
export const GAME_CONFIG = {
  GRAVITY: 1.4,
  JUMP_FORCE: -16.8,
  MOVE_SPEED: 10.5,
  GROUND_HEIGHT: 120, // Distance from bottom of canvas
  PLAYER_SIZE: 40,
  PARTICLE_COUNT: 20,
  // Ship Physics
  SHIP_GRAVITY: 0.6,
  SHIP_LIFT: 1.2, // Applied against gravity when holding
  // Wave Physics
  WAVE_SPEED: 10.5, // Matches move speed for 45 degree angle
};

export const COLORS = {
  PLAYER: '#00f0ff', // Default fallback
  PLAYER_BORDER: '#ffffff',
  SPIKE: '#ff003c', // Red/Pink
  BLOCK: '#facc15', // Yellow
  BLOCK_BORDER: '#ffffff',
  GROUND: '#1e293b', // Slate 800
  GROUND_LINE: '#00f0ff',
  BACKGROUND: '#0f172a', // Slate 900
  GRID: '#1e293b',
  COIN: '#fbbf24', // Gold
  ORB: '#f59e0b', // Amber/Yellow Orb
  ORB_DASH: '#a855f7', // Purple Dash Orb
  PORTAL_SHIP: '#ec4899', // Pink
  PORTAL_CUBE: '#22c55e', // Green
  PORTAL_WAVE: '#3b82f6', // Blue
};

export const PLAYER_COLORS = [
  '#00f0ff', // Cyan
  '#22c55e', // Green
  '#ef4444', // Red
  '#facc15', // Yellow
  '#a855f7', // Purple
  '#ec4899', // Pink
  '#f97316', // Orange
  '#ffffff', // White
];

export const PLAYER_ICONS: {id: string, label: string}[] = [
    { id: 'default', label: 'Classic' },
    { id: 'face', label: 'Face' },
    { id: 'creeper', label: 'Blocky' },
    { id: 'lines', label: 'Stripes' },
    { id: 'dot', label: 'Dot' },
    { id: 'cross', label: 'X' },
];

export const SHIP_ICONS: {id: string, label: string}[] = [
    { id: 'default', label: 'Rocket' },
    { id: 'fighter', label: 'Jet' },
    { id: 'shark', label: 'Shark' },
    { id: 'saucer', label: 'UFO' },
];

export const WAVE_ICONS: {id: string, label: string}[] = [
    { id: 'default', label: 'Classic' },
    { id: 'dart', label: 'Dart' },
    { id: 'saw', label: 'Saw' },
    { id: 'shuriken', label: 'Diamond' },
];

// LEVEL 1: Stereo Bound (The original level)
const LEVEL_1 = [
  { type: 'spike', x: 800 },
  { type: 'spike', x: 1200 },
  { type: 'block', x: 1500, width: 200, y: 0 },
  { type: 'spike', x: 2000 },
  { type: 'spike', x: 2300 },
  { type: 'spike', x: 2350 }, // Double spike
  { type: 'block', x: 2800, width: 100, y: 0 },
  { type: 'spike', x: 3100 },
  
  // -- SECRET COIN ROUTE SPLIT --
  // Ground path (boring)
  { type: 'spike', x: 3600 },
  { type: 'spike', x: 3900 },
  { type: 'block', x: 4200, width: 100, y: 0 },
  { type: 'spike', x: 4500 },

  // Upper path (The Coin Route)
  // Entry: YELLOW ORB JUMP
  { type: 'orb', x: 3250, y: 90, width: 40, height: 40 }, 

  { type: 'block', x: 3450, width: 1550, y: 160 }, // Long upper platform
  
  // Triple Spike 1 on upper platform
  { type: 'spike', x: 3700, y: 200 }, 
  { type: 'spike', x: 3740, y: 200 }, 
  { type: 'spike', x: 3780, y: 200 },

  // Triple Spike 2 on upper platform
  { type: 'spike', x: 4100, y: 200 }, 
  { type: 'spike', x: 4140, y: 200 }, 
  { type: 'spike', x: 4180, y: 200 },

  // Triple Spike 3 on upper platform
  { type: 'spike', x: 4500, y: 200 }, 
  { type: 'spike', x: 4540, y: 200 }, 
  { type: 'spike', x: 4580, y: 200 },

  // THE COIN
  { type: 'coin', x: 4850, y: 220 }, 

  // -- REJOIN --
  { type: 'block', x: 5300, width: 400, y: 0 },
  { type: 'spike', x: 5500 }, 
  { type: 'finish', x: 6500 }
];

