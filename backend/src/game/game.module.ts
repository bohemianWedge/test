import { Module } from '@nestjs/common';
import { GameGateway } from './game.gateway';
import { GameService } from './game.service';
import { PhysicsService } from './physics.service';
import { CollisionService } from './collision.service';
import { ScoreService } from './score.service';

@Module({
  providers: [GameGateway, GameService, PhysicsService, CollisionService, ScoreService],
})
export class GameModule {}
