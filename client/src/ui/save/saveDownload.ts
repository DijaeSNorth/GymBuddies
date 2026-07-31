import { exportSaveJson } from '../../game/save/saveService';
import type { SaveData } from '../../game/types';

export function downloadSaveJson(
  save: SaveData,
  filename = 'gym-buddies-save.json',
) {
  const json = exportSaveJson(save);
  const blob = new Blob([json], { type: 'application/json' });
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = objectUrl;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(objectUrl);
}
