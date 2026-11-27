import React, { useEffect, useRef, useState } from 'react';
import {
  Crosshair,
  Download,
  Eye,
  Gauge,
  GripHorizontal,
  Minimize2,
  Terminal,
  Trash2,
  Zap,
} from 'lucide-react';
import {
  BypassState,
  CrosshairColor,
  CrosshairStyle,
  LogEntry,
  ModSettings,
} from '../types/modTypes';

interface ModMenuPanelProps {
  settings: ModSettings;
  onUpdateSettings: (patch: Partial<ModSettings>) => void;
  logs: LogEntry[];
  bypassState: BypassState;
  onInjectBypass: () => void;
  onClearLogs: () => void;
  onMinimize: () => void;
  onExportStandalone: () => void;
}

type MenuTab = 'combat' | 'esp' | 'engine';

interface ToggleRowProps {
  label: string;
  description: string;
  checked: boolean;
  onChange: (next: boolean) => void;
  accent?: 'cyan' | 'crimson';
}

const ToggleRow: React.FC<ToggleRowProps> = ({
  label,
  description,
  checked,
  onChange,
  accent = 'cyan',
}) => {
  const activeBg =
    accent === 'crimson'
      ? 'bg-[#ff2a55] shadow-[0_0_14px_rgba(255,42,85,0.65)]'
      : 'bg-[#00f0ff] shadow-[0_0_14px_rgba(0,240,255,0.65)]';

  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="w-full min-h-[48px] px-3 py-2 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.06] flex items-center justify-between gap-3 text-left transition-colors cursor-pointer"
    >
      <div className="min-w-0">
        <div className="text-xs sm:text-sm font-medium text-slate-100 truncate">
          {label}
        </div>
        <div className="text-[11px] text-slate-400 truncate">{description}</div>
      </div>
      <span
        className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
          checked ? activeBg : 'bg-white/15'
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-[#07080c] transition-transform ${
            checked ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </span>
    </button>
  );
};

