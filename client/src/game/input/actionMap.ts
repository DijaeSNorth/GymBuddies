import type {
  CardinalDirection,
  GamepadProfileId,
  InputAction,
  KeyboardBindingMap,
  MovementInputAction,
  PlayerInputAction,
} from '../types';

export type {
  InputAction,
  KeyboardBindingMap,
  MovementInputAction,
  PlayerInputAction,
};

export const PLAYER_INPUT_ACTIONS = [
  'move-up',
  'move-down',
  'move-left',
  'move-right',
  'confirm',
  'cancel',
  'menu',
  'interact',
  'ability-1',
  'ability-2',
  'ability-3',
  'pause',
] as const satisfies readonly PlayerInputAction[];

export const INPUT_ACTIONS = [
  ...PLAYER_INPUT_ACTIONS,
  'debug-toggle',
] as const satisfies readonly InputAction[];

export const INPUT_ACTION_LABELS: Readonly<Record<PlayerInputAction, string>> = {
  'move-up': 'Move up',
  'move-down': 'Move down',
  'move-left': 'Move left',
  'move-right': 'Move right',
  confirm: 'Confirm',
  cancel: 'Cancel',
  menu: 'Menu',
  interact: 'Interact',
  'ability-1': 'Ability 1',
  'ability-2': 'Ability 2',
  'ability-3': 'Ability 3',
  pause: 'Pause',
};

export const CARDINAL_DIRECTIONS: CardinalDirection[] = ['up', 'left', 'down', 'right'];

export const DEFAULT_KEYBOARD_BINDINGS: Readonly<KeyboardBindingMap> = {
  'move-up': ['ArrowUp', 'KeyW'],
  'move-down': ['ArrowDown', 'KeyS'],
  'move-left': ['ArrowLeft', 'KeyA'],
  'move-right': ['ArrowRight', 'KeyD'],
  confirm: ['Enter'],
  cancel: ['Escape'],
  menu: ['KeyM'],
  interact: ['Space', 'KeyE'],
  'ability-1': ['Digit1'],
  'ability-2': ['Digit2'],
  'ability-3': ['Digit3'],
  pause: ['KeyP'],
};

export const GAMEPAD_BUTTON_ACTION_MAP: Readonly<Record<number, PlayerInputAction>> = {
  0: 'confirm',
  1: 'cancel',
  2: 'interact',
  3: 'menu',
  4: 'ability-1',
  5: 'ability-2',
  7: 'ability-3',
  8: 'menu',
  9: 'pause',
  12: 'move-up',
  13: 'move-down',
  14: 'move-left',
  15: 'move-right',
};

export const GAMEPAD_PROFILE_LABELS: Readonly<
  Record<GamepadProfileId, Readonly<Record<PlayerInputAction, string>>>
> = {
  standard: {
    'move-up': 'D-pad / left stick up',
    'move-down': 'D-pad / left stick down',
    'move-left': 'D-pad / left stick left',
    'move-right': 'D-pad / left stick right',
    confirm: 'South button',
    cancel: 'East button',
    menu: 'North button / select',
    interact: 'West button',
    'ability-1': 'Left shoulder',
    'ability-2': 'Right shoulder',
    'ability-3': 'Right trigger',
    pause: 'Start',
  },
  xbox: {
    'move-up': 'D-pad / left stick up',
    'move-down': 'D-pad / left stick down',
    'move-left': 'D-pad / left stick left',
    'move-right': 'D-pad / left stick right',
    confirm: 'A',
    cancel: 'B',
    menu: 'Y / View',
    interact: 'X',
    'ability-1': 'LB',
    'ability-2': 'RB',
    'ability-3': 'RT',
    pause: 'Menu',
  },
  playstation: {
    'move-up': 'D-pad / left stick up',
    'move-down': 'D-pad / left stick down',
    'move-left': 'D-pad / left stick left',
    'move-right': 'D-pad / left stick right',
    confirm: 'Cross',
    cancel: 'Circle',
    menu: 'Triangle / Create',
    interact: 'Square',
    'ability-1': 'L1',
    'ability-2': 'R1',
    'ability-3': 'R2',
    pause: 'Options',
  },
};

