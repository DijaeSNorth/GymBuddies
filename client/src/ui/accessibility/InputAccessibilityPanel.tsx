import {
  useEffect,
  useState,
} from 'react';

import { CAPTURE_BATTLE_SPEEDS } from '../../game/content/captureBalance';
import { DEVELOPMENT_PRESENTATION_LEVELS } from '../../game/content/visualProgression';
import {
  DEFAULT_KEYBOARD_BINDINGS,
  GAMEPAD_PROFILE_LABELS,
  INPUT_ACTION_LABELS,
  PLAYER_INPUT_ACTIONS,
  formatKeyboardCode,
  isBindableKeyboardCode,
} from '../../game/input/actionMap';
import type {
  CaptureBattleSpeed,
  GamepadProfileId,
  KeyboardBindingMap,
  PlayerInputAction,
  SaveAccessibilitySettings,
  TrainerVisualProgressionPreferences,
} from '../../game/types';

interface InputAccessibilityPanelProps {
  accessibility: SaveAccessibilitySettings;
  battleSpeed: CaptureBattleSpeed;
  gamepadProfile: GamepadProfileId;
  keyboardBindings: KeyboardBindingMap;
  visualProgression: TrainerVisualProgressionPreferences;
  onAccessibilityChange: (settings: SaveAccessibilitySettings) => void;
  onBattleSpeedChange: (speed: CaptureBattleSpeed) => void;
  onKeyboardBindingsChange: (bindings: KeyboardBindingMap) => void;
  onRemap: (action: PlayerInputAction, code: string) => void;
  onVisualProgressionChange: (
    preferences: TrainerVisualProgressionPreferences,
  ) => void;
}

function cloneDefaultBindings(): KeyboardBindingMap {
  return Object.fromEntries(
    PLAYER_INPUT_ACTIONS.map((action) => [
      action,
      [...DEFAULT_KEYBOARD_BINDINGS[action]],
    ]),
  ) as KeyboardBindingMap;
}

