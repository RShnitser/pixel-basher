import { v2, m3x3 } from "./math_types";

export const identityM3x3 = (): m3x3 => {
  return {
    data: new Float32Array([1, 0, 0, 0, 1, 0, 0, 0, 1]),
  };
};

export const multiplyM3x3 = (a: m3x3, b: m3x3): m3x3 => {
  const [a00, a01, a02, a10, a11, a12, a20, a21, a22] = a.data;
  const [b00, b01, b02, b10, b11, b12, b20, b21, b22] = b.data;

  return {
    data: new Float32Array([
      b00 * a00 + b01 * a10 + b02 * a20,
      b00 * a01 + b01 * a11 + b02 * a21,
      b00 * a02 + b01 * a12 + b02 * a22,
      b10 * a00 + b11 * a10 + b12 * a20,
      b10 * a01 + b11 * a11 + b12 * a21,
      b10 * a02 + b11 * a12 + b12 * a22,
      b20 * a00 + b21 * a10 + b22 * a20,
      b20 * a01 + b21 * a11 + b22 * a21,
      b20 * a02 + b21 * a12 + b22 * a22,
    ]),
  };
};

export const translateM3x3 = (a: m3x3, b: v2): m3x3 => {
  const [a00, a01, a02, a10, a11, a12, a20, a21, a22] = a.data;
  return {
    data: new Float32Array([
      a00,
      a01,
      a02,
      a10,
      a11,
      a12,
      a20 + b.x,
      a21 + b.y,
      a22,
    ]),
  };
};

export const scaleM3x3 = (s: v2): m3x3 => {
  return {
    data: new Float32Array([s.x, 0, 0, 0, s.y, 0, 0, 0, 1]),
  };
};
