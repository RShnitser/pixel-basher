import { Routes, Route } from "react-router-dom";
import Game from "../Game/Game";
import MainMenu from "../MainMenu/MainMenu";
import Score from "../Score/Score";

const GameApp = () => {
  return (
    <Routes>
      <Route path="/" element={<MainMenu />} />
      <Route path="/game" element={<Game />} />
      <Route path="/score" element={<Score />} />
    </Routes>
  );
};

export default GameApp;
