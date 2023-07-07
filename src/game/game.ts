import { Buttons, ButtonState, GameInput, GameState } from "./game_types";
import { pushObject } from "./renderer";
import { RendererCommands } from "./renderer_types";

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

  //pushRenderGroup(commands, 1, state.blockPositions.length, state.assets);
};
