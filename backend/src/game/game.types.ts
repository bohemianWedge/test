export interface Vector2 {
  x: number;
  y: number;
}

export interface Player {
  id: string;
  position: Vector2;
  velocity: Vector2;
  direction: 'left' | 'right' | 'up' | 'down';
  spawnPoint: Vector2;
  isGrounded: boolean;
  width: number;
  height: number;
  hasFinished: boolean;
  color: string;
  currentPlatformType?: 'solid' | 'water' | 'fire' | 'neutral' | 'ice';
  lastDamageTime?: number;
  isInvincible?: boolean;
  effects?: PlayerEffect[];
}

export interface PlayerEffect {
  type: 'burning' | 'slowed' | 'frozen' | 'invincible';
  duration: number;
  startTime: number;
}

export interface Projectile {
  id: string;
  playerId: string;
  position: Vector2;
  velocity: Vector2;
  active: boolean;
  radius: number;
}

export interface Platform {
  x: number;
  y: number;
  width: number;
  height: number;
  type: 'solid' | 'water' | 'fire' | 'neutral';
}

export interface Button {
  x: number;
  y: number;
  width: number;
  height: number;
  doorId: number;
  pressed: boolean;
}

export interface Door {
  id: number;
  x: number;
  y: number;
  width: number;
  height: number;
  open: boolean;
  requiredButtons: number[];
}

export interface Goal {
  x: number;
  y: number;
  width: number;
  height: number;
  playerId: number;
}

export interface Level {
  platforms: Platform[];
  buttons: Button[];
  doors: Door[];
  goals: Goal[];
  spawnPoints: Vector2[];
}

export interface GameState {
  players: Map<string, Player>;
  projectiles: Projectile[];
  level: Level;
  gameStarted: boolean;
  winner: string | null;
}

export interface InputState {
  up: boolean;
  down: boolean;
  left: boolean;
  right: boolean;
  shoot: boolean;
}
