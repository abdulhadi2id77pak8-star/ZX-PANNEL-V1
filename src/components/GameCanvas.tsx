import React, { useEffect, useRef } from 'react';
import { ModSettings } from '../types/modTypes';

interface GameCanvasProps {
  settings: ModSettings;
  unlocked: boolean;
  onEnemiesInFovChange: (count: number) => void;
}

interface BotEntity {
  id: number;
  name: string;
  baseX: number; // normalized -1..1
  baseY: number; // normalized -0.4..0.4
  speedX: number;
  speedY: number;
  phase: number;
  hp: number;
  maxHp: number;
  distance: number; // meters
}

const INITIAL_BOTS: BotEntity[] = [
  {
    id: 1,
    name: 'OPFOR-01',
    baseX: -0.32,
    baseY: -0.04,
    speedX: 0.45,
    speedY: 0.7,
    phase: 0.2,
    hp: 94,
    maxHp: 100,
    distance: 28.4,
  },
  {
    id: 2,
    name: 'VANGUARD',
    baseX: 0.26,
    baseY: 0.05,
    speedX: 0.36,
    speedY: 0.52,
    phase: 1.9,
    hp: 68,
    maxHp: 100,
    distance: 41.7,
  },
  {
    id: 3,
    name: 'SPECTRE-7',
    baseX: 0.0,
    baseY: -0.06,
    speedX: 0.58,
    speedY: 0.41,
    phase: 3.4,
    hp: 39,
    maxHp: 100,
    distance: 22.1,
  },
  {
    id: 4,
    name: 'RECON-4',
    baseX: 0.48,
    baseY: -0.1,
    speedX: 0.28,
    speedY: 0.65,
    phase: 5.1,
    hp: 100,
    maxHp: 100,
    distance: 56.8,
  },
];

