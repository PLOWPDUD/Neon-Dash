
export type GameState = 'MENU' | 'PLAYING' | 'GAMEOVER' | 'WON' | 'PAUSED';

export type PlayerIconType = 'default' | 'face' | 'creeper' | 'lines' | 'dot' | 'cross';

export type ShipIconType = 'default' | 'fighter' | 'shark' | 'saucer';

export type WaveIconType = 'default' | 'dart' | 'saw' | 'shuriken';

export type GameMode = 'cube' | 'ship' | 'wave';

export interface Player {
  x: number;
  y: number;
  vy: number;
  width: number;
  height: number;
  rotation: number;
  isGrounded: boolean;
  isDead: boolean;
  mode: GameMode;
  isDashing?: boolean; // New dash state
}

export interface Camera {
  x: number;
  y: number;
}

export interface Obstacle {
  id: number;
  type: 'spike' | 'block' | 'finish' | 'coin' | 'orb' | 'orb_dash' | 'portal_ship' | 'portal_cube' | 'portal_wave';
  x: number;
  y: number; // Y position relative to ground (0 = on ground)
  width: number;
  height: number;
  collected?: boolean; // For coins
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
  size: number;
}