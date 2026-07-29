import { getGymById } from '../gyms';
import { ALL_TRAINING_MACHINES } from '../machines';
import { WORLD_ROUTE_ENCOUNTER_COOLDOWN_MS } from '../routes';
import {
  getWorldJourneyConnection,
  validateWorldJourneyGraph,
  WORLD_JOURNEY_CONNECTIONS,
} from '../worldGraph';
import type {
  GymZoneId,
  OverworldInteractable,
  OverworldLightArea,
  OverworldLocationId,
  OverworldMapConfig,
  OverworldPalette,
  OverworldProp,
  OverworldTilePosition,
  OverworldTileRect,
  OverworldTransition,
  WorldJourneyConnection,
} from '../../types';

export const OVERWORLD_TILE_SIZE = 8;
export const OVERWORLD_MOVE_COOLDOWN_MS = 105;
export const OVERWORLD_TRANSITION_COOLDOWN_MS = 260;
export const OVERWORLD_ENCOUNTER_COOLDOWN_MS = WORLD_ROUTE_ENCOUNTER_COOLDOWN_MS;

const PALETTES = {
  home: {
    id: 'home-recovery',
    ground: '#12383a',
    groundAlternate: '#1c4c49',
    wall: '#071b20',
    accent: '#69d6a2',
    encounter: '#69d6a2',
    rareEncounter: '#f4d35e',
    light: '#d7f4c2',
  },
  starterA: {
    id: 'starter-a-coral',
    ground: '#18343d',
    groundAlternate: '#234b53',
    wall: '#081b23',
    accent: '#ef765f',
    encounter: '#76d7a5',
    rareEncounter: '#ffd166',
    light: '#ffd8b8',
  },
  starterB: {
    id: 'starter-b-control',
    ground: '#172f4b',
    groundAlternate: '#21466a',
    wall: '#071625',
    accent: '#69b8ff',
    encounter: '#68d39b',
    rareEncounter: '#d8a8ff',
    light: '#b9e6ff',
  },
  iron: {
    id: 'iron-rust',
    ground: '#302d2a',
    groundAlternate: '#493b32',
    wall: '#161719',
    accent: '#d77b42',
    encounter: '#8ac27a',
    rareEncounter: '#ffbd69',
    light: '#ffd0a3',
  },
  apex: {
    id: 'apex-violet',
    ground: '#252641',
    groundAlternate: '#39365c',
    wall: '#111326',
    accent: '#b78cff',
    encounter: '#66d7b0',
    rareEncounter: '#ff8fbd',
    light: '#cab8ff',
  },
  glory: {
    id: 'glory-gold',
    ground: '#343021',
    groundAlternate: '#51482b',
    wall: '#17170f',
    accent: '#f2c14e',
    encounter: '#86d39d',
    rareEncounter: '#fff0a6',
    light: '#fff1b8',
  },
  route1: {
    id: 'warm-up-sunrise',
    ground: '#143932',
    groundAlternate: '#1d4b3d',
    wall: '#081d1b',
    accent: '#f2c14e',
    encounter: '#67d89b',
    rareEncounter: '#ffe08a',
    light: '#f6e7a8',
  },
  route2: {
    id: 'starter-link-blue',
    ground: '#17364a',
    groundAlternate: '#204c62',
    wall: '#091a26',
    accent: '#6fc6ff',
    encounter: '#71d0a4',
    rareEncounter: '#d5adff',
    light: '#b6dcff',
  },
  route3: {
    id: 'iron-gate-sunset',
    ground: '#3a332b',
    groundAlternate: '#514233',
    wall: '#1c1a18',
    accent: '#d77b42',
    encounter: '#84bd75',
    rareEncounter: '#ffb55e',
    light: '#f4b07a',
  },
  route4: {
    id: 'forge-violet-dusk',
    ground: '#292942',
    groundAlternate: '#413857',
    wall: '#151422',
    accent: '#d28a54',
    encounter: '#63caa0',
    rareEncounter: '#f28cb8',
    light: '#c993ff',
  },
  route5: {
    id: 'champion-sky',
    ground: '#3b3a2b',
    groundAlternate: '#555039',
    wall: '#181a17',
    accent: '#f2c14e',
    encounter: '#82cf9a',
    rareEncounter: '#fff2a3',
    light: '#fff2ba',
  },
} satisfies Record<string, OverworldPalette>;

