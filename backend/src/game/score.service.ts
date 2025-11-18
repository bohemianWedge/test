import { Injectable } from '@nestjs/common';
import { PlayerScore } from './game.types';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class ScoreService {
  private readonly scoresFilePath: string;
  private scores: Map<string, PlayerScore>;
  private totalGames: number;

  constructor() {
    // Store scores in a JSON file in the backend directory
    this.scoresFilePath = path.join(process.cwd(), 'game-scores.json');
    this.scores = new Map();
    this.totalGames = 0;
    this.loadScores();
  }

  private loadScores() {
    try {
      if (fs.existsSync(this.scoresFilePath)) {
        const data = fs.readFileSync(this.scoresFilePath, 'utf-8');
        const parsed = JSON.parse(data);

        // Convert array back to Map
        if (parsed.scores && Array.isArray(parsed.scores)) {
          this.scores = new Map(
            parsed.scores.map((score: PlayerScore) => [score.playerId, score])
          );
        }

        this.totalGames = parsed.totalGames || 0;
        console.log('Scores loaded successfully');
      } else {
        console.log('No scores file found, starting fresh');
      }
    } catch (error) {
      console.error('Error loading scores:', error);
      this.scores = new Map();
      this.totalGames = 0;
    }
  }

  private saveScores() {
    try {
      const data = {
        scores: Array.from(this.scores.values()),
        totalGames: this.totalGames,
        lastUpdate: new Date().toISOString(),
      };

      fs.writeFileSync(
        this.scoresFilePath,
        JSON.stringify(data, null, 2),
        'utf-8'
      );
      console.log('Scores saved successfully');
    } catch (error) {
      console.error('Error saving scores:', error);
    }
  }

  getOrCreatePlayerScore(playerId: string): PlayerScore {
    if (!this.scores.has(playerId)) {
      const playerScore: PlayerScore = {
        playerId,
        playerName: `Player ${this.scores.size + 1}`,
        wins: 0,
        losses: 0,
      };
      this.scores.set(playerId, playerScore);
    }
    return this.scores.get(playerId)!;
  }

  recordWin(winnerId: string, loserId: string) {
    const winner = this.getOrCreatePlayerScore(winnerId);
    const loser = this.getOrCreatePlayerScore(loserId);

    winner.wins++;
    winner.lastWin = Date.now();
    loser.losses++;

    this.totalGames++;
    this.saveScores();
  }

  getScores(): Map<string, PlayerScore> {
    return new Map(this.scores);
  }

  getTotalGames(): number {
    return this.totalGames;
  }

  getPlayerScore(playerId: string): PlayerScore | null {
    return this.scores.get(playerId) || null;
  }

  resetScores() {
    this.scores.clear();
    this.totalGames = 0;
    this.saveScores();
  }
}
