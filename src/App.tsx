import { useCallback, useEffect, useRef, useState } from 'react';
import { FloatingBubble } from './components/FloatingBubble';
import { FpsHud } from './components/FpsHud';
import { GameCanvas } from './components/GameCanvas';
import { ModMenuPanel } from './components/ModMenuPanel';
import { BypassState, LogEntry, ModSettings } from './types/modTypes';

const INITIAL_SETTINGS: ModSettings = {
  aimbotEnabled: true,
  showFovCircle: true,
  fovRadius: 110,
  aimSmoothness: 6.5,
  targetBone: 'head',
  espEnabled: true,
  espBoxes: true,
  espHealthBar: true,
  espSnaplines: true,
  espDistance: true,
  crosshairEnabled: true,
  crosshairStyle: 'cross',
  crosshairColor: '#00f0ff',
  crosshairSize: 13,
  fpsBoosterEnabled: true,
};

function formatTime(): string {
  return new Date().toTimeString().slice(0, 8);
}

export default function App() {
  const [menuOpen, setMenuOpen] = useState<boolean>(true);
  const [settings, setSettings] = useState<ModSettings>(INITIAL_SETTINGS);
  const [enemiesInFov, setEnemiesInFov] = useState<number>(0);
  const [bypassState, setBypassState] = useState<BypassState>('idle');
  const [logs, setLogs] = useState<LogEntry[]>([
    {
      id: 'boot-1',
      timestamp: formatTime(),
      level: 'info',
      text: 'PhantomCore Android ARM64 runtime initialized. Overlay ready.',
    },
  ]);

  const timersRef = useRef<number[]>([]);

  useEffect(() => {
    return () => {
      timersRef.current.forEach((id) => window.clearTimeout(id));
    };
  }, []);

  const appendLog = useCallback((level: LogEntry['level'], text: string) => {
    setLogs((prev) => [
      ...prev.slice(-60),
      {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        timestamp: formatTime(),
        level,
        text,
      },
    ]);
  }, []);

  const handleUpdateSettings = (patch: Partial<ModSettings>) => {
    setSettings((prev) => ({ ...prev, ...patch }));
  };

  const handleInjectBypass = () => {
    if (bypassState === 'injecting') return;

    timersRef.current.forEach((id) => window.clearTimeout(id));
    timersRef.current = [];

    setBypassState('injecting');

    const scriptSteps: Array<{
      delay: number;
      level: LogEntry['level'];
      text: string;
    }> = [
      {
        delay: 80,
        level: 'cmd',
        text: '$ python3 core_hook.py --arch arm64-v8a --pid 14892',
      },
      {
        delay: 420,
        level: 'info',
        text: '[*] Loading pymem-android & frida-gum bindings (v16.4.1)...',
      },
      {
        delay: 850,
        level: 'info',
        text: '[*] Attaching to target process: com.tactical.ops.mobile',
      },
      {
        delay: 1320,
        level: 'ok',
        text: '[+] Located libil2cpp.so base @ 0x7a4f200000 (size: 48.6 MB)',
      },
      {
        delay: 1780,
        level: 'ok',
        text: '[+] Resolved offsets: PlayerController::Update -> +0x18B4C20',
      },
      {
        delay: 2220,
        level: 'warn',
        text: '[*] Scanning memory regions for anti-cheat CRC32 watchdog...',
      },
      {
        delay: 2740,
        level: 'ok',
        text: '[+] Patching libanogs.so checksum verification [NOP x4 @ 0x00419F88]',
      },
      {
        delay: 3200,
        level: 'ok',
        text: '[+] Hooking AimAssist & FramePacingJNI callbacks...',
      },
      {
        delay: 3650,
        level: 'ok',
        text: 'SUCCESS! Memory hooks active · Anti-cheat bypass verified (0 detections).',
      },
    ];

    scriptSteps.forEach((step, idx) => {
      const timerId = window.setTimeout(() => {
        appendLog(step.level, step.text);
        if (idx === scriptSteps.length - 1) {
          setBypassState('active');
        }
      }, step.delay);
      timersRef.current.push(timerId);
    });
  };

  const handleExportStandalone = () => {
    const link = document.createElement('a');
    link.href = '/android-mod-overlay.html';
    link.download = 'android-mod-overlay.html';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    appendLog('info', 'Exported self-contained single-file android-mod-overlay.html');
  };

  return (
    <main className="relative w-screen h-screen overflow-hidden bg-[#07080c] select-none">
      {/* Live Tactical Arena Simulation Canvas */}
      <GameCanvas
        settings={settings}
        unlocked={true}
        onEnemiesInFovChange={setEnemiesInFov}
      />

      {/* Overlay HUD & Floating Controls */}
      <FpsHud
        fpsBoosterEnabled={settings.fpsBoosterEnabled}
        bypassState={bypassState}
        enemiesInFov={enemiesInFov}
      />

      <FloatingBubble
        isOpen={menuOpen}
        onToggle={() => setMenuOpen((prev) => !prev)}
        bypassState={bypassState}
      />

      {menuOpen && (
        <ModMenuPanel
          settings={settings}
          onUpdateSettings={handleUpdateSettings}
          logs={logs}
          bypassState={bypassState}
          onInjectBypass={handleInjectBypass}
          onClearLogs={() => setLogs([])}
          onMinimize={() => setMenuOpen(false)}
          onExportStandalone={handleExportStandalone}
        />
      )}
    </main>
  );
}
