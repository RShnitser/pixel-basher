import {
  Buttons,
  ButtonState,
  Mesh,
  GameInput,
  GameState,
  MeshId,
  ParticleEmitter,
  SoundBuffer,
  SoundId,
} from "./game_types";
import { pushObject } from "./renderer";
import { RendererCommands } from "./renderer_types";
import { v2, v4 } from "./math_types";
import { mulV2, randomRange, reflectV2, V2, V4 } from "./math";
import { Hit } from "./game_types";
//import { playSound } from "./audio";

// const GetFileHeader = (a: number, b: number, c: number, d: number) => {
//   const result = a | (b << 8) | (c << 16) | (d << 24);
//   return result;
// };

// const FileHeader = {
//   RIFF: GetFileHeader(
//     "R".charCodeAt(0),
//     "I".charCodeAt(0),
//     "F".charCodeAt(0),
//     "F".charCodeAt(0)
//   ),
//   WAVE: GetFileHeader(
//     "W".charCodeAt(0),
//     "A".charCodeAt(0),
//     "V".charCodeAt(0),
//     "E".charCodeAt(0)
//   ),
// } as const;

// export const decodeWAV = (buffer: ArrayBuffer) => {
//   const dataView = new DataView(buffer);
//   const riffId = dataView.getUint32(4);
//   console.log(riffId);
//   console.log(buffer.byteLength);
//   //const waveId = new Uint32Array(buffer, 8, 1)[0];
//   //const fileSize = new Uint32Array(buffer, 4, 1)[0];
//   //console.log(riffId === FileHeader.RIFF);
// };

const comboScore = [
  1, 2, 2, 3, 3, 3, 4, 4, 4, 4, 5, 5, 5, 5, 5, 6, 6, 6, 6, 6, 6, 7, 7, 7, 7, 7,
  7, 7, 8, 8, 8, 8, 8, 8, 8, 8, 9, 9, 9, 9, 9, 9, 9, 9, 9, 10, 10, 10, 10, 10,
  10, 10, 10, 10, 10, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 12, 12, 12,
  12, 12, 12, 12, 12, 12, 12, 12, 12, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13,
  13, 13, 13, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 15, 15,
  15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15,
];
//const scoreLog = 1 / Math.log(1.5);
const getComboScore = (combo: number) => {
  //console.log(comboScore.length);
  if (combo > 120) {
    return 16;
  }
  //const result = Math.floor(scoreLog * Math.log(combo));
  const result = comboScore[combo];
  return result;
};

// function getBaseLog(x: number, y: number) {
//   return Math.log(y) / Math.log(x);
// }

const playSound = (state: GameState, id: SoundId, isLooping = false) => {
  //const queuedSound = state.soundQueue[state.currentSound];
  if (state.currentSound === state.maxSounds) {
    return;
  }

  const sound = state.sounds[id];
  for (let i = 0; i < state.maxSounds; i++) {
    const queuedSound = state.soundQueue[i];
    if (!queuedSound.isActive) {
      queuedSound.soundId = id;
      queuedSound.isLooping = isLooping;
      queuedSound.samplesRead = 0;
      queuedSound.sampleCount = sound.sampleCount;
      queuedSound.isActive = true;
      state.currentSound++;
      break;
    }
  }
};

