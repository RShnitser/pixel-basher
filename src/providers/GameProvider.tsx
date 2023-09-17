import { createContext, useContext, useState } from "react";
//import { BlockLayout } from "../game/game_types";
import {
  BlockLayout,
  Score,
  addScoreAPI,
  getLayoutsAPI,
  getScoresAPI,
} from "../pixelbasher-api/pixelbasher-api";
import useAuth from "./AuthProvider";

export type GameContextType = {
  selectedLayout: number;
  layoutId: number;
  layouts: BlockLayout[];
  getLayouts: () => Promise<void>;
  setLayout: (index: number) => void;
  setLayoutId: (id: number) => void;
  addScore: (score: number) => Promise<void>;
  scores: Score[];
  getScores: () => Promise<void>;
  resetScores: () => void;
};

const GameContext = createContext<GameContextType>({} as GameContextType);

export const GameProvider = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();

  const [layoutIndex, setLayoutIndex] = useState(0);
  const [layoutId, setLayoutId] = useState(-1);
  const [layouts, setLayouts] = useState<BlockLayout[]>([]);
  const [scores, setScores] = useState<Score[]>([]);

  const addScore = async (score: number) => {
    if (user) {
      await addScoreAPI(layoutId, score, user.token);
    }
  };

  const resetScores = () => {
    setScores([]);
  };

  const getScores = async () => {
    if (user) {
      const result = await getScoresAPI(layoutId, user.token);
      if (result.success) {
        setScores(result.data);
      }
    }
  };

  const getLayouts = async () => {
    if (user) {
      const result = await getLayoutsAPI(user.token);
      if (result.success) {
        setLayouts(result.data);
      }
    }
  };

  return (
    <GameContext.Provider
      value={{
        selectedLayout: layoutIndex,
        setLayout: setLayoutIndex,
        layoutId: layoutId,
        setLayoutId: setLayoutId,
        layouts: layouts,
        getLayouts,
        addScore,
        scores,
        getScores,
        resetScores,
      }}
    >
      {children}
    </GameContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useGame = () => {
  const gameContext = useContext(GameContext);

  return gameContext;
};
