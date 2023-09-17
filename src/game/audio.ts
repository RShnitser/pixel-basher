import { Sound, SoundBuffer } from "./game_types";

export type Audio = {
  context: AudioContext;
  samples: SoundBuffer;
  endTime: number;
};

export const initAudio = () => {
  const context = new AudioContext();
  const sampleCount = 0;
  const samples: SoundBuffer = {
    sampleCount: sampleCount,
    samples: new Float32Array(context.sampleRate * 32),
  };

  const result: Audio = {
    context,
    samples,
    endTime: 0,
  };

  return result;
};

export const loadSound = async (audio: AudioContext, name: string) => {
  try {
    const response = await fetch(name);
    if (response.ok) {
      const arrayBuffer = await response.arrayBuffer();
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
    }
  } catch {
    /* empty */
  }
  return {
    sampleCount: 0,
    channelCount: 0,
    samples: [],
  };
};

export const fillSoundBuffer = (audio: Audio) => {
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

    audio.endTime += buffer.duration;
  } else {
    audio.context.resume();
  }
};
