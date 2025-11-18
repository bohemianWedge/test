import { Injectable } from '@nestjs/common';
import {
  GameState,
  Player,
  Projectile,
  InputState,
} from './game.types';
import { LEVELS } from './levels';
import { GAME_CONFIG } from './game.config';
import { PhysicsService } from './physics.service';
import { CollisionService } from './collision.service';
import { ScoreService } from './score.service';

@Injectable()
export class GameService {
  private gameState: GameState;

  constructor(
    private physicsService: PhysicsService,
    private collisionService: CollisionService,
    private scoreService: ScoreService,
  ) {
    this.initializeGame();
  }

  private initializeGame() {
    this.gameState = {
      players: new Map(),
      projectiles: [],
      level: LEVELS[0],
      gameStarted: false,
      winner: null,
      scores: this.scoreService.getScores(),
    };
  }

  addPlayer(socketId: string): Player {
    const playerCount = this.gameState.players.size;
    if (playerCount >= GAME_CONFIG.MAX_PLAYERS) {
      return null;
    }

    const spawnPoint = this.gameState.level.spawnPoints[playerCount];
    const player: Player = {
      id: socketId,
      position: { x: spawnPoint.x, y: spawnPoint.y },
      velocity: { x: 0, y: 0 },
      direction: playerCount === 0 ? 'right' : 'left',
      spawnPoint: { x: spawnPoint.x, y: spawnPoint.y },
      isGrounded: false,
      width: GAME_CONFIG.PLAYER_WIDTH,
      height: GAME_CONFIG.PLAYER_HEIGHT,
      hasFinished: false,
      color: GAME_CONFIG.PLAYER_COLORS[playerCount],
      currentPlatformType: 'neutral',
      lastDamageTime: 0,
      isInvincible: false,
      effects: [],
    };

    this.gameState.players.set(socketId, player);

    if (this.gameState.players.size === GAME_CONFIG.MAX_PLAYERS) {
      this.gameState.gameStarted = true;
    }

    return player;
  }

  removePlayer(socketId: string) {
    this.gameState.players.delete(socketId);
    if (this.gameState.players.size < GAME_CONFIG.MAX_PLAYERS) {
      this.gameState.gameStarted = false;
    }
  }

  handleInput(socketId: string, input: InputState) {
    const player = this.gameState.players.get(socketId);
    if (!player || this.gameState.winner) return;

    // Horizontal movement
    if (input.left) {
      this.physicsService.applyMovement(player, 'left');
    } else if (input.right) {
      this.physicsService.applyMovement(player, 'right');
    } else {
      player.velocity.x = 0;
    }

    // Jumping
    if (input.up) {
      this.physicsService.applyJump(player);
    }

    // Shooting
    if (input.shoot) {
      this.shootProjectile(player, input);
    }

    // Update direction for down
    if (input.down) {
      player.direction = 'down';
    }
  }

  private shootProjectile(player: Player, input: InputState) {
    // Check projectile limit
    const playerProjectiles = this.gameState.projectiles.filter(
      (p) => p.playerId === player.id && p.active,
    );
    if (playerProjectiles.length >= GAME_CONFIG.MAX_PROJECTILES_PER_PLAYER) {
      return;
    }

    // Determine direction
    let direction: 'up' | 'down' | 'left' | 'right';
    if (input.up && input.shoot) {
      direction = 'up';
    } else if (input.down && input.shoot) {
      direction = 'down';
    } else {
      direction = player.direction === 'right' ? 'right' : 'left';
    }

    const velocity = this.physicsService.calculateProjectileVelocity(direction);

    const projectile: Projectile = {
      id: `${player.id}-${Date.now()}`,
      playerId: player.id,
      position: {
        x: player.position.x + player.width / 2,
        y: player.position.y + player.height / 2,
      },
      velocity,
      active: true,
      radius: GAME_CONFIG.PROJECTILE_RADIUS,
    };

    this.gameState.projectiles.push(projectile);
  }

  update(): GameState {
    // Only stop updates if there's a winner, but allow updates even with 1 player
    if (this.gameState.winner) {
      return this.getGameState();
    }

    // Update players
    this.gameState.players.forEach((player) => {
      this.updatePlayer(player);
    });

    // Update projectiles
    this.updateProjectiles();

    // Update buttons and doors
    this.updateButtons();
    this.updateDoors();

    // Apply platform effects
    this.applyPlatformEffects();

    // Update player effects
    this.updatePlayerEffects();

    // Only check win condition when game has started (both players present)
    if (this.gameState.gameStarted) {
      this.checkWinCondition();
    }

    return this.getGameState();
  }

  private updatePlayer(player: Player) {
    // Apply gravity
    this.physicsService.applyGravity(player);

    // Update position
    this.physicsService.updatePosition(player);

    // Reset grounded state and platform type
    player.isGrounded = false;
    player.currentPlatformType = 'neutral';

    // Check platform collisions
    this.gameState.level.platforms.forEach((platform) => {
      const collision = this.collisionService.checkPlatformCollision(
        player,
        platform,
      );
      if (collision.collided) {
        this.collisionService.resolvePlatformCollision(
          player,
          platform,
          collision.side,
        );
      }
    });

    // Check door collisions
    this.gameState.level.doors.forEach((door) => {
      if (!door.open && this.collisionService.checkDoorCollision(player, door)) {
        this.collisionService.resolveDoorCollision(player, door);
      }
    });

    // Keep player in bounds
    this.physicsService.keepInBounds(player);

    // Check if fell out of world
    if (player.position.y > GAME_CONFIG.HEIGHT) {
      this.respawnPlayer(player);
    }
  }

