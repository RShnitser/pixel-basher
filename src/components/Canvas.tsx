import { useRef, useEffect } from "react";

type WebGPU = {
  device: GPUDevice;
  renderPipeline: GPURenderPipeline;

  context: GPUCanvasContext;
  bindGroup: GPUBindGroup;
  vertexBuffer: GPUBuffer;
  indexBuffer: GPUBuffer;
  uniformBuffer: GPUBuffer;
  uniformValues: Float32Array;
};

const Buttons = {
  MOVE_LEFT: 0,
  MOVE_RIGHT: 1,
} as const;

type Buttons = (typeof Buttons)[keyof typeof Buttons];

type ButtonState = {
  isDown: boolean;
  changed: boolean;
};

type GameInput = {
  deltaTime: number;
  buttons: ButtonState[];
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

  const processKeyboardState = (button: ButtonState, isDown: boolean) => {
    if (button.isDown !== isDown) {
      button.isDown = isDown;
      button.changed = true;
    }
  };

  const handleKeyUp = (e: KeyboardEvent) => {
    const key = e.key;
    if (key === "ArrowLeft") {
      processKeyboardState(gameInput.current.buttons[Buttons.MOVE_LEFT], false);
    }

    if (key === "ArrowRight") {
      //processKeyboardState(gameInput.current.buttons[1], false);
    }
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    const key = e.key;

    if (key === "ArrowLeft") {
      processKeyboardState(gameInput.current.buttons[Buttons.MOVE_LEFT], true);
    }

    if (key === "ArrowRight") {
      //processKeyboardState(gameInput.current.buttons[1], true);
    }
  };

  const update = () => {
    const now = performance.now();

    if (webGPU.current) {
      render(webGPU.current);

      gameInput.current.deltaTime = now - prevTime.current;

      if (isButtonPressed(gameInput.current.buttons[Buttons.MOVE_LEFT])) {
        console.log("left pressed");
      }

      if (isButtonDown(gameInput.current.buttons[Buttons.MOVE_LEFT])) {
        console.log("left down");
      }

      if (isButtonReleased(gameInput.current.buttons[Buttons.MOVE_LEFT])) {
        console.log("left up");
      }

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
        struct VertexOut {
        @builtin(position) position : vec4f,
        @location(0) color : vec4f
        }

        @group(0) @binding(0) var<uniform> color: vec4f;

        @vertex
        fn vertex_main(@location(0) position: vec4f) -> VertexOut
        {
        var output : VertexOut;
        output.position = position;
        output.color = color;
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

    const vertices = new Float32Array([
      -1, 1, 0, 1, 0, 1, 0, 1, -1, -1, 0, 1, 0, -1, 0, 1,
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
      size: 16,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });

    const uniformValues = new Float32Array([0, 0, 1, 1]);

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
