import { GAMEPAD_DISCOVERY_INTERVAL_MS } from './actionMap';

type GamepadFrameSubscriber = (
  gamepad: Gamepad | null,
  nowMs: number,
) => void;

const subscribers = new Set<GamepadFrameSubscriber>();
let animationFrame = 0;
let discoveryTimer = 0;
let listeningForConnections = false;

function connectedGamepad() {
  return navigator.getGamepads?.().find(Boolean) ?? null;
}

function notifySubscribers(gamepad: Gamepad | null, nowMs: number) {
  [...subscribers].forEach((subscriber) => subscriber(gamepad, nowMs));
}

function scheduleScan() {
  if (
    typeof window === 'undefined' ||
    subscribers.size === 0 ||
    animationFrame !== 0 ||
    discoveryTimer !== 0
  ) {
    return;
  }
  animationFrame = window.requestAnimationFrame(scanGamepads);
}

function scanGamepads(nowMs: number) {
  animationFrame = 0;
  if (subscribers.size === 0) return;
  const gamepad = connectedGamepad();
  notifySubscribers(gamepad, nowMs);
  if (gamepad) {
    scheduleScan();
    return;
  }
  discoveryTimer = window.setTimeout(() => {
    discoveryTimer = 0;
    scheduleScan();
  }, GAMEPAD_DISCOVERY_INTERVAL_MS);
}

function handleGamepadConnectionChange() {
  if (discoveryTimer !== 0) {
    window.clearTimeout(discoveryTimer);
    discoveryTimer = 0;
  }
  scheduleScan();
}

function startConnectionListeners() {
  if (listeningForConnections) return;
  window.addEventListener('gamepadconnected', handleGamepadConnectionChange);
  window.addEventListener('gamepaddisconnected', handleGamepadConnectionChange);
  listeningForConnections = true;
}

function stopConnectionListeners() {
  if (!listeningForConnections) return;
  window.removeEventListener('gamepadconnected', handleGamepadConnectionChange);
  window.removeEventListener(
    'gamepaddisconnected',
    handleGamepadConnectionChange,
  );
  listeningForConnections = false;
}

export function subscribeToGamepadFrames(
  subscriber: GamepadFrameSubscriber,
) {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return () => undefined;
  }
  subscribers.add(subscriber);
  startConnectionListeners();
  scheduleScan();
  return () => {
    subscribers.delete(subscriber);
    if (subscribers.size > 0) return;
    if (animationFrame !== 0) {
      window.cancelAnimationFrame(animationFrame);
      animationFrame = 0;
    }
    if (discoveryTimer !== 0) {
      window.clearTimeout(discoveryTimer);
      discoveryTimer = 0;
    }
    stopConnectionListeners();
  };
}