// LEVEL 2: Orb City (Verticality Focus)
const LEVEL_2 = [
  { type: 'block', x: 500, width: 100, y: 0 },
  { type: 'spike', x: 800 },
  // Introduction to orbs
  { type: 'orb', x: 1100, y: 80 },
  { type: 'block', x: 1300, width: 200, y: 120 },
  { type: 'spike', x: 1450, y: 160 },
  
  // Drop down
  { type: 'spike', x: 1800 },
  { type: 'spike', x: 2100 },
  
  // Orb Chain
  { type: 'orb', x: 2400, y: 100 },
  { type: 'orb', x: 2700, y: 150 },
  { type: 'block', x: 2900, width: 200, y: 200 },
  
  // -- COIN ROUTE SPLIT --
  // Normal: Drop down from block
  { type: 'spike', x: 3300 },
  { type: 'spike', x: 3600 },
  { type: 'block', x: 3800, width: 100, y: 0 },

  // Coin: Use a third hidden orb to go even higher
  { type: 'orb', x: 3150, y: 250 }, // The Coin Orb
  { type: 'block', x: 3400, width: 200, y: 350 }, // Sky platform
  { type: 'coin', x: 3500, y: 400 }, // Sky Coin

  // Rejoin
  { type: 'block', x: 4100, width: 400, y: 0 },
  { type: 'spike', x: 4300 },
  
  // Ending sequence
  { type: 'orb', x: 4600, y: 50 },
  { type: 'orb', x: 4900, y: 50 },
  { type: 'block', x: 5200, width: 100, y: 0 },
  { type: 'finish', x: 5800 }
];

// LEVEL 3: Triple Threat (Precision Focus)
const LEVEL_3 = [
  // Immediate triple spike
  { type: 'spike', x: 600 },
  { type: 'spike', x: 640, y: 0 },
  { type: 'spike', x: 680, y: 0 },

  { type: 'block', x: 1000, width: 100, y: 0 },
  { type: 'orb', x: 1200, y: 100 },
  { type: 'block', x: 1400, width: 100, y: 150 },
  
  // -- COIN ROUTE SPLIT --
  // High Path (Normal): Orb chain over the "lava"
  { type: 'orb', x: 1700, y: 150 },
  { type: 'orb', x: 2000, y: 150 },
  { type: 'orb', x: 2300, y: 150 },
  { type: 'block', x: 2600, width: 300, y: 100 },

  // Low Path (Coin): Drop down between the gap to a dangerous low platform
  // Note: Requires missing the orb at 1700 intentionally
  { type: 'block', x: 1900, width: 400, y: 0 }, // Low platform
  { type: 'spike', x: 2000, y: 40 }, // Spike ON the low platform
  { type: 'coin', x: 2150, y: 50 },  // Coin on low platform
  { type: 'orb', x: 2250, y: 50 },   // Escape orb
  // Rejoin happens at x=2600 block

  // Fast finish
  { type: 'spike', x: 3000 },
  { type: 'spike', x: 3050 }, // Double
  { type: 'block', x: 3300, width: 100, y: 0 },
  { type: 'orb', x: 3500, y: 100 },
  { type: 'block', x: 3700, width: 100, y: 50 },
  { type: 'finish', x: 4200 }
];

