import { Injectable } from '@nestjs/common';
import {
  GameState,
  Player,
  Projectile,
  Vector2,
  InputState,
  Platform,
  Button,
  Door,
} from './game.types';
import { LEVELS } from './levels';

@Injectable()
export class GameService {
  private gameState: GameState;
  private readonly GRAVITY = 0.5;
  private readonly JUMP_FORCE = -12;
  private readonly MOVE_SPEED = 5;
  private readonly PROJECTILE_SPEED = 8;
  private readonly GAME_WIDTH = 800;
  private readonly GAME_HEIGHT = 600;
  private readonly UPDATE_RATE = 1000 / 60; // 60 FPS

  constructor() {
    this.initializeGame();
  }

  private initializeGame() {
    this.gameState = {
      players: new Map(),
      projectiles: [],
      level: LEVELS[0],
      gameStarted: false,
      winner: null,
    };
  }

  addPlayer(socketId: string): Player {
    const playerCount = this.gameState.players.size;
    if (playerCount >= 2) {
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
      width: 30,
      height: 40,
      hasFinished: false,
      color: playerCount === 0 ? '#FF4444' : '#4444FF',
    };

    this.gameState.players.set(socketId, player);

    if (this.gameState.players.size === 2) {
      this.gameState.gameStarted = true;
    }

    return player;
  }

  removePlayer(socketId: string) {
    this.gameState.players.delete(socketId);
    if (this.gameState.players.size < 2) {
      this.gameState.gameStarted = false;
    }
  }

