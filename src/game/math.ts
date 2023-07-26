import { v2, v3, v4, m3x3 } from "./math_types";

export const V2 = (x: number, y: number) => {
  const result: v2 = { x, y };
  return result;
};

export const V3 = (x: number, y: number, z: number) => {
  const result: v3 = { x, y, z };
  return result;
};

export const V4 = (x: number, y: number, z: number, w: number) => {
  const result: v4 = { x, y, z, w };
  return result;
};

export const identityM3x3 = (): m3x3 => {
  return {
    data: new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0]),
  };
};

export const multiplyM3x3 = (a: m3x3, b: m3x3): m3x3 => {
  //const [a00, a01, a02, p1, a10, a11, a12, p2, a20, a21, a22, p3] = a.data;
  //const [b00, b01, b02, p1b, b10, b11, b12, p2b, b20, b21, b22, p3b] = b.data;

  const a00 = a.data[0];
  const a01 = a.data[1];
  const a02 = a.data[2];
  const a10 = a.data[4];
  const a11 = a.data[5];
  const a12 = a.data[6];
  const a20 = a.data[8];
  const a21 = a.data[9];
  const a22 = a.data[10];

  const b00 = b.data[0];
  const b01 = b.data[1];
  const b02 = b.data[2];
  const b10 = b.data[4];
  const b11 = b.data[5];
  const b12 = b.data[6];
  const b20 = b.data[8];
  const b21 = b.data[9];
  const b22 = b.data[10];

  return {
    data: new Float32Array([
      b00 * a00 + b01 * a10 + b02 * a20,
      b00 * a01 + b01 * a11 + b02 * a21,
      b00 * a02 + b01 * a12 + b02 * a22,
      0,
      b10 * a00 + b11 * a10 + b12 * a20,
      b10 * a01 + b11 * a11 + b12 * a21,
      b10 * a02 + b11 * a12 + b12 * a22,
      0,
      b20 * a00 + b21 * a10 + b22 * a20,
      b20 * a01 + b21 * a11 + b22 * a21,
      b20 * a02 + b21 * a12 + b22 * a22,
      0,
    ]),
  };
};

export const translateM3x3 = (a: m3x3, b: v2): m3x3 => {
  // const [a00, a01, a02, a10, a11, a12, a20, a21, a22] = a.data;
  // return {
  //   data: new Float32Array([
  //     a00,
  //     a01,
  //     a02,
  // 0
  //     a10,
  //     a11,
  //     a12,
  // 0
  //     a20 + b.x,
  //     a21 + b.y,
  //     a22,
  // 0
  //   ]),
  // };
  a.data[8] = a.data[8] + b.x;
  a.data[9] = a.data[9] + b.y;
  return a;
};

export const scaleM3x3 = (m: m3x3, s: v2): m3x3 => {
  // return {
  //   data: new Float32Array([s.x, 0, 0, 0, s.y, 0, 0, 0, 1]),
  // };
  //const [b00, b01, b02, b10, b11, b12, b20, b21, b22] = m.data;
  m.data[0] = m.data[0] * s.x;
  m.data[1] = m.data[1] * s.y;
  //m.data[2] = b02 * 1,
  //
  m.data[4] = m.data[4] * s.x;
  m.data[5] = m.data[5] * s.y;
  //m.data[5] = b12 * 1,
  //
  m.data[8] = m.data[8] * s.x;
  m.data[9] = m.data[9] * s.y;
  //m.data[8] = b22 * 1,
  //
  return m;
};

export const addV2 = (a: v2, b: v2) => {
  const result: v2 = { x: a.x + b.x, y: a.y + b.y };
  return result;
};

export const subV2 = (a: v2, b: v2) => {
  const result: v2 = { x: b.x - a.x, y: b.y - a.y };
  return result;
};

export const mulV2 = (c: number, v: v2) => {
  const result: v2 = { x: c * v.x, y: c * v.y };
  return result;
};

export const lengthSquaredV2 = (v: v2) => {
  return v.x * v.x + v.y * v.y;
};

export const dotProduct = (a: v2, b: v2) => {
  return a.x * b.x + a.y * b.y;
};

export const reflectV2 = (v: v2, n: v2) => {
  //return subV2(mulV2(1 / (2 * dotProduct(v, n)), n), v);
  const mult = -2 * dotProduct(v, n);
  const result = addV2(v, mulV2(mult, n));
  return result;
};

export const lerp = (a: number, b: number, t: number) => {
  const result = (1 - t) * a + t * b;
  return result;
};

export const max = (a: number, b: number) => {
  return a > b ? a : b;
};

export const min = (a: number, b: number) => {
  return a < b ? a : b;
};

export const randomRange = (min: number, max: number) => {
  const result = Math.random() * (max - min) + min;
  return result;
};
