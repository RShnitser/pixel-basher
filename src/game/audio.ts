// type Audio = {
//   audio: AudioContext;
// };

//import { decodeWAV } from "./game";
import { GameState, Sound, SoundBuffer, SoundId } from "./game_types";

export type Audio = {
  context: AudioContext;
  samples: SoundBuffer;
  //samplesInQueue: number;
  //startTime: number;
  endTime: number;
  //script: ScriptProcessorNode;
  //previous: AudioBufferSourceNode | null;
};

export const initAudio = () => {
  const context = new AudioContext();
  const sampleCount = 0;
  //const sampleCount = 256;
  //console.log(sampleCount);
  const samples: SoundBuffer = {
    sampleCount: sampleCount,
    samples: new Float32Array(context.sampleRate * 32),
  };

  // const buffer = new AudioBuffer({
  //   numberOfChannels: 2,
  //   length: sampleCount,
  //   sampleRate: context.sampleRate,
  // });

  // const script = context.createScriptProcessor(4096, 1, 1);

  // script.onaudioprocess = (e) => {
  //   //console.log("start");
  //   //const inputBuffer = e.inputBuffer;
  //   const outputBuffer = e.outputBuffer;
  //   const channels = outputBuffer.numberOfChannels;

  //   for (let c = 0; c < channels; c++) {
  //     const channel = outputBuffer.getChannelData(c);
  //     let channelIndex = 0;
  //     for (let i = c; i < samples.sampleCount * channels; i += channels) {
  //       channel[channelIndex] = samples.samples[i];
  //       //channel[channelIndex] = (Math.random() * 2 - 1) * 0.2;
  //       channelIndex++;
  //     }
  //   }
  // };

  const result: Audio = {
    context,
    samples,
    //startTime: 0,
    endTime: 0,
    //samplesInQueue: 0,
    //script: script,
    //previous: null,
  };

  return result;
};

export const loadSound = async (audio: AudioContext, name: string) => {
  const response = await fetch(name);
  const arrayBuffer = await response.arrayBuffer();
  //decodeWAV(arrayBuffer);
  const audioBuffer = await audio.decodeAudioData(arrayBuffer);
  const result: Sound = {
    sampleCount: audioBuffer.length,
    channelCount: audioBuffer.numberOfChannels,
    samples: [],
  };

  for (let i = 0; i < audioBuffer.numberOfChannels; i++) {
    result.samples.push(audioBuffer.getChannelData(i));
  }

  return result;
};

// export const playSound = (
//   context: AudioContext,
//   sound: SoundBuffer,
//   state: GameState,
//   id: SoundId
// ) => {
//   const soundData = state.sounds[id];
//   const channels = soundData.channelCount;
//   const frameCount = soundData.sampleCount;

//   sound.sampleCount = frameCount;

//   const buffer = new AudioBuffer({
//     numberOfChannels: channels,
//     length: frameCount,
//     sampleRate: context.sampleRate,
//   });

//   let bufferIndex = 0;
//   for (let s = 0; s < sound.sampleCount; s++) {
//     for (let c = 0; c < soundData.channelCount; c++) {
//       const value = soundData.samples[c][s];
//       sound.samples[bufferIndex] = value;
//       bufferIndex++;
//     }
//   }

//   for (let c = 0; c < channels; c++) {
//     const channel = buffer.getChannelData(c);
//     let channelIndex = 0;
//     for (let i = c; i < sound.sampleCount * channels; i += channels) {
//       channel[channelIndex] = sound.samples[i];
//       channelIndex++;
//     }
//   }

//   const source = context.createBufferSource();
//   source.buffer = buffer;
//   source.connect(context.destination);
//   source.start();
// };

export const fillSoundBuffer = (
  audio: Audio
  //audio: AudioContext,
  //sound: SoundBuffer,
  //previous: AudioBufferSourceNode | null,
  //deltaTime: number
) => {
  // const buffer = new AudioBuffer({
  //   numberOfChannels: 2,
  //   length: audio.samples.sampleCount,
  //   sampleRate: audio.context.sampleRate,
  // });

  // const source = audio.context.createBufferSource();
  // source.buffer = buffer;
  // source.connect(audio.script);
  // audio.script.connect(audio.context.destination);
  // source.start();

  const channels = 2;
  const frameCount = audio.samples.sampleCount;

  if (frameCount > 0) {
    const buffer = new AudioBuffer({
      numberOfChannels: channels,
      length: frameCount,
      sampleRate: audio.context.sampleRate,
    });

    for (let c = 0; c < channels; c++) {
      const channel = buffer.getChannelData(c);
      let channelIndex = 0;
      for (let i = c; i < audio.samples.sampleCount * channels; i += channels) {
        channel[channelIndex] = audio.samples.samples[i];
        channelIndex++;
      }
    }

    const source = audio.context.createBufferSource();
    source.buffer = buffer;
    source.connect(audio.context.destination);

    source.start(audio.endTime);
    // source.onended = () => {
    //   audio.samplesInQueue -= frameCount;
    //   console.log(audio.samplesInQueue);
    // };
    //console.log(buffer.duration);
    //audio.endTime = audio.context.currentTime + buffer.duration;
    //const duration = frameCount / audio.context.sampleRate;
    audio.endTime += buffer.duration;
    //audio.context.resume();
    //console.log(duration);
    //console.log("add buffer", buffer.duration);
  } else {
    //console.log(0);
    //audio.endTime = audio.startTime;
    audio.context.resume();
  }
};