export const TOUCH_DIRECTION_ACTION_MAP: Readonly<Record<CardinalDirection, MovementInputAction>> = {
  up: 'move-up',
  down: 'move-down',
  left: 'move-left',
  right: 'move-right',
};

export const INPUT_REPEAT_MS: Readonly<Record<'movement' | 'command', number>> = {
  movement: 115,
  command: 280,
};
export const GAMEPAD_DISCOVERY_INTERVAL_MS = 1_000;

const LEGACY_KEY_TO_CODE: Readonly<Record<string, string>> = {
  ' ': 'Space',
  arrowup: 'ArrowUp',
  arrowdown: 'ArrowDown',
  arrowleft: 'ArrowLeft',
  arrowright: 'ArrowRight',
  backspace: 'Backspace',
  enter: 'Enter',
  escape: 'Escape',
  tab: 'Tab',
};

const BLOCKED_BINDING_CODES = new Set([
  'AltLeft',
  'AltRight',
  'ControlLeft',
  'ControlRight',
  ...Array.from({ length: 12 }, (_, index) => `F${index + 1}`),
  'MetaLeft',
  'MetaRight',
  'ShiftLeft',
  'ShiftRight',
  'Tab',
]);

function cloneBindings(bindings: Readonly<KeyboardBindingMap>): KeyboardBindingMap {
  return Object.fromEntries(
    PLAYER_INPUT_ACTIONS.map((action) => [action, [...bindings[action]]]),
  ) as KeyboardBindingMap;
}

function keyValueToCode(key: string) {
  const normalized = key.toLowerCase();
  if (LEGACY_KEY_TO_CODE[normalized]) return LEGACY_KEY_TO_CODE[normalized];
  if (/^[a-z]$/i.test(key)) return `Key${key.toUpperCase()}`;
  if (/^[0-9]$/.test(key)) return `Digit${key}`;
  if (/^(Key[A-Z]|Digit[0-9]|Arrow(?:Up|Down|Left|Right)|F[0-9]{1,2})$/.test(key)) {
    return key;
  }
  return key;
}

export function isBindableKeyboardCode(code: string) {
  return Boolean(code) && !BLOCKED_BINDING_CODES.has(code);
}

export function keyboardCodeToAction(
  code: string,
  bindings: Readonly<KeyboardBindingMap> = DEFAULT_KEYBOARD_BINDINGS,
): InputAction | null {
  if (code === 'F2') return 'debug-toggle';
  return (
    PLAYER_INPUT_ACTIONS.find((action) => bindings[action]?.includes(code)) ??
    null
  );
}

export function keyboardKeyToAction(
  key: string,
  bindings: Readonly<KeyboardBindingMap> = DEFAULT_KEYBOARD_BINDINGS,
): InputAction | null {
  return keyboardCodeToAction(keyValueToCode(key), bindings);
}

export function keyboardEventToAction(
  event: Pick<KeyboardEvent, 'code' | 'key'>,
  bindings: Readonly<KeyboardBindingMap> = DEFAULT_KEYBOARD_BINDINGS,
) {
  return (
    keyboardCodeToAction(event.code, bindings) ??
    keyboardKeyToAction(event.key, bindings)
  );
}

export function formatKeyboardCode(code: string) {
  if (code.startsWith('Key')) return code.slice(3);
  if (code.startsWith('Digit')) return code.slice(5);
  if (code === 'Space') return 'Space';
  return code.replace(/([a-z])([A-Z])/g, '$1 $2');
}

export function remapKeyboardBinding(
  bindings: Readonly<KeyboardBindingMap>,
  action: PlayerInputAction,
  nextCode: string,
): KeyboardBindingMap {
  if (!isBindableKeyboardCode(nextCode)) return cloneBindings(bindings);
  const next = cloneBindings(bindings);
  const previousPrimary = next[action][0];
  const displacedAction = PLAYER_INPUT_ACTIONS.find(
    (candidate) => candidate !== action && next[candidate].includes(nextCode),
  );

  next[action] = [
    nextCode,
    ...next[action].slice(1).filter((code) => code !== nextCode),
  ];

  if (displacedAction) {
    next[displacedAction] = next[displacedAction].map((code) =>
      code === nextCode && previousPrimary ? previousPrimary : code,
    );
  }

  return next;
}