// LEVEL 4: Aerodynamics (Ship Mode Focus)
const LEVEL_4 = [
    { type: 'block', x: 400, width: 200, y: 0 },
    
    // PORTAL TO SHIP
    { type: 'portal_ship', x: 800, y: 50 },
    
    // Fly section
    // Floor blocks
    { type: 'block', x: 1000, width: 800, y: 0 },
    { type: 'spike', x: 1200, y: 40 },
    { type: 'spike', x: 1500, y: 40 },
    
    // Ceiling blocks (obstacles to fly under)
    { type: 'block', x: 1000, width: 800, y: 400 },
    { type: 'block', x: 1300, width: 200, y: 250 }, // Dip in ceiling

    // Tunnel
    { type: 'block', x: 1800, width: 1000, y: 0 }, // Floor
    { type: 'block', x: 1800, width: 1000, y: 300 }, // Roof (Gap size 300)
    
    // Obstacles in tunnel
    { type: 'block', x: 2000, width: 50, y: 40 }, // Floor bump
    { type: 'block', x: 2200, width: 50, y: 260 }, // Roof bump
    { type: 'block', x: 2400, width: 50, y: 40 },
    
    // COIN ROUTE: Straight Fly Challenge
    // Two massive walls with a tiny gap in the middle
    { type: 'block', x: 3000, width: 400, y: 0 }, // Floor base
    { type: 'block', x: 3000, width: 400, y: 400 }, // Ceiling base
    
    // The tight gap
    { type: 'block', x: 3200, width: 200, y: 120 }, // Wall up
    { type: 'block', x: 3200, width: 200, y: 280 }, // Wall down (from 400)
    // Gap is from 120 to 160 (size 40! very tight - straight fly required)
    
    { type: 'coin', x: 3300, y: 140 }, // In the middle of the gap
    
    // Open space recovery
    { type: 'block', x: 3600, width: 400, y: 0 },
    
    // Back to Cube
    { type: 'portal_cube', x: 3800, y: 100 },
    
    { type: 'spike', x: 4100 },
    { type: 'spike', x: 4300 },
    { type: 'finish', x: 4600 }
];

// LEVEL 5: Tsunami (Wave Mode Focus)
const LEVEL_5 = [
    { type: 'block', x: 400, width: 200, y: 0 },
    
    // PORTAL TO WAVE
    { type: 'portal_wave', x: 700, y: 50 },

    // Intro zig zag (obstacles on floor and ceiling)
    { type: 'block', x: 1000, width: 50, y: 0 },
    { type: 'block', x: 1200, width: 50, y: 300 },
    { type: 'block', x: 1400, width: 50, y: 0 },
    { type: 'block', x: 1600, width: 50, y: 300 },

    // The Tunnel
    { type: 'block', x: 2000, width: 800, y: 0 }, // Floor
    { type: 'block', x: 2000, width: 800, y: 350 }, // Roof

    // Center obstacles
    { type: 'block', x: 2200, width: 50, y: 175 }, // Mid block
    { type: 'block', x: 2500, width: 50, y: 175 }, // Mid block

    // COIN ROUTE: The Spam Gap
    // A very narrow tunnel that requires spamming
    { type: 'block', x: 3100, width: 600, y: 100 }, // Floor raised
    { type: 'block', x: 3100, width: 600, y: 250 }, // Roof lowered
    // Gap is 150 units high (easy/med), but let's put spikes to make it tight

    { type: 'spike', x: 3200, y: 140 }, // Spike on floor
    { type: 'spike', x: 3400, y: 250, height: 40 }, // Spike on roof (pointing down roughly visually)
    { type: 'coin', x: 3500, y: 175 },

    // Exit to open air
    { type: 'portal_cube', x: 3900, y: 100 },
    { type: 'block', x: 3900, width: 400, y: 0 }, // Safety platform

    { type: 'spike', x: 4100 },
    { type: 'spike', x: 4200 },
    { type: 'finish', x: 4500 }
];

