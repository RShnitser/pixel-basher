import { useRef, useEffect } from "react";
import { Buttons, ButtonState, GameInput, GameState } from "../game/game_types";
import { gameUpdate } from "../game/game";
import {
  identityM3x3,
  multiplyM3x3,
  scaleM3x3,
  translateM3x3,
} from "../game/math";

type WebGPU = {
  device: GPUDevice;
  renderPipeline: GPURenderPipeline;

  context: GPUCanvasContext;
  bindGroup: GPUBindGroup;
  vertexBuffer: GPUBuffer;
  indexBuffer: GPUBuffer;
  uniformBuffer: GPUBuffer;
  uniformValues: Float32Array;
  matrixValue: Float32Array;
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
    playerPosition: { x: 0, y: 0 },
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
    // if (key === "ArrowLeft") {
    //   processKeyboardState(gameInput.current.buttons[Buttons.MOVE_LEFT], false);
    // }

    // if (key === "ArrowRight") {
    //   //processKeyboardState(gameInput.current.buttons[1], false);
    // }
    processInput(key, false);
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    const key = e.key;

    // if (key === "ArrowLeft") {
    //   processKeyboardState(gameInput.current.buttons[Buttons.MOVE_LEFT], true);
    // }

    // if (key === "ArrowRight") {
    //   //processKeyboardState(gameInput.current.buttons[1], true);
    // }
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

  const render = ({
    device,
    //commandEncoder,
    //renderPassDescriptor,
    context,
    renderPipeline,
    bindGroup,
    vertexBuffer,
    indexBuffer,
    uniformBuffer,
    uniformValues,
    matrixValue,
  }: WebGPU) => {
    const commandEncoder = device.createCommandEncoder();
    const passEncoder = commandEncoder.beginRenderPass({
      colorAttachments: [
        {
          clearValue: { r: 0.0, g: 0.5, b: 1.0, a: 1.0 },
          loadOp: "clear",
          storeOp: "store",
          view: context.getCurrentTexture().createView(),
        },
      ],
    });

    passEncoder.setPipeline(renderPipeline);
    passEncoder.setBindGroup(0, bindGroup);
    passEncoder.setVertexBuffer(0, vertexBuffer);
    passEncoder.setIndexBuffer(indexBuffer, "uint32");

    const projection = {
      data: new Float32Array([2 / 800, 0, 0, 0, -2 / 600, 0, -1, 1, 1]),
    };

    const matrix = multiplyM3x3(
      projection,
      translateM3x3(identityM3x3(), gameState.current.playerPosition)
    ).data;

    //console.log(matrix);
    matrixValue.set([
      ...matrix.slice(0, 3),
      0,
      ...matrix.slice(3, 6),
      0,
      ...matrix.slice(6, 9),
      0,
    ]);
    device.queue.writeBuffer(uniformBuffer, 0, uniformValues);

    passEncoder.drawIndexed(6);
    passEncoder.end();

    device.queue.submit([commandEncoder.finish()]);
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

        @group(0) @binding(0) var<uniform> uniforms: Uniforms;

        @vertex
        fn vertex_main(@location(0) position: vec4f) -> VertexOut
        {
        var output : VertexOut;

        let clipSpace = (uniforms.matrix * vec3f(position.xy, 1)).xy;
      
        output.position = vec4f(clipSpace, 0.0, 1.0);
        output.color = uniforms.color;
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

    const vertices = new Float32Array([
      0, 0, 0, 1, 30, 0, 0, 1, 0, 30, 0, 1, 30, 30, 0, 1,
    ]);

    const indexData = new Uint32Array([0, 1, 2, 1, 3, 2]);

    const vertexBuffer = device.createBuffer({
      size: vertices.byteLength, // make it big enough to store vertices in
      usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
    });

    device.queue.writeBuffer(vertexBuffer, 0, vertices, 0, vertices.length);

    const indexBuffer = device.createBuffer({
      label: "index buffer",
      size: indexData.byteLength,
      usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST,
    });
    device.queue.writeBuffer(indexBuffer, 0, indexData);

    const vertexBuffers: Iterable<GPUVertexBufferLayout> = [
      {
        attributes: [
          {
            shaderLocation: 0, // position
            offset: 0,
            format: "float32x4",
          },
        ],
        arrayStride: 16,
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

    const uniformBuffer = device.createBuffer({
      size: 64,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });

    const uniformValues = new Float32Array([
      0, 0, 1, 1, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0,
    ]);

    const matrixValue = uniformValues.subarray(4, 16);

    const bindGroup = device.createBindGroup({
      layout: renderPipeline.getBindGroupLayout(0),
      entries: [{ binding: 0, resource: { buffer: uniformBuffer } }],
    });

    webGPU.current = {
      device,
      context,

      renderPipeline,

      bindGroup,
      vertexBuffer,
      indexBuffer,
      uniformBuffer,
      uniformValues,
      matrixValue,
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
