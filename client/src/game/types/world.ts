import type { GymMachine, GymKind } from './training';

export type GymDefinition = {
  id: string;
  name: string;
  machineIds: string[];
  defaultMachineId: string;
  type: GymKind;
  levelMin: number;
  levelMax: number;
  blurb: string;
};

export type GymArea = GymDefinition & {
  machines: GymMachine[];
};

export type WorldPosition = {
  x: number;
  y: number;
};

export type WorldRouteConnection = {
  id: string;
  from: string;
  to: string;
  routeName: string;
  travelFatigue: number;
  encounterBoost: number;
};

export type ZoneVibe = {
  id: string;
  icon: string;
  mood: string;
  theme: string;
  accent: string;
};

export type ZoneTransit = {
  from: string;
  to: string;
  icon: string;
  routeName?: string;
  routeFatigue?: number;
  routeEncounterBoost?: number;
  routeScoutChance?: number;
};

export type CardinalDirection = 'up' | 'down' | 'left' | 'right';
