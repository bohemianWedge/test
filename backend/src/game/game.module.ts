import { Module } from '@nestjs/common';
import { GameGateway } from './game.gateway';
import { GameService } from './game.service';
import { PhysicsService } from './physics.service';
import { CollisionService } from './collision.service';

@Module({
  providers: [GameGateway, GameService, PhysicsService, CollisionService],
})
export class GameModule {}