interface GymMapSpec {
  locationId: OverworldLocationId;
  zoneId: GymZoneId;
  name: string;
  palette: OverworldPalette;
  npcName: string;
  npcCharacterId: string;
  npcMessage: string;
  boardMessage: string;
  doorXByConnectionId: Record<string, number>;
  props: OverworldProp[];
  lights: OverworldLightArea[];
  recovery?: {
    position: OverworldTilePosition;
    label: string;
    message: string;
  };
}

interface RouteMapSpec {
  connectionId: string;
  palette: OverworldPalette;
  obstacles: OverworldTileRect[];
  props: OverworldProp[];
  lights: OverworldLightArea[];
  scoutName: string;
  scoutCharacterId: string;
  scoutMessage: string;
  recovery?: {
    position: OverworldTilePosition;
    label: string;
    message: string;
  };
}

const GYM_SPECS: GymMapSpec[] = [
  {
    locationId: 'home-gym',
    zoneId: 'home',
    name: 'Home Gym',
    palette: PALETTES.home,
    npcName: 'Coach Mara',
    npcCharacterId: 'character-coach-mara',
    npcMessage: 'Coach Mara: Build a balanced team. Power without Recovery will stall.',
    boardMessage: 'FOUNDATION: Train, recover, scout, and return stronger.',
    doorXByConnectionId: {
      'warm-up-path': 27,
      'recovery-circuit-shortcut': 8,
    },
    props: [
      { id: 'home-planter-west', kind: 'planter', position: { x: 4, y: 7 }, story: 'A clipped indoor fern marks the quiet recovery side.' },
      { id: 'home-hydration', kind: 'hydration', position: { x: 32, y: 8 }, story: 'A refill station carries handwritten pacing reminders.' },
      { id: 'home-chalk-foundation', kind: 'chalk-mark', position: { x: 18, y: 16 }, story: 'Five linked rings represent balanced training.' },
    ],
    lights: [
      { id: 'home-window-light', x: 2, y: 2, width: 12, height: 7, color: '#d8f2c6', alpha: 0.08 },
    ],
    recovery: {
      position: { x: 4, y: 19 },
      label: 'Recovery Nook',
      message: 'The Recovery Nook offers a controlled reset.',
    },
  },
  {
    locationId: 'starter-gym-a',
    zoneId: 'starter-a',
    name: 'Starter Gym A',
    palette: PALETTES.starterA,
    npcName: 'Grip Guide Dex',
    npcCharacterId: 'character-grip-guide-dex',
    npcMessage: 'Dex: Clean machine alignment matters more than frantic force.',
    boardMessage: 'STARTER A: Power grows faster when Technique stays clean.',
    doorXByConnectionId: {
      'warm-up-path': 10,
      'starter-link-road': 30,
    },
    props: [
      { id: 'starter-a-banner', kind: 'banner', position: { x: 20, y: 3 }, story: 'A coral banner celebrates controlled first attempts.' },
      { id: 'starter-a-bench', kind: 'bench', position: { x: 4, y: 15 }, story: 'A viewing bench faces the beginner pressure platform.' },
      { id: 'starter-a-plates', kind: 'plate-stack', position: { x: 35, y: 8 }, story: 'Light plates are ordered by form target, not ego.' },
    ],
    lights: [
      { id: 'starter-a-platform-light', x: 13, y: 6, width: 14, height: 11, color: '#ffd8b8', alpha: 0.07 },
    ],
  },
  {
    locationId: 'starter-gym-b',
    zoneId: 'starter-b',
    name: 'Starter Gym B',
    palette: PALETTES.starterB,
    npcName: 'Control Coach Nia',
    npcCharacterId: 'character-control-coach-nia',
    npcMessage: 'Nia: Hold tension through the middle. Starter Link Road rewards patience.',
    boardMessage: 'STARTER B: Endurance is Technique repeated under pressure.',
    doorXByConnectionId: {
      'starter-link-road': 10,
      'iron-gate-trail': 30,
      'recovery-circuit-shortcut': 5,
    },
    props: [
      { id: 'starter-b-fan', kind: 'fan', position: { x: 35, y: 7 }, story: 'A slow fan keeps longer control sets comfortable.' },
      { id: 'starter-b-banner', kind: 'banner', position: { x: 20, y: 3 }, story: 'Blue bands track each trainee’s longest steady hold.' },
      { id: 'starter-b-hydration', kind: 'hydration', position: { x: 4, y: 9 }, story: 'The refill meter glows brighter after measured sets.' },
    ],
    lights: [
      { id: 'starter-b-control-light', x: 10, y: 5, width: 20, height: 12, color: '#9fdcff', alpha: 0.07 },
    ],
  },
  {
    locationId: 'iron-gym',
    zoneId: 'higher-1',
    name: 'Iron Gym',
    palette: PALETTES.iron,
    npcName: 'Gatekeeper Sol',
    npcCharacterId: 'character-gatekeeper-sol',
    npcMessage: 'Sol: Iron is honest. Bring a team that can recover between hard pulls.',
    boardMessage: 'IRON GYM: Strength earns entry; restraint keeps it.',
    doorXByConnectionId: {
      'iron-gate-trail': 10,
      'forge-stretch': 30,
      'glory-lift-shortcut': 35,
    },
    props: [
      { id: 'iron-chain-west', kind: 'chain-post', position: { x: 4, y: 8 }, story: 'Retired challenge chains form a record wall.' },
      { id: 'iron-plates', kind: 'plate-stack', position: { x: 35, y: 9 }, story: 'Scarred plates are stamped with recovery dates.' },
      { id: 'iron-banner', kind: 'banner', position: { x: 20, y: 3 }, story: 'The rust-red gate emblem honors durable teams.' },
    ],
    lights: [
      { id: 'iron-gate-light', x: 15, y: 2, width: 10, height: 17, color: '#f0a06d', alpha: 0.08 },
    ],
  },
  {
    locationId: 'apex-gym',
    zoneId: 'higher-2',
    name: 'Apex Gym',
    palette: PALETTES.apex,
    npcName: 'Apex Analyst Vale',
    npcCharacterId: 'character-apex-analyst-vale',
    npcMessage: 'Vale: Read the opponent’s drift. Precision creates the safest opening.',
    boardMessage: 'APEX GYM: Mobility turns pressure into position.',
    doorXByConnectionId: {
      'forge-stretch': 10,
      'champion-ascent': 30,
    },
    props: [
      { id: 'apex-fan', kind: 'fan', position: { x: 35, y: 7 }, story: 'Directional fans simulate the exposed Champion Ascent.' },
      { id: 'apex-banner', kind: 'banner', position: { x: 20, y: 3 }, story: 'Violet split banners frame the prediction platform.' },
      { id: 'apex-chalk', kind: 'chalk-mark', position: { x: 20, y: 17 }, story: 'Footwork arcs record efficient pivots.' },
    ],
    lights: [
      { id: 'apex-focus-light', x: 12, y: 4, width: 16, height: 14, color: '#c6a9ff', alpha: 0.09 },
    ],
  },
  {
    locationId: 'glory-gym',
    zoneId: 'higher-3',
    name: 'Glory Gym',
    palette: PALETTES.glory,
    npcName: 'Summit Steward Ori',
    npcCharacterId: 'character-summit-steward-ori',
    npcMessage: 'Ori: Glory belongs to balanced teams that still have something left.',
    boardMessage: 'GLORY GYM: Power, Technique, Endurance, Mobility, Recovery.',
    doorXByConnectionId: {
      'champion-ascent': 10,
      'glory-lift-shortcut': 34,
    },
    props: [
      { id: 'glory-trophy-west', kind: 'trophy', position: { x: 5, y: 7 }, story: 'A plain cup honors the first team to finish without overtraining.' },
      { id: 'glory-trophy-east', kind: 'trophy', position: { x: 34, y: 7 }, story: 'A second cup remains empty for the next balanced champion.' },
      { id: 'glory-banner', kind: 'banner', position: { x: 20, y: 3 }, story: 'Five gold bands converge above the final platform.' },
    ],
    lights: [
      { id: 'glory-summit-light', x: 8, y: 2, width: 24, height: 17, color: '#fff0a8', alpha: 0.1 },
    ],
    recovery: {
      position: { x: 20, y: 19 },
      label: 'Champion Reset Bench',
      message: 'The summit reset bench is open before the final challenge.',
    },
  },
];

