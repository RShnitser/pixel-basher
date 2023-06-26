export const Buttons = {
  MOVE_LEFT: 0,
  MOVE_RIGHT: 1,
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
};

export type v2 = {
  x: number;
  y: number;
};
