import { Module } from '@nestjs/core';
import { GameModule } from './game/game.module';

@Module({
  imports: [GameModule],
})
export class AppModule {}