const ROUTE_SPECS: RouteMapSpec[] = [
  {
    connectionId: 'warm-up-path',
    palette: PALETTES.route1,
    obstacles: [
      { x: 13, y: 8, width: 4, height: 2 },
      { x: 34, y: 10, width: 4, height: 2 },
      { x: 22, y: 2, width: 2, height: 5 },
    ],
    props: [
      { id: 'route-1-planter', kind: 'planter', position: { x: 3, y: 4 }, story: 'Home Gym volunteers keep the first route green.' },
      { id: 'route-1-hydration', kind: 'hydration', position: { x: 47, y: 15 }, story: 'A low-pressure refill station marks the final turn.' },
      { id: 'route-1-chalk', kind: 'chalk-mark', position: { x: 25, y: 11 }, story: 'Chalk arrows teach the safe scouting loop.' },
    ],
    lights: [
      { id: 'route-1-sunrise', x: 0, y: 0, width: 20, height: 20, color: '#ffe99e', alpha: 0.06 },
    ],
    scoutName: 'Stride Scout Rin',
    scoutCharacterId: 'character-stride-scout-rin',
    scoutMessage: 'Rin: Pulse turf reacts to steady movement, not repeated tapping.',
  },
  {
    connectionId: 'starter-link-road',
    palette: PALETTES.route2,
    obstacles: [
      { x: 12, y: 2, width: 3, height: 5 },
      { x: 24, y: 11, width: 5, height: 2 },
      { x: 39, y: 6, width: 3, height: 5 },
    ],
    props: [
      { id: 'route-2-banner-west', kind: 'banner', position: { x: 8, y: 2 }, story: 'Blue flags mark controlled pacing intervals.' },
      { id: 'route-2-bench', kind: 'bench', position: { x: 27, y: 16 }, story: 'The bench faces a wall of recorded technique streaks.' },
      { id: 'route-2-light-post', kind: 'light-post', position: { x: 45, y: 4 }, story: 'Cool lamps make evening travel readable.' },
    ],
    lights: [
      { id: 'route-2-cool-lane', x: 17, y: 0, width: 18, height: 20, color: '#8fd7ff', alpha: 0.055 },
    ],
    scoutName: 'Form Marshal Kio',
    scoutCharacterId: 'character-form-marshal-kio',
    scoutMessage: 'Kio: Buddy signals here favor clean timing and longer holds.',
  },
  {
    connectionId: 'iron-gate-trail',
    palette: PALETTES.route3,
    obstacles: [
      { x: 10, y: 9, width: 5, height: 2 },
      { x: 22, y: 2, width: 3, height: 6 },
      { x: 37, y: 12, width: 5, height: 2 },
    ],
    props: [
      { id: 'route-3-chain-west', kind: 'chain-post', position: { x: 7, y: 4 }, story: 'Old gate chains show how far the trail predates Iron Gym.' },
      { id: 'route-3-plates', kind: 'plate-stack', position: { x: 44, y: 15 }, story: 'Weathered plates serve as trail markers.' },
      { id: 'route-3-light', kind: 'light-post', position: { x: 30, y: 3 }, story: 'Amber shelter lamps cut through the rust-colored dusk.' },
    ],
    lights: [
      { id: 'route-3-shelter-light', x: 23, y: 11, width: 12, height: 8, color: '#f7b276', alpha: 0.09 },
    ],
    scoutName: 'Trail Keeper Bo',
    scoutCharacterId: 'character-trail-keeper-bo',
    scoutMessage: 'Bo: The shelter is safe. Recover before the Iron Gate if fatigue is climbing.',
    recovery: {
      position: { x: 28, y: 16 },
      label: 'Iron Trail Shelter',
      message: 'The Iron Trail Shelter offers water, wraps, and a controlled reset.',
    },
  },
  {
    connectionId: 'forge-stretch',
    palette: PALETTES.route4,
    obstacles: [
      { x: 11, y: 3, width: 4, height: 5 },
      { x: 25, y: 10, width: 4, height: 3 },
      { x: 40, y: 4, width: 3, height: 6 },
    ],
    props: [
      { id: 'route-4-steam-west', kind: 'steam-vent', position: { x: 8, y: 15 }, story: 'Warm vents reveal the old forge channels below.' },
      { id: 'route-4-chain', kind: 'chain-post', position: { x: 32, y: 5 }, story: 'Polished chains guide travelers away from unstable stone.' },
      { id: 'route-4-steam-east', kind: 'steam-vent', position: { x: 46, y: 14 }, story: 'The final vent pulses in time with Apex Gym lights.' },
    ],
    lights: [
      { id: 'route-4-forge-glow', x: 0, y: 11, width: 52, height: 9, color: '#e78a58', alpha: 0.06 },
      { id: 'route-4-apex-glow', x: 36, y: 0, width: 16, height: 12, color: '#b491ff', alpha: 0.06 },
    ],
    scoutName: 'Forge Reader Sela',
    scoutCharacterId: 'character-forge-reader-sela',
    scoutMessage: 'Sela: Elite signals gather where violet light meets warm steam.',
  },
  {
    connectionId: 'champion-ascent',
    palette: PALETTES.route5,
    obstacles: [
      { x: 9, y: 4, width: 4, height: 6 },
      { x: 23, y: 12, width: 6, height: 2 },
      { x: 39, y: 3, width: 4, height: 6 },
    ],
    props: [
      { id: 'route-5-banner-west', kind: 'banner', position: { x: 6, y: 3 }, story: 'Gold banners show the five-discipline ascent order.' },
      { id: 'route-5-fan', kind: 'fan', position: { x: 33, y: 5 }, story: 'Altitude fans keep the exposed lane clear.' },
      { id: 'route-5-trophy-marker', kind: 'trophy', position: { x: 47, y: 15 }, story: 'A small trail cup marks the last safe switchback.' },
    ],
    lights: [
      { id: 'route-5-summit-light', x: 26, y: 0, width: 26, height: 20, color: '#fff0ac', alpha: 0.075 },
    ],
    scoutName: 'Summit Scout Ivo',
    scoutCharacterId: 'character-summit-scout-ivo',
    scoutMessage: 'Ivo: Rare summit turf is bright gold. Enter rested and expect champion pressure.',
    recovery: {
      position: { x: 18, y: 16 },
      label: 'Summit Recovery Camp',
      message: 'The Summit Recovery Camp offers one last controlled reset.',
    },
  },
];