export function validateKeyboardBindings(
  bindings: Readonly<KeyboardBindingMap>,
) {
  const issues: string[] = [];
  const ownerByCode = new Map<string, PlayerInputAction>();
  PLAYER_INPUT_ACTIONS.forEach((action) => {
    const actionBindings = bindings[action];
    if (!Array.isArray(actionBindings) || actionBindings.length === 0) {
      issues.push(`${INPUT_ACTION_LABELS[action]} has no keyboard binding.`);
      return;
    }
    actionBindings.forEach((code) => {
      if (!isBindableKeyboardCode(code)) {
        issues.push(`${formatKeyboardCode(code)} cannot be used as a binding.`);
      }
      const owner = ownerByCode.get(code);
      if (owner && owner !== action) {
        issues.push(
          `${formatKeyboardCode(code)} is assigned to both ${INPUT_ACTION_LABELS[owner]} and ${INPUT_ACTION_LABELS[action]}.`,
        );
      } else {
        ownerByCode.set(code, action);
      }
    });
  });
  return issues;
}

export function normalizeKeyboardBindings(
  value: unknown,
  fallback: Readonly<KeyboardBindingMap> = DEFAULT_KEYBOARD_BINDINGS,
): KeyboardBindingMap {
  const source =
    value && typeof value === 'object' && !Array.isArray(value)
      ? (value as Partial<Record<PlayerInputAction, unknown>>)
      : {};
  const normalized = {} as KeyboardBindingMap;

  PLAYER_INPUT_ACTIONS.forEach((action) => {
    const raw = Array.isArray(source[action]) ? source[action] : [];
    const candidates = raw.filter(
      (code): code is string =>
        typeof code === 'string' &&
        isBindableKeyboardCode(code),
    );
    const unique = [...new Set(candidates)].slice(0, 2);
    normalized[action] =
      unique.length > 0 ? unique : [...fallback[action]];
  });

  return validateKeyboardBindings(normalized).length > 0
    ? cloneBindings(DEFAULT_KEYBOARD_BINDINGS)
    : normalized;
}

export function directionToInputAction(direction: CardinalDirection): MovementInputAction {
  return TOUCH_DIRECTION_ACTION_MAP[direction];
}

export function inputActionToDirection(action: InputAction): CardinalDirection | null {
  if (action === 'move-up') return 'up';
  if (action === 'move-down') return 'down';
  if (action === 'move-left') return 'left';
  if (action === 'move-right') return 'right';
  return null;
}

export function detectGamepadProfile(id: string): GamepadProfileId {
  const normalized = id.toLowerCase();
  if (
    normalized.includes('dualshock') ||
    normalized.includes('dualsense') ||
    normalized.includes('playstation') ||
    normalized.includes('sony')
  ) {
    return 'playstation';
  }
  if (
    normalized.includes('xbox') ||
    normalized.includes('xinput') ||
    normalized.includes('microsoft')
  ) {
    return 'xbox';
  }
  return 'standard';
}

export function gamepadActions(
  buttons: readonly { pressed: boolean }[],
  axes: readonly number[],
): Set<InputAction> {
  const actions = new Set<InputAction>();
  Object.entries(GAMEPAD_BUTTON_ACTION_MAP).forEach(([index, action]) => {
    if (buttons[Number(index)]?.pressed) actions.add(action);
  });
  const horizontal = axes[0] ?? 0;
  const vertical = axes[1] ?? 0;
  if (horizontal <= -0.55) actions.add('move-left');
  if (horizontal >= 0.55) actions.add('move-right');
  if (vertical <= -0.55) actions.add('move-up');
  if (vertical >= 0.55) actions.add('move-down');
  return actions;
}

export function isMovementInputAction(action: InputAction): action is MovementInputAction {
  return inputActionToDirection(action) !== null;
}
