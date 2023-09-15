import { v2, v4 } from "./math_types";
import { BlockLayout } from "../pixelbasher-api/pixelbasher-api";

export const Buttons = {
  MOVE_LEFT: 0,
  MOVE_RIGHT: 1,
  RELEASE_BALL: 2,
  PAUSE: 3,
} as const;

export type Buttons = (typeof Buttons)[keyof typeof Buttons];

export const MeshId = {
  PLAYER: 0,
  BLOCK: 1,
  PARTICLE: 2,
  BALL: 3,
} as const;

export type MeshId = (typeof MeshId)[keyof typeof MeshId];

export const SoundId = {
  HIT: 0,
  MUSIC: 1,
} as const;

export type SoundId = (typeof SoundId)[keyof typeof SoundId];

export type ButtonState = {
  isDown: boolean;
  changed: boolean;
};

export type GameInput = {
  deltaTime: number;
  mouseX: number;
  mouseY: number;
  buttons: ButtonState[];
};

export type GameState = {
  isInitialized: boolean;
  isGameOver: boolean;
  isPaused: boolean;

  remainingTime: number;
  score: number;

  playerCount: number;
  player: Player;

  blockCount: number;
  blocks: Block[];

  ballCount: number;
  balls: Ball[];

  playerSpeed: number;

  trailEmitter: ParticleEmitter;

  meshes: Mesh[];
  sounds: Sound[];
  layout: BlockLayout | null;

  currentSound: number;
  maxSounds: number;
  soundQueue: QueuedSound[];

  setPause: () => void;
  setGameOver: () => void;
};

export type Mesh = {
  vertexData: Float32Array;
  indexData: Uint32Array;
};

export type Player = {
  color: v4;
  position: v2;
  velocity: v2;
  meshId: MeshId;
};

export type Block = {
  color: v4;
  position: v2;
  hp: number;
  meshId: MeshId;
};

export type Ball = {
  isReleased: boolean;
  combo: number;
  color: v4;
  position: v2;
  velocity: v2;
  meshId: MeshId;
};

export type ParticleEmitter = {
  isPaused: boolean;
  count: number;
  maxCount: number;
  color: v4;
  position: v2;
  rate: number;
  timeElapsed: number;
  meshId: MeshId;
  particles: Particle[];
};

export type Particle = {
  color: v4;
  position: v2;
  velocity: v2;
  currentLifeTime: number;
  lifeTime: number;
};

export type Hit = {
  isHit: boolean;
  hitTime: number;
  hitPosition: v2;
  hitNormal: v2;
};

export type SoundBuffer = {
  sampleCount: number;
  samples: Float32Array;
};

export type Sound = {
  sampleCount: number;
  channelCount: number;
  samples: Float32Array[];
};

export type QueuedSound = {
  soundId: SoundId;
  samplesRead: number;
  sampleCount: number;
  isLooping: boolean;
  isActive: boolean;
};