const GYM_SPEC_BY_LOCATION = new Map(GYM_SPECS.map((spec) => [spec.locationId, spec]));

function createGymTransition(
  spec: GymMapSpec,
  connection: WorldJourneyConnection,
): OverworldTransition {
  const fromThisGym = connection.fromLocationId === spec.locationId;
  const targetLocationId = connection.viaLocationId
    ? connection.viaLocationId
    : fromThisGym
      ? connection.toLocationId
      : connection.fromLocationId;
  const targetGymSpec = GYM_SPEC_BY_LOCATION.get(targetLocationId);
  const targetDoorX = targetGymSpec?.doorXByConnectionId[connection.id];
  const targetPosition = connection.viaLocationId
    ? fromThisGym
      ? { x: 2, y: 10 }
      : { x: 49, y: 10 }
    : { x: targetDoorX ?? 20, y: 21 };

  return {
    id: `${spec.locationId}-via-${connection.id}`,
    connectionId: connection.id,
    kind: 'door',
    trigger: 'interact',
    position: { x: spec.doorXByConnectionId[connection.id], y: 22 },
    targetLocationId,
    targetPosition,
    targetFacing: connection.viaLocationId
      ? fromThisGym
        ? 'right'
        : 'left'
      : 'up',
    targetZoneId: connection.viaLocationId
      ? undefined
      : fromThisGym
        ? connection.toZoneId
        : connection.fromZoneId,
    routeName: connection.routeName,
    fatigueCost: connection.viaLocationId
      ? connection.travelFatigue / 2
      : connection.travelFatigue,
  };
}

