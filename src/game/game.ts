import { Buttons, ButtonState, GameInput, GameState } from "./game_types";

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

export const gameUpdate = (state: GameState, input: GameInput) => {
  //   if (isButtonPressed(input.buttons[Buttons.MOVE_LEFT])) {
  //     console.log("left pressed");
  //   }

  if (isButtonDown(input.buttons[Buttons.MOVE_LEFT])) {
    //console.log("left down");
    state.playerPosition.x -= 10 * input.deltaTime;
  }

  if (isButtonDown(input.buttons[Buttons.MOVE_RIGHT])) {
    //console.log("left down");
    state.playerPosition.x += 10 * input.deltaTime;
  }

  //   if (isButtonReleased(input.buttons[Buttons.MOVE_LEFT])) {
  //     console.log("left up");
  //   }
};
