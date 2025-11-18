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

    const player = this.gameService.addPlayer(client.id);

    if (player) {
      client.emit('playerJoined', {
        playerId: client.id,
        player,
      });

      // Send current game state
      const gameState = this.gameService.getGameState();
      client.emit('gameState', this.serializeGameState(gameState));

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

  handleDisconnect(@ConnectedSocket() client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
    this.gameService.removePlayer(client.id);

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
    };
  }
}