function createGymMap(spec: GymMapSpec): OverworldMapConfig {
  const gym = getGymById(spec.zoneId);
  const connections = WORLD_JOURNEY_CONNECTIONS.filter(
    (connection) =>
      connection.fromLocationId === spec.locationId ||
      connection.toLocationId === spec.locationId,
  );
  const transitions = connections.map((connection) =>
    createGymTransition(spec, connection),
  );
  const machinePositions = [8, 15, 23, 30];
  const interactables: OverworldInteractable[] = [
    ...transitions.map((transition) => {
      const connection = getWorldJourneyConnection(transition.connectionId);
      return {
        id: `${transition.id}-door`,
        kind: 'door' as const,
        position: transition.position,
        blocksMovement: true,
        label: `${connection.routeName} exit`,
        message: `${connection.routeName}: ${connection.preview} Fatigue ${connection.travelFatigue.toFixed(2)} · difficulty ${connection.difficultyRank}/5 · ${connection.rewardQuality} rewards.`,
        transitionId: transition.id,
      };
    }),
    ...gym.machines.map((machine, index) => ({
      id: `${spec.locationId}-machine-${machine.id}`,
      kind: 'machine' as const,
      position: { x: machinePositions[index], y: 10 },
      footprint: { x: machinePositions[index], y: 10, width: 2, height: 2 },
      blocksMovement: true,
      label: machine.name,
      message: `${machine.name} selected. ${machine.detail}`,
      machineId: machine.id,
    })),
    {
      id: `${spec.locationId}-npc`,
      kind: 'npc',
      position: { x: 5, y: 18 },
      blocksMovement: true,
      label: spec.npcName,
      message: spec.npcMessage,
      characterId: spec.npcCharacterId,
    },
    {
      id: `${spec.locationId}-board`,
      kind: 'sign',
      position: { x: 35, y: 19 },
      blocksMovement: true,
      label: `${spec.name} board`,
      message: spec.boardMessage,
    },
  ];
  if (spec.recovery) {
    interactables.push({
      id: `${spec.locationId}-recovery`,
      kind: 'recovery',
      position: spec.recovery.position,
      blocksMovement: true,
      label: spec.recovery.label,
      message: spec.recovery.message,
    });
  }

  return {
    id: spec.locationId,
    name: spec.name,
    zoneId: spec.zoneId,
    kind: 'gym',
    width: 40,
    height: 24,
    tileSize: OVERWORLD_TILE_SIZE,
    defaultSpawn: { x: 20, y: 20 },
    floorStyle: 'gym-grid',
    palette: spec.palette,
    collisionRects: [
      { x: 0, y: 0, width: 40, height: 1 },
      { x: 0, y: 23, width: 40, height: 1 },
      { x: 0, y: 0, width: 1, height: 24 },
      { x: 39, y: 0, width: 1, height: 24 },
      { x: 4, y: 4, width: 10, height: 2 },
      { x: 26, y: 4, width: 10, height: 2 },
      { x: 16, y: 2, width: 8, height: 2 },
    ],
    interactables,
    transitions,
    encounterAreas: [],
    props: spec.props,
    lights: spec.lights,
  };
}

