import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import "./ScoreMenu.css";
import { useGame } from "../../providers/GameProvider";

const ScoreMenu = () => {
  const navigate = useNavigate();
  const { scores, getScores } = useGame();

  useEffect(() => {
    (async () => {
      await getScores();
    })();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="menu-container ratio-wrapper">
      <h2 className="title">Score</h2>
      <div className="score-display">
        {scores.map((score, index) => (
          <div key={`score ${index}`}>{`${score.name}   ${score.score}`}</div>
        ))}
      </div>
      <button className="button" type="button" onClick={() => navigate("/")}>
        Back
      </button>
    </div>
  );
};

export default ScoreMenu;
