import { RenderGroup, WebGPU } from "./renderer_types";
import { GameAsset } from "./game_types";
import { v2, v4 } from "./math_types";
import { multiplyM3x3, translateM3x3, identityM3x3 } from "./math";
import { RendererCommands, ObjectBuffers, Buffer } from "./renderer_types";

const createBuffer = (device: GPUDevice, data: Buffer, usage: number) => {
  const buffer = device.createBuffer({
    size: data.byteLength,
    usage: usage,
    mappedAtCreation: true,
  });
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  new data.constructor(buffer.getMappedRange()).set(data);
  buffer.unmap();
  return buffer;
};

export const initWebGPU = async (
  canvas: HTMLCanvasElement | null,
  assets: GameAsset[]
) => {
  if (!navigator.gpu) {
    return null;
  }

  const adapter = await navigator.gpu.requestAdapter();

  if (!adapter) {
    return null;
  }

  const device = await adapter.requestDevice();

  const shaders = `
      struct Uniforms {
        color: vec4f,
        matrix: mat3x3f
      }

      struct VertexOut {
      @builtin(position) position : vec4f,
      @location(0) color : vec4f
      }

      @group(0) @binding(0) var<storage, read> uniforms: array<Uniforms>;

      @vertex
      fn vertex_main(
        @builtin(instance_index) Id : u32,
        @location(0) position: vec2f) -> VertexOut
      {
      var output : VertexOut;

      let clipSpace = (uniforms[Id].matrix * vec3f(position, 1)).xy;
    
      output.position = vec4f(clipSpace, 0.0, 1.0);
      output.color = uniforms[Id].color;
      return output;
      }

      @fragment
      fn fragment_main(fragData: VertexOut) -> @location(0) vec4f
      {
      return fragData.color;
      }
      `;

  const shaderModule = device.createShaderModule({
    code: shaders,
  });

  if (!canvas) {
    return null;
  }

  const context = canvas.getContext("webgpu");
  if (!context) {
    return null;
  }

  context.configure({
    device: device,
    format: navigator.gpu.getPreferredCanvasFormat(),
    alphaMode: "premultiplied",
  });

  const objectBuffers: ObjectBuffers[] = [];

  // const playerBuffers: ObjectBuffers = {

  //   vertexBuffer: createBuffer(
  //     device,
  //     assets[0].vertexData,
  //     GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST
  //   ),
  //   indexBuffer: createBuffer(
  //     device,
  //     assets[0].indexData,
  //     GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST
  //   ),
  // };

  // objectBuffers.push(playerBuffers);

  // const blockBuffers: ObjectBuffers = {

  //   vertexBuffer: createBuffer(
  //     device,
  //     assets[1].vertexData,
  //     GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST
  //   ),
  //   indexBuffer: createBuffer(
  //     device,
  //     assets[1].indexData,
  //     GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST
  //   ),
  // };

  // objectBuffers.push(blockBuffers);

  // const ballBuffers: ObjectBuffers = {
  //   vertexBuffer: createBuffer(
  //     device,
  //     assets[2].vertexData,
  //     GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST
  //   ),
  //   indexBuffer: createBuffer(
  //     device,
  //     assets[2].indexData,
  //     GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST
  //   ),
  // };

  // objectBuffers.push(ballBuffers);

  for (const asset of assets) {
    const buffer: ObjectBuffers = {
      vertexBuffer: createBuffer(
        device,
        asset.vertexData,
        GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST
      ),
      indexBuffer: createBuffer(
        device,
        asset.indexData,
        GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST
      ),
    };

    objectBuffers.push(buffer);
  }

  const vertexBuffers: Iterable<GPUVertexBufferLayout> = [
    {
      attributes: [
        {
          shaderLocation: 0, // position
          offset: 0,
          format: "float32x2",
        },
      ],
      arrayStride: 8,
      stepMode: "vertex",
    },
  ];

  const pipelineDescriptor: GPURenderPipelineDescriptor = {
    vertex: {
      module: shaderModule,
      entryPoint: "vertex_main",
      buffers: vertexBuffers,
    },
    fragment: {
      module: shaderModule,
      entryPoint: "fragment_main",
      targets: [
        {
          format: navigator.gpu.getPreferredCanvasFormat(),
          blend: {
            alpha: {
              srcFactor: "zero",
              dstFactor: "one",
              operation: "add",
            },
            color: {
              srcFactor: "src-alpha",
              dstFactor: "one-minus-src-alpha",
              operation: "add",
            },
          },

          //format: "bgra8unorm",
        },
      ],
    },

    primitive: {
      topology: "triangle-list",
    },

    layout: "auto",
  };

  const renderPipeline = device.createRenderPipeline(pipelineDescriptor);

  // const uniformValues = new Float32Array([
  //   0, 0, 1, 1, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0,
  // ]);

  // const uniformBuffer = device.createBuffer({
  //   size: uniformValues.byteLength,
  //   usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
  // });

  const objectData = new Float32Array(16 * 1024);

  const objectBuffer = device.createBuffer({
    size: objectData.byteLength,
    usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
  });

  //const colorValue = uniformValues.subarray(0, 4);
  //const matrixValue = uniformValues.subarray(4, 16);

  const bindGroup = device.createBindGroup({
    layout: renderPipeline.getBindGroupLayout(0),
    //entries: [{ binding: 0, resource: { buffer: uniformBuffer } }],
    entries: [{ binding: 0, resource: { buffer: objectBuffer } }],
  });

  const renderPassDescriptor: GPURenderPassDescriptor = {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    colorAttachments: [
      {
        clearValue: { r: 0.0, g: 0.5, b: 1.0, a: 1.0 },
        loadOp: "clear",
        storeOp: "store",
        view: undefined,
        //view: context.getCurrentTexture().createView(),
      },
    ],
  };

  const projection = {
    data: new Float32Array([2 / 800, 0, 0, 0, 0, 2 / 600, 0, 0, -1, -1, 1, 0]),
  };

  //const commandEncoder = device.createCommandEncoder();
  //const passEncoder = commandEncoder.beginRenderPass(renderPassDescriptor);

  const result: WebGPU = {
    device,
    context,
    renderPassDescriptor,

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    passEncoder: undefined,
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    commandEncoder: undefined,

    renderPipeline,

    objectBuffers,
    projection,

    bindGroup,
    objectBuffer,
    objectData,
    //uniformBuffer,
    //uniformValues,
    //colorValue,
    //matrixValue,
    objectsRendered: 0,
  };

  return result;
};