export function InputAccessibilityPanel({
  accessibility,
  battleSpeed,
  gamepadProfile,
  keyboardBindings,
  onAccessibilityChange,
  onBattleSpeedChange,
  onKeyboardBindingsChange,
  onRemap,
  onVisualProgressionChange,
  visualProgression,
}: InputAccessibilityPanelProps) {
  const [listeningAction, setListeningAction] =
    useState<PlayerInputAction | null>(null);
  const [remapStatus, setRemapStatus] = useState(
    'Choose Remap, then press a keyboard key.',
  );

  useEffect(() => {
    if (!listeningAction) return;
    const captureRemap = (event: KeyboardEvent) => {
      event.preventDefault();
      event.stopImmediatePropagation();
      if (
        event.altKey ||
        event.ctrlKey ||
        event.metaKey ||
        !isBindableKeyboardCode(event.code)
      ) {
        setRemapStatus(
          'That key is reserved by the browser or operating system. Try another key.',
        );
        return;
      }
      onRemap(listeningAction, event.code);
      setRemapStatus(
        `${INPUT_ACTION_LABELS[listeningAction]} is now bound to ${formatKeyboardCode(event.code)}.`,
      );
      setListeningAction(null);
    };
    window.addEventListener('keydown', captureRemap, true);
    return () => window.removeEventListener('keydown', captureRemap, true);
  }, [listeningAction, onRemap]);

  return (
    <div
      className="gb-input-settings"
      data-input-settings
    >
      <div className="gb-settings-grid">
        <label className="gb-settings-field">
          <span>Text speed</span>
          <select
            value={accessibility.textSpeed}
            onChange={(event) =>
              onAccessibilityChange({
                ...accessibility,
                textSpeed: event.target
                  .value as SaveAccessibilitySettings['textSpeed'],
              })
            }
          >
            <option value="slow">Slow</option>
            <option value="standard">Standard</option>
            <option value="fast">Fast</option>
            <option value="instant">Instant</option>
          </select>
        </label>
        <label className="gb-settings-field">
          <span>Training development</span>
          <select
            aria-label="Training development intensity"
            value={visualProgression.developmentLevel}
            onChange={(event) =>
              onVisualProgressionChange({
                ...visualProgression,
                developmentLevel: event.target
                  .value as TrainerVisualProgressionPreferences['developmentLevel'],
              })
            }
          >
            {DEVELOPMENT_PRESENTATION_LEVELS.map((level) => (
              <option key={level.id} value={level.id}>
                {level.label}
              </option>
            ))}
          </select>
        </label>
        <label className="gb-settings-field">
          <span>Battle speed</span>
          <select
            value={battleSpeed}
            onChange={(event) =>
              onBattleSpeedChange(event.target.value as CaptureBattleSpeed)
            }
          >
            {CAPTURE_BATTLE_SPEEDS.map((speed) => (
              <option key={speed.id} value={speed.id}>
                {speed.label}
              </option>
            ))}
          </select>
        </label>
        <label className="gb-settings-field">
          <span>Sustained touch movement</span>
          <select
            value={accessibility.sustainedInputMode}
            onChange={(event) =>
              onAccessibilityChange({
                ...accessibility,
                sustainedInputMode: event.target
                  .value as SaveAccessibilitySettings['sustainedInputMode'],
              })
            }
          >
            <option value="hold">Hold button</option>
            <option value="toggle">Tap to toggle</option>
          </select>
        </label>
      </div>

      <div className="gb-settings-toggles">
        <label className="gb-menu-toggle">
          <input
            type="checkbox"
            checked={accessibility.reducedMotion}
            onChange={(event) =>
              onAccessibilityChange({
                ...accessibility,
                reducedMotion: event.target.checked,
                screenShake: event.target.checked
                  ? false
                  : accessibility.screenShake,
              })
            }
          />
          <span>Reduced motion</span>
        </label>
        <label className="gb-menu-toggle">
          <input
            type="checkbox"
            checked={accessibility.screenShake}
            disabled={accessibility.reducedMotion}
            onChange={(event) =>
              onAccessibilityChange({
                ...accessibility,
                screenShake: event.target.checked,
              })
            }
          />
          <span>Screen shake</span>
        </label>
        <label className="gb-menu-toggle">
          <input
            type="checkbox"
            checked={accessibility.highContrast}
            onChange={(event) =>
              onAccessibilityChange({
                ...accessibility,
                highContrast: event.target.checked,
              })
            }
          />
          <span>High-contrast interface</span>
        </label>
        <label className="gb-menu-toggle">
          <input
            type="checkbox"
            checked={
              visualProgression.developmentLevel !== 'cosmetic-only'
            }
            onChange={(event) =>
              onVisualProgressionChange({
                ...visualProgression,
                developmentLevel: event.target.checked
                  ? 'standard'
                  : 'cosmetic-only',
              })
            }
          />
          <span>Show Training Development</span>
        </label>
        <label className="gb-menu-toggle">
          <input
            type="checkbox"
            checked={visualProgression.showPumpEffects}
            onChange={(event) =>
              onVisualProgressionChange({
                ...visualProgression,
                showPumpEffects: event.target.checked,
              })
            }
          />
          <span>Show workout pump highlights</span>
        </label>
        <label className="gb-menu-toggle">
          <input
            type="checkbox"
            checked={visualProgression.showFatigueEffects}
            onChange={(event) =>
              onVisualProgressionChange({
                ...visualProgression,
                showFatigueEffects: event.target.checked,
              })
            }
          />
          <span>Show fatigue and recovery stance</span>
        </label>
      </div>

      <details className="gb-control-details">
        <summary>Keyboard controls and remapping</summary>
        <p className="gb-remap-status" role="status" aria-live="polite">
          {remapStatus}
        </p>
        <div className="gb-binding-list">
          {PLAYER_INPUT_ACTIONS.map((action) => (
            <div className="gb-binding-row" key={action}>
              <span>{INPUT_ACTION_LABELS[action]}</span>
              <kbd>
                {keyboardBindings[action].map(formatKeyboardCode).join(' / ')}
              </kbd>
              <button
                type="button"
                className="gb-menu-action"
                aria-label={`Remap ${INPUT_ACTION_LABELS[action]}`}
                aria-pressed={listeningAction === action}
                onClick={() => {
                  setListeningAction(action);
                  setRemapStatus(
                    `Listening for a new ${INPUT_ACTION_LABELS[action]} key.`,
                  );
                }}
              >
                {listeningAction === action ? 'Press key…' : 'Remap'}
              </button>
            </div>
          ))}
        </div>
        <button
          type="button"
          className="gb-menu-action gb-reset-bindings"
          onClick={() => {
            onKeyboardBindingsChange(cloneDefaultBindings());
            setListeningAction(null);
            setRemapStatus('Default keyboard controls restored.');
          }}
        >
          Restore keyboard defaults
        </button>
      </details>

      <details className="gb-control-details">
        <summary>
          {gamepadProfile === 'xbox'
            ? 'Xbox-style controller map'
            : gamepadProfile === 'playstation'
              ? 'PlayStation-style controller map'
              : 'Standard controller map'}
        </summary>
        <dl className="gb-gamepad-map">
          {PLAYER_INPUT_ACTIONS.map((action) => (
            <div key={action}>
              <dt>{INPUT_ACTION_LABELS[action]}</dt>
              <dd>{GAMEPAD_PROFILE_LABELS[gamepadProfile][action]}</dd>
            </div>
          ))}
        </dl>
      </details>
    </div>
  );
}