function createRouteMap(spec: RouteMapSpec): OverworldMapConfig {
  const connection = getWorldJourneyConnection(spec.connectionId);
  if (!connection.viaLocationId) {
    throw new Error(`Route spec "${spec.connectionId}" does not reference a route location.`);
  }
  const fromGymSpec = GYM_SPEC_BY_LOCATION.get(connection.fromLocationId);
  const toGymSpec = GYM_SPEC_BY_LOCATION.get(connection.toLocationId);
  const routeIndex = connection.difficultyRank;
  const interactables: OverworldInteractable[] = [
    {
      id: `${connection.viaLocationId}-preview-sign`,
      kind: 'sign',
      position: { x: 6, y: 8 },
      blocksMovement: true,
      label: `${connection.routeName} travel sign`,
      message: `${connection.routeName}: fatigue ${connection.travelFatigue.toFixed(2)} · difficulty ${routeIndex}/5 · ${connection.rewardQuality} rewards. ${connection.preview}`,
    },
    {
      id: `${connection.viaLocationId}-scout`,
      kind: 'npc',
      position: { x: 26, y: 9 },
      blocksMovement: true,
      label: spec.scoutName,
      message: spec.scoutMessage,
      characterId: spec.scoutCharacterId,
    },
  ];
  if (spec.recovery) {
    interactables.push({
      id: `${connection.viaLocationId}-recovery`,
      kind: 'recovery',
      position: spec.recovery.position,
      blocksMovement: true,
      label: spec.recovery.label,
      message: spec.recovery.message,
    });
  }

  return {
    id: connection.viaLocationId,
    name: `Route ${routeIndex} · ${connection.routeName}`,
    zoneId: null,
    kind: 'route',
    width: 52,
    height: 20,
    tileSize: OVERWORLD_TILE_SIZE,
    defaultSpawn: { x: 2, y: 10 },
    floorStyle: 'route-lane',
    palette: spec.palette,
    collisionRects: [
      { x: 0, y: 0, width: 52, height: 1 },
      { x: 0, y: 19, width: 52, height: 1 },
      { x: 0, y: 0, width: 1, height: 10 },
      { x: 0, y: 11, width: 1, height: 9 },
      { x: 51, y: 0, width: 1, height: 10 },
      { x: 51, y: 11, width: 1, height: 9 },
      ...spec.obstacles,
    ],
    interactables,
    transitions: [
      {
        id: `${connection.viaLocationId}-to-${connection.fromLocationId}`,
        connectionId: connection.id,
        kind: 'route-exit',
        trigger: 'step',
        position: { x: 0, y: 10 },
        targetLocationId: connection.fromLocationId,
        targetPosition: {
          x: fromGymSpec?.doorXByConnectionId[connection.id] ?? 10,
          y: 21,
        },
        targetFacing: 'up',
        targetZoneId: connection.fromZoneId,
        routeName: connection.routeName,
        fatigueCost: connection.travelFatigue / 2,
      },
      {
        id: `${connection.viaLocationId}-to-${connection.toLocationId}`,
        connectionId: connection.id,
        kind: 'route-exit',
        trigger: 'step',
        position: { x: 51, y: 10 },
        targetLocationId: connection.toLocationId,
        targetPosition: {
          x: toGymSpec?.doorXByConnectionId[connection.id] ?? 30,
          y: 21,
        },
        targetFacing: 'up',
        targetZoneId: connection.toZoneId,
        routeName: connection.routeName,
        fatigueCost: connection.travelFatigue / 2,
      },
    ],
    encounterAreas: [
      {
        id: `${connection.viaLocationId}-pulse-turf-west`,
        x: 8,
        y: 3,
        width: 11,
        height: 5,
        gymId: connection.toZoneId as Exclude<GymZoneId, 'home'>,
        routeName: `${connection.routeName} Pulse Turf`,
        encounterBoost: connection.encounterBoost,
        rarity: 'standard',
        rewardQuality: connection.rewardQuality,
      },
      {
        id: `${connection.viaLocationId}-pulse-turf-east`,
        x: 31,
        y: 13,
        width: 11,
        height: 5,
        gymId: connection.toZoneId as Exclude<GymZoneId, 'home'>,
        routeName: `${connection.routeName} Pulse Turf`,
        encounterBoost: connection.encounterBoost,
        rarity: 'standard',
        rewardQuality: connection.rewardQuality,
      },
      {
        id: `${connection.viaLocationId}-rare-signal`,
        x: 44,
        y: 2,
        width: 5,
        height: 4,
        gymId: connection.toZoneId as Exclude<GymZoneId, 'home'>,
        routeName: `${connection.routeName} Rare Signal`,
        encounterBoost: connection.encounterBoost + 0.08,
        rarity: 'rare',
        rewardQuality: connection.rewardQuality,
      },
    ],
    props: spec.props,
    lights: spec.lights,
  };
}

