import { v2 } from "./math_types";

export const Buttons = {
  MOVE_LEFT: 0,
  MOVE_RIGHT: 1,
  RELEASE_BALL: 2,
} as const;

export type Buttons = (typeof Buttons)[keyof typeof Buttons];

export type ButtonState = {
  isDown: boolean;
  changed: boolean;
};

export type GameInput = {
  deltaTime: number;
  buttons: ButtonState[];
};

export type GameState = {
  playerPosition: v2;
  blockPositions: v2[];
  playerCount: number;
  blockCount: number;
  ballCount: number;
  ballPosition: v2;
  ballVelocity: v2;
  isBallReleased: boolean;

  assets: GameAsset[];
};

export type GameAsset = {
  //color: Float32Array;
  vertexData: Float32Array;
  indexData: Uint32Array;
};
