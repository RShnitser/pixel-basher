import { createContext, useContext, useState } from "react";

type AudioContextType = {
  stop: () => void;
  play: () => void;
};

const AudioContext = createContext({} as AudioContextType);
export const AudioProvider = ({ children }: { children: React.ReactNode }) => {
  const [audio] = useState(new Audio("menu.mp3"));

  const play = () => {
    audio.loop = true;
    audio.play();
  };

  const stop = () => {
    audio.currentTime = 0;
    audio.pause();
  };
  return (
    <AudioContext.Provider
      value={{
        play,
        stop,
      }}
    >
      {children}
    </AudioContext.Provider>
  );
};

const useAudio = () => {
  return useContext(AudioContext);
};

// eslint-disable-next-line react-refresh/only-export-components
export default useAudio;
