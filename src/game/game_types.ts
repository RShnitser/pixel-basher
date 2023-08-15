import { v2, v4 } from "./math_types";

export const Buttons = {
  MOVE_LEFT: 0,
  MOVE_RIGHT: 1,
  RELEASE_BALL: 2,
} as const;

export type Buttons = (typeof Buttons)[keyof typeof Buttons];

export const MeshId = {
  PLAYER: 0,
  BLOCK: 1,
  BALL: 2,
  PARTICLE: 3,
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

  remainingTime: number;
  score: number;

  playerCount: number;
  player: Player;
  //playerPosition: v2;

  blockCount: number;
  blocks: Block[];
  //blockPositions: v2[];

  ballCount: number;
  balls: Ball[];
  //ballPosition: v2;
  //ballVelocity: v2;

  //isBallReleased: boolean;
  playerSpeed: number;

  trailEmitter: ParticleEmitter;
  //testSampleIndex: number;

  meshes: Mesh[];
  sounds: Sound[];
  layouts: BlockLayout[];

  currentSound: number;
  maxSounds: number;
  soundQueue: QueuedSound[];

  //soundHead: QueuedSound | null;
  //soundFreeHead: QueuedSound | null;
};

export type Mesh = {
  //color: Float32Array;
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
  //velocity: v2;
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
  //meshId: MeshId;
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
  //next: QueuedSound | null;
};

export type BlockLayout = {
  data: Uint8Array;
};
