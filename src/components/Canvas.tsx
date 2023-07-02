import { useRef, useEffect } from "react";
import { Buttons, ButtonState, GameInput, GameState } from "../game/game_types";
import { gameUpdate } from "../game/game";
import { m3x3 } from "../game/math_types";
import {
  beginRender,
  endRender,
  renderGroup,
  updateBufferData,
} from "../game/renderer";

type ObjectBuffers = {
  vertexBuffer: GPUBuffer;
  indexBuffer: GPUBuffer;
};

export type WebGPU = {
  device: GPUDevice;
  renderPipeline: GPURenderPipeline;
  renderPassDescriptor: GPURenderPassDescriptor;
  context: GPUCanvasContext;
  passEncoder: GPURenderPassEncoder;
  commandEncoder: GPUCommandEncoder;

  //vertexBuffer: GPUBuffer;
  //indexBuffer: GPUBuffer;
  projection: m3x3;
  objectBuffers: ObjectBuffers[];

  bindGroup: GPUBindGroup;
  objectBuffer: GPUBuffer;
  objectData: Float32Array;
  //uniformBuffer: GPUBuffer;
  //uniformValues: Float32Array;
  //matrixValue: Float32Array;
  //colorValue: Float32Array;
  objectsRendered: number;
};

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
    playerPosition: { x: 0, y: 0 },
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

    assets: [
      {
        //color: new Float32Array([0, 0, 1, 1]),
        vertexData: new Float32Array([0, 0, 30, 0, 0, 30, 30, 30]),
        indexData: new Uint32Array([0, 1, 2, 1, 3, 2]),
      },
      {
        //color: new Float32Array([0, 1, 0, 1]),
        vertexData: new Float32Array([0, 0, 90, 0, 0, 30, 90, 30]),
        indexData: new Uint32Array([0, 1, 2, 1, 3, 2]),
      },
    ],
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

      gameUpdate(gameState.current, gameInput.current);
      render(webGPU.current);

      for (let i = 0; i < gameInput.current.buttons.length; i++) {
        gameInput.current.buttons[i].changed = false;
      }
    }

    prevTime.current = now;
    requestAnimationFrame(update);
  };

  const render = (webGPU: WebGPU) => {
    beginRender(webGPU);

    updateBufferData(webGPU, gameState.current);

    renderGroup(webGPU, 0, 1, gameState.current.assets);
    renderGroup(
      webGPU,
      1,
      gameState.current.blockPositions.length,
      gameState.current.assets
    );

    endRender(webGPU);
  };

  type Buffer =
    | Float32Array
    | Float64Array
    | Int16Array
    | Int32Array
    | Uint16Array
    | Uint32Array;

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

  const initWebGPU = async () => {
    if (!navigator.gpu) {
      return;
    }

    const adapter = await navigator.gpu.requestAdapter();

    if (!adapter) {
      return;
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

    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const context = canvas.getContext("webgpu");
    if (!context) {
      return;
    }

    context.configure({
      device: device,
      format: navigator.gpu.getPreferredCanvasFormat(),
      alphaMode: "premultiplied",
    });

    // const vertices = new Float32Array([
    //   -1, 1, 0,
    //   1, 0, 1,
    //   0, 1, -1,
    //   -1, 0, 1,
    //   0, -1, 0, 1,
    // ]);

    //const vertices = new Float32Array([0, 0, 30, 0, 0, 30, 30, 30]);

    //const indexData = new Uint32Array([0, 1, 2, 1, 3, 2]);
    const objectBuffers: ObjectBuffers[] = [];

    const playerBuffers: ObjectBuffers = {
      // vertexBuffer: device.createBuffer({
      //   size: gameState.current.assets[0].vertexData.byteLength, // make it big enough to store vertices in
      //   usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
      // }),
      // indexBuffer: device.createBuffer({
      //   size: gameState.current.assets[0].indexData.byteLength,
      //   usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST,
      // }),
      vertexBuffer: createBuffer(
        device,
        gameState.current.assets[0].vertexData,
        GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST
      ),
      indexBuffer: createBuffer(
        device,
        gameState.current.assets[0].indexData,
        GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST
      ),
    };

    objectBuffers.push(playerBuffers);

    const blockBuffers: ObjectBuffers = {
      // vertexBuffer: device.createBuffer({
      //   size: gameState.current.assets[1].vertexData.byteLength, // make it big enough to store vertices in
      //   usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
      // }),
      // indexBuffer: device.createBuffer({
      //   size: gameState.current.assets[1].indexData.byteLength,
      //   usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST,
      // }),
      vertexBuffer: createBuffer(
        device,
        gameState.current.assets[1].vertexData,
        GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST
      ),
      indexBuffer: createBuffer(
        device,
        gameState.current.assets[1].indexData,
        GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST
      ),
    };

    objectBuffers.push(blockBuffers);

    //const playerData = gameState.current.assets[0];
    // device.queue.writeBuffer(
    //   playerBuffers.vertexBuffer,
    //   0,
    //   playerData.vertexData
    // );
    // device.queue.writeBuffer(
    //   playerBuffers.indexBuffer,
    //   0,
    //   playerData.indexData
    // );

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
      data: new Float32Array([
        2 / 800,
        0,
        0,
        0,
        0,
        -2 / 600,
        0,
        0,
        -1,
        1,
        1,
        0,
      ]),
    };

    //const commandEncoder = device.createCommandEncoder();
    //const passEncoder = commandEncoder.beginRenderPass(renderPassDescriptor);

    webGPU.current = {
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
  };

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    if (!webGPU.current) {
      initWebGPU();
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
