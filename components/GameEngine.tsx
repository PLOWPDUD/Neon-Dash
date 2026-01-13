import React, { useRef, useEffect, useCallback } from 'react';
import { GAME_CONFIG, COLORS } from '../constants';
import { GameState, Player, Obstacle, Particle, PlayerIconType, ShipIconType, WaveIconType, Checkpoint } from '../types';
import { audioService } from '../services/audioService';

interface GameEngineProps {
  levelData: any[];
  gameState: GameState;
  isPracticeMode: boolean;
  onStateChange: (state: GameState) => void;
  onAttemptChange: (attempt: number | ((prev: number) => number)) => void;
  onProgressChange: (percent: number) => void;
  onCoinCollect: (collected: boolean) => void;
  playerColor: string;
  playerIcon: PlayerIconType;
  shipIcon: ShipIconType;
  waveIcon: WaveIconType;
}

export const GameEngine: React.FC<GameEngineProps> = ({ 
  levelData,
  gameState: externalGameState,
  isPracticeMode,
  onStateChange, 
  onAttemptChange, 
  onProgressChange,
  onCoinCollect,
  playerColor,
  playerIcon,
  shipIcon,
  waveIcon
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number>(0);
  
  // Refs to track latest props without re-triggering effects
  const configRef = useRef({ color: playerColor, icon: playerIcon, ship: shipIcon, wave: waveIcon });

  useEffect(() => {
    configRef.current = { color: playerColor, icon: playerIcon, ship: shipIcon, wave: waveIcon };
  }, [playerColor, playerIcon, shipIcon, waveIcon]);

  // Game State Refs
  const gameState = useRef<GameState>('MENU');
  const isCoinCollected = useRef<boolean>(false);
  const isHoldingInput = useRef<boolean>(false);
  const isPracticeRef = useRef<boolean>(isPracticeMode);
  
  // Checkpoint System
  const checkpoints = useRef<Checkpoint[]>([]);
  const autoCheckpointTimer = useRef<number>(0);
  
  const lastOrbId = useRef<number>(-1);
  const lastDashOrbId = useRef<number>(-1);
  const dashTimer = useRef<number>(0);
  const lastWavePos = useRef<{x: number, y: number} | null>(null);
  const ballScaleRef = useRef<number>(1); // For ease-in animation
  
  // --- Core Actions ---

  const initLevel = useCallback(() => {
    const obs: Obstacle[] = [];
    let idCounter = 0;
    
    const dataToLoad = Array.isArray(levelData) ? levelData : [];

    dataToLoad.forEach((data) => {
      obs.push({
        id: idCounter++,
        type: data.type as any,
        x: data.x,
        y: (data as any).y || 0,
        width: (data as any).width || 40,
        height: (data as any).height || 40,
        collected: false,
      });
    });
    obstacles.current = obs;
  }, [levelData]);

  const player = useRef<Player>({
    x: 0,
    y: 0,
    vy: 0,
    width: GAME_CONFIG.PLAYER_SIZE,
    height: GAME_CONFIG.PLAYER_SIZE,
    rotation: 0,
    isGrounded: true,
    isDead: false,
    mode: 'cube',
    isDashing: false,
    gravityInverted: false
  });
  const camera = useRef({ x: 0, y: 0 });
  const particles = useRef<Particle[]>([]);
  const obstacles = useRef<Obstacle[]>([]);

  const spawnDeathParticles = useCallback((x: number, y: number) => {
    for (let i = 0; i < GAME_CONFIG.PARTICLE_COUNT; i++) {
      particles.current.push({
        x: x,
        y: y,
        vx: (Math.random() - 0.5) * 15,
        vy: (Math.random() - 0.5) * 15,
        life: 1.0,
        color: configRef.current.color,
        size: Math.random() * 8 + 2,
      });
    }
  }, []);

  const spawnCoinParticles = useCallback((x: number, y: number) => {
    for (let i = 0; i < 10; i++) {
      particles.current.push({
        x: x,
        y: y,
        vx: (Math.random() - 0.5) * 10,
        vy: (Math.random() - 0.5) * 10,
        life: 0.8,
        color: COLORS.COIN,
        size: Math.random() * 5 + 2,
      });
    }
  }, []);

  const spawnOrbParticles = useCallback((x: number, y: number, color: string) => {
    for (let i = 0; i < 10; i++) {
      particles.current.push({
        x: x,
        y: y,
        vx: (Math.random() - 0.5) * 20,
        vy: (Math.random() - 0.5) * 20,
        life: 0.6,
        color: color,
        size: Math.random() * 6 + 2,
      });
    }
  }, []);

  const spawnCheckpointParticles = useCallback((x: number, y: number) => {
      for (let i = 0; i < 8; i++) {
      particles.current.push({
        x: x,
        y: y,
        vx: (Math.random() - 0.5) * 8,
        vy: (Math.random() - 0.5) * 8,
        life: 0.8,
        color: '#22c55e', // Green
        size: 4,
      });
    }
  }, []);

  const spawnShipTrail = useCallback((x: number, y: number) => {
      particles.current.push({
        x: x,
        y: y,
        vx: -5 - Math.random() * 5,
        vy: (Math.random() - 0.5) * 2,
        life: 0.5,
        color: '#fbbf24', // Flame color
        size: Math.random() * 4 + 2,
      });
  }, []);

  const spawnWaveTrail = useCallback((x: number, y: number) => {
      particles.current.push({
        x: x,
        y: y,
        vx: 0, // Stationary in world space to form a trail
        vy: 0,
        life: 0.4,
        color: configRef.current.color,
        size: 8,
      });
  }, []);
  
  const spawnDashParticles = useCallback((x: number, y: number) => {
      particles.current.push({
        x: x,
        y: y,
        vx: -15 - Math.random() * 10,
        vy: (Math.random() - 0.5) * 2,
        life: 0.4,
        color: COLORS.ORB_DASH,
        size: 2,
      });
  }, []);
  
  const spawnBallGravityParticles = useCallback((x: number, y: number) => {
      for (let i=0; i<6; i++) {
          particles.current.push({
            x: x,
            y: y,
            vx: (Math.random() - 0.5) * 5,
            vy: (Math.random() - 0.5) * 5,
            life: 0.5,
            color: '#ffffff',
            size: 3,
          });
      }
  }, []);

  const reset = useCallback(() => {
      const height = canvasRef.current ? canvasRef.current.height : window.innerHeight;
      const groundY = height - GAME_CONFIG.GROUND_HEIGHT;
      const startY = groundY - GAME_CONFIG.PLAYER_SIZE;

      player.current = {
        x: 0,
        y: startY,
        vy: 0,
        width: GAME_CONFIG.PLAYER_SIZE,
        height: GAME_CONFIG.PLAYER_SIZE,
        rotation: 0,
        isGrounded: true,
        isDead: false,
        mode: 'cube',
        isDashing: false,
        gravityInverted: false
      };
      camera.current = { x: 0, y: 0 };
      particles.current = [];
      // Only clear checkpoints if we are doing a full reset (not respawning)
      if (!isPracticeRef.current) {
          checkpoints.current = [];
      } else {
          checkpoints.current = [];
      }
      
      isCoinCollected.current = false;
      onCoinCollect(false);
      lastOrbId.current = -1;
      lastDashOrbId.current = -1;
      dashTimer.current = 0;
      lastWavePos.current = null;
      autoCheckpointTimer.current = 0;
      ballScaleRef.current = 1;
      onProgressChange(0);
      initLevel();
  }, [initLevel, onCoinCollect, onProgressChange]);

  // Sync level data change and initial mount
  useEffect(() => {
    reset();
  }, [levelData, reset]);

  // Sync external state to ref
  useEffect(() => {
    if (gameState.current !== externalGameState) {
        gameState.current = externalGameState;
        if (externalGameState === 'MENU') {
             reset();
        }
    }
  }, [externalGameState, reset]);

  useEffect(() => {
    isPracticeRef.current = isPracticeMode;
    if (!isPracticeMode) {
        checkpoints.current = [];
    }
  }, [isPracticeMode]);

  // --- Checkpoint Logic ---

  const createCheckpoint = useCallback(() => {
      const p = player.current;
      const cp: Checkpoint = {
          x: p.x,
          y: p.y,
          vy: p.vy,
          rotation: p.rotation,
          mode: p.mode,
          isDashing: p.isDashing || false,
          gravityInverted: p.gravityInverted || false
      };
      checkpoints.current.push(cp);
      spawnCheckpointParticles(p.x + p.width/2, p.y + p.height/2);
  }, [spawnCheckpointParticles]);

  const removeLastCheckpoint = useCallback(() => {
      if (checkpoints.current.length > 0) {
          checkpoints.current.pop();
          audioService.playDeath(); // Sound cue for removal
      }
  }, []);

  const respawnAtCheckpoint = useCallback(() => {
      if (checkpoints.current.length === 0) {
          reset();
          return;
      }
      
      const cp = checkpoints.current[checkpoints.current.length - 1];
      const p = player.current;
      
      p.x = cp.x;
      p.y = cp.y;
      p.vy = cp.vy;
      p.rotation = cp.rotation;
      p.mode = cp.mode;
      p.isDashing = cp.isDashing;
      p.gravityInverted = cp.gravityInverted;
      p.isDead = false;
      p.isGrounded = p.mode === 'cube' ? true : false; 
      
      // Reset Camera
      camera.current.x = p.x - 200;
      const height = canvasRef.current ? canvasRef.current.height : window.innerHeight;
      const targetCamY = Math.min(0, p.y - height * 0.6);
      camera.current.y = targetCamY;
      
      // Reset State helpers
      isHoldingInput.current = false;
      lastOrbId.current = -1;
      lastDashOrbId.current = -1;
      lastWavePos.current = null;
      ballScaleRef.current = 1;
      
  }, [reset]);

  const die = useCallback(() => {
    if (player.current.isDead) return;
    
    audioService.playDeath();
    spawnDeathParticles(player.current.x + player.current.width/2, player.current.y + player.current.height/2);

    if (isPracticeRef.current) {
        // Practice Mode: Instant Respawn
        player.current.isDead = true; // Briefly dead for particles
        setTimeout(() => {
             respawnAtCheckpoint();
        }, 100);
    } else {
        // Normal Mode: Game Over
        player.current.isDead = true;
        gameState.current = 'GAMEOVER';
        onStateChange('GAMEOVER');
    }
  }, [onStateChange, spawnDeathParticles, respawnAtCheckpoint]);

  const win = useCallback(() => {
    if (gameState.current === 'WON') return;
    gameState.current = 'WON';
    onStateChange('WON');
    onProgressChange(100);
    audioService.playWin();
  }, [onStateChange, onProgressChange]);


  // --- Game Loop ---

  const update = useCallback(() => {
    if (gameState.current !== 'PLAYING') return;

    const p = player.current;
    
    // Auto Checkpoint Logic
    if (isPracticeRef.current && !p.isDead) {
        autoCheckpointTimer.current++;
        // Try every 2 seconds (180 frames at 60fps)
        if (autoCheckpointTimer.current > 180) {
            let safe = false;
            // Only checkpoint if 'safe'
            if (p.mode === 'cube' && p.isGrounded) safe = true;
            if (p.mode === 'ship' || p.mode === 'wave' || p.mode === 'ball') safe = true; 
            
            if (safe) {
                createCheckpoint();
                autoCheckpointTimer.current = 0;
            }
        }
    }

    // Capture previous Y before modification for precise collision detection
    const prevY = p.y; 

    // --- Spam Jump Logic (Cube) ---
    if (p.mode === 'cube' && isHoldingInput.current && p.isGrounded) {
         p.vy = GAME_CONFIG.JUMP_FORCE;
         p.isGrounded = false;
         audioService.playJump();
    }
    
    // 1. Movement X
    p.x += GAME_CONFIG.MOVE_SPEED;
    
    // 2. Camera Logic
    // Horizontal follows player offset
    camera.current.x = p.x - 200; 

    // Vertical follows player center, but clamped to ground
    const canvasHeight = canvasRef.current?.height || window.innerHeight;
    const targetCamY = Math.min(0, p.y - canvasHeight * 0.6); // Center player somewhat
    // Smooth lerp
    camera.current.y += (targetCamY - camera.current.y) * 0.1;

    // 3. Movement Y & Gravity
    
    // DASH MECHANIC
    if (p.isDashing) {
        dashTimer.current -= 1;
        p.vy = 0; // No gravity during dash
        p.rotation += 15; // Spin player during dash
        spawnDashParticles(p.x, p.y + p.height/2);
        
        // Hold to dash logic
        if (!isHoldingInput.current) {
            p.isDashing = false;
        }
        lastWavePos.current = null;
    } 
    // WAVE MODE
    else if (p.mode === 'wave') {
        if (isHoldingInput.current) {
            p.vy = -GAME_CONFIG.WAVE_SPEED;
            p.rotation = -45;
        } else {
            p.vy = GAME_CONFIG.WAVE_SPEED;
            p.rotation = 45;
        }
        p.y += p.vy;
        
        // Calculate Rotated Tail Position for Trail
        const rad = (p.rotation * Math.PI) / 180;
        const scale = 1.6;
        const offset = -10 * scale; // Back of the triangle relative to center
        
        const cx = p.x + p.width / 2;
        const cy = p.y + p.height / 2;
        
        const tailX = cx + offset * Math.cos(rad);
        const tailY = cy + offset * Math.sin(rad);

        // Interpolate to fill gaps (makes the trail look solid)
        if (lastWavePos.current) {
            const lx = lastWavePos.current.x;
            const ly = lastWavePos.current.y;
            const midX = (lx + tailX) / 2;
            const midY = (ly + tailY) / 2;
            spawnWaveTrail(midX, midY);
        }
        
        spawnWaveTrail(tailX, tailY);
        lastWavePos.current = {x: tailX, y: tailY};
    } 
    // BALL MODE
    else if (p.mode === 'ball') {
        // Animation
        if (ballScaleRef.current < 1) {
            ballScaleRef.current += 0.1;
            if(ballScaleRef.current > 1) ballScaleRef.current = 1;
        }

        if (p.gravityInverted) {
            // Going UP
            p.vy = -GAME_CONFIG.BALL_SPEED;
        } else {
            // Going DOWN
            p.vy = GAME_CONFIG.BALL_SPEED;
        }
        
        p.y += p.vy;
        
        // Rotation
        // Rotate based on direction
        const rotSpeed = 10;
        p.rotation += p.gravityInverted ? -rotSpeed : rotSpeed;

        lastWavePos.current = null;
    }
    // SHIP MODE
    else if (p.mode === 'ship') {
         if (isHoldingInput.current) {
             p.vy -= GAME_CONFIG.SHIP_LIFT;
         }
         p.vy += GAME_CONFIG.SHIP_GRAVITY;
         p.y += p.vy;
         
         // Ship rotation visual
         p.rotation = p.vy * 2;
         
         if (isHoldingInput.current) {
             spawnShipTrail(p.x, p.y + p.height/2 + 10);
         }
         lastWavePos.current = null;
    } 
    // CUBE MODE
    else {
        p.vy += GAME_CONFIG.GRAVITY;
        p.y += p.vy;
        
        // Rotation for cube
        if (!p.isGrounded) {
            p.rotation += 7.5; // Rotate approx 180 degrees per standard jump
        } else {
            // Snap to nearest 90
            const rem = p.rotation % 90;
            if (rem !== 0) {
                if (rem > 45) p.rotation += (90 - rem) * 0.2;
                else p.rotation -= rem * 0.2;
            }
        }
        lastWavePos.current = null;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const groundY = canvas.height - GAME_CONFIG.GROUND_HEIGHT;
    const ceilingY = groundY - GAME_CONFIG.CEILING_HEIGHT;
    const playerBottom = p.y + p.height;
    
    let onFloor = false;
    let onCeiling = false;

    // Floor Collision (Global Ground)
    if (playerBottom >= groundY && p.vy > 0) {
        if (p.mode === 'cube') {
            p.y = groundY - p.height;
            p.vy = 0;
            p.isGrounded = true;
        } else if (p.mode === 'ship' || p.mode === 'wave') {
             // Slide
             p.y = groundY - p.height;
             p.vy = 0;
             p.isGrounded = true;
        } else if (p.mode === 'ball') {
            if (!p.gravityInverted) {
                p.y = groundY - p.height;
                p.vy = 0;
                onFloor = true;
            }
        }
    } 
    
    // Ceiling Collision (Global Ceiling for Ship/Wave/Ball)
    if (p.mode === 'ship' || p.mode === 'wave' || (p.mode === 'ball' && p.gravityInverted)) {
        if (p.y <= ceilingY) {
            p.y = ceilingY;
            if (p.vy < 0) p.vy = 0; // Stop upward velocity
            
            // For Ball, this counts as grounded on ceiling
            if (p.mode === 'ball') {
                onCeiling = true;
            }
            // For Ship/Wave, it's just a barrier
            if (p.mode === 'wave' || p.mode === 'ship') {
                 p.isGrounded = true; 
            }
        }
    }

    // Reset grounded for Ball based on current frame collision logic
    if (p.mode === 'ball') {
         if (onFloor || onCeiling) {
             p.isGrounded = true;
         } else {
             p.isGrounded = false;
         }
    } else {
        if (p.y < groundY - p.height && p.y > ceilingY) {
            p.isGrounded = false;
        }
    }
    
    // Safety check for falling out of world
    if (p.y > groundY + 100) {
         die(); 
    }

    // 4. Obstacle Logic
    const playerRect = { l: p.x, r: p.x + p.width, t: p.y, b: p.y + p.height };
    
    // Optimize: only check obstacles nearby
    const visibleObstacles = obstacles.current.filter(o => 
        o.x + o.width > p.x - 100 && o.x < p.x + 1000
    );

    // Calculate level progress
    if (visibleObstacles.length > 0) {
        const lastObj = obstacles.current[obstacles.current.length-1];
        if (lastObj) {
            const pct = Math.min(100, Math.max(0, (p.x / lastObj.x) * 100));
            onProgressChange(Math.floor(pct));
        }
    }

    for (const obs of visibleObstacles) {
        const obsY = groundY - obs.y - obs.height;
        const obsRect = { l: obs.x, r: obs.x + obs.width, t: obsY, b: obsY + obs.height };

        let hitX = false;
        let hitY = false;
        
        if (obs.type === 'spike') {
             hitX = playerRect.r - 8 > obsRect.l && playerRect.l + 8 < obsRect.r;
             hitY = playerRect.b - 8 > obsRect.t && playerRect.t + 8 < obsRect.b;
        } else {
             hitX = playerRect.r > obsRect.l && playerRect.l < obsRect.r;
             hitY = playerRect.b > obsRect.t && playerRect.t < obsRect.b;
        }

        if (hitX && hitY) {
            if (obs.type === 'spike') {
                if (!p.isDashing) die();
            }
            else if (obs.type === 'block') {
                 const tolerance = 18; 
                 const wasAbove = prevY + p.height <= obsRect.t + tolerance;
                 const wasBelow = prevY >= obsRect.b - tolerance;

                 if (wasAbove && p.vy >= 0) {
                     p.y = obsRect.t - p.height;
                     p.vy = 0;
                     p.isGrounded = true;
                 } else if (wasBelow && p.vy <= 0) {
                     if (p.mode === 'ball') {
                         p.y = obsRect.b;
                         p.vy = 0;
                         p.isGrounded = true;
                     } else if (p.mode === 'ship' || p.mode === 'wave') {
                         p.y = obsRect.b;
                         if (p.vy < 0) p.vy = 0;
                     } else {
                         if (!p.isDashing) die();
                     }
                 } else {
                     if (!p.isDashing) die();
                 }
            }
            else if (obs.type === 'finish') {
                win();
            }
            else if (obs.type === 'coin') {
                if (!obs.collected) {
                    obs.collected = true;
                    isCoinCollected.current = true;
                    onCoinCollect(true);
                    audioService.playCoin();
                    spawnCoinParticles(obs.x + obs.width/2, obsY + obs.height/2);
                }
            }
            else if (obs.type === 'orb' || obs.type === 'orb_dash') {
                if (isHoldingInput.current) {
                    if (obs.type === 'orb') {
                        if (lastOrbId.current !== obs.id) {
                            p.vy = GAME_CONFIG.JUMP_FORCE * 1.1; 
                            p.isGrounded = false;
                            lastOrbId.current = obs.id;
                            audioService.playOrb();
                            spawnOrbParticles(obs.x + obs.width/2, obsY + obs.height/2, COLORS.ORB);
                            if (p.mode === 'ball') {
                                p.gravityInverted = false;
                            }
                        }
                    } else if (obs.type === 'orb_dash') {
                         if (lastDashOrbId.current !== obs.id) {
                            p.isDashing = true;
                            p.vy = 0;
                            p.y = obsY + obs.height/2 - p.height/2;
                            lastDashOrbId.current = obs.id;
                            audioService.playDash();
                            spawnOrbParticles(obs.x + obs.width/2, obsY + obs.height/2, COLORS.ORB_DASH);
                        }
                    }
                }
            }
            else if (obs.type === 'portal_ship') {
                if (p.mode !== 'ship') {
                    p.mode = 'ship';
                    p.rotation = 0;
                    p.gravityInverted = false;
                    spawnOrbParticles(p.x, p.y, COLORS.PORTAL_SHIP);
                }
            }
            else if (obs.type === 'portal_cube') {
                if (p.mode !== 'cube') {
                    p.mode = 'cube';
                    p.rotation = 0;
                    p.gravityInverted = false;
                    spawnOrbParticles(p.x, p.y, COLORS.PORTAL_CUBE);
                }
            }
            else if (obs.type === 'portal_wave') {
                if (p.mode !== 'wave') {
                    p.mode = 'wave';
                    p.rotation = 0;
                    p.gravityInverted = false;
                    spawnOrbParticles(p.x, p.y, COLORS.PORTAL_WAVE);
                }
            }
            else if (obs.type === 'portal_ball') {
                if (p.mode !== 'ball') {
                    p.mode = 'ball';
                    p.rotation = 0;
                    p.gravityInverted = false;
                    spawnOrbParticles(p.x, p.y, COLORS.PORTAL_BALL);
                }
            }
        }
    }

    for (let i = particles.current.length - 1; i >= 0; i--) {
        const part = particles.current[i];
        part.x += part.vx;
        part.y += part.vy;
        part.life -= 0.02;
        if (part.life <= 0) {
            particles.current.splice(i, 1);
        }
    }

  }, [die, win, initLevel, onProgressChange, onCoinCollect, spawnCoinParticles, spawnDashParticles, spawnOrbParticles, spawnShipTrail, spawnWaveTrail, createCheckpoint]);

  const drawCubeVisual = (ctx: CanvasRenderingContext2D, size: number, icon: PlayerIconType, color: string) => {
        ctx.fillStyle = color;
        ctx.fillRect(-size/2, -size/2, size, size);
        ctx.strokeStyle = COLORS.PLAYER_BORDER;
        ctx.lineWidth = 3;
        ctx.strokeRect(-size/2, -size/2, size, size);
        ctx.fillStyle = '#000';
        
        if (icon === 'face' || icon === 'default') {
            ctx.fillRect(-10, -8, 6, 6);
            ctx.fillRect(4, -8, 6, 6);
            ctx.fillRect(-10, 4, 20, 4);
            ctx.fillRect(-10, 2, 4, 4);
            ctx.fillRect(6, 2, 4, 4);
        } 
        else if (icon === 'creeper') {
            ctx.fillRect(-8, -8, 6, 6);
            ctx.fillRect(2, -8, 6, 6);
            ctx.fillRect(-4, -2, 8, 8);
            ctx.fillRect(-8, 4, 4, 8);
            ctx.fillRect(4, 4, 4, 8);
            ctx.fillRect(-4, 8, 8, 4);
        }
        else if (icon === 'lines') {
            ctx.fillStyle = 'rgba(0,0,0,0.3)';
            ctx.fillRect(-size/2, -5, size, 10);
            ctx.fillRect(-size/2, -15, size, 5);
            ctx.fillRect(-size/2, 10, size, 5);
        }
        else if (icon === 'dot') {
            ctx.fillStyle = 'rgba(0,0,0,0.3)';
            ctx.beginPath();
            ctx.arc(0, 0, 8, 0, Math.PI*2);
            ctx.fill();
        }
        else if (icon === 'cross') {
            ctx.strokeStyle = 'rgba(0,0,0,0.3)';
            ctx.lineWidth = 5;
            ctx.beginPath();
            ctx.moveTo(-10, -10);
            ctx.lineTo(10, 10);
            ctx.moveTo(10, -10);
            ctx.lineTo(-10, 10);
            ctx.stroke();
        }
  };

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const p = player.current;
    const cam = camera.current;
    const width = canvas.width;
    const height = canvas.height;
    const groundY = height - GAME_CONFIG.GROUND_HEIGHT;
    const ceilingY = groundY - GAME_CONFIG.CEILING_HEIGHT;

    ctx.fillStyle = COLORS.BACKGROUND;
    ctx.fillRect(0, 0, width, height);

    ctx.save();
    ctx.strokeStyle = COLORS.GRID;
    ctx.lineWidth = 2;
    ctx.beginPath();
    
    const gridSize = 100;
    const offsetX = -(cam.x * 0.5) % gridSize; 
    const offsetY = -(cam.y * 0.5) % gridSize; 
    
    for (let x = offsetX; x < width; x += gridSize) {
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
    }
    for (let y = offsetY - gridSize; y < height; y += gridSize) {
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
    }
    ctx.stroke();
    ctx.restore();

    const groundScroll = -(cam.x) % 100;

    ctx.save();
    ctx.translate(0, -cam.y);
    
    ctx.fillStyle = 'rgba(15, 23, 42, 0.95)';
    ctx.fillRect(0, ceilingY - 2000, width, 2000); 

    ctx.strokeStyle = COLORS.GROUND_LINE;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(0, ceilingY);
    ctx.lineTo(width, ceilingY);
    ctx.stroke();

    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 2;
    ctx.beginPath();
    for(let i=groundScroll; i<width; i+=100) {
        ctx.moveTo(i, ceilingY);
        ctx.lineTo(i - 50, ceilingY - 100); 
    }
    ctx.stroke();
    ctx.restore();

    ctx.save();
    ctx.translate(0, -cam.y); 
    
    ctx.fillStyle = COLORS.GROUND;
    ctx.fillRect(0, groundY, width, GAME_CONFIG.GROUND_HEIGHT);
    ctx.strokeStyle = COLORS.GROUND_LINE;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(0, groundY);
    ctx.lineTo(width, groundY);
    ctx.stroke();

    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 2;
    ctx.beginPath();
    for(let i=groundScroll; i<width; i+=100) {
        ctx.moveTo(i, groundY);
        ctx.lineTo(i - 50, height); 
    }
    ctx.stroke();
    ctx.restore();

    ctx.save();
    ctx.translate(-cam.x, -cam.y);

    if (isPracticeRef.current) {
        for (const cp of checkpoints.current) {
            if (cp.x > cam.x - 50 && cp.x < cam.x + width + 50) {
                const cpY = cp.y + 20; 
                ctx.fillStyle = '#22c55e'; 
                ctx.beginPath();
                ctx.moveTo(cp.x, cpY - 10);
                ctx.lineTo(cp.x + 10, cpY);
                ctx.lineTo(cp.x, cpY + 10);
                ctx.lineTo(cp.x - 10, cpY);
                ctx.fill();
            }
        }
    }

    const visibleObstacles = obstacles.current.filter(o => o.x + o.width > cam.x - 200 && o.x < cam.x + width + 200);
    
    for (const obs of visibleObstacles) {
        if (obs.collected) continue;
        const obsY = groundY - obs.y - obs.height;
        
        if (obs.type === 'block') {
            ctx.fillStyle = COLORS.BLOCK;
            ctx.fillRect(obs.x, obsY, obs.width, obs.height);
            ctx.strokeStyle = COLORS.BLOCK_BORDER;
            ctx.lineWidth = 2;
            ctx.strokeRect(obs.x, obsY, obs.width, obs.height);
            ctx.fillStyle = 'rgba(0,0,0,0.2)';
            ctx.fillRect(obs.x + 4, obsY + 4, obs.width - 8, obs.height - 8);
        }
        else if (obs.type === 'spike') {
            ctx.fillStyle = COLORS.SPIKE;
            ctx.beginPath();
            if (obs.height < 0) {
                 ctx.moveTo(obs.x, obsY);
                 ctx.lineTo(obs.x + obs.width/2, obsY + Math.abs(obs.height));
                 ctx.lineTo(obs.x + obs.width, obsY);
            } else {
                 ctx.moveTo(obs.x, obsY + obs.height);
                 ctx.lineTo(obs.x + obs.width/2, obsY);
                 ctx.lineTo(obs.x + obs.width, obsY + obs.height);
            }
            ctx.closePath();
            ctx.fill();
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 1;
            ctx.stroke();
        }
        else if (obs.type === 'orb') {
            const cx = obs.x + obs.width/2;
            const cy = obsY + obs.height/2;
            ctx.fillStyle = COLORS.ORB;
            ctx.beginPath();
            ctx.arc(cx, cy, obs.width/2, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(cx, cy, obs.width/2 + 4, 0, Math.PI * 2);
            ctx.stroke();
            ctx.fillStyle = 'rgba(255,255,255,0.5)';
            ctx.beginPath();
            ctx.arc(cx, cy, obs.width/4, 0, Math.PI * 2);
            ctx.fill();
        }
        else if (obs.type === 'orb_dash') {
            const cx = obs.x + obs.width/2;
            const cy = obsY + obs.height/2;
            const r = obs.width/2;
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(cx, cy, r, 0, Math.PI * 2);
            ctx.stroke();
            ctx.fillStyle = COLORS.ORB_DASH;
            ctx.beginPath();
            const arrowSize = r * 0.8;
            ctx.moveTo(cx - arrowSize/2, cy - arrowSize * 0.7);
            ctx.lineTo(cx + arrowSize/2, cy);
            ctx.lineTo(cx - arrowSize/2, cy + arrowSize * 0.7);
            ctx.lineTo(cx - arrowSize/2 + 10, cy); 
            ctx.fill();
        }
        else if (obs.type === 'coin') {
            const cx = obs.x + obs.width/2;
            const cy = obsY + obs.height/2;
            ctx.fillStyle = COLORS.COIN;
            ctx.beginPath();
            ctx.arc(cx, cy, obs.width/2, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 2;
            ctx.stroke();
            ctx.fillStyle = '#b45309';
            ctx.font = 'bold 20px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('C', cx, cy);
        }
        else if (obs.type.startsWith('portal')) {
            const color = obs.type === 'portal_ship' ? COLORS.PORTAL_SHIP :
                          obs.type === 'portal_cube' ? COLORS.PORTAL_CUBE : 
                          obs.type === 'portal_ball' ? COLORS.PORTAL_BALL : COLORS.PORTAL_WAVE;
            ctx.fillStyle = color;
            ctx.fillRect(obs.x, obsY, obs.width, obs.height);
            ctx.fillStyle = 'rgba(255,255,255,0.3)';
            ctx.fillRect(obs.x + 10, obsY + 10, obs.width - 20, obs.height - 20);
        }
        else if (obs.type === 'finish') {
             ctx.fillStyle = 'rgba(255,255,255,0.2)';
             ctx.fillRect(obs.x, 0, 10, height); 
        }
    }
    
    if (!p.isDead) {
        ctx.save();
        ctx.translate(p.x + p.width / 2, p.y + p.height / 2);
        ctx.rotate((p.rotation * Math.PI) / 180);

        if (p.mode === 'ship') {
             ctx.scale(1.6, 1.6);
             const shipType = configRef.current.ship;
             if (shipType === 'saucer') {
                 ctx.fillStyle = '#94a3b8'; ctx.strokeStyle = '#fff'; ctx.lineWidth = 2;
                 ctx.beginPath(); ctx.arc(0, -5, 10, Math.PI, 0); ctx.fill(); ctx.stroke();
                 ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.ellipse(0, 5, 20, 6, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
                 ctx.save(); ctx.translate(0, -5); ctx.scale(0.35, 0.35); drawCubeVisual(ctx, 40, configRef.current.icon, configRef.current.color); ctx.restore();
             } 
             else if (shipType === 'shark') {
                 ctx.fillStyle = '#94a3b8'; ctx.strokeStyle = '#fff'; ctx.lineWidth = 2;
                 ctx.beginPath(); ctx.moveTo(-20, 0); ctx.quadraticCurveTo(0, -15, 25, 5); ctx.lineTo(20, 10); ctx.lineTo(-15, 10); ctx.closePath(); ctx.fill(); ctx.stroke();
                 ctx.beginPath(); ctx.moveTo(-5, -8); ctx.lineTo(0, -20); ctx.lineTo(10, -5); ctx.fill(); ctx.stroke();
                 ctx.save(); ctx.translate(5, 0); ctx.scale(0.3, 0.3); drawCubeVisual(ctx, 40, configRef.current.icon, configRef.current.color); ctx.restore();
             }
             else if (shipType === 'fighter') {
                 ctx.fillStyle = '#fff'; ctx.strokeStyle = '#94a3b8'; ctx.lineWidth = 2;
                 ctx.beginPath(); ctx.moveTo(25, 0); ctx.lineTo(-15, -10); ctx.lineTo(-10, 0); ctx.lineTo(-15, 10); ctx.closePath(); ctx.fill(); ctx.stroke();
                 ctx.save(); ctx.translate(-2, 0); ctx.scale(0.3, 0.3); drawCubeVisual(ctx, 40, configRef.current.icon, configRef.current.color); ctx.restore();
             }
             else {
                 ctx.fillStyle = '#94a3b8'; ctx.strokeStyle = '#fff'; ctx.lineWidth = 2;
                 ctx.beginPath(); ctx.moveTo(-8, -4); ctx.lineTo(-18, -12); ctx.lineTo(-12, 0); ctx.lineTo(-18, 12); ctx.lineTo(-8, 4); ctx.fill(); ctx.stroke();
                 ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.ellipse(0, 0, 15, 8, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
                 ctx.save(); ctx.translate(5, -1); ctx.scale(0.35, 0.35); drawCubeVisual(ctx, 40, configRef.current.icon, configRef.current.color); ctx.restore();
             }
        }
        else if (p.mode === 'wave') {
             ctx.scale(1.6, 1.6);
             const waveType = configRef.current.wave;
             ctx.beginPath();
             if (waveType === 'dart') {
                 ctx.moveTo(10, 0); ctx.lineTo(-10, -8); ctx.lineTo(-6, 0); ctx.lineTo(-10, 8);  
             } 
             else if (waveType === 'saw') {
                 ctx.moveTo(10, 0); ctx.lineTo(5, -5); ctx.lineTo(0, -8); ctx.lineTo(-5, -5); ctx.lineTo(-10, -8); ctx.lineTo(-10, 8); ctx.lineTo(-5, 5); ctx.lineTo(0, 8); ctx.lineTo(5, 5);
             }
             else if (waveType === 'shuriken') {
                 ctx.moveTo(10, 0); ctx.lineTo(0, -10); ctx.lineTo(-10, 0); ctx.lineTo(0, 10);
             }
             else {
                 ctx.moveTo(10, 0); ctx.lineTo(-10, -10); ctx.lineTo(-10, 10);
             }
             ctx.closePath(); ctx.fillStyle = configRef.current.color; ctx.fill(); ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.stroke();
        }
        else if (p.mode === 'ball') {
            const scale = ballScaleRef.current;
            ctx.scale(scale, scale);
            ctx.beginPath(); ctx.arc(0, 0, 20, 0, Math.PI * 2); ctx.fillStyle = configRef.current.color; ctx.fill(); ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.stroke();
            for(let i=0; i<4; i++) {
                ctx.save(); ctx.rotate(i * Math.PI/2); ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.moveTo(0, -12); ctx.lineTo(5, -20); ctx.lineTo(-5, -20); ctx.fill(); ctx.restore();
            }
        }
        else {
            drawCubeVisual(ctx, p.width, configRef.current.icon, configRef.current.color);
        }
        ctx.restore();
    }
    
    if (p.isDashing && !p.isDead) {
        ctx.save(); ctx.translate(p.x - 20 + p.width/2, p.y + p.height/2); ctx.globalAlpha = 0.5; ctx.fillStyle = configRef.current.color; ctx.fillRect(-20, -20, 40, 40); ctx.restore();
    }

    for (const part of particles.current) {
        ctx.globalAlpha = part.life; ctx.fillStyle = part.color; ctx.beginPath();
        if ((p.mode === 'ship' && part.color === '#fbbf24') || part.color === '#22c55e' || p.mode === 'ball') {
             ctx.arc(part.x, part.y, part.size, 0, Math.PI * 2);
        } else {
             ctx.fillRect(part.x - part.size/2, part.y - part.size/2, part.size, part.size);
        }
        ctx.fill();
    }
    ctx.globalAlpha = 1.0;
    ctx.restore(); 
  }, []);

  const tick = useCallback(() => {
    update();
    draw();
    requestRef.current = requestAnimationFrame(tick);
  }, [update, draw]);

  useEffect(() => {
    requestRef.current = requestAnimationFrame(tick);
    const handleResize = () => {
        if (canvasRef.current) {
            canvasRef.current.width = window.innerWidth;
            canvasRef.current.height = window.innerHeight;
            reset(); // Reset player pos on resize
        }
    };
    window.addEventListener('resize', handleResize);
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
      window.removeEventListener('resize', handleResize);
    };
  }, [tick, reset]);

  const handleStart = useCallback(() => {
      if (gameState.current === 'MENU' || gameState.current === 'GAMEOVER' || gameState.current === 'WON') {
          if (gameState.current === 'GAMEOVER' || gameState.current === 'WON') {
               reset();
               onAttemptChange(prev => prev + 1);
          }
          gameState.current = 'PLAYING';
          onStateChange('PLAYING');
      }
  }, [onStateChange, onAttemptChange, reset]);
  
  const handleInputDown = useCallback((e: MouseEvent | TouchEvent | KeyboardEvent) => {
    if (gameState.current === 'PAUSED') return;
    if (e.type === 'keydown' && isPracticeRef.current) {
        const k = (e as KeyboardEvent).code;
        if (k === 'KeyZ') { createCheckpoint(); return; }
        if (k === 'KeyX') { removeLastCheckpoint(); return; }
    }
    if (e.type === 'keydown') {
        if ((e as KeyboardEvent).code === 'Space' || (e as KeyboardEvent).code === 'ArrowUp') {
            e.preventDefault(); 
            if (gameState.current === 'MENU') { handleStart(); return; }
        } else { return; }
    }
    if (e.type === 'mousedown' || e.type === 'touchstart') {
        const target = e.target as HTMLElement;
        const isInteractive = target.closest('button') || target.closest('.pointer-events-auto') || target.tagName === 'INPUT';
        if (isInteractive && !target.closest('canvas')) { return; }
    }
    if (gameState.current === 'MENU') { return; }
    if (gameState.current === 'GAMEOVER' || gameState.current === 'WON') { handleStart(); return; }
    isHoldingInput.current = true;
    const p = player.current;
    if (p.mode === 'cube' && p.isGrounded) {
        p.vy = GAME_CONFIG.JUMP_FORCE; p.isGrounded = false; audioService.playJump();
    } else if (p.mode === 'ball' && p.isGrounded) {
        p.gravityInverted = !p.gravityInverted; p.isGrounded = false; audioService.playJump(); 
        spawnBallGravityParticles(p.x + p.width/2, p.y + p.height/2); ballScaleRef.current = 0.8; 
    }
  }, [handleStart, createCheckpoint, removeLastCheckpoint, spawnBallGravityParticles]);
  
  const handleInputUp = useCallback(() => { isHoldingInput.current = false; }, []);

  useEffect(() => {
      const handleCustom = (e: CustomEvent) => {
          if (e.detail === 'checkpoint') createCheckpoint();
          if (e.detail === 'remove_checkpoint') removeLastCheckpoint();
      };
      window.addEventListener('game-action', handleCustom as EventListener);
      return () => window.removeEventListener('game-action', handleCustom as EventListener);
  }, [createCheckpoint, removeLastCheckpoint]);

  useEffect(() => {
    window.addEventListener('mousedown', handleInputDown);
    window.addEventListener('touchstart', handleInputDown);
    window.addEventListener('keydown', handleInputDown);
    window.addEventListener('mouseup', handleInputUp);
    window.addEventListener('touchend', handleInputUp);
    window.addEventListener('keyup', handleInputUp);
    return () => {
      window.removeEventListener('mousedown', handleInputDown);
      window.removeEventListener('touchstart', handleInputDown);
      window.removeEventListener('keydown', handleInputDown);
      window.removeEventListener('mouseup', handleInputUp);
      window.removeEventListener('touchend', handleInputUp);
      window.removeEventListener('keyup', handleInputUp);
    };
  }, [handleInputDown, handleInputUp]);

  return <canvas ref={canvasRef} width={window.innerWidth} height={window.innerHeight} className="block w-full h-full" style={{ cursor: 'pointer' }} />;
};