// LEVEL 6: The Gauntlet (Long Level with All Modes)
const LEVEL_6 = [
    // --- SECTION 1: CUBE INTRO (0 - 3000) ---
    { type: 'spike', x: 600 },
    { type: 'spike', x: 1000 },
    { type: 'block', x: 1300, width: 200, y: 0 },
    { type: 'spike', x: 1600 },
    { type: 'spike', x: 1650 }, // Double
    { type: 'orb', x: 1900, y: 80 }, // Jump
    { type: 'block', x: 2100, width: 200, y: 120 },
    { type: 'spike', x: 2300, y: 120 }, // Spike on block
    { type: 'block', x: 2500, width: 100, y: 0 }, // Landing
    
    // --- SECTION 2: SHIP CAVE (3000 - 8000) ---
    { type: 'portal_ship', x: 3000, y: 100 },
    
    { type: 'block', x: 3200, width: 4000, y: 0 }, // Floor
    { type: 'block', x: 3200, width: 4000, y: 400 }, // Ceiling
    
    // Obstacles
    { type: 'block', x: 3500, width: 100, y: 100 }, // Bottom pillar
    { type: 'block', x: 3800, width: 100, y: 300 }, // Top pillar
    { type: 'block', x: 4200, width: 100, y: 150 }, 
    { type: 'block', x: 4600, width: 100, y: 250 }, 
    
    // Middle Barrier
    { type: 'block', x: 5000, width: 100, y: 200 }, // Center
    
    // Tunnel
    { type: 'block', x: 5500, width: 1000, y: 150 }, // Raise floor
    { type: 'block', x: 5500, width: 1000, y: 350 }, // Lower roof
    
    { type: 'spike', x: 5800, y: 190 }, // Spike on raised floor
    { type: 'spike', x: 6200, y: 190 },
    
    // --- SECTION 3: CUBE INTERLUDE (8000 - 12000) ---
    { type: 'portal_cube', x: 7500, y: 200 },
    { type: 'block', x: 7500, width: 500, y: 150 }, // Landing platform
    
    // Drop down
    { type: 'block', x: 8200, width: 100, y: 0 },
    { type: 'spike', x: 8500 },
    { type: 'orb', x: 8700, y: 100 },
    { type: 'orb', x: 8900, y: 150 },
    { type: 'orb', x: 9100, y: 200 },
    { type: 'block', x: 9300, width: 300, y: 200 }, // High platform
    
    // High path spikes
    { type: 'spike', x: 9400, y: 240 },
    { type: 'spike', x: 9500, y: 240 },
    
    // Fall back down
    { type: 'block', x: 10000, width: 200, y: 0 },
    { type: 'spike', x: 10300 },
    { type: 'spike', x: 10350 },
    { type: 'spike', x: 10400 }, // Triple spike!
    
    // --- SECTION 4: WAVE (12000 - 17000) ---
    { type: 'portal_wave', x: 11000, y: 50 },
    
    // Zig Zag Channel
    { type: 'block', x: 11500, width: 50, y: 0 },
    { type: 'block', x: 11700, width: 50, y: 300 },
    { type: 'block', x: 11900, width: 50, y: 0 },
    { type: 'block', x: 12100, width: 50, y: 300 },
    { type: 'block', x: 12300, width: 50, y: 0 },
    { type: 'block', x: 12500, width: 50, y: 300 },
    
    // Tight Tube
    { type: 'block', x: 13000, width: 2000, y: 0 },
    { type: 'block', x: 13000, width: 2000, y: 350 },
    
    { type: 'block', x: 13500, width: 50, y: 175 }, // Mid obstacle
    { type: 'block', x: 14000, width: 50, y: 175 }, // Mid obstacle
    
    // Rapid Fire
    { type: 'block', x: 15000, width: 50, y: 100 },
    { type: 'block', x: 15100, width: 50, y: 250 },
    { type: 'block', x: 15200, width: 50, y: 100 },
    { type: 'block', x: 15300, width: 50, y: 250 },

    // --- SECTION 5: MIXED FINALE + COIN (17000 - 20000) ---
    
    // Back to Ship
    { type: 'portal_ship', x: 16000, y: 200 },
    { type: 'block', x: 16000, width: 3000, y: 0 }, // Floor
    { type: 'block', x: 16000, width: 3000, y: 400 }, // Ceiling
    
    // THE COIN CHALLENGE
    // A vertical pillar with a small gap in the middle
    { type: 'block', x: 17000, width: 200, y: 150 }, // Bottom Wall
    { type: 'block', x: 17000, width: 200, y: 250 }, // Top Wall (Gap is 150-250 = 100 size)
    // Actually let's make it tighter for the coin
    { type: 'block', x: 17500, width: 100, y: 180 }, 
    { type: 'block', x: 17500, width: 100, y: 280 }, // Gap size 60 (Requires somewhat straight fly)
    
    { type: 'coin', x: 17550, y: 230 }, 
    
    // Final Transitions
    { type: 'portal_cube', x: 18500, y: 100 },
    { type: 'spike', x: 18800 },
    { type: 'spike', x: 18900 },
    
    { type: 'portal_wave', x: 19200, y: 100 },
    { type: 'block', x: 19500, width: 50, y: 200 }, // One last dodge
    
    { type: 'portal_cube', x: 19800, y: 100 },
    { type: 'block', x: 19800, width: 300, y: 0 },
    
    { type: 'finish', x: 20500 }
];

