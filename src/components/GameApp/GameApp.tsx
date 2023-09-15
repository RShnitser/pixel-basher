import { useEffect } from "react";
import { Routes, Route } from "react-router-dom";
import Game from "../Game/Game";
import MainMenu from "../MainMenu/MainMenu";
import ScoreMenu from "../Score/ScoreMenu";
import { useGame } from "../../providers/GameProvider";

const GameApp = () => {
  const { getLayouts } = useGame();

  useEffect(() => {
    (async () => {
      await getLayouts();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Routes>
      <Route path="/" element={<MainMenu />} />
      <Route path="/game" element={<Game />} />
      <Route path="/score" element={<ScoreMenu />} />
    </Routes>
  );
};

export default GameApp;
