"use client";

import React, { useEffect, useState, useRef } from 'react';
import { Play, Pause, RotateCcw, Volume2, VolumeX, SkipForward, SkipBack, Music } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

interface Track {
  title: string;
  duration: number; // in seconds
  author: string;
}

export const AudioWavePlayer: React.FC = () => {
  const { language, t } = useLanguage();
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [volume, setVolume] = useState(80);
  const [isMuted, setIsMuted] = useState(false);
  const [speed, setSpeed] = useState<0.5 | 1.0 | 1.5 | 2.0>(1.0);

  const waveformRef = useRef<HTMLCanvasElement>(null);
  const visualizerRef = useRef<HTMLCanvasElement>(null);
  const playAnimationRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);

  const playlist: Track[] = [
    { title: "Cinematic Ambient Soundscape (Intro)", duration: 184, author: "SoundWave" },
    { title: "Neo-Tokyo Cyberpunk Synthwave", duration: 215, author: "SoundWave" },
    { title: "Lo-Fi Midnight Beats", duration: 142, author: "SoundWave" }
  ];

  const currentTrack = playlist[currentTrackIndex];

  // Static waveform heights (procedural profile of the song)
  const barCount = 50;
  const waveformHeights = useRef<number[]>([]);
  if (waveformHeights.current.length === 0) {
    for (let i = 0; i < barCount; i++) {
      // Create a nice distribution (higher in middle, lower at ends, with noise)
      const distFromEnd = Math.sin((i / barCount) * Math.PI);
      const height = 10 + 35 * distFromEnd + Math.random() * 15;
      waveformHeights.current.push(height);
    }
  }

  // Format seconds to MM:SS
  const formatTime = (secs: number) => {
    const minutes = Math.floor(secs / 60);
    const seconds = Math.floor(secs % 60);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  // Playback ticking loop
  useEffect(() => {
    if (!isPlaying) {
      if (playAnimationRef.current) {
        cancelAnimationFrame(playAnimationRef.current);
        playAnimationRef.current = null;
      }
      return;
    }

    lastTimeRef.current = performance.now();

    const tick = (now: number) => {
      const delta = (now - lastTimeRef.current) / 1000;
      lastTimeRef.current = now;

      setCurrentTime(prev => {
        const nextTime = prev + delta * speed;
        if (nextTime >= currentTrack.duration) {
          setIsPlaying(false);
          return 0;
        }
        return nextTime;
      });

      playAnimationRef.current = requestAnimationFrame(tick);
    };

    playAnimationRef.current = requestAnimationFrame(tick);

    return () => {
      if (playAnimationRef.current) {
        cancelAnimationFrame(playAnimationRef.current);
      }
    };
  }, [isPlaying, speed, currentTrack.duration]);

  // Redraw Waveform Canvas
  useEffect(() => {
    const canvas = waveformRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    const isLight = document.documentElement.classList.contains('light');
    const width = canvas.width;
    const height = canvas.height;
    const barWidth = width / barCount - 2;
    const currentProgressIndex = (currentTime / currentTrack.duration) * barCount;

    for (let i = 0; i < barCount; i++) {
      const x = i * (barWidth + 2);
      const h = waveformHeights.current[i];
      const y = (height - h) / 2;

      // Draw bar with proper coloring based on progress
      if (i < currentProgressIndex) {
        // Highlighted played part
        const grad = ctx.createLinearGradient(x, y, x, y + h);
        grad.addColorStop(0, '#818cf8'); // Light Indigo
        grad.addColorStop(1, '#4f46e5'); // Dark Indigo
        ctx.fillStyle = grad;
      } else {
        // Unplayed part
        ctx.fillStyle = isLight ? 'rgba(203, 213, 225, 0.8)' : 'rgba(71, 85, 105, 0.4)';
      }

      // Rounded rectangle drawing
      ctx.beginPath();
      ctx.roundRect(x, y, barWidth, h, 2);
      ctx.fill();
    }
  }, [currentTime, currentTrack.duration, barCount]);

  // Bouncing frequency visualizer animation
  useEffect(() => {
    const canvas = visualizerRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let visualId: number;
    const count = 12;
    const heights = Array(count).fill(5);

    const animateVisualizer = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const isLight = document.documentElement.classList.contains('light');
      const w = canvas.width;
      const h = canvas.height;
      const bWidth = w / count - 3;

      for (let i = 0; i < count; i++) {
        const x = i * (bWidth + 3);
        
        if (isPlaying) {
          // Bouncing math using volume and math.sin
          const volFactor = isMuted ? 0 : volume / 100;
          const speedFactor = performance.now() * 0.007;
          const targetH = 3 + (Math.sin(speedFactor + i * 0.5) + 1.2) * (h - 6) * 0.4 * volFactor + Math.random() * 4;
          // Interpolate to make it smooth
          heights[i] = heights[i] * 0.7 + targetH * 0.3;
        } else {
          // Flatten when paused
          heights[i] = heights[i] * 0.8 + 2 * 0.2;
        }

        const barH = heights[i];
        const y = h - barH;

        // Gradient for visualizer bars
        const grad = ctx.createLinearGradient(x, y, x, h);
        grad.addColorStop(0, '#f472b6'); // Pink
        grad.addColorStop(1, '#6366f1'); // Indigo
        ctx.fillStyle = grad;

        ctx.beginPath();
        ctx.roundRect(x, y, bWidth, barH, 1.5);
        ctx.fill();
      }

      visualId = requestAnimationFrame(animateVisualizer);
    };

    animateVisualizer();

    return () => cancelAnimationFrame(visualId);
  }, [isPlaying, volume, isMuted]);

  // Handle Scrubbing (Seeking)
  const handleScrub = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = waveformRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percent = Math.min(Math.max(clickX / rect.width, 0), 1);
    setCurrentTime(percent * currentTrack.duration);
  };

  const handleMuteToggle = () => {
    setIsMuted(!isMuted);
  };

  const handleNextTrack = () => {
    setCurrentTrackIndex(prev => (prev + 1) % playlist.length);
    setCurrentTime(0);
  };

  const handlePrevTrack = () => {
    setCurrentTrackIndex(prev => (prev - 1 + playlist.length) % playlist.length);
    setCurrentTime(0);
  };

  const handleReset = () => {
    setCurrentTime(0);
  };

  return (
    <div className="w-full bg-slate-955 light:bg-slate-100 rounded-3xl border border-slate-800 light:border-slate-200 p-5 flex flex-col justify-between transition-all">
      
      {/* Player Header */}
      <div className="flex items-center gap-3.5 mb-4">
        <div className="w-11 h-11 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 light:bg-indigo-50 light:text-indigo-650 flex items-center justify-center animate-pulse">
          <Music className="w-5.5 h-5.5" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] text-slate-500 light:text-slate-400 font-extrabold uppercase tracking-wider">{t('audio_player_title')}</p>
          <h4 className="text-sm font-bold text-slate-250 light:text-slate-850 truncate mt-0.5" title={currentTrack.title}>
            {currentTrack.title}
          </h4>
        </div>
      </div>

      {/* Playlist Selector */}
      <div className="mb-4">
        <label className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block mb-1.5">{t('audio_playlist')}</label>
        <select
          value={currentTrackIndex}
          onChange={(e) => {
            setCurrentTrackIndex(Number(e.target.value));
            setCurrentTime(0);
          }}
          className="w-full bg-slate-900 border border-slate-800 text-slate-300 light:bg-white light:border-slate-250 light:text-slate-700 px-3 py-2 rounded-xl text-xs font-semibold focus:outline-none cursor-pointer hover:border-slate-700 light:hover:border-slate-350 transition-colors"
        >
          {playlist.map((track, idx) => (
            <option key={idx} value={idx}>
              {idx + 1}. {track.title}
            </option>
          ))}
        </select>
      </div>

      {/* Interactive Waveform */}
      <div className="relative bg-slate-950/40 light:bg-slate-50 border border-slate-850/60 light:border-slate-200 rounded-2xl p-4 mb-4 flex flex-col justify-center select-none">
        <canvas
          ref={waveformRef}
          width={300}
          height={65}
          onClick={handleScrub}
          className="w-full h-[65px] cursor-pointer"
        />
        
        {/* Time Counters */}
        <div className="flex justify-between items-center mt-2.5 text-[10px] font-mono font-bold text-slate-400 light:text-slate-600">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(currentTrack.duration)}</span>
        </div>
      </div>

      {/* Play Controls & Bouncing Spectrum */}
      <div className="flex items-center justify-between gap-4 mb-4">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handlePrevTrack}
            className="p-2 hover:bg-slate-900 light:hover:bg-slate-200 text-slate-400 hover:text-slate-200 light:text-slate-500 light:hover:text-slate-800 rounded-xl transition-all cursor-pointer"
            title="Oldingi"
          >
            <SkipBack className="w-4 h-4" />
          </button>
          
          <button
            type="button"
            onClick={() => setIsPlaying(!isPlaying)}
            className={`w-11 h-11 rounded-full flex items-center justify-center transition-all cursor-pointer active:scale-95 shadow-md ${
              isPlaying 
                ? 'bg-indigo-650 text-white shadow-indigo-600/10' 
                : 'bg-white text-slate-950 hover:bg-slate-100 shadow-white/5'
            }`}
          >
            {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
          </button>

          <button
            type="button"
            onClick={handleNextTrack}
            className="p-2 hover:bg-slate-900 light:hover:bg-slate-200 text-slate-400 hover:text-slate-200 light:text-slate-500 light:hover:text-slate-800 rounded-xl transition-all cursor-pointer"
            title="Keyingi"
          >
            <SkipForward className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={handleReset}
            className="p-2 hover:bg-slate-900 light:hover:bg-slate-200 text-slate-450 hover:text-slate-200 light:text-slate-500 light:hover:text-slate-800 rounded-xl transition-all cursor-pointer"
            title="Qayta boshlash"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Mini Spectrum Visualizer */}
        <div className="flex-1 flex justify-end">
          <canvas
            ref={visualizerRef}
            width={85}
            height={30}
            className="w-[85px] h-[30px] opacity-90"
          />
        </div>
      </div>

      {/* Speed & Volume Controllers */}
      <div className="grid grid-cols-2 gap-4 border-t border-slate-900 light:border-slate-200/80 pt-4 text-xs font-semibold">
        {/* Speed */}
        <div className="space-y-1.5">
          <label className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block">{t('audio_playback_speed')}</label>
          <div className="flex gap-1 bg-slate-900 light:bg-white border border-slate-800 light:border-slate-250 p-0.5 rounded-lg">
            {([0.5, 1.0, 1.5, 2.0] as const).map((val) => (
              <button
                key={val}
                type="button"
                onClick={() => setSpeed(val)}
                className={`flex-1 py-1 rounded text-[9px] font-extrabold transition-all cursor-pointer ${
                  speed === val
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-450 hover:text-slate-200 light:text-slate-500 light:hover:text-slate-850'
                }`}
              >
                {val}x
              </button>
            ))}
          </div>
        </div>

        {/* Volume */}
        <div className="space-y-1.5">
          <label className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block">{t('audio_volume')}</label>
          <div className="flex items-center gap-2 bg-slate-900 light:bg-white border border-slate-800 light:border-slate-250 px-2.5 py-1 rounded-lg h-[24px]">
            <button
              type="button"
              onClick={handleMuteToggle}
              className="text-slate-400 hover:text-slate-200 light:text-slate-500 light:hover:text-slate-800 cursor-pointer"
            >
              {isMuted || volume === 0 ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
            </button>
            <input
              type="range"
              min="0"
              max="100"
              value={isMuted ? 0 : volume}
              onChange={(e) => {
                setVolume(Number(e.target.value));
                if (isMuted) setIsMuted(false);
              }}
              className="w-full h-1 bg-slate-850 light:bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-500 outline-none"
            />
          </div>
        </div>
      </div>
      
    </div>
  );
};
