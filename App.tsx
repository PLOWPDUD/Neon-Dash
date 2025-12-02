
import React, { useState, useCallback } from 'react';
import { GameEngine } from './components/GameEngine';
import { GameState, PlayerIconType, ShipIconType, WaveIconType } from './types';
import { Play, RotateCcw, Trophy, Palette, X, Check, Coins, ChevronLeft, ChevronRight, FastForward, Pause, Grid, Home, LogOut, Rocket, Box, Zap } from 'lucide-react';
import { PLAYER_COLORS, PLAYER_ICONS, LEVELS, SHIP_ICONS, WAVE_ICONS } from './constants';

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>('MENU');
  const [attempt, setAttempt] = useState(1);
  const [progress, setProgress] = useState(0);
  const [hasCoin, setHasCoin] = useState(false);
  const [currentLevelIndex, setCurrentLevelIndex] = useState(0);
  
  // Customization State
  const [playerColor, setPlayerColor] = useState(PLAYER_COLORS[0]);
  const [playerIcon, setPlayerIcon] = useState<PlayerIconType>('default');
  const [shipIcon, setShipIcon] = useState<ShipIconType>('default');
  const [waveIcon, setWaveIcon] = useState<WaveIconType>('default');
  const [isCustomizing, setIsCustomizing] = useState(false);
  const [customizationTab, setCustomizationTab] = useState<'cube' | 'ship' | 'wave'>('cube');
  
  // Modal State
  const [showLevelSelector, setShowLevelSelector] = useState(false);

  const currentLevel = LEVELS[currentLevelIndex];

  // Throttled Progress Update to avoid excessive re-renders
  const handleProgressChange = useCallback((newProgress: number) => {
      // Only update state if change is significant (>1%) or if 100%
      setProgress((prev) => {
          if (newProgress === 100) return 100;
          if (Math.abs(newProgress - prev) >= 1) return newProgress;
          return prev;
      });
  }, []);

  const handleNextLevel = () => {
      if (currentLevelIndex < LEVELS.length - 1) {
          setCurrentLevelIndex(prev => prev + 1);
          setGameState('MENU'); // Go to menu of next level
      }
  };

  const changeLevel = (direction: 'prev' | 'next') => {
      if (direction === 'prev') {
          setCurrentLevelIndex(prev => (prev > 0 ? prev - 1 : LEVELS.length - 1));
      } else {
          setCurrentLevelIndex(prev => (prev < LEVELS.length - 1 ? prev + 1 : 0));
      }
  };
  
  const handleSelectLevel = (index: number) => {
      setCurrentLevelIndex(index);
      setShowLevelSelector(false);
      setGameState('MENU');
  };

  const togglePause = () => {
      if (gameState === 'PLAYING') {
          setGameState('PAUSED');
      } else if (gameState === 'PAUSED') {
          setGameState('PLAYING');
      }
  };

  return (
    <div className="relative w-screen h-screen bg-slate-900 overflow-hidden select-none font-sans">
      {/* Game Layer */}
      <div className="absolute inset-0 z-0">
        <GameEngine 
            levelData={currentLevel.data}
            gameState={gameState}
            onStateChange={setGameState} 
            onAttemptChange={setAttempt}
            onProgressChange={handleProgressChange}
            onCoinCollect={setHasCoin}
            playerColor={playerColor}
            playerIcon={playerIcon}
            shipIcon={shipIcon}
            waveIcon={waveIcon}
        />
      </div>

      {/* UI Layer */}
      <div className="absolute inset-0 z-10 pointer-events-none flex flex-col justify-between p-6">
        
        {/* Top Bar */}
        <div className="flex justify-between items-start pointer-events-auto w-full">
             <div className="flex flex-col">
                <h1 className="text-2xl font-black text-cyan-400 drop-shadow-[0_0_10px_rgba(34,211,238,0.8)] tracking-wider">NEON DASH</h1>
                <span className="text-xs text-cyan-200/60 uppercase tracking-widest">Attempt {attempt}</span>
             </div>
             
             {/* Center Top: Coin Status */}
             <div className={`absolute left-1/2 -translate-x-1/2 top-6 flex items-center gap-2 px-4 py-2 rounded-full border-2 transition-all duration-500 ${hasCoin ? 'bg-yellow-500/20 border-yellow-400 text-yellow-300 scale-110 shadow-[0_0_20px_rgba(250,204,21,0.5)]' : 'bg-slate-800/50 border-slate-600 text-slate-500'}`}>
                <Coins size={20} className={hasCoin ? 'animate-bounce' : ''} />
                <span className="font-bold text-sm">{hasCoin ? '1/1' : '0/1'}</span>
             </div>

             {/* Right Top: Controls */}
             <div className="flex gap-4">
                 {/* Progress Bar (Visible mostly when playing) */}
                 <div className="w-48 md:w-64 h-8 bg-slate-800/80 border-2 border-slate-600 rounded-full overflow-hidden backdrop-blur-sm relative hidden md:block">
                     <div 
                        className="h-full bg-gradient-to-r from-green-400 to-cyan-400 transition-all duration-100 ease-linear"
                        style={{ width: `${progress}%` }}
                     />
                     <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white drop-shadow-md">
                         {progress}%
                     </span>
                 </div>
                 
                 {gameState === 'PLAYING' && (
                     <button onClick={togglePause} className="p-2 bg-slate-800/80 border-2 border-slate-500 rounded-lg hover:bg-slate-700 text-white transition-colors">
                         <Pause size={24} />
                     </button>
                 )}
             </div>
        </div>

        {/* Center Messages / Overlays */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            
            {/* MAIN MENU */}
            {gameState === 'MENU' && !isCustomizing && !showLevelSelector && (
                <div className="bg-black/80 backdrop-blur-md p-8 rounded-2xl border-2 border-cyan-500/50 shadow-[0_0_50px_rgba(6,182,212,0.3)] text-center animate-in fade-in zoom-in duration-300 pointer-events-auto min-w-[320px]">
                    <h2 className="text-4xl md:text-5xl font-black text-white mb-2 italic uppercase">{currentLevel.name}</h2>
                    <div className="flex justify-center items-center gap-4 mb-6">
                         <button onClick={() => changeLevel('prev')} className="p-2 text-white/50 hover:text-white hover:bg-white/10 rounded-full transition-all">
                             <ChevronLeft size={32} />
                         </button>
                         <span className="text-cyan-400 font-mono text-xs uppercase tracking-widest border border-cyan-500/30 px-3 py-1 rounded bg-cyan-950/30">
                             Level {currentLevelIndex + 1}
                         </span>
                         <button onClick={() => changeLevel('next')} className="p-2 text-white/50 hover:text-white hover:bg-white/10 rounded-full transition-all">
                             <ChevronRight size={32} />
                         </button>
                    </div>

                    <div className="flex flex-col gap-4 items-center">
                        <div 
                            className="flex justify-center cursor-pointer hover:scale-110 transition-transform active:scale-95"
                            onClick={(e) => {
                                // The global listener handles the start
                            }}
                        >
                            <Play className="w-16 h-16 text-cyan-400 fill-cyan-400/20 animate-bounce" />
                        </div>
                        
                        <div className="flex gap-4">
                            <button 
                                onClick={() => setIsCustomizing(true)}
                                className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-full text-xs font-bold uppercase tracking-wider text-cyan-400 border border-cyan-500/30 transition-colors"
                            >
                                <Palette size={16} />
                                Garage
                            </button>
                            <button 
                                onClick={() => setShowLevelSelector(true)}
                                className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-full text-xs font-bold uppercase tracking-wider text-purple-400 border border-purple-500/30 transition-colors"
                            >
                                <Grid size={16} />
                                Levels
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* PAUSE MENU */}
            {gameState === 'PAUSED' && (
                <div className="bg-black/90 backdrop-blur-xl p-8 rounded-2xl border-2 border-white/20 shadow-2xl text-center animate-in fade-in zoom-in duration-200 pointer-events-auto min-w-[300px]">
                    <h2 className="text-4xl font-black text-white mb-8 tracking-widest">PAUSED</h2>
                    
                    <div className="flex flex-col gap-4">
                        <button 
                            onClick={() => setGameState('PLAYING')}
                            className="w-full py-3 bg-cyan-600 hover:bg-cyan-500 rounded-lg font-bold text-white uppercase tracking-wider flex items-center justify-center gap-2"
                        >
                            <Play size={20} /> Resume
                        </button>
                        
                        <button 
                            onClick={() => {
                                setGameState('GAMEOVER'); // Trigger restart logic via crash screen shortcut or simpler reset
                            }}
                            className="w-full py-3 bg-slate-700 hover:bg-slate-600 rounded-lg font-bold text-white uppercase tracking-wider flex items-center justify-center gap-2"
                        >
                            <RotateCcw size={20} /> Restart
                        </button>
                        
                        <div className="flex gap-2">
                             <button 
                                onClick={() => setShowLevelSelector(true)}
                                className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 rounded-lg font-bold text-purple-400 border border-purple-500/30 uppercase tracking-wider flex items-center justify-center gap-2"
                            >
                                <Grid size={20} /> Levels
                            </button>
                            <button 
                                onClick={() => setGameState('MENU')}
                                className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 rounded-lg font-bold text-red-400 border border-red-500/30 uppercase tracking-wider flex items-center justify-center gap-2"
                            >
                                <LogOut size={20} /> Menu
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* LEVEL SELECTOR MODAL */}
            {showLevelSelector && (
                 <div className="bg-slate-900/95 backdrop-blur-xl p-6 rounded-2xl border-2 border-purple-500/50 shadow-[0_0_50px_rgba(168,85,247,0.3)] text-center animate-in slide-in-from-bottom-10 duration-300 pointer-events-auto w-full max-w-2xl mx-4 z-50">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-black text-white italic">SELECT LEVEL</h2>
                        <button onClick={() => setShowLevelSelector(false)} className="text-white/50 hover:text-white transition-colors">
                            <X size={24} />
                        </button>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[60vh] overflow-y-auto p-2">
                        {LEVELS.map((level, idx) => (
                            <button
                                key={level.id}
                                onClick={() => handleSelectLevel(idx)}
                                className={`relative p-4 rounded-xl border-2 transition-all hover:scale-105 active:scale-95 group overflow-hidden ${currentLevelIndex === idx ? 'border-cyan-400 bg-cyan-900/40' : 'border-slate-700 bg-slate-800 hover:border-slate-500'}`}
                            >
                                <div className="relative z-10 flex flex-col items-start">
                                    <span className="text-xs font-mono text-white/50 mb-1">LEVEL {idx + 1}</span>
                                    <span className={`text-xl font-bold uppercase ${currentLevelIndex === idx ? 'text-cyan-400' : 'text-white'}`}>{level.name}</span>
                                </div>
                                <div className={`absolute right-4 top-1/2 -translate-y-1/2 opacity-20 group-hover:opacity-40 transition-opacity`}>
                                     {idx === 0 ? <Play size={40} /> : idx === 1 ? <Trophy size={40} /> : idx === 3 ? <FastForward size={40} /> : <Grid size={40} />}
                                </div>
                            </button>
                        ))}
                    </div>
                 </div>
            )}

            {/* CUSTOMIZATION MENU (GARAGE) */}
            {gameState === 'MENU' && isCustomizing && (
                <div className="bg-slate-900/95 backdrop-blur-xl p-6 rounded-2xl border-2 border-purple-500/50 shadow-[0_0_50px_rgba(168,85,247,0.3)] text-center animate-in slide-in-from-bottom-10 duration-300 pointer-events-auto w-full max-w-md mx-4">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-black text-white italic">GARAGE</h2>
                        <button onClick={() => setIsCustomizing(false)} className="text-white/50 hover:text-white transition-colors">
                            <X size={24} />
                        </button>
                    </div>

                    {/* Tabs */}
                    <div className="flex bg-slate-800 rounded-lg p-1 mb-6">
                        <button 
                            onClick={() => setCustomizationTab('cube')}
                            className={`flex-1 py-2 rounded-md text-xs font-bold uppercase transition-all flex items-center justify-center gap-2 ${customizationTab === 'cube' ? 'bg-cyan-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
                        >
                            <Box size={14} /> Cube
                        </button>
                        <button 
                            onClick={() => setCustomizationTab('ship')}
                            className={`flex-1 py-2 rounded-md text-xs font-bold uppercase transition-all flex items-center justify-center gap-2 ${customizationTab === 'ship' ? 'bg-pink-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
                        >
                            <Rocket size={14} /> Ship
                        </button>
                        <button 
                            onClick={() => setCustomizationTab('wave')}
                            className={`flex-1 py-2 rounded-md text-xs font-bold uppercase transition-all flex items-center justify-center gap-2 ${customizationTab === 'wave' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
                        >
                            <Zap size={14} /> Wave
                        </button>
                    </div>

                    {/* Preview Box */}
                    <div className="flex justify-center mb-6">
                        <div className="w-24 h-24 bg-slate-800 rounded-xl border-2 border-slate-600 flex items-center justify-center relative shadow-inner overflow-hidden">
                            {/* Background Grid */}
                            <div className="absolute inset-0 opacity-20" style={{backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '10px 10px'}}></div>
                            
                            {/* Dynamic Preview */}
                            <div className="relative z-10 scale-150">
                                {customizationTab === 'cube' && (
                                    <div className="w-8 h-8 border-2 border-white relative flex items-center justify-center" style={{ backgroundColor: playerColor }}>
                                        {playerIcon === 'face' && <div className="absolute inset-0 opacity-50 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMCAxMCI+PHBhdGggZD0iTTIgMnYyaDJWMmgtMnptNCAwdjJoMlYyaC0yem0tMiA0djEuNWg2VjZINC41eiIgZmlsbD0iIzAwMCIvPjwvc3ZnPg==')] bg-cover"></div>}
                                        {playerIcon === 'creeper' && <div className="absolute inset-0 opacity-50 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMCAxMCI+PHBhdGggZD0iTTEuNSAyLjVIMy41VjQuNUgxLjV6bTUgMEg4LjVWNC41SDYuNXpNNSA0djNIN3YtLjVINlY1SDV6bS0xIDEuNUgzdjIuNUg0di0yeiIgZmlsbD0iIzAwMCIvPjwvc3ZnPg==')] bg-cover"></div>}
                                        {playerIcon === 'lines' && <div className="absolute inset-0 opacity-50 flex flex-col justify-center gap-1"><div className="h-[20%] bg-black w-full"></div><div className="h-[20%] bg-black w-full"></div></div>}
                                        {playerIcon === 'dot' && <div className="w-3 h-3 bg-black/50 rounded-full"></div>}
                                        {playerIcon === 'cross' && <div className="text-black/50 text-xl font-bold leading-none">×</div>}
                                        {playerIcon === 'default' && <div className="w-4 h-4 bg-black/50"></div>}
                                    </div>
                                )}
                                {customizationTab === 'ship' && (
                                    <div className="relative w-12 h-8">
                                        {/* Ship Chassis */}
                                        <svg viewBox="0 0 40 25" className="absolute inset-0 w-full h-full drop-shadow-md">
                                            <path fill="#fff" stroke="#94a3b8" strokeWidth="1" d={
                                                shipIcon === 'default' ? "M5 20 L35 20 L30 5 L10 5 Z" :
                                                shipIcon === 'fighter' ? "M2 20 L38 20 L30 2 L12 2 M12 20 L8 25 L15 20" :
                                                shipIcon === 'shark' ? "M5 20 Q20 -5 35 20 M10 10 L15 0 L20 10" :
                                                shipIcon === 'saucer' ? "M5 15 A 15 10 0 0 0 35 15 L 35 15 Q 20 0 5 15" : "M5 20 L35 20 L30 5 L10 5 Z"
                                            } />
                                        </svg>
                                        {/* Mini Cube Inside */}
                                        <div className="absolute top-[8px] left-[12px] w-5 h-5 border border-white" style={{ backgroundColor: playerColor }}></div>
                                    </div>
                                )}
                                {customizationTab === 'wave' && (
                                    <div className="relative w-8 h-8">
                                        <svg viewBox="0 0 20 20" className="w-full h-full drop-shadow-md overflow-visible">
                                            <path fill={playerColor} stroke="#fff" strokeWidth="1" d={
                                                waveIcon === 'default' ? "M2 10 L18 10 L10 18 Z" : // Triangle pointing down/right ish
                                                waveIcon === 'dart' ? "M2 5 L18 10 L2 15 L6 10 Z" : // Dart
                                                waveIcon === 'saw' ? "M2 5 L5 2 L10 5 L15 2 L18 10 L15 18 L10 15 L5 18 L2 10 Z" : // Saw
                                                waveIcon === 'shuriken' ? "M10 0 L15 10 L10 20 L5 10 Z" : "M2 10 L18 10 L10 18 Z"
                                            } transform="rotate(-45 10 10)" /> 
                                        </svg>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Icon Grid */}
                    <div className="mb-6">
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 text-left">Select Icon</h3>
                        <div className="grid grid-cols-3 gap-2 max-h-[150px] overflow-y-auto p-1">
                            {customizationTab === 'cube' && PLAYER_ICONS.map(icon => (
                                <button key={icon.id} onClick={() => setPlayerIcon(icon.id as PlayerIconType)} className={`p-2 rounded-lg border-2 text-xs font-bold uppercase transition-all ${playerIcon === icon.id ? 'border-cyan-400 bg-cyan-900/30 text-white' : 'border-slate-700 bg-slate-800 text-slate-400 hover:border-slate-500'}`}>{icon.label}</button>
                            ))}
                            {customizationTab === 'ship' && SHIP_ICONS.map(icon => (
                                <button key={icon.id} onClick={() => setShipIcon(icon.id as ShipIconType)} className={`p-2 rounded-lg border-2 text-xs font-bold uppercase transition-all ${shipIcon === icon.id ? 'border-pink-400 bg-pink-900/30 text-white' : 'border-slate-700 bg-slate-800 text-slate-400 hover:border-slate-500'}`}>{icon.label}</button>
                            ))}
                            {customizationTab === 'wave' && WAVE_ICONS.map(icon => (
                                <button key={icon.id} onClick={() => setWaveIcon(icon.id as WaveIconType)} className={`p-2 rounded-lg border-2 text-xs font-bold uppercase transition-all ${waveIcon === icon.id ? 'border-blue-400 bg-blue-900/30 text-white' : 'border-slate-700 bg-slate-800 text-slate-400 hover:border-slate-500'}`}>{icon.label}</button>
                            ))}
                        </div>
                    </div>

                    {/* Colors (Global) */}
                    <div className="mb-6">
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 text-left">Global Color</h3>
                        <div className="flex flex-wrap gap-3 justify-center">
                            {PLAYER_COLORS.map(c => (
                                <button
                                    key={c}
                                    onClick={() => setPlayerColor(c)}
                                    className={`w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 ${playerColor === c ? 'border-white scale-110 shadow-[0_0_10px_white]' : 'border-transparent'}`}
                                    style={{ backgroundColor: c }}
                                />
                            ))}
                        </div>
                    </div>
                    
                    <button 
                        onClick={() => setIsCustomizing(false)}
                        className="w-full py-3 bg-gradient-to-r from-purple-600 to-cyan-600 rounded-lg font-black text-white uppercase tracking-widest hover:brightness-110 transition-all shadow-lg flex items-center justify-center gap-2"
                    >
                        <Check size={20} />
                        Save & Play
                    </button>
                </div>
            )}

            {gameState === 'GAMEOVER' && (
                <div className="bg-black/80 backdrop-blur-md p-8 rounded-2xl border-2 border-red-500/50 shadow-[0_0_50px_rgba(239,68,68,0.3)] text-center animate-in fade-in zoom-in duration-200 pointer-events-auto cursor-pointer" onClick={() => {}}>
                    <h2 className="text-5xl font-black text-red-500 mb-2 drop-shadow-lg">CRASHED</h2>
                    <p className="text-white/60 mb-6 font-mono text-sm">Progress: {progress}%</p>
                    <div className="flex flex-col items-center gap-2">
                        <RotateCcw className="w-12 h-12 text-white animate-spin-slow" />
                        <span className="text-xs text-white/40 uppercase tracking-widest">Tap to Restart</span>
                    </div>
                </div>
            )}

            {gameState === 'WON' && (
                <div className="bg-black/80 backdrop-blur-md p-10 rounded-2xl border-2 border-green-500/50 shadow-[0_0_50px_rgba(34,197,94,0.3)] text-center animate-in fade-in zoom-in duration-500 pointer-events-auto cursor-pointer" onClick={() => {}}>
                    <div className="relative">
                        <Trophy className="w-20 h-20 text-yellow-400 mx-auto mb-4 drop-shadow-[0_0_15px_rgba(250,204,21,0.5)] animate-bounce" />
                        {hasCoin && <Coins className="w-8 h-8 text-yellow-300 absolute bottom-4 right-1/3 animate-ping" />}
                    </div>
                    
                    <h2 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-600 mb-2">LEVEL COMPLETE!</h2>
                    
                    {hasCoin && (
                        <div className="mb-4 text-yellow-400 font-bold uppercase tracking-widest animate-pulse border-2 border-yellow-400/50 inline-block px-4 py-1 rounded-full">
                            Secret Coin Found!
                        </div>
                    )}

                    <p className="text-green-200 mb-6 font-mono">Attempts: {attempt}</p>
                    
                    <div className="flex flex-col gap-3">
                        {currentLevelIndex < LEVELS.length - 1 && (
                            <button 
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleNextLevel();
                                }}
                                className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-full font-bold text-white uppercase tracking-widest hover:scale-105 transition-transform flex items-center justify-center gap-2 shadow-lg"
                            >
                                <FastForward size={20} />
                                Next Level
                            </button>
                        )}
                        <span className="text-xs text-white/40 uppercase tracking-widest mt-2">Tap to Play Again</span>
                    </div>
                </div>
            )}
        </div>
        
        {/* Footer info */}
        <div className="text-center text-white/10 text-xs font-mono pointer-events-auto">
           Mugen Style v1.3
        </div>
      </div>
    </div>
  );
};

export default App;