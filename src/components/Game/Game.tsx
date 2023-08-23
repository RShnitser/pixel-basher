import { useRef, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Buttons,
  ButtonState,
  GameInput,
  GameState,
  MeshId,
} from "../../game/game_types";
import {
  createCircle,
  createRectangle,
  gameInit,
  gameUpdate,
} from "../../game/game";
import { initWebGPU, beginRender, endRender } from "../../game/renderer";
import { RendererCommands } from "../../game/renderer_types";
import { WebGPU } from "../../game/renderer_types";
import { V2, V4 } from "../../game/math";
import { fillSoundBuffer, initAudio, Audio, loadSound } from "../../game/audio";
import "./Game.css";
import Modal from "../Modal/Modal";
import { useGame } from "../../providers/GameProvider";

// const PauseModal = () => {
//   return (
//     <>
//       <h2>Paused</h2>
//       <button type="button">Resume</button>
//     </>
//   );
// };

// const GameOverModal = () => {
//   return (
//     <>
//       <h2>Game Over</h2>
//       <div>Score</div>
//       <button type="button">Main Menu</button>
//     </>
//   );
// };

const Game = () => {
  //const [score, setScore] = useState(0);
  //const [time, setTime] = useState(0);
  const { layouts, selectedLayout } = useGame();
  const navigate = useNavigate();
  const [pause, setPause] = useState(false);
  const [gameOver, setGameOver] = useState(false);

  const textRef = useRef<HTMLCanvasElement | null>(null);
  const textContext = useRef<CanvasRenderingContext2D | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  //const canvasRect = useRef<DOMRect>({height: 0, width: 0, x: 0, y: 0, left: 0, bottom: 0, right: 0, top: 0});
  const webGPU = useRef<WebGPU | null>(null);
  const audio = useRef<Audio>(initAudio());
  const updateId = useRef<number | null>(null);
  const prevTime = useRef<number>(0);
  const gameInput = useRef<GameInput>({
    mouseX: 0,
    mouseY: 0,
    deltaTime: 16,
    buttons: Array.from({ length: 4 }, () => ({
      isDown: false,
      changed: false,
    })),
  });
  const gameState = useRef<GameState>({
    isInitialized: false,
    isGameOver: false,
    isPaused: false,
    score: 0,
    remainingTime: 120,
    playerCount: 1,
    //playerPosition: { x: 400, y: 550 },
    player: {
      position: { x: 400, y: 20 },
      velocity: { x: 0, y: 0 },
      color: { x: 0, y: 0, z: 1, w: 1 },
      meshId: MeshId.PLAYER,
    },
    blockCount: 0,
    // blockPositions: [
    //   { x: 100, y: 100 },
    //   { x: 200, y: 100 },
    //   { x: 300, y: 100 },
    //   { x: 400, y: 100 },
    //   { x: 500, y: 100 },
    //   { x: 600, y: 100 },
    //   { x: 700, y: 100 },
    //   { x: 100, y: 200 },
    //   { x: 200, y: 200 },
    //   { x: 300, y: 200 },
    //   { x: 400, y: 200 },
    // ],
    blocks: Array.from({ length: 8 * 6 }, (block, index) => ({
      meshId: MeshId.BLOCK,
      hp: 0,
      color: { x: 0, y: 0, z: (index + 1) / (8 * 6), w: 1 },
      position: {
        x: ((index * 100) % 800) + 50,
        y: 600 - Math.floor(index / 8) * 40 - 20,
      },
      //velocity: V2(0, -10),
    })),
    //blocks: [],
    ballCount: 3,
    balls: Array.from({ length: 3 }, () => ({
      isReleased: false,
      combo: 0,
      meshId: MeshId.BALL,
      color: { x: 1, y: 1, z: 1, w: 1 },
      position: { x: 0, y: 0 },
      velocity: { x: 0, y: 0 },
    })),
    //ballPosition: { x: 0, y: 100 },
    //ballVelocity: { x: 0, y: 0 },
    //isBallReleased: false,
    playerSpeed: 600,

    trailEmitter: {
      isPaused: false,
      count: 0,
      maxCount: 64,
      position: V2(0, 0),
      color: V4(1, 1, 1, 1),
      rate: 0,
      timeElapsed: 0,
      meshId: MeshId.PARTICLE,
      particles: Array.from({ length: 64 }, () => ({
        position: V2(0, 0),
        velocity: V2(0, 0),
        color: V4(0, 0, 0, 0),
        currentLifeTime: 0,
        lifeTime: 0,
      })),
    },

    meshes: [
      // {
      //   vertexData: new Float32Array([0, 0, 30, 0, 0, 30, 30, 30]),
      //   indexData: new Uint32Array([0, 1, 2, 1, 3, 2]),
      // },
      createRectangle(100, 20),
      // {
      //   vertexData: new Float32Array([0, 0, 90, 0, 0, 30, 90, 30]),
      //   indexData: new Uint32Array([0, 1, 2, 1, 3, 2]),
      // },
      createRectangle(100, 40),
      createRectangle(10, 10),
      createCircle(10, 8),
      //createCircle(30, 30),
    ],
    sounds: [],
    layout: null,
    // layouts: [
    // ],

    currentSound: 0,
    maxSounds: 16,
    soundQueue: Array.from({ length: 16 }, () => ({
      soundId: 0,
      samplesRead: 0,
      sampleCount: 0,
      isLooping: false,
      isActive: false,
    })),

    setPause: () => {
      setPause(gameState.current.isPaused);
    },
    setGameOver: () => {
      setGameOver(gameState.current.isGameOver);
    },

    //soundHead: null,
    //soundFreeHead: null,
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
    commands: Array.from({ length: 512 }, () => ({
      objectId: 0,
      //count: 0,
      vertexBuffer: new Float32Array([]),
      indexBuffer: new Uint32Array([]),
      position: { x: 0, y: 0 },
      color: { x: 0, y: 0, z: 0, w: 0 },
    })),
  });

  const processKeyboard = (key: string, isDown: boolean) => {
    if (key === "ArrowLeft") {
      processInputState(gameInput.current.buttons[Buttons.MOVE_LEFT], isDown);
    }

    if (key === "ArrowRight") {
      processInputState(gameInput.current.buttons[Buttons.MOVE_RIGHT], isDown);
    }

    if (key === " ") {
      processInputState(
        gameInput.current.buttons[Buttons.RELEASE_BALL],
        isDown
      );
    }

    if (key === "Escape") {
      processInputState(gameInput.current.buttons[Buttons.PAUSE], isDown);
    }
  };

  const processInputState = (button: ButtonState, isDown: boolean) => {
    if (button.isDown !== isDown) {
      button.isDown = isDown;
      button.changed = true;
    }
  };

  const processMouse = (button: number, isDown: boolean) => {
    if (button === 0) {
      processInputState(
        gameInput.current.buttons[Buttons.RELEASE_BALL],
        isDown
      );
    }
  };

  const handleKeyUp = (e: KeyboardEvent) => {
    const key = e.key;
    processKeyboard(key, false);
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    const key = e.key;
    processKeyboard(key, true);
  };

  const handleMouseUp = (e: MouseEvent) => {
    const button = e.button;
    processMouse(button, false);
  };

  const handleMouseDown = (e: MouseEvent) => {
    const button = e.button;
    processMouse(button, true);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (canvasRef.current !== null) {
      const rect = canvasRef.current.getBoundingClientRect();
      gameInput.current.mouseX = e.clientX - rect.left;
      gameInput.current.mouseY = 600 - (e.clientY - rect.top);
      //console.log(gameInput.current.mouseY);
    }
  };

  const update = () => {
    const now = performance.now();

    if (webGPU.current) {
      gameInput.current.deltaTime = (now - prevTime.current) * 0.001;

      beginRender(webGPU.current);
      //audio.current.startTime = audio.current.context.currentTime;
      const targetSamples = audio.current.context.sampleRate / 15;
      //console.log(audio.current.context.currentTime, audio.current.endTime);
      //console.log(audio.current.endTime - audio.current.startTime);
      let samplesInQueue = Math.ceil(
        (audio.current.endTime - audio.current.context.currentTime) *
          audio.current.context.sampleRate
      );
      if (samplesInQueue < 0) {
        samplesInQueue = 0;
        audio.current.endTime = audio.current.context.currentTime;
      }
      const samplesToWrite = targetSamples - samplesInQueue;
      // if (samplesToWrite <= 0) {
      //   samplesToWrite = 0;
      // }
      //console.log(audio.current.startTime, audio.current.endTime);
      //console.log(samplesToWrite);
      audio.current.samples.sampleCount = samplesToWrite;
      gameUpdate(
        gameState.current,
        gameInput.current,
        commands.current,
        audio.current.samples
        //audio.current.context
      );
      fillSoundBuffer(audio.current);
      endRender(webGPU.current, commands.current);
      //render(webGPU.current);

      for (let i = 0; i < gameInput.current.buttons.length; i++) {
        gameInput.current.buttons[i].changed = false;
      }
    }

    //setTime(gameState.current.remainingTime);
    //setScore(gameState.current.score);
    if (textContext.current !== null) {
      //textContext.current.font = "18px sans-serif";
      textContext.current.clearRect(0, 0, 800, 40);
      textContext.current.fillText(gameState.current.score.toString(), 5, 1);
      textContext.current.fillText(
        gameState.current.remainingTime.toFixed(2),
        700,
        1
      );
      //textContext.current.fillText("text", 20, 40);
    }

    prevTime.current = now;
    updateId.current = requestAnimationFrame(update);
  };

  const cleanUp = () => {
    window.removeEventListener("keydown", handleKeyDown);
    window.removeEventListener("keyup", handleKeyUp);
    window.removeEventListener("mousemove", handleMouseMove);
    window.removeEventListener("mousedown", handleMouseDown);
    window.removeEventListener("mouseup", handleMouseUp);
    console.log(updateId.current);
    if (updateId.current !== null) {
      console.log("cancel");
      cancelAnimationFrame(updateId.current);
      updateId.current = null;
    }
  };

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    window.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("mouseup", handleMouseUp);
    window.addEventListener("mousemove", handleMouseMove);

    const loadData = async () => {
      //if (!webGPU.current) {

      const sound1 = await loadSound(audio.current.context, "sound1.wav");
      const sound2 = await loadSound(audio.current.context, "music1.mp3");
      gameState.current.sounds.push(sound1);
      gameState.current.sounds.push(sound2);
      webGPU.current = await initWebGPU(
        canvasRef.current,
        gameState.current.meshes
      );
      //if (!gameState.current.isInitialized) {
      gameState.current.layout = layouts[selectedLayout];
      gameInit(gameState.current);

      if (textRef.current !== null) {
        textContext.current = textRef.current.getContext("2d");
        if (textContext.current) {
          textContext.current.fillStyle = "black";
          textContext.current.textBaseline = "hanging";
          textContext.current.font = "18px sans-serif";
        }
      }
      //gameState.current.isInitialized = true;
      //}
      //}
      if (!updateId.current) {
        prevTime.current = performance.now();
        updateId.current = requestAnimationFrame(update);
      }
    };

    if (!gameState.current.isInitialized) {
      loadData();
      gameState.current.isInitialized = true;
    }

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("mouseup", handleMouseUp);
      if (updateId.current) {
        cancelAnimationFrame(updateId.current);
        updateId.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const mainMenu = () => {
    //audio.current.context.close();

    cleanUp();
    navigate("/");
  };

  const resumeGame = () => {
    gameState.current.isPaused = false;
    setPause(false);
  };

  return (
    // <>
    <div className="canvas-container">
      <Modal isOpen={pause}>
        <div>Pause</div>
        <button type="button" onClick={resumeGame}>
          Resume
        </button>
        <button type="button" onClick={mainMenu}>
          Quit
        </button>
      </Modal>
      <Modal isOpen={gameOver}>
        <div>Score</div>
        <div>{gameState.current.score}</div>
        <button type="button" onClick={mainMenu}>
          Quit
        </button>
      </Modal>
      <canvas
        className="text-canvas"
        width={800}
        height={20}
        ref={textRef}
      ></canvas>
      <canvas
        className="game-canvas"
        width={800}
        height={600}
        ref={canvasRef}
      ></canvas>
    </div>
    // {/* </> */}
  );
};

export default Game;
