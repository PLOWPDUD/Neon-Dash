
import React, { useRef, useEffect, useCallback } from 'react';
import { GAME_CONFIG, COLORS } from '../constants';
import { GameState, Player, Obstacle, Particle, PlayerIconType, ShipIconType, WaveIconType } from '../types';
import { audioService } from '../services/audioService';

interface GameEngineProps {
  levelData: any[];
  gameState: GameState;
  onStateChange: (state: GameState) => void;
  onAttemptChange: (attempt: number) => void;
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
  const requestRef = useRef<number>();
  
  // To avoid stale closures in the game loop, we store the current config in a ref
  const configRef = useRef({ color: playerColor, icon: playerIcon, ship: shipIcon, wave: waveIcon });

  useEffect(() => {
    configRef.current = { color: playerColor, icon: playerIcon, ship: shipIcon, wave: waveIcon };
  }, [playerColor, playerIcon, shipIcon, waveIcon]);

  // Game State Refs (Mutable for performance)
  const gameState = useRef<GameState>('MENU');
  const attempt = useRef<number>(1);
  const isCoinCollected = useRef<boolean>(false);
  const isHoldingInput = useRef<boolean>(false);
  const lastOrbId = useRef<number>(-1);
  
  // Sync external prop state to internal ref
  useEffect(() => {
    if (gameState.current !== externalGameState) {
        gameState.current = externalGameState;
    }
  }, [externalGameState]);
  
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
  });
  const camera = useRef({ x: 0, y: 0 });
  const particles = useRef<Particle[]>([]);
  const obstacles = useRef<Obstacle[]>([]);

  // --- Core Actions (Memoized) ---

  const initLevel = useCallback(() => {
    const obs: Obstacle[] = [];
    let idCounter = 0;
    
    levelData.forEach((data) => {
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
        vx: -2,
        vy: 0,
        life: 0.4,
        color: configRef.current.color,
        size: 8,
      });
  }, []);
  
  const spawnDashParticles = useCallback((x: number, y: number) => {
      // Speed lines
      particles.current.push({
        x: x,
        y: y,
        vx: -15 - Math.random() * 10, // Fast backward
        vy: (Math.random() - 0.5) * 2,
        life: 0.4,
        color: COLORS.ORB_DASH,
        size: 2,
      });
  }, []);

  const die = useCallback(() => {
    if (player.current.isDead) return;
    player.current.isDead = true;
    gameState.current = 'GAMEOVER';
    onStateChange('GAMEOVER');
    audioService.playDeath();
    spawnDeathParticles(player.current.x + player.current.width/2, player.current.y + player.current.height/2);
  }, [onStateChange, spawnDeathParticles]);

  const win = useCallback(() => {
      if (gameState.current === 'WON') return;
      gameState.current = 'WON';
      onStateChange('WON');
      audioService.playWin();
  }, [onStateChange]);

  const collectCoin = useCallback((obs: Obstacle) => {
      if (obs.collected) return;
      obs.collected = true;
      isCoinCollected.current = true;
      onCoinCollect(true);
      audioService.playCoin();
      spawnCoinParticles(obs.x + obs.width/2, (canvasRef.current?.height || 0) - GAME_CONFIG.GROUND_HEIGHT - obs.y - obs.height/2);
  }, [onCoinCollect, spawnCoinParticles]);

  const resetGame = useCallback(() => {
    player.current = {
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
    };
    camera.current.x = 0;
    camera.current.y = 0;
    particles.current = [];
    isCoinCollected.current = false;
    isHoldingInput.current = false;
    lastOrbId.current = -1;
    onCoinCollect(false);
    
    initLevel();
    
    gameState.current = 'PLAYING';
    onStateChange('PLAYING');
  }, [initLevel, onStateChange, onCoinCollect]);

  // Handle Level Data changes
  useEffect(() => {
      resetGame();
      gameState.current = 'MENU';
      onStateChange('MENU');
      attempt.current = 1;
      onAttemptChange(1);
  }, [levelData, resetGame, onStateChange, onAttemptChange]);


  const jump = useCallback(() => {
    const p = player.current;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const groundY = canvas.height - GAME_CONFIG.GROUND_HEIGHT;

    // Check for Orbs (Standard Jump Orbs only, Dash Orbs handled in update loop for hold)
    const activeOrb = obstacles.current.find(obs => {
        if (obs.type !== 'orb') return false; // Only standard orbs in jump logic
        
        const yPos = groundY - obs.y;
        const obsLeft = obs.x;
        const obsRight = obs.x + obs.width;
        const obsTop = yPos - obs.height;
        const obsBottom = yPos;
        
        const pLeft = p.x;
        const pRight = p.x + p.width;
        const pTop = p.y;
        const pBottom = p.y + p.height;
        
        return (pRight > obsLeft && pLeft < obsRight && pBottom > obsTop && pTop < obsBottom);
    });

    if (activeOrb) {
        if (lastOrbId.current === activeOrb.id) return;

        // Yellow Orb
        p.vy = GAME_CONFIG.JUMP_FORCE * 1.2;
        p.isGrounded = false;
        p.isDashing = false; 
        lastOrbId.current = activeOrb.id;
        audioService.playOrb();
        spawnOrbParticles(activeOrb.x + activeOrb.width/2, groundY - activeOrb.y - activeOrb.height/2, COLORS.ORB);
        return;
    }

    // Normal Jump
    if (p.mode === 'cube' && p.isGrounded) {
      p.vy = GAME_CONFIG.JUMP_FORCE;
      p.isGrounded = false;
      audioService.playJump();
    }
  }, [spawnOrbParticles]);

  const handleInputDown = useCallback(() => {
      if (gameState.current === 'PAUSED') return;

      isHoldingInput.current = true;

      if (gameState.current === 'MENU' || gameState.current === 'GAMEOVER' || gameState.current === 'WON') {
        if (gameState.current === 'GAMEOVER') {
            attempt.current += 1;
            onAttemptChange(attempt.current);
        }
        resetGame();
        return;
      }

      if (gameState.current === 'PLAYING') {
          if (player.current.mode === 'cube') {
              jump();
          }
      }
  }, [jump, resetGame, onAttemptChange]);

  const handleInputUp = useCallback(() => {
      isHoldingInput.current = false;
  }, []);

  const updateParticles = useCallback(() => {
    for (let i = particles.current.length - 1; i >= 0; i--) {
      const part = particles.current[i];
      part.x += part.vx;
      part.y += part.vy;
      part.life -= 0.02;
      part.size *= 0.95;
      if (part.life <= 0) {
        particles.current.splice(i, 1);
      }
    }
  }, []);

  const update = useCallback((canvas: HTMLCanvasElement) => {
    if (gameState.current === 'PAUSED') return;

    if (gameState.current !== 'PLAYING') {
      if (gameState.current === 'GAMEOVER' || gameState.current === 'WON') {
        updateParticles();
      }
      return;
    }

    const p = player.current;

    // Auto-jump if holding input (Cube mode - spam jump)
    if (p.mode === 'cube' && isHoldingInput.current) {
        jump();
    }

    let groundY = canvas.height - GAME_CONFIG.GROUND_HEIGHT;

    // --- PHYSICS ---
    p.x += GAME_CONFIG.MOVE_SPEED;

    // Handle Dashing
    if (p.isDashing) {
        p.vy = 0; // No gravity while dashing
        spawnDashParticles(p.x, p.y + p.height/2);
        p.rotation = p.rotation * 0.8;
        
        // Stop Dashing if key released
        if (!isHoldingInput.current) {
            p.isDashing = false;
        }
    } 
    else {
        // Normal Physics
        if (p.mode === 'cube') {
            p.vy += GAME_CONFIG.GRAVITY;
            p.y += p.vy;
            
            if (!p.isGrounded) {
                p.rotation += 0.15;
            } else {
                const nearest90 = Math.round(p.rotation / (Math.PI / 2)) * (Math.PI / 2);
                p.rotation = p.rotation * 0.8 + nearest90 * 0.2;
            }

        } else if (p.mode === 'ship') {
            p.vy += GAME_CONFIG.SHIP_GRAVITY;
            if (isHoldingInput.current) {
                p.vy -= GAME_CONFIG.SHIP_LIFT;
                spawnShipTrail(p.x, p.y + p.height/2);
            }
            if (p.vy > 15) p.vy = 15;
            if (p.vy < -15) p.vy = -15;
            p.y += p.vy;
            const targetRotation = p.vy * 0.05; 
            p.rotation = p.rotation * 0.9 + targetRotation * 0.1;

        } else if (p.mode === 'wave') {
            if (isHoldingInput.current) {
                p.vy = -GAME_CONFIG.WAVE_SPEED;
                p.rotation = -Math.PI / 4; 
            } else {
                p.vy = GAME_CONFIG.WAVE_SPEED;
                p.rotation = Math.PI / 4; 
            }
            p.y += p.vy;
            spawnWaveTrail(p.x + p.width/2, p.y + p.height/2);
        }
    }


    // --- COLLISION ---
    p.isGrounded = false;

    obstacles.current.forEach(obs => {
      const yPos = groundY - obs.y;

      // Dash Orb Logic: Moved to update loop for continuous hold detection
      if (obs.type === 'orb_dash') {
          const obsLeft = obs.x;
          const obsRight = obs.x + obs.width;
          const obsTop = yPos - obs.height;
          const obsBottom = yPos;
          
          if (p.x + p.width > obsLeft && p.x < obsRight && p.y + p.height > obsTop && p.y < obsBottom) {
              if (isHoldingInput.current) {
                  if (!p.isDashing) {
                      p.isDashing = true;
                      p.vy = 0;
                      // Snap Y to orb center for clean flight
                      p.y = yPos - obs.height/2 - p.height/2; 
                      p.isGrounded = false;
                      p.rotation = 0;
                      audioService.playDash();
                      spawnOrbParticles(obs.x + obs.width/2, yPos - obs.height/2, COLORS.ORB_DASH);
                  }
              }
          }
          return;
      }

      if (obs.type === 'coin') {
          if (obs.collected) return;
          if (p.x + p.width > obs.x && p.x < obs.x + obs.width &&
              p.y + p.height > yPos - obs.height && p.y < yPos) {
              collectCoin(obs);
          }
          return;
      }

      if (obs.type === 'portal_ship' || obs.type === 'portal_cube' || obs.type === 'portal_wave') {
           if (p.x + p.width > obs.x && p.x < obs.x + obs.width &&
              p.y + p.height > yPos - obs.height && p.y < yPos) {
             if (obs.type === 'portal_ship' && p.mode !== 'ship') {
                 p.mode = 'ship'; p.rotation = 0; p.vy = -5; p.isDashing = false;
             } else if (obs.type === 'portal_cube' && p.mode !== 'cube') {
                 p.mode = 'cube'; p.rotation = 0; p.isDashing = false;
                 p.rotation = Math.round(p.rotation / (Math.PI / 2)) * (Math.PI / 2);
             } else if (obs.type === 'portal_wave' && p.mode !== 'wave') {
                 p.mode = 'wave'; p.rotation = 0; p.vy = GAME_CONFIG.WAVE_SPEED; p.isDashing = false;
             }
          }
          return;
      }
      
      if (obs.type === 'orb') return;

      // Block/Spike
      const obsLeft = obs.x;
      const obsRight = obs.x + obs.width;
      const obsTop = yPos - obs.height;
      const obsBottom = yPos;
      const pLeft = p.x;
      const pRight = p.x + p.width;
      const pBottom = p.y + p.height;
      const pTop = p.y;

      if (pRight > obsLeft && pLeft < obsRight && pBottom > obsTop && pTop < obsBottom) {
          if (obs.type === 'spike') {
              if (p.x + p.width > obs.x + 8 && p.x < obs.x + obs.width - 8 &&
                  p.y + p.height > yPos - obs.height + 8 && p.y < yPos) {
                   die();
              }
          } else if (obs.type === 'finish') {
             win();
          } else if (obs.type === 'block') {
             const prevBottom = pBottom - p.vy;
             const tolerance = p.mode === 'wave' ? 20 : 15;

             // Logic for landing vs crashing
             if (prevBottom <= obsTop + tolerance && p.vy >= 0) {
                 // Landing
                 p.y = obsTop - p.height;
                 p.vy = 0;
                 p.isGrounded = true;
                 if (p.mode === 'ship') p.rotation = 0; 
             } 
             else if (pTop - p.vy >= obsBottom - tolerance && p.vy < 0) {
                  // Ceiling
                  p.y = obsBottom;
                  p.vy = 0;
                  if (p.mode === 'wave') die();
             }
             else {
                 // Side impact or inside block
                 die();
             }
          }
      }
    });

    // Floor
    if (p.y + p.height >= groundY && !p.isDead) {
      if (p.mode === 'wave') {
          p.y = groundY - p.height;
      } else {
          p.y = groundY - p.height;
          p.vy = 0;
          p.isGrounded = true;
          if (p.mode === 'ship') p.rotation = 0;
      }
    }

    // Camera
    camera.current.x = p.x - canvas.width * 0.25;
    const playerCenterY = p.y + p.height / 2;
    const idealY = canvas.height * 0.6; 
    let targetCamY = idealY - playerCenterY;
    if (targetCamY < -100) targetCamY = -100; 
    if (targetCamY > 400) targetCamY = 400; 
    camera.current.y += (targetCamY - camera.current.y) * 0.1;

    const totalDist = obstacles.current[obstacles.current.length - 1]?.x || 1000;
    onProgressChange(Math.min(100, Math.floor((p.x / totalDist) * 100)));

    updateParticles();
  }, [die, win, onProgressChange, updateParticles, collectCoin, spawnShipTrail, spawnWaveTrail, spawnDashParticles, spawnOrbParticles, jump]);

  const drawIconDesign = (ctx: CanvasRenderingContext2D, size: number, type: PlayerIconType) => {
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    const s = size;
    switch (type) {
        case 'face':
            ctx.fillRect(s * 0.2, s * 0.2, s * 0.2, s * 0.2);
            ctx.fillRect(s * 0.6, s * 0.2, s * 0.2, s * 0.2);
            ctx.fillRect(s * 0.2, s * 0.6, s * 0.6, s * 0.15);
            break;
        case 'creeper':
            ctx.fillRect(s * 0.15, s * 0.2, s * 0.2, s * 0.2);
            ctx.fillRect(s * 0.65, s * 0.2, s * 0.2, s * 0.2);
            ctx.fillRect(s * 0.4, s * 0.4, s * 0.2, s * 0.3);
            ctx.fillRect(s * 0.3, s * 0.55, s * 0.1, s * 0.25);
            ctx.fillRect(s * 0.6, s * 0.55, s * 0.1, s * 0.25);
            break;
        case 'lines':
             ctx.fillRect(0, s * 0.2, s, s * 0.15);
             ctx.fillRect(0, s * 0.6, s, s * 0.15);
             break;
        case 'dot':
             ctx.beginPath();
             ctx.arc(s/2, s/2, s*0.25, 0, Math.PI*2);
             ctx.fill();
             break;
        case 'cross':
             ctx.beginPath();
             ctx.moveTo(s*0.2, s*0.2);
             ctx.lineTo(s*0.8, s*0.8);
             ctx.moveTo(s*0.8, s*0.2);
             ctx.lineTo(s*0.2, s*0.8);
             ctx.strokeStyle = 'rgba(0,0,0,0.5)';
             ctx.lineWidth = s * 0.15;
             ctx.stroke();
             break;
        case 'default':
        default:
            ctx.fillRect(s * 0.25, s * 0.25, s * 0.5, s * 0.5);
            break;
    }
  };

  const drawShipChassis = (ctx: CanvasRenderingContext2D, type: ShipIconType, w: number, h: number) => {
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      if (type === 'default') {
          ctx.moveTo(-w/2 - 10, h/2);
          ctx.lineTo(w/2 + 15, h/2);
          ctx.lineTo(w/2 + 5, 0);
          ctx.lineTo(-w/2 - 5, 0);
      } else if (type === 'fighter') {
           ctx.moveTo(-w/2 - 15, h/2);
           ctx.lineTo(w/2 + 20, h/2);
           ctx.lineTo(w/2 + 10, -h/4);
           ctx.lineTo(-w/2, -h/4);
           // Wing
           ctx.moveTo(-w/2, h/2);
           ctx.lineTo(-w/2 - 10, h/2 + 10);
           ctx.lineTo(0, h/2);
      } else if (type === 'shark') {
           ctx.ellipse(0, h/4, w/2 + 10, h/3, 0, 0, Math.PI * 2);
           // Fin
           ctx.moveTo(-10, -h/4);
           ctx.lineTo(0, -h);
           ctx.lineTo(10, -h/4);
      } else if (type === 'saucer') {
          ctx.ellipse(0, h/3, w/2 + 10, h/3, 0, 0, Math.PI); // half circle bottom
          ctx.lineTo(w/2 + 10, 0);
          ctx.bezierCurveTo(20, -20, -20, -20, -w/2 - 10, 0);
      }
      ctx.closePath();
      ctx.fill();
      // Add some detail lines
      ctx.strokeStyle = '#cbd5e1'; 
      ctx.lineWidth = 2;
      ctx.stroke();
  };

  const drawWaveIcon = (ctx: CanvasRenderingContext2D, type: WaveIconType, w: number, h: number, color: string) => {
       ctx.fillStyle = color;
       ctx.beginPath();
       if (type === 'default') {
           ctx.moveTo(-w/2, -h/2);
           ctx.lineTo(w/2, 0);
           ctx.lineTo(-w/2, h/2);
       } else if (type === 'dart') {
           ctx.moveTo(-w/2, -h/2);
           ctx.lineTo(w/2 + 10, 0);
           ctx.lineTo(-w/2, h/2);
           ctx.lineTo(-w/4, 0); 
       } else if (type === 'saw') {
           ctx.moveTo(-w/2, -h/2);
           ctx.lineTo(-w/4, -h/4);
           ctx.lineTo(0, -h/2);
           ctx.lineTo(w/4, -h/4);
           ctx.lineTo(w/2, 0);
           ctx.lineTo(w/4, h/4);
           ctx.lineTo(0, h/2);
           ctx.lineTo(-w/4, h/4);
           ctx.lineTo(-w/2, h/2);
       } else if (type === 'shuriken') {
           ctx.moveTo(0, -h/2 - 5);
           ctx.lineTo(w/2 + 5, 0);
           ctx.lineTo(0, h/2 + 5);
           ctx.lineTo(-w/2 - 5, 0);
       }
       ctx.closePath();
       ctx.fill();
       ctx.strokeStyle = '#fff';
       ctx.lineWidth = 2;
       ctx.stroke();
  };

  const draw = useCallback((ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
    ctx.fillStyle = COLORS.BACKGROUND;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    ctx.translate(-camera.current.x, camera.current.y);

    // Grid
    const gridSize = 100;
    ctx.strokeStyle = COLORS.GRID;
    ctx.lineWidth = 2;
    ctx.beginPath();
    const startX = Math.floor(camera.current.x / gridSize) * gridSize;
    const endX = camera.current.x + canvas.width;
    const startY = Math.floor(-camera.current.y / gridSize) * gridSize;
    const endY = canvas.height - camera.current.y;
    for (let x = startX; x < endX + gridSize; x += gridSize) {
       ctx.moveTo(x, startY); ctx.lineTo(x, endY);
    }
    for (let y = startY; y < endY + gridSize; y += gridSize) {
        ctx.moveTo(camera.current.x, y); ctx.lineTo(camera.current.x + canvas.width, y);
    }
    ctx.stroke();

    const groundY = canvas.height - GAME_CONFIG.GROUND_HEIGHT;

    obstacles.current.forEach(obs => {
       const yPos = groundY - obs.y;
       if (obs.type === 'spike') {
         ctx.fillStyle = COLORS.SPIKE;
         ctx.beginPath();
         ctx.moveTo(obs.x, yPos);
         ctx.lineTo(obs.x + obs.width / 2, yPos - obs.height);
         ctx.lineTo(obs.x + obs.width, yPos);
         ctx.closePath();
         ctx.fill();
         ctx.fillStyle = 'rgba(0,0,0,0.3)';
         ctx.beginPath();
         ctx.moveTo(obs.x + 10, yPos);
         ctx.lineTo(obs.x + obs.width / 2, yPos - obs.height + 10);
         ctx.lineTo(obs.x + obs.width - 10, yPos);
         ctx.closePath();
         ctx.fill();
       } else if (obs.type === 'block') {
         ctx.fillStyle = COLORS.BLOCK;
         ctx.strokeStyle = COLORS.BLOCK_BORDER;
         ctx.lineWidth = 2;
         ctx.fillRect(obs.x, yPos - obs.height, obs.width, obs.height);
         ctx.strokeRect(obs.x, yPos - obs.height, obs.width, obs.height);
       } else if (obs.type === 'finish') {
           ctx.fillStyle = '#10b981';
           ctx.fillRect(obs.x, 0, 20, canvas.height);
       } else if (obs.type === 'coin' && !obs.collected) {
           const cx = obs.x + obs.width/2;
           const cy = yPos - obs.height/2;
           const time = Date.now() * 0.005;
           ctx.save();
           ctx.translate(cx, cy);
           ctx.rotate(time);
           ctx.fillStyle = COLORS.COIN;
           ctx.beginPath();
           for (let i = 0; i < 5; i++) {
               ctx.lineTo(Math.cos((18 + i * 72) * Math.PI / 180) * 20, Math.sin((18 + i * 72) * Math.PI / 180) * 20);
               ctx.lineTo(Math.cos((54 + i * 72) * Math.PI / 180) * 10, Math.sin((54 + i * 72) * Math.PI / 180) * 10);
           }
           ctx.closePath();
           ctx.fill();
           ctx.strokeStyle = '#fff';
           ctx.lineWidth = 2;
           ctx.stroke();
           ctx.restore();
       } else if (obs.type === 'orb' || obs.type === 'orb_dash') {
           const cx = obs.x + obs.width/2;
           const cy = yPos - obs.height/2;
           const isDash = obs.type === 'orb_dash';
           const orbColor = isDash ? COLORS.ORB_DASH : COLORS.ORB;
           
           const pulse = (Math.sin(Date.now() * 0.01) + 1) / 2;
           ctx.beginPath();
           ctx.arc(cx, cy, 22 + pulse * 4, 0, Math.PI * 2);
           ctx.strokeStyle = orbColor;
           ctx.lineWidth = 2;
           ctx.stroke();
           
           ctx.beginPath();
           ctx.arc(cx, cy, 15, 0, Math.PI * 2);
           ctx.fillStyle = orbColor;
           ctx.fill();
           
           if (isDash) {
               ctx.beginPath();
               ctx.arc(cx, cy, 8, 0, Math.PI * 2);
               ctx.fillStyle = '#fff';
               ctx.fill();
           }

           ctx.strokeStyle = '#fff';
           ctx.lineWidth = 2;
           ctx.stroke();
       } else if (obs.type === 'portal_ship' || obs.type === 'portal_cube' || obs.type === 'portal_wave') {
           let portalColor = COLORS.PORTAL_CUBE;
           if (obs.type === 'portal_ship') portalColor = COLORS.PORTAL_SHIP;
           if (obs.type === 'portal_wave') portalColor = COLORS.PORTAL_WAVE;

           ctx.fillStyle = portalColor;
           ctx.fillRect(obs.x, yPos - obs.height, obs.width, obs.height);
           
           ctx.shadowColor = portalColor;
           ctx.shadowBlur = 20;
           ctx.strokeStyle = '#fff';
           ctx.lineWidth = 3;
           ctx.strokeRect(obs.x, yPos - obs.height, obs.width, obs.height);
           ctx.shadowBlur = 0;
           
           ctx.fillStyle = '#fff';
           if (obs.type === 'portal_ship') {
                ctx.beginPath(); ctx.moveTo(obs.x + 10, yPos - 10); ctx.lineTo(obs.x + 30, yPos - 20); ctx.lineTo(obs.x + 10, yPos - 30); ctx.fill();
           } else if (obs.type === 'portal_wave') {
                ctx.beginPath(); ctx.moveTo(obs.x + 10, yPos - 20); ctx.lineTo(obs.x + 18, yPos - 10); ctx.lineTo(obs.x + 22, yPos - 30); ctx.lineTo(obs.x + 30, yPos - 20); ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.stroke();
           } else {
               ctx.fillRect(obs.x + 10, yPos - 30, 20, 20);
           }
       }
    });

    // Ground
    ctx.fillStyle = COLORS.GROUND;
    ctx.fillRect(camera.current.x, groundY, canvas.width, canvas.height - groundY + 1000); 
    ctx.strokeStyle = COLORS.GROUND_LINE;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(camera.current.x, groundY);
    ctx.lineTo(camera.current.x + canvas.width, groundY);
    ctx.stroke();

    // Player
    if (!player.current.isDead) {
      const p = player.current;
      ctx.save();
      ctx.translate(p.x + p.width/2, p.y + p.height/2);
      ctx.rotate(p.rotation);
      
      // Draw Afterimage when dashing
      if (p.isDashing) {
          ctx.save();
          ctx.translate(-40, 0); 
          ctx.globalAlpha = 0.5;
          ctx.fillStyle = COLORS.ORB_DASH;
          ctx.fillRect(-p.width/2, -p.height/2, p.width, p.height);
          ctx.restore();
          
          ctx.save();
          ctx.translate(-20, 0);
          ctx.globalAlpha = 0.8;
          ctx.fillStyle = COLORS.ORB_DASH;
          ctx.fillRect(-p.width/2, -p.height/2, p.width, p.height);
          ctx.restore();
      }

      if (p.mode === 'ship') {
          drawShipChassis(ctx, configRef.current.ship, p.width, p.height);
          ctx.scale(0.7, 0.7);
          ctx.translate(0, -10);
      } else if (p.mode === 'wave') {
          drawWaveIcon(ctx, configRef.current.wave, p.width, p.height, configRef.current.color);
      }

      if (p.mode !== 'wave') {
          ctx.fillStyle = configRef.current.color;
          ctx.fillRect(-p.width/2, -p.height/2, p.width, p.height);
          ctx.strokeStyle = COLORS.PLAYER_BORDER;
          ctx.lineWidth = 3;
          ctx.strokeRect(-p.width/2, -p.height/2, p.width, p.height);
          ctx.translate(-p.width/2, -p.height/2);
          drawIconDesign(ctx, p.width, configRef.current.icon);
      }
      
      ctx.restore();
    }

    // Particles
    particles.current.forEach(part => {
      ctx.save();
      ctx.globalAlpha = part.life;
      ctx.fillStyle = part.color;
      ctx.translate(part.x, part.y);
      ctx.fillRect(-part.size/2, -part.size/2, part.size, part.size);
      ctx.restore();
    });

    ctx.restore();
  }, []);

  const loop = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    if (canvas.width !== window.innerWidth) {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    update(canvas);
    draw(ctx, canvas);
    requestRef.current = requestAnimationFrame(loop);
  }, [update, draw]);

  useEffect(() => {
    initLevel();
    requestRef.current = requestAnimationFrame(loop);
    const handleKeyDown = (e: KeyboardEvent) => { if (e.code === 'Space' || e.code === 'ArrowUp') handleInputDown(); };
    const handleMouseDown = (e: Event) => { if ((e.target as HTMLElement).tagName === 'BUTTON') return; handleInputDown(); };
    const handleKeyUp = (e: KeyboardEvent) => { if (e.code === 'Space' || e.code === 'ArrowUp') handleInputUp(); };
    const handleMouseUp = () => { handleInputUp(); };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('touchstart', handleMouseDown);
    window.addEventListener('touchend', handleMouseUp);

    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchstart', handleMouseDown);
      window.removeEventListener('touchend', handleMouseUp);
    };
  }, [loop, initLevel, handleInputDown, handleInputUp]);

  return <canvas ref={canvasRef} className="block w-full h-full" />;
};
