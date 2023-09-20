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
  createParticleEmitter,
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
import useAudio from "../../providers/AudioProvider";
import {
  BALL_RADIUS,
  BLOCK_HEIGHT,
  BLOCK_WIDTH,
  MAX_BALLS,
  MAX_BLOCKS,
  MAX_COMMANDS,
  MAX_PARTICLES,
  MAX_SOUNDS,
  PARTICLE_SIZE,
  PLAYER_HEIGHT,
  PLAYER_WIDTH,
  SCREEN_HEIGHT,
  SCREEN_WIDTH,
  UI_HEIGHT,
} from "../../game/game_consts";

const AppState = {
  LOADING: 0,
  OK: 1,
  ERROR: 2,
} as const;

export type AppState = (typeof AppState)[keyof typeof AppState];

const Game = () => {
  const { layouts, selectedLayout, addScore } = useGame();
  const { play } = useAudio();
  const navigate = useNavigate();
  const [pause, setPause] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [appState, setAppState] = useState<AppState>(AppState.LOADING);

  const textRef = useRef<HTMLCanvasElement | null>(null);
  const textContext = useRef<CanvasRenderingContext2D | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
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

    player: {
      position: { x: 400, y: 20 },
      velocity: { x: 0, y: 0 },
      color: { x: 0, y: 0, z: 1, w: 1 },
      meshId: MeshId.PLAYER,
    },
    blocksRemaining: 0,

    blocks: Array.from({ length: MAX_BLOCKS }, () => ({
      meshId: MeshId.BLOCK,
      hp: 0,
      color: V4(0, 0, 0, 0),
      position: V2(0, 0),
    })),

    balls: Array.from({ length: MAX_BALLS }, () => ({
      isReleased: false,
      combo: 0,
      meshId: MeshId.BALL,
      color: V4(1, 1, 1, 1),
      position: V2(0, 0),
      velocity: V2(0, 0),
    })),

    emitter: createParticleEmitter(
      V4(1, 1, 1, 1),
      MAX_PARTICLES,
      MeshId.PARTICLE
    ),

    meshes: [
      createRectangle(PLAYER_WIDTH, PLAYER_HEIGHT),
      createRectangle(BLOCK_WIDTH, BLOCK_HEIGHT),
      createRectangle(PARTICLE_SIZE, PARTICLE_SIZE),
      createCircle(BALL_RADIUS, 8),
    ],
    sounds: [],
    layout: null,

    currentSound: 0,
    maxSounds: MAX_SOUNDS,
    soundQueue: Array.from({ length: MAX_SOUNDS }, () => ({
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
      addScore(gameState.current.score);
    },
  });
  const commands = useRef<RendererCommands>({
    count: 0,

    commands: Array.from({ length: MAX_COMMANDS }, () => ({
      objectId: 0,
      vertexBuffer: new Float32Array([]),
      indexBuffer: new Uint32Array([]),
      position: V2(0, 0),
      color: V4(0, 0, 0, 0),
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
      gameInput.current.mouseY = SCREEN_HEIGHT - (e.clientY - rect.top);
      //console.log(gameInput.current.mouseY);
    }
  };

  const update = () => {
    const now = performance.now();

    if (webGPU.current) {
      gameInput.current.deltaTime = (now - prevTime.current) * 0.001;

      beginRender(webGPU.current);

      const targetSamples = audio.current.context.sampleRate / 15;

      let samplesInQueue = Math.ceil(
        (audio.current.endTime - audio.current.context.currentTime) *
          audio.current.context.sampleRate
      );
      if (samplesInQueue < 0) {
        samplesInQueue = 0;
        audio.current.endTime = audio.current.context.currentTime;
      }
      const samplesToWrite = targetSamples - samplesInQueue;

      audio.current.samples.sampleCount = samplesToWrite;
      gameUpdate(
        gameState.current,
        gameInput.current,
        commands.current,
        audio.current.samples
      );
      fillSoundBuffer(audio.current);
      endRender(webGPU.current, commands.current);

      for (let i = 0; i < gameInput.current.buttons.length; i++) {
        gameInput.current.buttons[i].changed = false;
      }
    }

    if (textContext.current !== null) {
      const score = gameState.current.score.toString().padStart(6, "0");
      textContext.current.clearRect(0, 0, SCREEN_WIDTH, UI_HEIGHT);
      textContext.current.fillText(`Score: ${score}`, 20, 10);
      const time = gameState.current.remainingTime;

      const mins = Math.floor(time / 60);
      const secs = Math.floor(time - mins * 60);
      const ms = Math.floor((time - mins * 60 - secs) * 100);
      textContext.current.fillText(
        `Remaining Time: ${mins}:${secs.toString().padStart(2, "0")}:${ms
          .toString()
          .padStart(2, "0")}`,
        510,
        10
      );
      textContext.current.strokeStyle = "white";
      textContext.current.beginPath();
      textContext.current.moveTo(0, 57);
      textContext.current.lineTo(800, 57);
      textContext.current.lineWidth = 3;
      textContext.current.stroke();
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

    if (updateId.current !== null) {
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
      const sound1 = await loadSound(audio.current.context, "sound1.ogg");
      const sound2 = await loadSound(audio.current.context, "music1.mp3");

      gameState.current.sounds.push(sound1);
      gameState.current.sounds.push(sound2);

      webGPU.current = await initWebGPU(
        canvasRef.current,
        gameState.current.meshes
      );

      if (webGPU.current === null) {
        setAppState(AppState.ERROR);
        return;
      }

      gameState.current.layout = layouts[selectedLayout];
      gameInit(gameState.current);

      if (textRef.current !== null) {
        textContext.current = textRef.current.getContext("2d");
        if (textContext.current) {
          textContext.current.fillStyle = "white";
          textContext.current.textBaseline = "hanging";
          textContext.current.font = "18px Silkscreen";
        }
      }

      if (!updateId.current) {
        prevTime.current = performance.now();
        updateId.current = requestAnimationFrame(update);
      }

      setAppState(AppState.OK);
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
    cleanUp();
    play();
    navigate("/");
  };

  const scoreMenu = async () => {
    cleanUp();
    play();
    navigate("/score");
  };

  const resumeGame = () => {
    setPause(false);
    gameState.current.isPaused = false;
  };

  return (
    <div className="canvas-container ratio-wrapper">
      <Modal isOpen={appState === AppState.LOADING}>
        <div className="game-error ratio-wrapper">
          <div>Loading...</div>
        </div>
      </Modal>
      <Modal isOpen={appState === AppState.ERROR}>
        <div className="game-error ratio-wrapper">
          <div>Could not initialize WebGPU</div>
          <div>Please use a WebGPU enabled browser</div>
          <button className="button" type="button" onClick={mainMenu}>
            Main Menu
          </button>
        </div>
      </Modal>
      <Modal isOpen={pause}>
        <div className="modal-title">Pause</div>
        <button className="button" type="button" onClick={resumeGame}>
          Resume
        </button>
        <button className="button" type="button" onClick={mainMenu}>
          Quit
        </button>
      </Modal>
      <Modal isOpen={gameOver}>
        <div className="modal-title">Score</div>
        <div>{gameState.current.score}</div>
        <button className="button" type="button" onClick={scoreMenu}>
          Scores
        </button>
        <button className="button" type="button" onClick={mainMenu}>
          Main Menu
        </button>
      </Modal>
      <canvas
        className="text-canvas"
        width={SCREEN_WIDTH}
        height={UI_HEIGHT}
        ref={textRef}
      ></canvas>
      <canvas
        className="game-canvas"
        width={SCREEN_WIDTH}
        height={SCREEN_HEIGHT}
        ref={canvasRef}
      ></canvas>
    </div>
  );
};

export default Game;