  handleInput(socketId: string, input: InputState) {
    const player = this.gameState.players.get(socketId);
    if (!player || this.gameState.winner) return;

    // Horizontal movement
    if (input.left) {
      player.velocity.x = -this.MOVE_SPEED;
      player.direction = 'left';
    } else if (input.right) {
      player.velocity.x = this.MOVE_SPEED;
      player.direction = 'right';
    } else {
      player.velocity.x = 0;
    }

    // Jumping
    if (input.up && player.isGrounded) {
      player.velocity.y = this.JUMP_FORCE;
      player.isGrounded = false;
      player.direction = 'up';
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
    // Check if player can shoot (limit projectiles)
    const playerProjectiles = this.gameState.projectiles.filter(
      (p) => p.playerId === player.id && p.active
    );
    if (playerProjectiles.length >= 3) return;

    let velocityX = 0;
    let velocityY = 0;

    // Determine projectile direction
    if (input.up && input.shoot) {
      velocityY = -this.PROJECTILE_SPEED;
    } else if (input.down && input.shoot) {
      velocityY = this.PROJECTILE_SPEED;
    } else {
      // Shoot in facing direction
      velocityX = player.direction === 'right' ? this.PROJECTILE_SPEED : -this.PROJECTILE_SPEED;
    }

    const projectile: Projectile = {
      id: `${player.id}-${Date.now()}`,
      playerId: player.id,
      position: {
        x: player.position.x + player.width / 2,
        y: player.position.y + player.height / 2,
      },
      velocity: { x: velocityX, y: velocityY },
      active: true,
      radius: 5,
    };

    this.gameState.projectiles.push(projectile);
  }

  update(): GameState {
    if (!this.gameState.gameStarted || this.gameState.winner) {
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

    // Check win condition
    this.checkWinCondition();

    return this.getGameState();
  }

  private updatePlayer(player: Player) {
    // Apply gravity
    player.velocity.y += this.GRAVITY;

    // Update position
    player.position.x += player.velocity.x;
    player.position.y += player.velocity.y;

    // Check platform collisions
    player.isGrounded = false;
    this.gameState.level.platforms.forEach((platform) => {
      this.checkPlatformCollision(player, platform);
    });

    // Check door collisions
    this.gameState.level.doors.forEach((door) => {
      if (!door.open) {
        this.checkDoorCollision(player, door);
      }
    });

    // Keep player in bounds
    if (player.position.x < 0) player.position.x = 0;
    if (player.position.x + player.width > this.GAME_WIDTH) {
      player.position.x = this.GAME_WIDTH - player.width;
    }
    if (player.position.y > this.GAME_HEIGHT) {
      this.respawnPlayer(player);
    }
  }

  private checkPlatformCollision(player: Player, platform: Platform) {
    if (
      player.position.x < platform.x + platform.width &&
      player.position.x + player.width > platform.x &&
      player.position.y < platform.y + platform.height &&
      player.position.y + player.height > platform.y
    ) {
      // Check if player is falling onto platform
      if (player.velocity.y > 0 && player.position.y + player.height - player.velocity.y <= platform.y) {
        player.position.y = platform.y - player.height;
        player.velocity.y = 0;
        player.isGrounded = true;
      }
      // Bottom collision
      else if (player.velocity.y < 0 && player.position.y >= platform.y + platform.height) {
        player.position.y = platform.y + platform.height;
        player.velocity.y = 0;
      }
      // Side collisions
      else if (player.velocity.x > 0) {
        player.position.x = platform.x - player.width;
      } else if (player.velocity.x < 0) {
        player.position.x = platform.x + platform.width;
      }
    }
  }

  private checkDoorCollision(player: Player, door: Door) {
    if (
      player.position.x < door.x + door.width &&
      player.position.x + player.width > door.x &&
      player.position.y < door.y + door.height &&
      player.position.y + player.height > door.y
    ) {
      // Push player back
      if (player.velocity.x > 0) {
        player.position.x = door.x - player.width;
      } else if (player.velocity.x < 0) {
        player.position.x = door.x + door.width;
      }
    }
  }

  private updateProjectiles() {
    this.gameState.projectiles = this.gameState.projectiles.filter((projectile) => {
      if (!projectile.active) return false;

      // Update position
      projectile.position.x += projectile.velocity.x;
      projectile.position.y += projectile.velocity.y;

      // Check bounds
      if (
        projectile.position.x < 0 ||
        projectile.position.x > this.GAME_WIDTH ||
        projectile.position.y < 0 ||
        projectile.position.y > this.GAME_HEIGHT
      ) {
        return false;
      }

      // Check player collisions
      this.gameState.players.forEach((player) => {
        if (player.id !== projectile.playerId) {
          const dx = projectile.position.x - (player.position.x + player.width / 2);
          const dy = projectile.position.y - (player.position.y + player.height / 2);
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < projectile.radius + player.width / 2) {
            projectile.active = false;
            this.respawnPlayer(player);
          }
        }
      });

      return projectile.active;
    });
  }

  private updateButtons() {
    this.gameState.level.buttons.forEach((button) => {
      button.pressed = false;
      this.gameState.players.forEach((player) => {
        if (
          player.position.x < button.x + button.width &&
          player.position.x + player.width > button.x &&
          player.position.y < button.y + button.height &&
          player.position.y + player.height > button.y
        ) {
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

  private checkWinCondition() {
    this.gameState.players.forEach((player, index) => {
      const goalIndex = Array.from(this.gameState.players.keys()).indexOf(player.id);
      const goal = this.gameState.level.goals[goalIndex];

      if (
        goal &&
        player.position.x < goal.x + goal.width &&
        player.position.x + player.width > goal.x &&
        player.position.y < goal.y + goal.height &&
        player.position.y + player.height > goal.y
      ) {
        player.hasFinished = true;
        if (!this.gameState.winner) {
          this.gameState.winner = player.id;
        }
      }
    });
  }

  private respawnPlayer(player: Player) {
    player.position.x = player.spawnPoint.x;
    player.position.y = player.spawnPoint.y;
    player.velocity.x = 0;
    player.velocity.y = 0;
  }

  getGameState(): GameState {
    return {
      ...this.gameState,
      players: new Map(this.gameState.players),
    };
  }

  resetGame() {
    this.initializeGame();
  }
}
