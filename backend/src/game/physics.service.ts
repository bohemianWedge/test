import { Injectable } from '@nestjs/common';
import { Vector2, Player, Platform } from './game.types';
import { GAME_CONFIG } from './game.config';

@Injectable()
export class PhysicsService {
  applyGravity(player: Player): void {
    player.velocity.y += GAME_CONFIG.GRAVITY;
  }

  applyMovement(player: Player, direction: 'left' | 'right'): void {
    const speed = this.getEffectiveSpeed(player);
    player.velocity.x = direction === 'left' ? -speed : speed;
    player.direction = direction;
  }

  applyJump(player: Player): void {
    if (player.isGrounded) {
      player.velocity.y = GAME_CONFIG.JUMP_FORCE;
      player.isGrounded = false;
      player.direction = 'up';
    }
  }

  updatePosition(player: Player): void {
    player.position.x += player.velocity.x;
    player.position.y += player.velocity.y;
  }

  keepInBounds(player: Player): void {
    // Horizontal bounds
    if (player.position.x < 0) {
      player.position.x = 0;
      player.velocity.x = 0;
    }
    if (player.position.x + player.width > GAME_CONFIG.WIDTH) {
      player.position.x = GAME_CONFIG.WIDTH - player.width;
      player.velocity.x = 0;
    }
  }

  isOutOfBounds(position: Vector2): boolean {
    return (
      position.x < 0 ||
      position.x > GAME_CONFIG.WIDTH ||
      position.y < 0 ||
      position.y > GAME_CONFIG.HEIGHT
    );
  }

  private getEffectiveSpeed(player: Player): number {
    let speed = GAME_CONFIG.MOVE_SPEED;

    // Apply platform effects
    if (player.currentPlatformType === 'water') {
      speed *= GAME_CONFIG.WATER_SLOW_FACTOR;
    } else if (player.currentPlatformType === 'ice') {
      speed *= GAME_CONFIG.ICE_SLIDE_FACTOR;
    }

    return speed;
  }

  calculateDistance(pos1: Vector2, pos2: Vector2): number {
    const dx = pos1.x - pos2.x;
    const dy = pos1.y - pos2.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  calculateProjectileVelocity(
    direction: 'up' | 'down' | 'left' | 'right',
  ): Vector2 {
    const velocity: Vector2 = { x: 0, y: 0 };

    switch (direction) {
      case 'up':
        velocity.y = -GAME_CONFIG.PROJECTILE_SPEED;
        break;
      case 'down':
        velocity.y = GAME_CONFIG.PROJECTILE_SPEED;
        break;
      case 'left':
        velocity.x = -GAME_CONFIG.PROJECTILE_SPEED;
        break;
      case 'right':
        velocity.x = GAME_CONFIG.PROJECTILE_SPEED;
        break;
    }

    return velocity;
  }
}
