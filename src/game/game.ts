import {
  Buttons,
  ButtonState,
  GameAsset,
  GameInput,
  GameState,
} from "./game_types";
import { pushObject } from "./renderer";
import { RendererCommands } from "./renderer_types";

export const createRectangle = (width: number, height: number): GameAsset => {
  const hw = 0.5 * width;
  const hh = 0.5 * height;
  const vertexData = new Float32Array([-hw, -hh, -hw, hh, hw, hh, hw, -hh]);
  const indexData = new Uint32Array([0, 1, 2, 0, 2, 3]);

  return { vertexData, indexData };
};

export const createCircle = (radius: number, sides: number): GameAsset => {
  const vertexData = new Float32Array((sides + 1) * 2);
  const indexData = new Uint32Array(sides * 3);

  vertexData[0] = 0;
  vertexData[1] = 1;
  for (let i = 0; i < sides; i++) {
    const angle = (i * (Math.PI * 2)) / sides;
    const x = radius * Math.cos(angle);
    const y = radius * Math.sin(angle);
    //console.log(x, y);
    vertexData[2 + i * 2] = x;
    vertexData[3 + i * 2] = y;
  }

  for (let i = 0; i < sides - 1; i++) {
    indexData[i * 3] = i + 1;
    indexData[i * 3 + 1] = i + 2;
    indexData[i * 3 + 2] = 0;
  }
  indexData[(sides - 1) * 3] = sides - 1 + 1;
  indexData[(sides - 1) * 3 + 1] = 1;
  indexData[(sides - 1) * 3 + 2] = 0;

  return {
    vertexData,
    indexData,
  };
};

const isButtonDown = (button: ButtonState) => {
  const result = button.isDown;
  return result;
};

const isButtonPressed = (button: ButtonState) => {
  const result = button.isDown && button.changed;
  return result;
};

const isButtonReleased = (button: ButtonState) => {
  const result = !button.isDown && button.changed;
  return result;
};

export const gameUpdate = (
  state: GameState,
  input: GameInput,
  commands: RendererCommands
) => {
  //   if (isButtonPressed(input.buttons[Buttons.MOVE_LEFT])) {
  //     console.log("left pressed");
  //   }

  if (isButtonDown(input.buttons[Buttons.MOVE_LEFT])) {
    //console.log("left down");
    state.playerPosition.x -= 100 * input.deltaTime;
  }

  if (isButtonDown(input.buttons[Buttons.MOVE_RIGHT])) {
    //console.log("left down");
    state.playerPosition.x += 100 * input.deltaTime;
  }

  if (isButtonPressed(input.buttons[Buttons.RELEASE_BALL])) {
    console.log("click");
    if (!state.isBallReleased) {
      state.isBallReleased = true;
      state.ballVelocity.y = -100;
    }
  }

  if (state.isBallReleased) {
    state.ballPosition.x += state.ballVelocity.x * input.deltaTime;
    state.ballPosition.y += state.ballVelocity.y * input.deltaTime;
  } else {
    state.ballPosition.x = state.playerPosition.x;
    state.ballPosition.y = state.playerPosition.y - 20;
  }

  //   if (isButtonReleased(input.buttons[Buttons.MOVE_LEFT])) {
  //     console.log("left up");
  //   }

  pushObject(
    commands,
    0,
    state.playerPosition,
    { x: 0, y: 0, z: 1, w: 1 },
    state.assets
  );

  for (const position of state.blockPositions) {
    pushObject(commands, 1, position, { x: 0, y: 1, z: 0, w: 1 }, state.assets);
  }

  pushObject(
    commands,
    2,
    state.ballPosition,
    { x: 1, y: 1, z: 1, w: 1 },
    state.assets
  );

  //pushRenderGroup(commands, 1, state.blockPositions.length, state.assets);
};
