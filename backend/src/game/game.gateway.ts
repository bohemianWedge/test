import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { GameService } from './game.service';
import { InputState } from './game.types';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class GameGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private gameLoopInterval: NodeJS.Timeout;

  constructor(private readonly gameService: GameService) {
    this.startGameLoop();
  }

  private startGameLoop() {
    const UPDATE_RATE = 1000 / 60; // 60 FPS
    this.gameLoopInterval = setInterval(() => {
      const gameState = this.gameService.update();
      this.broadcastGameState(gameState);
    }, UPDATE_RATE);
  }

  handleConnection(@ConnectedSocket() client: Socket) {
    console.log(`Client connected: ${client.id}`);

    // Check if client is in local mode
    const gameMode = client.handshake.query.gameMode;
    const isLocalMode = gameMode === 'local';

    if (isLocalMode) {
      // In local mode, create both players for this single client
      const player1 = this.gameService.addPlayer(client.id + '-p1');
      const player2 = this.gameService.addPlayer(client.id + '-p2');

      if (player1 && player2) {
        // Store local mode flag on the socket
        (client as any).isLocalMode = true;
        (client as any).localPlayerId1 = client.id + '-p1';
        (client as any).localPlayerId2 = client.id + '-p2';

        client.emit('playerJoined', {
          playerId: client.id,
          player: player1,
          isLocalMode: true,
        });

        // Broadcast to all clients
        const gameState = this.gameService.getGameState();
        this.broadcastGameState(gameState);

        console.log(`Local mode activated for ${client.id}`);
      } else {
        client.emit('error', { message: 'Cannot create local game' });
        client.disconnect();
      }
    } else {
      // Online mode - normal behavior
      const player = this.gameService.addPlayer(client.id);

      if (player) {
        client.emit('playerJoined', {
          playerId: client.id,
          player,
        });

        // Send current game state
        const gameState = this.gameService.getGameState();

        // Broadcast to all clients to ensure everyone sees the new player immediately
        this.broadcastGameState(gameState);

        // Notify other players
        client.broadcast.emit('playerConnected', {
          playerId: client.id,
          player,
        });
      } else {
        client.emit('error', { message: 'Game is full' });
        client.disconnect();
      }
    }
  }

  handleDisconnect(@ConnectedSocket() client: Socket) {
    console.log(`Client disconnected: ${client.id}`);

    // Check if this was a local mode client
    if ((client as any).isLocalMode) {
      // Remove both players
      this.gameService.removePlayer((client as any).localPlayerId1);
      this.gameService.removePlayer((client as any).localPlayerId2);
    } else {
      // Remove single player
      this.gameService.removePlayer(client.id);
    }

    this.server.emit('playerDisconnected', {
      playerId: client.id,
    });
  }

  @SubscribeMessage('input')
  handleInput(
    @ConnectedSocket() client: Socket,
    @MessageBody() input: InputState,
  ) {
    this.gameService.handleInput(client.id, input);
  }

  @SubscribeMessage('localInput')
  handleLocalInput(
    @ConnectedSocket() client: Socket,
    @MessageBody() inputs: { player1: InputState; player2: InputState },
  ) {
    if ((client as any).isLocalMode) {
      // Handle both players' inputs
      this.gameService.handleInput((client as any).localPlayerId1, inputs.player1);
      this.gameService.handleInput((client as any).localPlayerId2, inputs.player2);
    }
  }

  @SubscribeMessage('resetGame')
  handleResetGame() {
    this.gameService.resetGame();
    this.server.emit('gameReset');
  }

  private broadcastGameState(gameState: any) {
    const serializedState = this.serializeGameState(gameState);
    this.server.emit('gameState', serializedState);
  }

  private serializeGameState(gameState: any) {
    return {
      ...gameState,
      players: Array.from(gameState.players.values()),
      scores: Array.from(gameState.scores.values()),
    };
  }
}
