import { m3x3, v2, v4 } from "./math_types";

export type ObjectBuffers = {
  vertexBuffer: GPUBuffer;
  indexBuffer: GPUBuffer;
};

export type Buffer =
  | Float32Array
  | Float64Array
  | Int16Array
  | Int32Array
  | Uint16Array
  | Uint32Array;

export type WebGPU = {
  device: GPUDevice;
  renderPipeline: GPURenderPipeline;
  renderPassDescriptor: GPURenderPassDescriptor;
  context: GPUCanvasContext;
  passEncoder: GPURenderPassEncoder;
  commandEncoder: GPUCommandEncoder;

  projection: m3x3;
  objectBuffers: ObjectBuffers[];

  bindGroup: GPUBindGroup;
  objectBuffer: GPUBuffer;
  objectData: Float32Array;

  objectsRendered: number;
};

export type RendererCommands = {
  count: number;
  commands: RendererCommand[];
};

export type RendererCommand = {
  objectId: number;
  vertexBuffer: Float32Array;
  indexBuffer: Uint32Array;
  position: v2;
  color: v4;
};

export type RenderGroup = {
  count: number;
  vertexBuffer: Float32Array;
  indexBuffer: Uint32Array;
};