export const ModMenuPanel: React.FC<ModMenuPanelProps> = ({
  settings,
  onUpdateSettings,
  logs,
  bypassState,
  onInjectBypass,
  onClearLogs,
  onMinimize,
  onExportStandalone,
}) => {
  const [activeTab, setActiveTab] = useState<MenuTab>('combat');
  const consoleEndRef = useRef<HTMLDivElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);

  // Draggable offset from center
  const [offset, setOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const dragState = useRef<{
    pointerId: number | null;
    startX: number;
    startY: number;
    origX: number;
    origY: number;
  }>({
    pointerId: null,
    startX: 0,
    startY: 0,
    origX: 0,
    origY: 0,
  });

  useEffect(() => {
    consoleEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const handleHeaderPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest('button')) return;
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    dragState.current = {
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      origX: offset.x,
      origY: offset.y,
    };
  };

  const handleHeaderPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (dragState.current.pointerId !== e.pointerId) return;
    const dx = e.clientX - dragState.current.startX;
    const dy = e.clientY - dragState.current.startY;
    const maxDx = Math.max(0, window.innerWidth * 0.35);
    const maxDy = Math.max(0, window.innerHeight * 0.25);
    setOffset({
      x: Math.min(Math.max(-maxDx, dragState.current.origX + dx), maxDx),
      y: Math.min(Math.max(-maxDy, dragState.current.origY + dy), maxDy),
    });
  };

  const handleHeaderPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (dragState.current.pointerId === e.pointerId) {
      dragState.current.pointerId = null;
    }
  };

  const getLogColor = (level: LogEntry['level']) => {
    switch (level) {
      case 'cmd':
        return 'text-[#00f0ff] font-semibold';
      case 'ok':
        return 'text-emerald-400 font-semibold';
      case 'warn':
        return 'text-amber-300';
      case 'err':
        return 'text-[#ff2a55]';
      default:
        return 'text-slate-300';
    }
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-3 sm:p-4 pointer-events-none">
      <div
        ref={panelRef}
        style={{
          transform: `translate3d(${offset.x}px, ${offset.y}px, 0)`,
        }}
        className="pointer-events-auto w-full max-w-[430px] sm:max-w-[470px] max-h-[86vh] cyber-glass rounded-2xl border border-white/12 flex flex-col overflow-hidden relative"
      >
        {/* Top gradient hairline */}
        <div
          aria-hidden="true"
          className="h-[2px] w-full bg-gradient-to-r from-[#ff2a55] via-[#00f0ff] to-[#ff2a55] shrink-0"
        />

        {/* Draggable Header Bar */}
        <div
          onPointerDown={handleHeaderPointerDown}
          onPointerMove={handleHeaderPointerMove}
          onPointerUp={handleHeaderPointerUp}
          onPointerCancel={handleHeaderPointerUp}
          style={{ touchAction: 'none' }}
          className="px-4 py-3 border-b border-white/10 flex items-center justify-between gap-2 cursor-grab active:cursor-grabbing select-none shrink-0 bg-black/30"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <GripHorizontal className="w-4 h-4 text-slate-400 shrink-0" />
            <div className="min-w-0">
              <div className="font-display font-bold text-sm sm:text-base tracking-wide text-white truncate">
                PhantomCore Overlay
              </div>
              <div className="font-mono-tech text-[11px] text-slate-400 truncate">
                ARM64-v8a · Rootless Overlay
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={onExportStandalone}
              title="Download 100% self-contained single-file HTML"
              className="min-h-[36px] px-2.5 rounded-lg bg-[#00f0ff]/12 hover:bg-[#00f0ff]/20 border border-[#00f0ff]/35 text-[#00f0ff] text-[11px] font-medium flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Single HTML</span>
              <span className="sm:hidden">.HTML</span>
            </button>

            <button
              type="button"
              onClick={onMinimize}
              aria-label="Collapse menu to floating bubble"
              className="min-h-[36px] min-w-[36px] rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 flex items-center justify-center transition-colors cursor-pointer"
            >
              <Minimize2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Segmented Navigation Tabs */}
        <div className="px-4 pt-3 pb-2 shrink-0">
          <div className="grid grid-cols-3 gap-1.5 p-1 rounded-xl bg-black/50 border border-white/10">
            <button
              type="button"
              onClick={() => setActiveTab('combat')}
              className={`min-h-[38px] rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'combat'
                  ? 'bg-[#ff2a55] text-white shadow-[0_0_16px_rgba(255,42,85,0.45)]'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Crosshair className="w-3.5 h-3.5" />
              <span>Aimbot</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('esp')}
              className={`min-h-[38px] rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'esp'
                  ? 'bg-[#00f0ff] text-[#07080c] shadow-[0_0_16px_rgba(0,240,255,0.45)]'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>ESP Visuals</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('engine')}
              className={`min-h-[38px] rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'engine'
                  ? 'bg-white/15 text-white border border-white/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Gauge className="w-3.5 h-3.5" />
              <span>FPS &amp; HUD</span>
            </button>
          </div>
        </div>

        {/* Scrollable Controls Body */}
        <div className="px-4 py-2 space-y-2.5 overflow-y-auto cyber-scroll flex-1 min-h-[180px]">
          {activeTab === 'combat' && (
            <>
              <ToggleRow
                label="Aimbot Lock Assist"
                description="Tracks enemies entering center FOV circle"
                checked={settings.aimbotEnabled}
                onChange={(v) => onUpdateSettings({ aimbotEnabled: v })}
                accent="crimson"
              />

              <ToggleRow
                label="Draw Neon FOV Circle"
                description="Live center-screen target acquisition ring"
                checked={settings.showFovCircle}
                onChange={(v) => onUpdateSettings({ showFovCircle: v })}
                accent="cyan"
              />

              {/* FOV Slider */}
              <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-slate-200">FOV Circle Radius</span>
                  <span className="font-mono-tech text-[#00f0ff] font-semibold">
                    {settings.fovRadius} px
                  </span>
                </div>
                <input
                  type="range"
                  min={35}
                  max={240}
                  step={5}
                  value={settings.fovRadius}
                  onChange={(e) =>
                    onUpdateSettings({ fovRadius: Number(e.target.value) })
                  }
                  className="cyber-slider"
                />
              </div>

              {/* Smoothness Slider */}
              <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-slate-200">Aimbot Smoothness</span>
                  <span className="font-mono-tech text-[#ff2a55] font-semibold">
                    {settings.aimSmoothness.toFixed(1)}x
                  </span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={20}
                  step={0.5}
                  value={settings.aimSmoothness}
                  onChange={(e) =>
                    onUpdateSettings({ aimSmoothness: Number(e.target.value) })
                  }
                  className="cyber-slider crimson"
                />
              </div>

              {/* Target Bone Selector */}
              <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-between gap-3">
                <span className="text-xs font-medium text-slate-200">Target Priority</span>
                <div className="flex items-center gap-1.5">
                  {(['head', 'chest'] as const).map((bone) => (
                    <button
                      key={bone}
                      type="button"
                      onClick={() => onUpdateSettings({ targetBone: bone })}
                      className={`min-h-[34px] px-3 rounded-lg text-xs font-medium capitalize transition-colors cursor-pointer ${
                        settings.targetBone === bone
                          ? 'bg-[#ff2a55]/20 text-[#ff2a55] border border-[#ff2a55]/50'
                          : 'bg-black/40 text-slate-400 border border-white/10 hover:text-white'
                      }`}
                    >
                      {bone}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {activeTab === 'esp' && (
            <>
              <ToggleRow
                label="Master ESP Overlay"
                description="Enable real-time enemy player tracking"
                checked={settings.espEnabled}
                onChange={(v) => onUpdateSettings({ espEnabled: v })}
                accent="cyan"
              />
              <ToggleRow
                label="Corner Hitbox Frame"
                description="Draws dynamic bounding box & head marker"
                checked={settings.espBoxes}
                onChange={(v) => onUpdateSettings({ espBoxes: v })}
                accent="cyan"
              />
              <ToggleRow
                label="Live Health Bar"
                description="Color-coded HP indicator per target"
                checked={settings.espHealthBar}
                onChange={(v) => onUpdateSettings({ espHealthBar: v })}
                accent="cyan"
              />
              <ToggleRow
                label="Distance & Callsign"
                description="Shows player tag and range in meters"
                checked={settings.espDistance}
                onChange={(v) => onUpdateSettings({ espDistance: v })}
                accent="cyan"
              />
              <ToggleRow
                label="Target Snaplines"
                description="Draws tracer vectors from bottom screen"
                checked={settings.espSnaplines}
                onChange={(v) => onUpdateSettings({ espSnaplines: v })}
                accent="crimson"
              />
            </>
          )}

          {activeTab === 'engine' && (
            <>
              <ToggleRow
                label="120 FPS & Anti-Lag Booster"
                description="Unlocks 120Hz frame pacing & reduces ping"
                checked={settings.fpsBoosterEnabled}
                onChange={(v) => onUpdateSettings({ fpsBoosterEnabled: v })}
                accent="cyan"
              />
              <ToggleRow
                label="Custom Pro Crosshair"
                description="Renders sharp center-screen reticle"
                checked={settings.crosshairEnabled}
                onChange={(v) => onUpdateSettings({ crosshairEnabled: v })}
                accent="crimson"
              />

              {/* Reticle Style */}
              <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-200">Reticle Style</span>
                  <div className="flex items-center gap-1">
                    {(['cross', 'dot', 'chevron'] as CrosshairStyle[]).map((st) => (
                      <button
                        key={st}
                        type="button"
                        onClick={() => onUpdateSettings({ crosshairStyle: st })}
                        className={`min-h-[32px] px-2.5 rounded-lg text-[11px] font-medium capitalize transition-colors cursor-pointer ${
                          settings.crosshairStyle === st
                            ? 'bg-[#00f0ff]/20 text-[#00f0ff] border border-[#00f0ff]/50'
                            : 'bg-black/40 text-slate-400 border border-white/10 hover:text-white'
                        }`}
                      >
                        {st}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-xs font-medium text-slate-200">Reticle Color</span>
                  <div className="flex items-center gap-2">
                    {(
                      [
                        { hex: '#00f0ff', label: 'Cyan' },
                        { hex: '#ff2a55', label: 'Crimson' },
                        { hex: '#22c55e', label: 'Green' },
                      ] as { hex: CrosshairColor; label: string }[]
                    ).map((c) => (
                      <button
                        key={c.hex}
                        type="button"
                        aria-label={`Set crosshair color ${c.label}`}
                        onClick={() => onUpdateSettings({ crosshairColor: c.hex })}
                        style={{ backgroundColor: c.hex }}
                        className={`w-7 h-7 rounded-lg transition-transform cursor-pointer ${
                          settings.crosshairColor === c.hex
                            ? 'ring-2 ring-white scale-110'
                            : 'opacity-65 hover:opacity-100'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Crosshair Size */}
              <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-slate-200">Reticle Scale</span>
                  <span className="font-mono-tech text-[#00f0ff] font-semibold">
                    {settings.crosshairSize} px
                  </span>
                </div>
                <input
                  type="range"
                  min={8}
                  max={24}
                  step={1}
                  value={settings.crosshairSize}
                  onChange={(e) =>
                    onUpdateSettings({ crosshairSize: Number(e.target.value) })
                  }
                  className="cyber-slider"
                />
              </div>
            </>
          )}
        </div>

        {/* Bottom Python & Memory Injection Terminal */}
        <div className="border-t border-white/10 bg-black/55 p-3.5 space-y-2.5 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-200">
              <Terminal className="w-3.5 h-3.5 text-[#00f0ff]" />
              <span>Python &amp; Memory Hook Console</span>
            </div>
            <button
              type="button"
              onClick={onClearLogs}
              aria-label="Clear terminal logs"
              className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer"
            >
              <Trash2 className="w-3 h-3" />
              <span>Clear</span>
            </button>
          </div>

          <div
            aria-live="polite"
            className="h-28 rounded-xl bg-[#050609] border border-white/10 p-2.5 overflow-y-auto cyber-scroll font-mono-tech text-[11px] leading-relaxed space-y-1"
          >
            {logs.map((entry) => (
              <div key={entry.id} className="break-words">
                <span className="text-slate-500 mr-1.5">[{entry.timestamp}]</span>
                <span className={getLogColor(entry.level)}>{entry.text}</span>
              </div>
            ))}
            <div ref={consoleEndRef} />
          </div>

          <button
            type="button"
            onClick={onInjectBypass}
            disabled={bypassState === 'injecting'}
            className={`w-full min-h-[44px] px-4 py-2.5 rounded-xl font-display font-bold text-xs sm:text-sm tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-65 ${
              bypassState === 'active'
                ? 'bg-emerald-500/20 border border-emerald-400/60 text-emerald-300 shadow-[0_0_20px_rgba(16,185,129,0.25)]'
                : 'bg-gradient-to-r from-[#ff2a55] to-[#e11d48] hover:brightness-110 text-white shadow-[0_0_22px_rgba(255,42,85,0.4)]'
            }`}
          >
            <Zap className="w-4 h-4" />
            <span>
              {bypassState === 'injecting'
                ? 'EXECUTING PYTHON HOOKS...'
                : bypassState === 'active'
                ? 'BYPASS ACTIVE — RE-INJECT HOOKS'
                : 'INJECT PYTHON BYPASS'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
