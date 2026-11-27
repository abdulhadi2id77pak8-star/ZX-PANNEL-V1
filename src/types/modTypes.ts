export type CrosshairStyle = 'cross' | 'dot' | 'chevron';
export type CrosshairColor = '#00f0ff' | '#ff2a55' | '#22c55e';

export interface ModSettings {
  // Combat / Aimbot
  aimbotEnabled: boolean;
  showFovCircle: boolean;
  fovRadius: number; // 30 to 240 px
  aimSmoothness: number; // 1 to 20
  targetBone: 'head' | 'chest';

  // Visuals / ESP
  espEnabled: boolean;
  espBoxes: boolean;
  espHealthBar: boolean;
  espSnaplines: boolean;
  espDistance: boolean;

  // Crosshair & FPS Booster
  crosshairEnabled: boolean;
  crosshairStyle: CrosshairStyle;
  crosshairColor: CrosshairColor;
  crosshairSize: number; // 8 to 24 px
  fpsBoosterEnabled: boolean;
}

export interface LogEntry {
  id: string;
  timestamp: string;
  level: 'cmd' | 'info' | 'ok' | 'warn' | 'err';
  text: string;
}

export type BypassState = 'idle' | 'injecting' | 'active';
