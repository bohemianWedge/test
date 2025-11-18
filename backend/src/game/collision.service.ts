import { Injectable } from '@nestjs/common';
import { Player, Platform, Door, Button, Goal, Projectile } from './game.types';

export interface CollisionResult {
  collided: boolean;
  side?: 'top' | 'bottom' | 'left' | 'right';
}

@Injectable()
export class CollisionService {
  checkAABB(
    x1: number,
    y1: number,
    w1: number,
    h1: number,
    x2: number,
    y2: number,
    w2: number,
    h2: number,
  ): boolean {
    return x1 < x2 + w2 && x1 + w1 > x2 && y1 < y2 + h2 && y1 + h1 > y2;
  }

  checkPlatformCollision(player: Player, platform: Platform): CollisionResult {
    const collided = this.checkAABB(
      player.position.x,
      player.position.y,
      player.width,
      player.height,
      platform.x,
      platform.y,
      platform.width,
      platform.height,
    );

    if (!collided) {
      return { collided: false };
    }

    // Determine collision side
    const playerBottom = player.position.y + player.height;
    const playerTop = player.position.y;
    const playerLeft = player.position.x;
    const playerRight = player.position.x + player.width;

    const platformTop = platform.y;
    const platformBottom = platform.y + platform.height;
    const platformLeft = platform.x;
    const platformRight = platform.x + platform.width;

    // Check if player is landing on top of platform
    if (
      player.velocity.y > 0 &&
      playerBottom - player.velocity.y <= platformTop
    ) {
      return { collided: true, side: 'top' };
    }

    // Check if player hit bottom of platform
    if (
      player.velocity.y < 0 &&
      playerTop - player.velocity.y >= platformBottom
    ) {
      return { collided: true, side: 'bottom' };
    }

    // Check horizontal collisions
    if (player.velocity.x > 0 && playerRight - player.velocity.x <= platformLeft) {
      return { collided: true, side: 'left' };
    }

    if (player.velocity.x < 0 && playerLeft - player.velocity.x >= platformRight) {
      return { collided: true, side: 'right' };
    }

    // Default to top if unclear
    return { collided: true, side: 'top' };
  }

  resolvePlatformCollision(
    player: Player,
    platform: Platform,
    side: string,
  ): void {
    switch (side) {
      case 'top':
        player.position.y = platform.y - player.height;
        player.velocity.y = 0;
        player.isGrounded = true;
        player.currentPlatformType = platform.type;
        break;

      case 'bottom':
        player.position.y = platform.y + platform.height;
        player.velocity.y = 0;
        break;

      case 'left':
        player.position.x = platform.x - player.width;
        player.velocity.x = 0;
        break;

      case 'right':
        player.position.x = platform.x + platform.width;
        player.velocity.x = 0;
        break;
    }
  }

  checkDoorCollision(player: Player, door: Door): boolean {
    return this.checkAABB(
      player.position.x,
      player.position.y,
      player.width,
      player.height,
      door.x,
      door.y,
      door.width,
      door.height,
    );
  }

  resolveDoorCollision(player: Player, door: Door): void {
    // Simple push back based on velocity direction
    if (player.velocity.x > 0) {
      player.position.x = door.x - player.width;
    } else if (player.velocity.x < 0) {
      player.position.x = door.x + door.width;
    }
    player.velocity.x = 0;
  }

  checkButtonCollision(player: Player, button: Button): boolean {
    return this.checkAABB(
      player.position.x,
      player.position.y,
      player.width,
      player.height,
      button.x,
      button.y,
      button.width,
      button.height,
    );
  }

  checkGoalCollision(player: Player, goal: Goal): boolean {
    return this.checkAABB(
      player.position.x,
      player.position.y,
      player.width,
      player.height,
      goal.x,
      goal.y,
      goal.width,
      goal.height,
    );
  }

  checkProjectilePlayerCollision(
    projectile: Projectile,
    player: Player,
  ): boolean {
    const dx = projectile.position.x - (player.position.x + player.width / 2);
    const dy = projectile.position.y - (player.position.y + player.height / 2);
    const distance = Math.sqrt(dx * dx + dy * dy);

    return distance < projectile.radius + player.width / 2;
  }
}
