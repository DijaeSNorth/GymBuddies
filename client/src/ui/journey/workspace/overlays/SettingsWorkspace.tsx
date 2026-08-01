import { InputAccessibilityPanel } from '../../../accessibility/InputAccessibilityPanel';
import {
  detectGamepadProfile,
  remapKeyboardBinding,
} from '../../../../game/input/actionMap';
import type { JourneyController } from '../../JourneyShell';

type SettingsWorkspaceProps = Readonly<{
  controller: JourneyController;
}>;

export function SettingsWorkspace({ controller }: SettingsWorkspaceProps) {
  const {
    save,
    setAccessibilitySettings,
    setAudioEnabled,
    setCaptureBattleSpeed,
    setKeyboardBindings,
    setMusicVolume,
    setSfxVolume,
    setVisualProgressionPreferences,
  } = controller;
  const activeGamepad = navigator.getGamepads?.().find(Boolean);
  const gamepadProfile = detectGamepadProfile(activeGamepad?.id ?? 'standard');

  return (
    <div className="journey-settings-workspace">
      <section className="journey-settings-audio">
        <span className="journey-overlay-kicker">AUDIO</span>
        <h3>Sound mix</h3>
        <button
          type="button"
          className="journey-overlay-primary"
          aria-label={save.audio.enabled ? 'Mute all audio' : 'Unmute all audio'}
          aria-pressed={!save.audio.enabled}
          onClick={() => setAudioEnabled(!save.audio.enabled)}
        >
          {save.audio.enabled ? 'Audio On' : 'Audio Muted'}
        </button>
        <label>
          <span>Music {Math.round(save.audio.musicVolume * 100)}%</span>
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={save.audio.musicVolume}
            onChange={(event) => setMusicVolume(Number(event.target.value))}
          />
        </label>
        <label>
          <span>SFX {Math.round(save.audio.sfxVolume * 100)}%</span>
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={save.audio.sfxVolume}
            onChange={(event) => setSfxVolume(Number(event.target.value))}
          />
        </label>
        <button
          type="button"
          onClick={() =>
            document
              .querySelector<HTMLButtonElement>(
                '[aria-label="Enter fullscreen"], [aria-label="Exit fullscreen"]',
              )
              ?.click()
          }
        >
          Toggle fullscreen
        </button>
      </section>
      <section className="journey-settings-accessibility">
        <span className="journey-overlay-kicker">ACCESSIBILITY &amp; INPUT</span>
        <h3>Presentation and controls</h3>
        <InputAccessibilityPanel
          accessibility={save.accessibility}
          battleSpeed={save.captureBattleSpeed}
          gamepadProfile={gamepadProfile}
          keyboardBindings={save.input.keyboardBindings}
          visualProgression={save.visualProgression.preferences}
          onAccessibilityChange={setAccessibilitySettings}
          onBattleSpeedChange={setCaptureBattleSpeed}
          onKeyboardBindingsChange={setKeyboardBindings}
          onRemap={(action, code) =>
            setKeyboardBindings(
              remapKeyboardBinding(save.input.keyboardBindings, action, code),
            )
          }
          onVisualProgressionChange={setVisualProgressionPreferences}
        />
      </section>
    </div>
  );
}
