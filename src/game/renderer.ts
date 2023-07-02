import { WebGPU } from "../components/Canvas";
import { GameState, GameAsset } from "./game_types";
//import { v2, m3x3 } from "./math_types";
import { multiplyM3x3, translateM3x3, identityM3x3 } from "./math";

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

export const renderGroup = (
  webGPU: WebGPU,
  objectId: number,
  count: number,
  assets: GameAsset[]
) => {
  const objectBuffers = webGPU.objectBuffers[objectId];
  const objectData = assets[objectId];
  webGPU.passEncoder.setVertexBuffer(0, objectBuffers.vertexBuffer);
  webGPU.passEncoder.setIndexBuffer(objectBuffers.indexBuffer, "uint32");
  webGPU.passEncoder.drawIndexed(
    objectData.indexData.length,
    count,
    0,
    0,
    webGPU.objectsRendered
  );
  webGPU.objectsRendered += count;
};

export const updateBufferData = (webGPU: WebGPU, gameState: GameState) => {
  const playerMatrix = multiplyM3x3(
    webGPU.projection,
    translateM3x3(identityM3x3(), gameState.playerPosition)
  ).data;

  webGPU.objectData.set([0, 0, 1, 1], 0);
  webGPU.objectData.set(playerMatrix, 4);

  const numBlocks = gameState.blockPositions.length;
  for (let i = 0; i < numBlocks; i++) {
    webGPU.objectData.set([0, 1, 0, 1], (i + 1) * 16);

    const blockMatrix = multiplyM3x3(
      webGPU.projection,
      translateM3x3(identityM3x3(), gameState.blockPositions[i])
    ).data;
    webGPU.objectData.set(blockMatrix, (i + 1) * 16 + 4);
  }

  webGPU.device.queue.writeBuffer(
    webGPU.objectBuffer,
    0,
    webGPU.objectData,
    //0,
    //objectData.length
    0,
    (1 + numBlocks) * 4 * 16
    //1 + numBlocks
  );
};

export const endRender = (webGPU: WebGPU) => {
  webGPU.objectsRendered = 0;
  webGPU.passEncoder.end();
  webGPU.device.queue.submit([webGPU.commandEncoder.finish()]);
};