const outputSound = (state: GameState, soundBuffer: SoundBuffer) => {
  let bufferIndex = 0;
  const channelCount = 2;

  for (let i = 0; i < soundBuffer.sampleCount; i++) {
    const sampleSums = Array.from({ length: channelCount }, () => 0);

    for (let s = 0; s < state.maxSounds; s++) {
      const queuedSound = state.soundQueue[s];
      //let queuedSound = state.soundHead;
      //while (queuedSound !== null) {
      //console.log(queuedSound);
      //const nextQueuedSound = queuedSound.next;
      if (queuedSound.isActive) {
        const sound = state.sounds[queuedSound.soundId];

        for (let c = 0; c < channelCount; c++) {
          const value = sound.samples[c][queuedSound.samplesRead];
          sampleSums[c] += value;
        }

        queuedSound.samplesRead++;
        if (queuedSound.samplesRead === queuedSound.sampleCount) {
          if (queuedSound.isLooping === true) {
            queuedSound.samplesRead = 0;
          } else {
            queuedSound.isActive = false;
            // if (s < state.currentSound - 1) {
            //   const temp = state.sounds[s];
            //   state.sounds[s] = state.sounds[state.currentSound - 1];
            //   state.sounds[state.currentSound - 1] = temp;
            //   s--;
            // }
            state.currentSound--;
            //queuedSound.next = state.soundFreeHead;
            //state.soundFreeHead = queuedSound;
          }
        }
      }
      //queuedSound = nextQueuedSound;
    }

    for (let c = 0; c < channelCount; c++) {
      soundBuffer.samples[bufferIndex + c] = sampleSums[c] * 0.5;
    }
    // state.testSampleIndex++;
    // if (state.testSampleIndex > sound.sampleCount) {
    //   state.testSampleIndex = 0;
    // }
    bufferIndex += channelCount;
  }

  //state.testSampleIndex += soundBuffer.sampleCount;
};

const createParticleEmitter = (
  color: v4,
  position: v2,
  maxCount: number,
  rate: number,
  meshId: MeshId
) => {
  const result: ParticleEmitter = {
    isPaused: false,
    color,
    maxCount,
    count: 0,
    position,
    rate,
    timeElapsed: 0,
    meshId,
    particles: Array.from({ length: maxCount }, () => ({
      color: V4(0, 0, 0, 0),
      position: V2(0, 0),
      velocity: V2(0, 0),
      currentLifeTime: 0,
      lifeTime: 0,
    })),
  };

  return result;
};

const emitParticle = (
  emitter: ParticleEmitter,
  lifeTime: number,
  velocity: v2,
  color: v4
) => {
  //emitter.timeElapsed += deltaTime;
  //if (emitter.timeElapsed > emitter.rate) {
  //emitter.timeElapsed = 0;

  if (!emitter.isPaused) {
    const particle = emitter.particles[emitter.count];
    //console.log(particle);
    particle.position.x = emitter.position.x;
    particle.position.y = emitter.position.y;
    particle.velocity.x = velocity.x;
    particle.velocity.y = velocity.y;
    particle.lifeTime = lifeTime;
    particle.currentLifeTime = lifeTime;
    particle.color.x = color.x;
    particle.color.y = color.y;
    particle.color.z = color.z;
    particle.color.w = color.w;

    emitter.count += 1;
    if (emitter.count > emitter.maxCount - 1) {
      emitter.count = 0;
    }
  }
  //}
};

const emitBurst = (
  emitter: ParticleEmitter,
  amount: number,
  lifeTime: number,
  color: v4
) => {
  for (let i = 0; i < amount; i++) {
    const vx = randomRange(-1, 1) * randomRange(100, 500);
    const vy = randomRange(-1, 1) * randomRange(100, 500);

    emitParticle(emitter, lifeTime, V2(vx, vy), color);
  }
};

const renderParticles = (
  emitter: ParticleEmitter,
  commands: RendererCommands,
  state: GameState,
  deltaTime: number
) => {
  for (const particle of emitter.particles) {
    particle.currentLifeTime -= deltaTime;
    particle.color.w = particle.currentLifeTime / particle.lifeTime;
    particle.position.x += particle.velocity.x * deltaTime;
    particle.position.y += particle.velocity.y * deltaTime;

    if (particle.currentLifeTime > 0) {
      pushObject(
        commands,
        MeshId.PARTICLE,
        particle.position,
        particle.color,
        state.meshes
      );
    }
  }
};

export const createRectangle = (width: number, height: number): Mesh => {
  const hw = 0.5 * width;
  const hh = 0.5 * height;
  const vertexData = new Float32Array([-hw, -hh, -hw, hh, hw, hh, hw, -hh]);
  const indexData = new Uint32Array([0, 1, 2, 0, 2, 3]);

  return { vertexData, indexData };
};

