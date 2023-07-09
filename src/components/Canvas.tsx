import { useRef, useEffect } from "react";
import { Buttons, ButtonState, GameInput, GameState } from "../game/game_types";
import { createCircle, createRectangle, gameUpdate } from "../game/game";
import { initWebGPU, beginRender, endRender } from "../game/renderer";
import { RendererCommands, RendererCommand } from "../game/renderer_types";
import { WebGPU } from "../game/renderer_types";

const Canvas = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const webGPU = useRef<WebGPU | null>(null);
  const updateId = useRef<number | null>(null);
  const prevTime = useRef<number>(0);
  const gameInput = useRef<GameInput>({
    deltaTime: 16,
    buttons: [
      {
        isDown: false,
        changed: false,
      },
      {
        isDown: false,
        changed: false,
      },
    ],
  });
  const gameState = useRef<GameState>({
    playerCount: 1,
    playerPosition: { x: 0, y: 100 },
    blockCount: 10,
    blockPositions: [
      { x: 100, y: 100 },
      { x: 200, y: 100 },
      { x: 300, y: 100 },
      { x: 400, y: 100 },
      { x: 500, y: 100 },
      { x: 600, y: 100 },
      { x: 700, y: 100 },
      { x: 100, y: 200 },
      { x: 200, y: 200 },
      { x: 300, y: 200 },
      { x: 400, y: 200 },
    ],
    ballCount: 1,
    ballPosition: { x: 0, y: 100 },

    assets: [
      // {
      //   vertexData: new Float32Array([0, 0, 30, 0, 0, 30, 30, 30]),
      //   indexData: new Uint32Array([0, 1, 2, 1, 3, 2]),
      // },
      createRectangle(90, 30),
      {
        vertexData: new Float32Array([0, 0, 90, 0, 0, 30, 90, 30]),
        indexData: new Uint32Array([0, 1, 2, 1, 3, 2]),
      },
      createCircle(10, 8),
    ],
  });
  const commands = useRef<RendererCommands>({
    count: 0,
    // commands: Array<RendererCommand>(256).fill({
    //   objectId: 0,
    //   //count: 0,
    //   vertexBuffer: new Float32Array([]),
    //   indexBuffer: new Uint32Array([]),
    //   position: { x: 0, y: 0 },
    //   color: { x: 0, y: 0, z: 0, w: 0 },
    // }),
    commands: Array.from({ length: 256 }, () => ({
      objectId: 0,
      //count: 0,
      vertexBuffer: new Float32Array([]),
      indexBuffer: new Uint32Array([]),
      position: { x: 0, y: 0 },
      color: { x: 0, y: 0, z: 0, w: 0 },
    })),
  });

  const processInput = (key: string, isDown: boolean) => {
    if (key === "ArrowLeft") {
      processKeyboardState(
        gameInput.current.buttons[Buttons.MOVE_LEFT],
        isDown
      );
    }

    if (key === "ArrowRight") {
      processKeyboardState(
        gameInput.current.buttons[Buttons.MOVE_RIGHT],
        isDown
      );
    }
  };

  const processKeyboardState = (button: ButtonState, isDown: boolean) => {
    if (button.isDown !== isDown) {
      button.isDown = isDown;
      button.changed = true;
    }
  };

  const handleKeyUp = (e: KeyboardEvent) => {
    const key = e.key;
    processInput(key, false);
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    const key = e.key;
    processInput(key, true);
  };

  const update = () => {
    const now = performance.now();

    if (webGPU.current) {
      gameInput.current.deltaTime = (now - prevTime.current) * 0.001;

      beginRender(webGPU.current);
      gameUpdate(gameState.current, gameInput.current, commands.current);
      endRender(webGPU.current, commands.current);
      //render(webGPU.current);

      for (let i = 0; i < gameInput.current.buttons.length; i++) {
        gameInput.current.buttons[i].changed = false;
      }
    }

    prevTime.current = now;
    requestAnimationFrame(update);
  };

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    if (!webGPU.current) {
      Promise.resolve(
        initWebGPU(canvasRef.current, gameState.current.assets)
      ).then((value) => {
        webGPU.current = value;
      });
    }
    if (!updateId.current) {
      prevTime.current = performance.now();
      updateId.current = requestAnimationFrame(update);
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      if (updateId.current) {
        cancelAnimationFrame(updateId.current);
        updateId.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <canvas
        ref={canvasRef}
        style={{ width: "800px", height: "600px" }}
      ></canvas>
    </>
  );
};

export default Canvas;
