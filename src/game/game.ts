import {
  Buttons,
  ButtonState,
  GameAsset,
  GameInput,
  GameState,
} from "./game_types";
import { pushObject } from "./renderer";
import { RendererCommands } from "./renderer_types";
import { v2 } from "./math_types";

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

const checkCircleRectangleCollision = (
  cc: v2,
  cr: number,
  rc: v2,
  rw: number,
  rh: number
) => {
  let result = false;
  const left = rc.x - cr - rw * 0.5;
  const right = rc.x + cr + rw * 0.5;
  const top = rc.y - cr - rh * 0.5;
  const bottom = rc.y + cr + rh * 0.5;

  if (cc.x >= left && cc.x <= right && cc.y <= bottom && cc.y >= top) {
    result = true;
  }

  return result;
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
    state.player.position.x -= 100 * input.deltaTime;
  }

  if (isButtonDown(input.buttons[Buttons.MOVE_RIGHT])) {
    //console.log("left down");
    state.player.position.x += 100 * input.deltaTime;
  }

  if (isButtonPressed(input.buttons[Buttons.RELEASE_BALL])) {
    console.log("click");
    if (!state.isBallReleased) {
      state.isBallReleased = true;
      state.ball.velocity.y = -100;
    }
  }

  if (state.isBallReleased) {
    state.ball.position.x += state.ball.velocity.x * input.deltaTime;
    state.ball.position.y += state.ball.velocity.y * input.deltaTime;

    if (
      checkCircleRectangleCollision(
        state.ball.position,
        10,
        state.player.position,
        90,
        30
      )
    ) {
      state.ball.velocity.y *= -1;
    }
  } else {
    state.ball.position.x = state.player.position.x;
    state.ball.position.y = state.player.position.y - 25;
  }
  //   if (isButtonReleased(input.buttons[Buttons.MOVE_LEFT])) {
  //     console.log("left up");
  //   }

  pushObject(
    commands,
    state.player.meshId,
    state.player.position,
    state.player.color,
    state.assets
  );

  for (const block of state.blocks) {
    if (
      checkCircleRectangleCollision(
        state.ball.position,
        10,
        block.position,
        90,
        30
      )
    ) {
      state.ball.velocity.y *= -1;
    }

    pushObject(
      commands,
      block.meshId,
      block.position,
      block.color,
      state.assets
    );
  }

  pushObject(
    commands,
    state.ball.meshId,
    state.ball.position,
    state.ball.color,
    state.assets
  );

  //pushRenderGroup(commands, 1, state.blockPositions.length, state.assets);
};
