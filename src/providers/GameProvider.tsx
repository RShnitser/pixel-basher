import { createContext, useContext, useState } from "react";
import { BlockLayout } from "../game/game_types";

export type GameContextType = {
  selectedLayout: number;
  layouts: BlockLayout[];
  setLayout: (index: number) => void;
};

const GameContext = createContext<GameContextType>({} as GameContextType);

export const GameProvider = ({ children }: { children: React.ReactNode }) => {
  const [layoutIndex, setLayoutIndex] = useState(0);
  return (
    <GameContext.Provider
      value={{
        selectedLayout: layoutIndex,
        setLayout: setLayoutIndex,
        layouts: [
          {
            data: new Uint8Array([
              1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0,
              0, 1, 1, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1,
              1, 1, 1, 1,
            ]),
          },
          {
            data: new Uint8Array([
              1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
              1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
              1, 1, 1, 1,
            ]),
          },
        ],
      }}
    >
      {children}
    </GameContext.Provider>
  );
};

export const useGame = () => {
  const gameContext = useContext(GameContext);

  return gameContext;
};