  private updateProjectiles() {
    this.gameState.projectiles = this.gameState.projectiles.filter(
      (projectile) => {
        if (!projectile.active) return false;

        // Update position
        projectile.position.x += projectile.velocity.x;
        projectile.position.y += projectile.velocity.y;

        // Check bounds
        if (this.physicsService.isOutOfBounds(projectile.position)) {
          return false;
        }

        // Check player collisions
        this.gameState.players.forEach((player) => {
          if (
            player.id !== projectile.playerId &&
            !player.isInvincible &&
            this.collisionService.checkProjectilePlayerCollision(
              projectile,
              player,
            )
          ) {
            projectile.active = false;
            this.respawnPlayer(player);
          }
        });

        return projectile.active;
      },
    );
  }

  private updateButtons() {
    this.gameState.level.buttons.forEach((button) => {
      button.pressed = false;
      this.gameState.players.forEach((player) => {
        if (this.collisionService.checkButtonCollision(player, button)) {
          button.pressed = true;
        }
      });
    });
  }

  private updateDoors() {
    this.gameState.level.doors.forEach((door) => {
      const allButtonsPressed = door.requiredButtons.every((buttonId) => {
        const button = this.gameState.level.buttons[buttonId];
        return button && button.pressed;
      });
      door.open = allButtonsPressed;
    });
  }

  private applyPlatformEffects() {
    const currentTime = Date.now();

    this.gameState.players.forEach((player) => {
      if (!player.isGrounded) return;

      switch (player.currentPlatformType) {
        case 'fire':
          // Apply fire damage with cooldown
          if (
            !player.isInvincible &&
            currentTime - player.lastDamageTime > GAME_CONFIG.FIRE_DAMAGE_COOLDOWN
          ) {
            player.lastDamageTime = currentTime;
            // Add visual effect (will be rendered on client)
            this.addPlayerEffect(player, 'burning', 500);
          }
          break;

        case 'water':
          // Slow down player
          this.addPlayerEffect(player, 'slowed', 100);
          break;

        case 'ice':
          // Make player slide (handled in physics service)
          break;
      }
    });
  }

  private addPlayerEffect(
    player: Player,
    type: 'burning' | 'slowed' | 'frozen' | 'invincible',
    duration: number,
  ) {
    if (!player.effects) {
      player.effects = [];
    }

    // Remove existing effect of same type
    player.effects = player.effects.filter((e) => e.type !== type);

    // Add new effect
    player.effects.push({
      type,
      duration,
      startTime: Date.now(),
    });
  }

  private updatePlayerEffects() {
    const currentTime = Date.now();

    this.gameState.players.forEach((player) => {
      if (!player.effects) return;

      // Remove expired effects
      player.effects = player.effects.filter((effect) => {
        return currentTime - effect.startTime < effect.duration;
      });

      // Update invincibility status
      player.isInvincible = player.effects.some((e) => e.type === 'invincible');
    });
  }

  private checkWinCondition() {
    this.gameState.players.forEach((player) => {
      const goalIndex = Array.from(this.gameState.players.keys()).indexOf(
        player.id,
      );
      const goal = this.gameState.level.goals[goalIndex];

      if (goal && this.collisionService.checkGoalCollision(player, goal)) {
        player.hasFinished = true;
        if (!this.gameState.winner) {
          this.gameState.winner = player.id;

          // Record the win/loss in scores
          const playerIds = Array.from(this.gameState.players.keys());
          const loserId = playerIds.find(id => id !== player.id);

          if (loserId) {
            this.scoreService.recordWin(player.id, loserId);

            // Update game state scores
            this.gameState.scores = this.scoreService.getScores();
          }
        }
      }
    });
  }

  private respawnPlayer(player: Player) {
    player.position.x = player.spawnPoint.x;
    player.position.y = player.spawnPoint.y;
    player.velocity.x = 0;
    player.velocity.y = 0;
    player.isInvincible = true;
    this.addPlayerEffect(player, 'invincible', GAME_CONFIG.RESPAWN_INVINCIBILITY);
  }

  getGameState(): GameState {
    return {
      ...this.gameState,
      players: new Map(this.gameState.players),
      scores: new Map(this.gameState.scores),
    };
  }

  resetGame() {
    // Keep existing player connections but reset game state
    const existingPlayers = new Map(this.gameState.players);

    this.initializeGame();

    // Restore player connections
    existingPlayers.forEach((player, playerId) => {
      const playerCount = this.gameState.players.size;
      const spawnPoint = this.gameState.level.spawnPoints[playerCount];

      const resetPlayer: Player = {
        ...player,
        position: { x: spawnPoint.x, y: spawnPoint.y },
        velocity: { x: 0, y: 0 },
        hasFinished: false,
        isGrounded: false,
        isInvincible: false,
        effects: [],
        lastDamageTime: 0,
      };

      this.gameState.players.set(playerId, resetPlayer);
    });

    // Update game started status
    if (this.gameState.players.size === GAME_CONFIG.MAX_PLAYERS) {
      this.gameState.gameStarted = true;
    }
  }
}