export const beginRender = (webGPU: WebGPU) => {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  //@ts-ignore
  webGPU.renderPassDescriptor.colorAttachments[0].view = webGPU.context
    .getCurrentTexture()
    .createView();
  webGPU.commandEncoder = webGPU.device.createCommandEncoder();
  // const passEncoder = commandEncoder.beginRenderPass({
  //   colorAttachments: [
  //     {
  //       clearValue: { r: 0.0, g: 0.5, b: 1.0, a: 1.0 },
  //       loadOp: "clear",
  //       storeOp: "store",
  //       view: context.getCurrentTexture().createView(),
  //     },
  //   ],
  // });
  webGPU.passEncoder = webGPU.commandEncoder.beginRenderPass(
    webGPU.renderPassDescriptor
  );

  webGPU.passEncoder.setPipeline(webGPU.renderPipeline);
  webGPU.passEncoder.setBindGroup(0, webGPU.bindGroup);
};

const drawRenderGroup = (
  webGPU: WebGPU,
  objectId: number,
  count: number,
  indexLength: number
  //vertextData: Float32Array,
  //indexData: Uint32Array
) => {
  const objectBuffers = webGPU.objectBuffers[objectId];
  webGPU.passEncoder.setVertexBuffer(0, objectBuffers.vertexBuffer);
  webGPU.passEncoder.setIndexBuffer(objectBuffers.indexBuffer, "uint32");
  webGPU.passEncoder.drawIndexed(
    indexLength,
    count,
    0,
    0,
    webGPU.objectsRendered
  );
  webGPU.objectsRendered += count;
};

