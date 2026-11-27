import React, { useEffect, useState } from 'react';
import { Activity, Cpu, ShieldCheck, Wifi } from 'lucide-react';
import { BypassState } from '../types/modTypes';

interface FpsHudProps {
  fpsBoosterEnabled: boolean;
  bypassState: BypassState;
  enemiesInFov: number;
}

export const FpsHud: React.FC<FpsHudProps> = ({
  fpsBoosterEnabled,
  bypassState,
  enemiesInFov,
}) => {
  const [fps, setFps] = useState(fpsBoosterEnabled ? 120 : 60);
  const [ping, setPing] = useState(fpsBoosterEnabled ? 14 : 48);

  useEffect(() => {
    const interval = setInterval(() => {
      if (fpsBoosterEnabled) {
        setFps(118 + Math.floor(Math.random() * 3)); // 118-120 FPS
        setPing(12 + Math.floor(Math.random() * 5)); // 12-16 ms
      } else {
        setFps(56 + Math.floor(Math.random() * 5)); // 56-60 FPS
        setPing(42 + Math.floor(Math.random() * 14)); // 42-55 ms
      }
    }, 650);

    return () => clearInterval(interval);
  }, [fpsBoosterEnabled]);

  const frameTimeMs = (1000 / Math.max(fps, 1)).toFixed(1);

  return (
    <div className="fixed top-3 left-1/2 -translate-x-1/2 z-30 pointer-events-none select-none max-w-[94vw]">
      <div className="cyber-glass rounded-xl border border-white/12 px-3.5 py-2 flex items-center gap-3 sm:gap-5 text-xs font-mono-tech shadow-[0_8px_32px_rgba(0,0,0,0.65)]">
        {/* FPS Metric */}
        <div className="flex items-center gap-1.5 whitespace-nowrap">
          <Activity
            className={`w-3.5 h-3.5 ${
              fpsBoosterEnabled ? 'text-[#00f0ff]' : 'text-slate-400'
            }`}
          />
          <span
            className={`font-semibold ${
              fpsBoosterEnabled ? 'text-[#00f0ff]' : 'text-slate-200'
            }`}
          >
            {fps} FPS
          </span>
          <span className="hidden sm:inline text-slate-400">
            ({frameTimeMs}ms)
          </span>
        </div>

        <span aria-hidden="true" className="text-white/15">
          |
        </span>

        {/* Ping Metric */}
        <div className="flex items-center gap-1.5 whitespace-nowrap">
          <Wifi
            className={`w-3.5 h-3.5 ${
              fpsBoosterEnabled ? 'text-emerald-400' : 'text-amber-400'
            }`}
          />
          <span
            className={
              fpsBoosterEnabled ? 'text-emerald-400 font-semibold' : 'text-amber-300'
            }
          >
            {ping} ms
          </span>
        </div>

        <span aria-hidden="true" className="text-white/15">
          |
        </span>

        {/* Booster / Targets */}
        <div className="flex items-center gap-1.5 whitespace-nowrap">
          <Cpu className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-slate-300">
            {fpsBoosterEnabled ? '120Hz Boost' : '60Hz Stock'}
          </span>
        </div>

        {bypassState === 'active' && (
          <>
            <span aria-hidden="true" className="text-white/15">
              |
            </span>
            <div className="flex items-center gap-1 text-emerald-400 whitespace-nowrap">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span className="font-semibold">Bypassed</span>
            </div>
          </>
        )}

        {enemiesInFov > 0 && (
          <>
            <span aria-hidden="true" className="hidden sm:inline text-white/15">
              |
            </span>
            <span className="hidden sm:inline text-[#ff2a55] font-semibold whitespace-nowrap">
              FOV Lock: {enemiesInFov}
            </span>
          </>
        )}
      </div>
    </div>
  );
};
