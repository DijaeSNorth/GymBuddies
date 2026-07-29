export type PlayerInputAction =
  | 'move-up'
  | 'move-down'
  | 'move-left'
  | 'move-right'
  | 'confirm'
  | 'cancel'
  | 'menu'
  | 'interact'
  | 'ability-1'
  | 'ability-2'
  | 'ability-3'
  | 'pause';

export type InputAction = PlayerInputAction | 'debug-toggle';

export type MovementInputAction = Extract<InputAction, `move-${string}`>;

export type KeyboardBindingMap = Record<PlayerInputAction, string[]>;

export type GamepadProfileId = 'standard' | 'xbox' | 'playstation';

export type TextSpeed = 'slow' | 'standard' | 'fast' | 'instant';

export type SustainedInputMode = 'hold' | 'toggle';

export type SaveInputSettings = {
  keyboardBindings: KeyboardBindingMap;
};