export const GameCanvas: React.FC<GameCanvasProps> = ({
  settings,
  unlocked,
  onEnemiesInFovChange,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const settingsRef = useRef<ModSettings>(settings);
  const unlockedRef = useRef<boolean>(unlocked);
  const aimPosRef = useRef<{ x: number; y: number } | null>(null);
  const lastFovCountRef = useRef<number>(-1);

  useEffect(() => {
    settingsRef.current = settings;
  }, [settings]);

  useEffect(() => {
    unlockedRef.current = unlocked;
  }, [unlocked]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId = 0;
    let lastTime = performance.now();
    let elapsed = 0;

    const handleResize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = window.innerWidth;
      const h = window.innerHeight;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    const drawGridBackground = (w: number, h: number, timeSec: number) => {
      // Deep tactical night backdrop
      const bgGrad = ctx.createLinearGradient(0, 0, 0, h);
      bgGrad.addColorStop(0, '#05060a');
      bgGrad.addColorStop(0.45, '#0b0e17');
      bgGrad.addColorStop(1, '#07080d');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, w, h);

      const horizonY = h * 0.46;

      // Subtle atmospheric radial glow at horizon center
      const rad = ctx.createRadialGradient(w / 2, horizonY, 10, w / 2, horizonY, w * 0.6);
      rad.addColorStop(0, 'rgba(0, 240, 255, 0.08)');
      rad.addColorStop(0.45, 'rgba(255, 42, 85, 0.04)');
      rad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = rad;
      ctx.fillRect(0, 0, w, h);

      // Perspective floor grid
      ctx.save();
      ctx.strokeStyle = 'rgba(0, 240, 255, 0.09)';
      ctx.lineWidth = 1;

      const numVertical = 18;
      for (let i = -numVertical; i <= numVertical; i++) {
        const xTop = w / 2 + i * (w * 0.032);
        const xBottom = w / 2 + i * (w * 0.16);
        ctx.beginPath();
        ctx.moveTo(xTop, horizonY);
        ctx.lineTo(xBottom, h);
        ctx.stroke();
      }

      // Moving horizontal perspective lines
      const scroll = (timeSec * 0.35) % 1;
      for (let i = 0; i < 14; i++) {
        const t = (i + scroll) / 14;
        const y = horizonY + Math.pow(t, 2.15) * (h - horizonY);
        ctx.strokeStyle = `rgba(0, 240, 255, ${0.03 + t * 0.1})`;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }

      // Horizon line
      ctx.strokeStyle = 'rgba(255, 42, 85, 0.25)';
      ctx.beginPath();
      ctx.moveTo(0, horizonY);
      ctx.lineTo(w, horizonY);
      ctx.stroke();

      // Tactical silhouettes / cover blocks
      ctx.fillStyle = 'rgba(15, 20, 32, 0.85)';
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
      const blocks = [
        { x: w * 0.12, y: horizonY - 38, bw: 74, bh: 44 },
        { x: w * 0.78, y: horizonY - 46, bw: 86, bh: 52 },
        { x: w * 0.44, y: horizonY - 22, bw: 110, bh: 26 },
      ];
      blocks.forEach((b) => {
        ctx.fillRect(b.x, b.y, b.bw, b.bh);
        ctx.strokeRect(b.x, b.y, b.bw, b.bh);
      });

      ctx.restore();
    };

    const drawBotModel = (
      cx: number,
      cy: number,
      scale: number,
      isLocked: boolean
    ) => {
      const headR = 7 * scale;
      const bodyW = 24 * scale;
      const bodyH = 48 * scale;

      ctx.save();
      // Subtle shadow beneath target
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.beginPath();
      ctx.ellipse(cx, cy + bodyH * 0.65, bodyW * 0.65, 5 * scale, 0, 0, Math.PI * 2);
      ctx.fill();

      // Torso silhouette
      ctx.fillStyle = isLocked ? 'rgba(255, 42, 85, 0.35)' : 'rgba(148, 163, 184, 0.22)';
      ctx.strokeStyle = isLocked ? '#ff2a55' : 'rgba(226, 232, 240, 0.5)';
      ctx.lineWidth = 1.4;

      // Legs
      ctx.beginPath();
      ctx.roundRect(cx - bodyW * 0.36, cy + bodyH * 0.18, bodyW * 0.28, bodyH * 0.42, 3);
      ctx.roundRect(cx + bodyW * 0.08, cy + bodyH * 0.18, bodyW * 0.28, bodyH * 0.42, 3);
      ctx.fill();
      ctx.stroke();

      // Chest
      ctx.beginPath();
      ctx.roundRect(cx - bodyW * 0.46, cy - bodyH * 0.32, bodyW * 0.92, bodyH * 0.52, 5);
      ctx.fill();
      ctx.stroke();

      // Head
      ctx.beginPath();
      ctx.arc(cx, cy - bodyH * 0.48, headR, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.restore();
    };

    const drawEspOverlay = (
      bot: BotEntity,
      cx: number,
      cy: number,
      scale: number,
      w: number,
      h: number,
      cfg: ModSettings,
      isLocked: boolean
    ) => {
      const boxW = 36 * scale;
      const boxH = 74 * scale;
      const left = cx - boxW / 2;
      const top = cy - boxH * 0.54;
      const right = left + boxW;
      const bottom = top + boxH;

      const accentColor = isLocked ? '#ff2a55' : '#00f0ff';

      // Snaplines
      if (cfg.espSnaplines) {
        ctx.save();
        ctx.strokeStyle = isLocked ? 'rgba(255, 42, 85, 0.65)' : 'rgba(0, 240, 255, 0.38)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(w / 2, h);
        ctx.lineTo(cx, bottom);
        ctx.stroke();
        ctx.restore();
      }

      // Corner bracket ESP Box
      if (cfg.espBoxes) {
        ctx.save();
        ctx.strokeStyle = accentColor;
        ctx.lineWidth = 1.8;
        ctx.shadowColor = accentColor;
        ctx.shadowBlur = 8;

        const cLen = Math.min(10 * scale, boxW * 0.3);

        // Top-left
        ctx.beginPath();
        ctx.moveTo(left, top + cLen);
        ctx.lineTo(left, top);
        ctx.lineTo(left + cLen, top);
        // Top-right
        ctx.moveTo(right - cLen, top);
        ctx.lineTo(right, top);
        ctx.lineTo(right, top + cLen);
        // Bottom-left
        ctx.moveTo(left, bottom - cLen);
        ctx.lineTo(left, bottom);
        ctx.lineTo(left + cLen, bottom);
        // Bottom-right
        ctx.moveTo(right - cLen, bottom);
        ctx.lineTo(right, bottom);
        ctx.lineTo(right, bottom - cLen);
        ctx.stroke();

        // Subtle fill
        ctx.shadowBlur = 0;
        ctx.fillStyle = isLocked ? 'rgba(255, 42, 85, 0.08)' : 'rgba(0, 240, 255, 0.05)';
        ctx.fillRect(left, top, boxW, boxH);

        // Head hitbox marker
        const headY = cy - 48 * scale * 0.48;
        ctx.fillStyle = '#ff2a55';
        ctx.beginPath();
        ctx.arc(cx, headY, 2.6, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // Health Bar
      if (cfg.espHealthBar) {
        const barW = 3.5;
        const barX = left - 7;
        const hpRatio = Math.max(0, Math.min(1, bot.hp / bot.maxHp));
        const hpColor =
          hpRatio > 0.6 ? '#22c55e' : hpRatio > 0.3 ? '#f59e0b' : '#ff2a55';

        ctx.save();
        ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
        ctx.fillRect(barX - 1, top - 1, barW + 2, boxH + 2);
        ctx.fillStyle = hpColor;
        const fillH = boxH * hpRatio;
        ctx.fillRect(barX, bottom - fillH, barW, fillH);
        ctx.restore();
      }

      // Player Info & Distance
      if (cfg.espDistance) {
        ctx.save();
        ctx.font = '600 11px "JetBrains Mono", monospace';
        ctx.textAlign = 'center';
        const label = `${bot.name} · ${bot.distance.toFixed(1)}m`;
        const textWidth = ctx.measureText(label).width;
        ctx.fillStyle = 'rgba(7, 8, 12, 0.78)';
        ctx.fillRect(cx - textWidth / 2 - 5, top - 20, textWidth + 10, 15);
        ctx.fillStyle = isLocked ? '#ff2a55' : '#e2e8f0';
        ctx.fillText(label, cx, top - 9);
        ctx.restore();
      }
    };

    const drawCrosshair = (
      cx: number,
      cy: number,
      cfg: ModSettings
    ) => {
      if (!cfg.crosshairEnabled) return;
      const s = cfg.crosshairSize;
      const color = cfg.crosshairColor;

      ctx.save();
      ctx.strokeStyle = color;
      ctx.fillStyle = color;
      ctx.lineWidth = 2;
      ctx.shadowColor = color;
      ctx.shadowBlur = 8;

      if (cfg.crosshairStyle === 'cross') {
        const gap = 4;
        ctx.beginPath();
        ctx.moveTo(cx - s, cy);
        ctx.lineTo(cx - gap, cy);
        ctx.moveTo(cx + gap, cy);
        ctx.lineTo(cx + s, cy);
        ctx.moveTo(cx, cy - s);
        ctx.lineTo(cx, cy - gap);
        ctx.moveTo(cx, cy + gap);
        ctx.lineTo(cx, cy + s);
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(cx, cy, 1.5, 0, Math.PI * 2);
        ctx.fill();
      } else if (cfg.crosshairStyle === 'dot') {
        ctx.beginPath();
        ctx.arc(cx, cy, Math.max(2.5, s * 0.22), 0, Math.PI * 2);
        ctx.fill();
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.arc(cx, cy, s * 0.65, 0, Math.PI * 2);
        ctx.stroke();
      } else {
        // Chevron tactical reticle
        ctx.beginPath();
        ctx.moveTo(cx - s * 0.75, cy + s * 0.55);
        ctx.lineTo(cx, cy - s * 0.2);
        ctx.lineTo(cx + s * 0.75, cy + s * 0.55);
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(cx, cy - s * 0.2, 2, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    };

    const render = (now: number) => {
      const dt = Math.min(0.05, (now - lastTime) / 1000);
      lastTime = now;
      const cfg = settingsRef.current;

      // Boost simulation responsiveness when 120 FPS booster is ON
      elapsed += dt * (cfg.fpsBoosterEnabled ? 1.15 : 0.92);

      const w = window.innerWidth;
      const h = window.innerHeight;
      const centerX = w / 2;
      const centerY = h / 2;

      if (!aimPosRef.current) {
        aimPosRef.current = { x: centerX, y: centerY };
      }

      drawGridBackground(w, h, elapsed);

      // Update & collect bot screen positions
      const computedBots = INITIAL_BOTS.map((bot) => {
        const waveX = Math.sin(elapsed * bot.speedX + bot.phase) * 0.26;
        const waveY = Math.cos(elapsed * bot.speedY + bot.phase * 1.3) * 0.09;
        const normX = bot.baseX + waveX;
        const normY = bot.baseY + waveY;

        const screenX = centerX + normX * w * 0.55;
        const screenY = h * 0.48 + normY * h * 0.55;
        const dynamicDist = Math.max(
          12,
          bot.distance + Math.sin(elapsed * 0.6 + bot.phase) * 6.5
        );
        const scale = Math.max(0.68, Math.min(1.45, 42 / dynamicDist));

        // Fluctuate HP subtly to feel alive
        const liveHp = Math.max(
          18,
          Math.min(100, bot.hp + Math.sin(elapsed * 0.8 + bot.id) * 12)
        );

        const targetX = screenX;
        const targetY =
          cfg.targetBone === 'head'
            ? screenY - 48 * scale * 0.48
            : screenY - 48 * scale * 0.1;

        const distToCenter = Math.hypot(targetX - centerX, targetY - centerY);

        return {
          bot: { ...bot, hp: liveHp, distance: dynamicDist },
          screenX,
          screenY,
          scale,
          targetX,
          targetY,
          distToCenter,
        };
      });

      // Find targets inside FOV circle
      const activeTargets = computedBots.filter(
        (b) => b.distToCenter <= cfg.fovRadius
      );
      activeTargets.sort((a, b) => a.distToCenter - b.distToCenter);
      const lockedTarget =
        unlockedRef.current && cfg.aimbotEnabled && activeTargets.length > 0
          ? activeTargets[0]
          : null;

      if (lastFovCountRef.current !== activeTargets.length) {
        lastFovCountRef.current = activeTargets.length;
        onEnemiesInFovChange(activeTargets.length);
      }

      // Draw bots & ESP
      computedBots.forEach((item) => {
        const isLocked = lockedTarget?.bot.id === item.bot.id;
        drawBotModel(item.screenX, item.screenY, item.scale, isLocked);
        if (unlockedRef.current && cfg.espEnabled) {
          drawEspOverlay(
            item.bot,
            item.screenX,
            item.screenY,
            item.scale,
            w,
            h,
            cfg,
            isLocked
          );
        }
      });

      // Aimbot FOV Circle & Smooth Tracking Simulation
      if (unlockedRef.current && (cfg.showFovCircle || cfg.aimbotEnabled)) {
        const fovColor = lockedTarget ? '#ff2a55' : '#00f0ff';
        ctx.save();
        ctx.strokeStyle = fovColor;
        ctx.lineWidth = lockedTarget ? 2 : 1.5;
        ctx.shadowColor = fovColor;
        ctx.shadowBlur = lockedTarget ? 14 : 8;
        ctx.setLineDash(cfg.aimbotEnabled ? [] : [6, 5]);
        ctx.beginPath();
        ctx.arc(centerX, centerY, cfg.fovRadius, 0, Math.PI * 2);
        ctx.stroke();

        // Subtle inner ring accent
        ctx.setLineDash([]);
        ctx.strokeStyle = lockedTarget
          ? 'rgba(255, 42, 85, 0.25)'
          : 'rgba(0, 240, 255, 0.14)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(centerX, centerY, Math.max(10, cfg.fovRadius - 6), 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }

      // Smooth aimbot interpolation reticle
      const desiredAim = lockedTarget
        ? { x: lockedTarget.targetX, y: lockedTarget.targetY }
        : { x: centerX, y: centerY };

      // Smoothness 1 = very fast snap, 20 = slow smooth tracking
      const lerpFactor = Math.min(1, Math.max(0.03, 1 / (cfg.aimSmoothness * 0.85)));
      aimPosRef.current.x += (desiredAim.x - aimPosRef.current.x) * lerpFactor;
      aimPosRef.current.y += (desiredAim.y - aimPosRef.current.y) * lerpFactor;

      if (unlockedRef.current && cfg.aimbotEnabled && lockedTarget) {
        ctx.save();
        // Aimbot vector line from center to interpolated lock point
        ctx.strokeStyle = 'rgba(255, 42, 85, 0.72)';
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(aimPosRef.current.x, aimPosRef.current.y);
        ctx.stroke();

        // Lock diamond indicator
        const ax = aimPosRef.current.x;
        const ay = aimPosRef.current.y;
        ctx.strokeStyle = '#ff2a55';
        ctx.lineWidth = 1.8;
        ctx.shadowColor = '#ff2a55';
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.moveTo(ax, ay - 9);
        ctx.lineTo(ax + 9, ay);
        ctx.lineTo(ax, ay + 9);
        ctx.lineTo(ax - 9, ay);
        ctx.closePath();
        ctx.stroke();
        ctx.restore();
      }

      // Custom Pro Crosshair
      if (unlockedRef.current) {
        drawCrosshair(centerX, centerY, cfg);
      }

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
    };
  }, [onEnemiesInFovChange]);

  return (
    <canvas
      ref={canvasRef}
      aria-label="Live tactical game viewport simulation"
      className="fixed inset-0 z-0 block w-full h-full pointer-events-none"
    />
  );
};
