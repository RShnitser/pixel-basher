import {
  Buttons,
  ButtonState,
  GameAsset,
  GameInput,
  GameState,
  MeshId,
  ParticleEmitter,
} from "./game_types";
import { pushObject } from "./renderer";
import { RendererCommands } from "./renderer_types";
import { v2, v4 } from "./math_types";
import { mulV2, reflectV2 } from "./math";
import { Hit } from "./game_types";

const createParticleEmitter = (
  color: v4,
  position: v2,
  maxCount: number,
  rate: number,
  meshId: MeshId
) => {
  const result: ParticleEmitter = {
    color,
    maxCount,
    count: 0,
    position,
    rate,
    timeElapsed: 0,
    meshId,
    particles: Array.from({ length: maxCount }, () => ({
      color: { x: 0, y: 0, z: 0, w: 0 },
      position: { x: 0, y: 0 },
      lifeTime: 0,
    })),
  };
};

const emitParticle = (
  emitter: ParticleEmitter,
  commands: RendererCommands,
  state: GameState,
  deltaTime: number
) => {
  emitter.timeElapsed += deltaTime;
  if (emitter.timeElapsed > emitter.rate) {
    emitter.timeElapsed = 0;

    const particle = emitter.particles[emitter.count];
    //console.log(particle);
    particle.position.x = emitter.position.x;
    particle.position.y = emitter.position.y;
    particle.color.x = 1;
    particle.color.w = 1;

    emitter.count += 1;
    if (emitter.count > emitter.maxCount - 1) {
      emitter.count = 0;
    }
  }

  for (const particle of emitter.particles) {
    particle.color.w -= deltaTime;

    pushObject(
      commands,
      MeshId.PARTICLE,
      particle.position,
      particle.color,
      state.assets
    );
  }
};

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

  //const cDir = subV2(cc, rc);
  //let tMin = 0;
  //let tMax = 1;

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
    //tMin = max(tMin, min(t1y, t2y));
    //tMax = min(tMax, max(t1y, t2y));
    //console.log(tyMin, tyMax);
  } else if (cc.y <= minY || cc.y >= maxY) {
    return result;
  }

  if (tMax > tMin && tMax > 0.0 && tMin < 1.0) {
    result.isHit = true;
    result.hitTime = tMin;
    result.hitPosition.x = cc.x + cDir.x * tMin;
    result.hitPosition.y = cc.y + cDir.y * tMin;
    //result.hitPosition.x = lerp(cc.x, cDir.x, tMin);
    //result.hitPosition.y = lerp(cc.x, cDir.x, tMin);

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

const checkCircleRectangleCollisionDiscreet = (
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
    state.player.position.x -= state.playerSpeed * input.deltaTime;
  }

  if (isButtonDown(input.buttons[Buttons.MOVE_RIGHT])) {
    //console.log("left down");
    state.player.position.x += state.playerSpeed * input.deltaTime;
  }

  if (isButtonPressed(input.buttons[Buttons.RELEASE_BALL])) {
    if (!state.isBallReleased) {
      state.isBallReleased = true;
      state.ball.velocity.x = 50;
      state.ball.velocity.y = 500;
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
    state.assets
  );

  for (const block of state.blocks) {
    if (block.hp > 0) {
      const hit = checkCircleRectangleCollision(
        state.ball.position,
        //addV2(state.ball.position, mulV2(input.deltaTime, state.ball.velocity)),
        mulV2(input.deltaTime, state.ball.velocity),
        10,
        block.position,
        90,
        30
      );

      if (hit.isHit) {
        block.hp -= 1;
        state.ball.position.x = hit.hitPosition.x;
        state.ball.position.y = hit.hitPosition.y;
        state.ball.velocity = reflectV2(state.ball.velocity, hit.hitNormal);
        //state.ball.velocity.y = 0;
      }

      // const hitDraw = checkCircleRectangleCollision(
      //   state.ball.position,
      //   { x: 0, y: 1000 },
      //   10,
      //   block.position,
      //   90,
      //   30
      // );

      // if (hitDraw.isHit) {
      //   pushObject(
      //     commands,
      //     state.ball.meshId,
      //     hitDraw.hitPosition,
      //     { x: 1, y: 0, z: 0, w: 1 },
      //     state.assets
      //   );
      // }

      pushObject(
        commands,
        block.meshId,
        block.position,
        block.color,
        state.assets
      );
    }
  }

  if (state.isBallReleased) {
    //const newBallPos = addV2(state.ball.position, state.ball.velocity);

    const hit = checkCircleRectangleCollision(
      state.ball.position,
      mulV2(input.deltaTime, state.ball.velocity),
      10,
      state.player.position,
      90,
      30
    );
    if (hit.isHit) {
      state.ball.position.x = hit.hitPosition.x;
      state.ball.position.y = hit.hitPosition.y;
      state.ball.velocity = reflectV2(state.ball.velocity, hit.hitNormal);
    }

    state.ball.position.x += state.ball.velocity.x * input.deltaTime;
    state.ball.position.y += state.ball.velocity.y * input.deltaTime;

    state.trailEmitter.position.x = state.ball.position.x;
    state.trailEmitter.position.y = state.ball.position.y;

    if (state.ball.position.x < 10) {
      state.ball.position.x = 10;
      state.ball.velocity = reflectV2(state.ball.velocity, { x: 1, y: 0 });
    }

    if (state.ball.position.x > 790) {
      state.ball.position.x = 790;
      state.ball.velocity = reflectV2(state.ball.velocity, { x: -1, y: 0 });
    }

    if (state.ball.position.y > 590) {
      state.ball.position.y = 590;
      state.ball.velocity = reflectV2(state.ball.velocity, { x: 0, y: -1 });
    }
  } else {
    state.ball.position.x = state.player.position.x;
    state.ball.position.y = state.player.position.y + 25;
  }

  pushObject(
    commands,
    state.ball.meshId,
    state.ball.position,
    state.ball.color,
    state.assets
  );

  emitParticle(state.trailEmitter, commands, state, input.deltaTime);

  //pushRenderGroup(commands, 1, state.blockPositions.length, state.assets);
};
