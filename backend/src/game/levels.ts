import { Level } from './game.types';

export const LEVELS: Level[] = [
  {
    // Level 1: Simple platformer with buttons and doors
    platforms: [
      // Ground
      { x: 0, y: 550, width: 800, height: 50, type: 'neutral' },

      // Player 1 side (left)
      { x: 50, y: 450, width: 150, height: 20, type: 'neutral' },
      { x: 50, y: 350, width: 100, height: 20, type: 'neutral' },
      { x: 120, y: 250, width: 100, height: 20, type: 'fire' },

      // Player 2 side (right)
      { x: 600, y: 450, width: 150, height: 20, type: 'neutral' },
      { x: 650, y: 350, width: 100, height: 20, type: 'neutral' },
      { x: 580, y: 250, width: 100, height: 20, type: 'water' },

      // Middle platforms
      { x: 300, y: 400, width: 200, height: 20, type: 'neutral' },
      { x: 250, y: 300, width: 100, height: 20, type: 'water' },
      { x: 450, y: 300, width: 100, height: 20, type: 'fire' },

      // Top platforms
      { x: 350, y: 150, width: 100, height: 20, type: 'neutral' },
    ],

    buttons: [
      { x: 80, y: 430, width: 30, height: 10, doorId: 0, pressed: false },
      { x: 680, y: 430, width: 30, height: 10, doorId: 1, pressed: false },
      { x: 370, y: 130, width: 30, height: 10, doorId: 2, pressed: false },
    ],

    doors: [
      { id: 0, x: 290, y: 320, width: 20, height: 80, open: false, requiredButtons: [0] },
      { id: 1, x: 490, y: 320, width: 20, height: 80, open: false, requiredButtons: [1] },
      { id: 2, x: 390, y: 70, width: 20, height: 80, open: false, requiredButtons: [2] },
    ],

    goals: [
      { x: 20, y: 100, width: 40, height: 40, playerId: 0 },
      { x: 740, y: 100, width: 40, height: 40, playerId: 1 },
    ],

    spawnPoints: [
      { x: 100, y: 500 }, // Player 1
      { x: 700, y: 500 }, // Player 2
    ],
  },
];