// LEVEL 7: Hyperspace (Dash Mechanic Focus)
const LEVEL_7 = [
  { type: 'block', x: 400, width: 200, y: 0 },
  { type: 'spike', x: 800 },
  
  // Intro to Dash
  { type: 'block', x: 1000, width: 100, y: 0 },
  { type: 'orb_dash', x: 1300, y: 50 }, // DASH!
  // Gap is from 1100 to 1600 (500 width) - impossible to jump, easy to dash
  { type: 'spike', x: 1200, y: 0 },
  { type: 'spike', x: 1350, y: 0 },
  { type: 'spike', x: 1500, y: 0 },
  
  { type: 'block', x: 1600, width: 300, y: 0 }, // Landing
  
  // Chained Dashes
  { type: 'orb_dash', x: 2100, y: 100 },
  { type: 'spike', x: 2100, y: 0 },
  
  // FIX: Lowered from 150 to 50 so player can fall into it from previous dash (at y=100)
  { type: 'orb_dash', x: 2600, y: 50 }, 
  { type: 'spike', x: 2600, y: 0 },
  
  // FIX: Lowered platform from 150 to 0 (ground) so player can land safely from low dash
  { type: 'block', x: 3000, width: 200, y: 0 }, 
  
  // -- COIN ROUTE --
  // Yellow Orb boost
  // FIX: Lowered from 160 to 130 to be reachable from ground
  { type: 'orb', x: 3280, y: 130 },
  // Dash Orb moved down and further to create an arc catch
  { type: 'orb_dash', x: 3550, y: 140 },
  
  // The Gauntlet of Spikes (Dash travels through this)
  { type: 'block', x: 3600, width: 600, y: 50 }, // Floor spikes sit here
  { type: 'spike', x: 3700, y: 90 }, // Spike up
  { type: 'spike', x: 3800, y: 90 },
  { type: 'spike', x: 3900, y: 90 },
  { type: 'spike', x: 4000, y: 90 },
  
  // Ceiling spikes
  { type: 'block', x: 3600, width: 600, y: 300 }, 
  { type: 'spike', x: 3700, y: 260, height: 40 }, // Upside down logic roughly
  { type: 'spike', x: 3900, y: 260, height: 40 },
  
  // The Coin is floating in the dash path
  { type: 'coin', x: 3850, y: 150 },
  
  // Landing
  { type: 'block', x: 4300, width: 200, y: 0 },
  
  // Final Dash to finish
  { type: 'spike', x: 4600 },
  { type: 'spike', x: 4650 },
  { type: 'spike', x: 4700 },
  { type: 'spike', x: 4750 },
  { type: 'orb_dash', x: 4700, y: 100 },
  
  { type: 'finish', x: 5200 }
];

export const LEVELS = [
  { id: 1, name: "Stereo Bound", data: LEVEL_1 },
  { id: 2, name: "Orb City", data: LEVEL_2 },
  { id: 3, name: "Triple Threat", data: LEVEL_3 },
  { id: 4, name: "Aerodynamics", data: LEVEL_4 },
  { id: 5, name: "Tsunami", data: LEVEL_5 },
  { id: 6, name: "The Gauntlet", data: LEVEL_6 },
  { id: 7, name: "Hyperspace", data: LEVEL_7 }
];