export const endRender = (webGPU: WebGPU, commands: RendererCommands) => {
  quickSort(
    commands.commands,
    0,
    commands.count - 1,
    (command) => command.objectId
  );
  //console.log(commands.commands.slice(0, commands.count));
  // commands.commands.sort((a, b) => {
  //   return a.objectId - b.objectId;
  // });
  //console.log(commands);
  const counter = new Map<number, RenderGroup>();
  for (let i = 0; i < commands.count; i++) {
    const command = commands.commands[i];

    const { x, y, z, w } = command.color;
    webGPU.objectData.set([x, y, z, w], i * 16);

    const objectMatrix = multiplyM3x3(
      webGPU.projection,
      translateM3x3(identityM3x3(), command.position)
    ).data;
    webGPU.objectData.set(objectMatrix, i * 16 + 4);

    const value = counter.get(command.objectId) || {
      count: 0,
      vertexBuffer: command.vertexBuffer,
      indexBuffer: command.indexBuffer,
    };
    value.count++;

    counter.set(command.objectId, value);
  }

  webGPU.device.queue.writeBuffer(
    webGPU.objectBuffer,
    0,
    webGPU.objectData,
    //0,
    //webGPU.objectData.length
    0,
    commands.count * 4 * 16
    //1 + numBlocks
  );

  //console.log(counter.entries());
  for (const entry of counter.entries()) {
    //console.log(entry);
    const [objectId, objectData] = entry;
    //console.log(objectCount);
    drawRenderGroup(
      webGPU,
      objectId,
      objectData.count,
      objectData.indexBuffer.length
    );
  }

  commands.count = 0;

  //updateBufferData(webGPU, gameState.current);
  webGPU.objectsRendered = 0;
  webGPU.passEncoder.end();
  webGPU.device.queue.submit([webGPU.commandEncoder.finish()]);
};

// export const pushRenderGroup = (
//   commands: RendererCommands,
//   objectId: number,
//   count: number,
//   assets: GameAsset[]
// ) => {
//   const command = commands.commands[commands.count];
//   const asset = assets[objectId];
//   command.objectId = objectId;
//   command.count = count;
//   command.vertexBuffer = asset.vertexData;
//   command.indexBuffer = asset.indexData;
//   commands.count++;
// };

export const pushObject = (
  commands: RendererCommands,
  objectId: number,
  position: v2,
  color: v4,
  assets: GameAsset[]
) => {
  //console.log(commands.count);
  const command = commands.commands[commands.count];
  const asset = assets[objectId];

  // commands.commands[commands.count].objectId = objectId;
  // commands.commands[commands.count].vertexBuffer = asset.vertexData;
  // commands.commands[commands.count].indexBuffer = asset.indexData;
  // commands.commands[commands.count].position = position;
  // commands.commands[commands.count].color = color;

  command.objectId = objectId;
  command.vertexBuffer = asset.vertexData;
  command.indexBuffer = asset.indexData;
  command.position = position;
  command.color = color;

  //console.log(command);
  //console.log(position);

  commands.count++;
};

const quickSort = <T>(
  arr: T[],
  l: number,
  r: number,
  callback: (v: T) => number
) => {
  if (r > l) {
    const pivot = callback(arr[r]);
    let swap = l;
    for (let i = l; i <= r; i++) {
      if (callback(arr[i]) <= pivot) {
        const temp = arr[i];
        arr[i] = arr[swap];
        arr[swap] = temp;
        swap++;
      }
    }

    quickSort(arr, l, swap - 2, callback);
    quickSort(arr, swap, r, callback);
  }

  return arr;
};