export const OVERWORLD_MAPS: OverworldMapConfig[] = [
  ...GYM_SPECS.map(createGymMap),
  ...ROUTE_SPECS.map(createRouteMap),
];

export const OVERWORLD_MAP_BY_ID = new Map(
  OVERWORLD_MAPS.map((map) => [map.id, map]),
);

export function getOverworldMap(locationId: OverworldLocationId) {
  const map = OVERWORLD_MAP_BY_ID.get(locationId);
  if (!map) throw new Error(`Unknown overworld location "${locationId}".`);
  return map;
}

export function isPositionInRect(
  position: { x: number; y: number },
  rect: OverworldTileRect,
) {
  return (
    position.x >= rect.x &&
    position.x < rect.x + rect.width &&
    position.y >= rect.y &&
    position.y < rect.y + rect.height
  );
}

export function locationIdForZone(zoneId: string): OverworldLocationId | null {
  return GYM_SPECS.find((spec) => spec.zoneId === zoneId)?.locationId ?? null;
}

export function validateOverworldMaps() {
  const issues = [...validateWorldJourneyGraph()];
  const mapIds = new Set<string>();
  const machineIds = new Set(ALL_TRAINING_MACHINES.map((machine) => machine.id));
  const authoredIds = new Set<string>();

  OVERWORLD_MAPS.forEach((map) => {
    if (mapIds.has(map.id)) issues.push(`Duplicate overworld map id "${map.id}".`);
    mapIds.add(map.id);
    const inBounds = (position: { x: number; y: number }) =>
      position.x >= 0 &&
      position.y >= 0 &&
      position.x < map.width &&
      position.y < map.height;
    const blocked = (position: { x: number; y: number }) =>
      map.collisionRects.some((rect) => isPositionInRect(position, rect)) ||
      map.interactables.some(
        (interactable) =>
          interactable.blocksMovement &&
          isPositionInRect(
            position,
            interactable.footprint ?? {
              ...interactable.position,
              width: 1,
              height: 1,
            },
          ),
      );
    const recordId = (id: string, kind: string) => {
      if (authoredIds.has(id)) issues.push(`Duplicate ${kind} id "${id}".`);
      authoredIds.add(id);
    };

    if (!inBounds(map.defaultSpawn) || blocked(map.defaultSpawn)) {
      issues.push(`Map "${map.id}" has an invalid default spawn.`);
    }

    map.interactables.forEach((interactable) => {
      recordId(interactable.id, 'authored');
      if (!inBounds(interactable.position)) {
        issues.push(`Interactable "${interactable.id}" is outside map "${map.id}".`);
      }
      if (interactable.machineId && !machineIds.has(interactable.machineId)) {
        issues.push(
          `Interactable "${interactable.id}" references unknown machine "${interactable.machineId}".`,
        );
      }
      if (
        interactable.transitionId &&
        !map.transitions.some((transition) => transition.id === interactable.transitionId)
      ) {
        issues.push(
          `Interactable "${interactable.id}" references unknown transition "${interactable.transitionId}".`,
        );
      }
    });

    map.transitions.forEach((transition) => {
      recordId(transition.id, 'transition');
      const targetMap = OVERWORLD_MAP_BY_ID.get(transition.targetLocationId);
      if (!targetMap) {
        issues.push(
          `Transition "${transition.id}" references unknown map "${transition.targetLocationId}".`,
        );
        return;
      }
      if (!WORLD_JOURNEY_CONNECTIONS.some(({ id }) => id === transition.connectionId)) {
        issues.push(
          `Transition "${transition.id}" references unknown connection "${transition.connectionId}".`,
        );
      }
      if (!inBounds(transition.position)) {
        issues.push(`Transition "${transition.id}" starts outside map "${map.id}".`);
      }
      if (
        transition.targetPosition.x < 0 ||
        transition.targetPosition.y < 0 ||
        transition.targetPosition.x >= targetMap.width ||
        transition.targetPosition.y >= targetMap.height
      ) {
        issues.push(
          `Transition "${transition.id}" targets an invalid tile in "${targetMap.id}".`,
        );
      }
      if (transition.trigger === 'step' && blocked(transition.position)) {
        issues.push(`Step transition "${transition.id}" is blocked.`);
      }
    });

    map.encounterAreas.forEach((area) => {
      recordId(area.id, 'encounter area');
      if (
        area.x < 0 ||
        area.y < 0 ||
        area.x + area.width > map.width ||
        area.y + area.height > map.height
      ) {
        issues.push(`Encounter area "${area.id}" exceeds map "${map.id}".`);
      }
    });

    map.props.forEach((prop) => {
      recordId(prop.id, 'prop');
      if (!inBounds(prop.position)) {
        issues.push(`Prop "${prop.id}" is outside map "${map.id}".`);
      }
    });
    map.lights.forEach((light) => {
      recordId(light.id, 'light');
      if (
        light.x < 0 ||
        light.y < 0 ||
        light.x + light.width > map.width ||
        light.y + light.height > map.height
      ) {
        issues.push(`Light "${light.id}" exceeds map "${map.id}".`);
      }
    });
  });

  WORLD_JOURNEY_CONNECTIONS.forEach((connection) => {
    const representedBy = OVERWORLD_MAPS.flatMap((map) =>
      map.transitions.filter((transition) => transition.connectionId === connection.id),
    );
    const expectedTransitionCount = connection.viaLocationId ? 4 : 2;
    if (representedBy.length !== expectedTransitionCount) {
      issues.push(
        `World connection "${connection.id}" has ${representedBy.length}/${expectedTransitionCount} transitions.`,
      );
    }
  });

  const routeMaps = OVERWORLD_MAPS.filter((map) => map.kind === 'route');
  if (routeMaps.length !== 5) issues.push('The journey must contain exactly five route maps.');
  routeMaps.forEach((map) => {
    if (!map.encounterAreas.some((area) => area.rarity === 'rare')) {
      issues.push(`Route "${map.id}" has no rare encounter area.`);
    }
  });

  return issues;
}

export function assertOverworldMapsValid() {
  const issues = validateOverworldMaps();
  if (issues.length > 0) {
    throw new Error(
      `Overworld map validation failed:\n${issues.map((issue) => `- ${issue}`).join('\n')}`,
    );
  }
}

if (import.meta.env?.DEV) {
  assertOverworldMapsValid();
}
