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
} as const;

export type MeshId = (typeof MeshId)[keyof typeof MeshId];

export type ButtonState = {
  isDown: boolean;
  changed: boolean;
};

export type GameInput = {
  deltaTime: number;
  buttons: ButtonState[];
};

export type GameState = {
  playerCount: number;
  player: Player;
  //playerPosition: v2;

  blockCount: number;
  blocks: Block[];
  //blockPositions: v2[];

  ballCount: number;
  ball: Ball;
  //ballPosition: v2;
  //ballVelocity: v2;

  isBallReleased: boolean;

  assets: GameAsset[];
};

export type GameAsset = {
  //color: Float32Array;
  vertexData: Float32Array;
  indexData: Uint32Array;
};

export type Player = {
  color: v4;
  position: v2;
  meshId: MeshId;
};

export type Block = {
  color: v4;
  position: v2;
  hp: number;
  meshId: MeshId;
};

export type Ball = {
  color: v4;
  position: v2;
  velocity: v2;
  meshId: MeshId;
};
