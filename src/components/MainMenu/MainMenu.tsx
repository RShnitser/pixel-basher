import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useGame } from "../../providers/GameProvider";
import useAuth from "../../providers/AuthProvider";
import "./MainMenu.css";

type MenuButtonProps = {
  levelIndex: number;
  levelId: number;
};

const LevelButton = ({ levelIndex, levelId }: MenuButtonProps) => {
  const navigate = useNavigate();
  const { setLayout, setLayoutId, resetScores } = useGame();
  const [audio] = useState(new Audio("menu.mp3"));

  useEffect(() => {
    audio.loop = true;
    audio.addEventListener("canplaythrough", () => {
      audio.play();
    });
    return () => {
      audio.pause();
      audio.removeEventListener("canplaythrough", () => {
        audio.play();
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="menu-button">
      <div className="menu-title">{`Level ${levelIndex + 1}`}</div>
      <div>
        <button
          className="button"
          type="button"
          onClick={() => {
            setLayout(levelIndex);
            setLayoutId(levelId);
            navigate("/game");
          }}
        >
          Play
        </button>
        <button
          className="button"
          type="button"
          onClick={() => {
            resetScores();
            setLayoutId(levelId);
            navigate("/score");
          }}
        >
          Score
        </button>
      </div>
    </div>
  );
};

const MainMenu = () => {
  const navigate = useNavigate();
  const { layouts } = useGame();
  const { setUser } = useAuth();

  return (
    <div className="menu-container ratio-wrapper">
      <h2 className="title">Pixel Basher 9001</h2>
      <div className="menu-grid">
        {layouts.map((layout, index) => {
          return (
            <LevelButton
              key={`button ${index}`}
              levelIndex={index}
              levelId={layout.id}
            ></LevelButton>
          );
        })}
      </div>
      <button
        className="button"
        type="button"
        onClick={() => {
          setUser(null);
          navigate("/login");
        }}
      >
        Logout
      </button>
    </div>
  );
};

export default MainMenu;