export const createCircle = (radius: number, sides: number): Mesh => {
  const vertexData = new Float32Array((sides + 1) * 2);
  const indexData = new Uint32Array(sides * 3);

  vertexData[0] = 0;
  vertexData[1] = 1;
  for (let i = 0; i < sides; i++) {
    const angle = (i * (Math.PI * 2)) / sides;
    const x = radius * Math.cos(angle);
    const y = radius * Math.sin(angle);

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
  cDir: v2,
  cr: number,
  rc: v2,
  rw: number,
  rh: number
) => {
  const result: Hit = {
    isHit: false,
    hitTime: 0,
    hitPosition: { x: 0, y: 0 },
    hitNormal: { x: 0, y: 0 },
  };

  const minX = rc.x - rw * 0.5 - cr;
  const maxX = rc.x + rw * 0.5 + cr;
  const minY = rc.y - rh * 0.5 - cr;
  const maxY = rc.y + rh * 0.5 + cr;

  let tMin = Number.NEGATIVE_INFINITY;
  let tMax = Number.POSITIVE_INFINITY;

  if (cDir.x !== 0) {
    const t1x = (minX - cc.x) / cDir.x;
    const t2x = (maxX - cc.x) / cDir.x;

    const txMin = t1x < t2x ? t1x : t2x;
    const txMax = t1x > t2x ? t1x : t2x;

    tMin = tMin > txMin ? tMin : txMin;
    tMax = tMax < txMax ? tMax : txMax;
  } else if (cc.x <= minX || cc.x >= maxX) {
    return result;
  }

  if (cDir.y !== 0) {
    const t1y = (minY - cc.y) / cDir.y;
    const t2y = (maxY - cc.y) / cDir.y;

    const tyMin = t1y < t2y ? t1y : t2y;
    const tyMax = t1y > t2y ? t1y : t2y;

    tMin = tMin > tyMin ? tMin : tyMin;
    tMax = tMax < tyMax ? tMax : tyMax;
  } else if (cc.y <= minY || cc.y >= maxY) {
    return result;
  }

  if (tMax > tMin && tMax > 0.0 && tMin < 1.0) {
    result.isHit = true;
    result.hitTime = tMin;
    result.hitPosition.x = cc.x + cDir.x * tMin;
    result.hitPosition.y = cc.y + cDir.y * tMin;

    const distX = result.hitPosition.x - rc.x;
    const distY = result.hitPosition.y - rc.y;
    const pX = (maxX - minX) * 0.5 - Math.abs(distX);
    const pY = (maxY - minY) * 0.5 - Math.abs(distY);

    if (pX < pY) {
      result.hitNormal.x = Math.sign(distX);
    } else {
      result.hitNormal.y = Math.sign(distY);
    }
  }

  return result;
};

// const checkCircleRectangleCollisionDiscreet = (
//   cc: v2,
//   cr: number,
//   rc: v2,
//   rw: number,
//   rh: number
// ) => {
//   let result = false;
//   const left = rc.x - cr - rw * 0.5;
//   const right = rc.x + cr + rw * 0.5;
//   const top = rc.y - cr - rh * 0.5;
//   const bottom = rc.y + cr + rh * 0.5;

//   if (cc.x >= left && cc.x <= right && cc.y <= bottom && cc.y >= top) {
//     result = true;
//   }

//   return result;
// };

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

const resetBalls = (state: GameState) => {
  for (const ball of state.balls) {
    ball.isReleased = false;
    ball.position.x = state.player.position.x;
    ball.position.y = state.player.position.y;
  }
};

const setLayout = (state: GameState, layoutIndex: number) => {
  const layout = state.layouts[layoutIndex].data;
  state.blockCount = 0;
  for (let x = 0; x < 8; x++) {
    for (let y = 0; y < 6; y++) {
      const index = y * 8 + x;

      const value = layout[index];
      if (value) {
        const block = state.blocks[index];
        block.hp = value;
        block.position.x = ((index * 100) % 800) + 50;
        (block.position.y = 600 - Math.floor(index / 8) * 40 - 40),
          state.blockCount++;
      }

      // if (value) {
      //   const block: Block = {
      //     meshId: MeshId.BLOCK,
      //     hp: 1,
      //     color: { x: 0, y: 0, z: (index + 1) / (8 * 6), w: 1 },
      //     position: {
      //       x: ((index * 100) % 800) + 50,
      //       y: 600 - Math.floor(index / 8) * 40 - 20,
      //     },
      //     velocity: V2(0, -10),
      //   };
      //   state.blocks.push(block);
      //   state.blockCount += 1;
      // }
    }
  }
};

export const gameInit = (state: GameState) => {
  setLayout(state, 0);
  playSound(state, SoundId.MUSIC, true);

  // for (let i = 0; i < 100; i++) {
  //   console.log(getComboScore(i));
  // }
};

export const gameUpdate = (
  state: GameState,
  input: GameInput,
  commands: RendererCommands,
  soundBuffer: SoundBuffer
  //audio: AudioContext
) => {
  //   if (isButtonPressed(input.buttons[Buttons.MOVE_LEFT])) {
  //     console.log("left pressed");
  //   }
  //console.log(state.sounds.length);

  // pushObject(
  //   commands,
  //   MeshId.BALL,
  //   V2(input.mouseX, input.mouseY),
  //   V4(1, 0, 0, 1),
  //   state.meshes
  // );

  outputSound(state, soundBuffer);
  if (!state.isGameOver) {
    if (isButtonPressed(input.buttons[Buttons.PAUSE])) {
      state.isPaused = !state.isPaused;
      state.trailEmitter.isPaused = !state.trailEmitter.isPaused;
      state.setPause();
    }

    if (state.isPaused) {
      input.deltaTime = 0;
    }

    const acceleration =
      10 * (input.mouseX - state.player.position.x) -
      0.5 * state.player.velocity.x;
    // const acceleration =
    //   200 * Math.sign(input.mouseX - state.player.position.x) -
    //   0.5 * state.player.velocity.x;
    //const acceleration = 1;

    //state.player.velocity.x = input.mouseX - state.player.position.x;
    //state.player.position.x += state.player.velocity.x;

    state.player.velocity.x = state.player.velocity.x + acceleration;

    state.player.position.x =
      state.player.position.x +
      state.player.velocity.x * input.deltaTime +
      0.5 * input.deltaTime * input.deltaTime * acceleration;

    if (state.player.position.x < 50) {
      state.player.position.x = 50;
    }

    if (state.player.position.x > 750) {
      state.player.position.x = 750;
    }

    // if (isButtonDown(input.buttons[Buttons.MOVE_LEFT])) {
    //   //console.log("left down");
    //   //state.player.position.x -= state.playerSpeed * input.deltaTime;
    //   state.player.velocity.x = -1 * state.playerSpeed;
    // }

    // if (isButtonDown(input.buttons[Buttons.MOVE_RIGHT])) {
    //   //console.log("left down");
    //   //state.player.position.x += state.playerSpeed * input.deltaTime;
    //   state.player.velocity.x = state.playerSpeed;
    // }
    if (!state.isPaused) {
      if (isButtonPressed(input.buttons[Buttons.RELEASE_BALL])) {
        for (const ball of state.balls) {
          if (!ball.isReleased) {
            ball.isReleased = true;
            ball.velocity.x = state.player.velocity.x;
            ball.velocity.y = 500;
            break;
            // state.isBallReleased = true;
            // state.balls[0].velocity.x = 50;
            // state.balls[0].velocity.y = 500;

            // state.balls[1].velocity.x = -50;
            // state.balls[1].velocity.y = 500;

            // state.balls[2].velocity.x = 20;
            // state.balls[2].velocity.y = 500;
          }
        }
      }
    }

    //   if (isButtonReleased(input.buttons[Buttons.MOVE_LEFT])) {
    //     console.log("left up");
    //   }

    pushObject(
      commands,
      state.player.meshId,
      state.player.position,
      state.player.color,
      state.meshes
    );

    //for (const block of state.blocks) {
    for (let b = 0; b < state.blocks.length; b++) {
      const block = state.blocks[b];
      if (block.hp > 0) {
        for (const ball of state.balls) {
          const hit = checkCircleRectangleCollision(
            ball.position,
            //addV2(ball.position, mulV2(input.deltaTime, ball.velocity)),
            //mulV2(input.deltaTime, subV2(block.velocity, ball.velocity)),
            mulV2(input.deltaTime, ball.velocity),
            10,
            block.position,
            90,
            30
          );

          if (hit.isHit) {
            playSound(state, SoundId.HIT);
            block.hp -= 1;
            ball.position.x = hit.hitPosition.x;
            ball.position.y = hit.hitPosition.y;
            ball.velocity = reflectV2(ball.velocity, hit.hitNormal);
            //state.ball.velocity.y = 0;

            if (block.hp <= 0) {
              emitBurst(state.trailEmitter, 15, 3, V4(0, 1, 0, 1));
              state.blockCount--;
              state.score += getComboScore(ball.combo);
              ball.combo++;

              if (state.blockCount === 0) {
                resetBalls(state);
                setLayout(state, 0);
              }
            }
          }
        }

        // if (b === 0) {
        //   console.log(block.position);
        // }
        //block.position.x += block.velocity.x * input.deltaTime;
        //block.position.y += block.velocity.y * input.deltaTime;

        pushObject(
          commands,
          block.meshId,
          block.position,
          block.color,
          state.meshes
        );
      }
    }

    //const newBallPos = addV2(state.ball.position, state.ball.velocity);

    for (const ball of state.balls) {
      if (ball.isReleased) {
        const hit = checkCircleRectangleCollision(
          ball.position,
          mulV2(input.deltaTime, ball.velocity),
          10,
          state.player.position,
          90,
          30
        );
        if (hit.isHit) {
          ball.position.x = hit.hitPosition.x;
          ball.position.y = hit.hitPosition.y;
          ball.velocity = reflectV2(ball.velocity, hit.hitNormal);
        }

        ball.position.x += ball.velocity.x * input.deltaTime;
        ball.position.y += ball.velocity.y * input.deltaTime;

        state.trailEmitter.position.x = ball.position.x;
        state.trailEmitter.position.y = ball.position.y;
        emitParticle(state.trailEmitter, 0.5, V2(0, 0), V4(0.8, 0.8, 1, 1));

        if (ball.position.x < 10) {
          ball.position.x = 10;
          ball.velocity = reflectV2(ball.velocity, { x: 1, y: 0 });
        }

        if (ball.position.x > 790) {
          ball.position.x = 790;
          ball.velocity = reflectV2(ball.velocity, { x: -1, y: 0 });
        }

        if (ball.position.y > 590) {
          ball.position.y = 590;
          ball.velocity = reflectV2(ball.velocity, { x: 0, y: -1 });
        }
        if (ball.position.y < 0) {
          ball.velocity.x = 0;
          ball.velocity.y = 0;
          ball.isReleased = false;
          ball.combo = 0;
          //ball.velocity = reflectV2(ball.velocity, { x: 0, y: -1 });
        }
      } else {
        ball.position.x = state.player.position.x;
        ball.position.y = state.player.position.y + 25;
      }

      pushObject(
        commands,
        ball.meshId,
        ball.position,
        ball.color,
        state.meshes
      );
    }

    renderParticles(state.trailEmitter, commands, state, input.deltaTime);

    //state.player.position.x += state.player.velocity.x * input.deltaTime;
    //state.player.position.x += state.player.velocity.x;
    //state.player.velocity.x = 0;

    state.remainingTime -= input.deltaTime;
    if (state.remainingTime < 0) {
      state.isGameOver = true;
      state.setGameOver();
    }
  }

  //pushRenderGroup(commands, 1, state.blockPositions.length, state.assets);
};
