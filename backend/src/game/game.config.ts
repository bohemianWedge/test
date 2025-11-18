export const GAME_CONFIG = {
  // Game dimensions
  WIDTH: 800,
  HEIGHT: 600,

  // Physics constants
  GRAVITY: 0.5,
  JUMP_FORCE: -12,
  MOVE_SPEED: 5,
  AIR_RESISTANCE: 0.95,

  // Combat
  PROJECTILE_SPEED: 8,
  MAX_PROJECTILES_PER_PLAYER: 3,
  PROJECTILE_RADIUS: 5,

  // Player properties
  PLAYER_WIDTH: 30,
  PLAYER_HEIGHT: 40,
  PLAYER_COLORS: ['#FF4444', '#4444FF'],

  // Game loop
  UPDATE_RATE: 1000 / 60, // 60 FPS
  MAX_PLAYERS: 2,

  // Platform effects
  FIRE_DAMAGE_COOLDOWN: 1000, // milliseconds
  WATER_SLOW_FACTOR: 0.6,
  ICE_SLIDE_FACTOR: 1.3,

  // Visual effects
  PARTICLE_LIFETIME: 500,
  RESPAWN_INVINCIBILITY: 2000,
};
