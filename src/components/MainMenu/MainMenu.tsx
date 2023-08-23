import { useNavigate } from "react-router-dom";
import { useGame } from "../../providers/GameProvider";

type MenuButtonProps = {
  // label: string;
  // path: string;
  level: number;
};

const LevelButton = ({ level }: MenuButtonProps) => {
  const navigate = useNavigate();
  const { setLayout } = useGame();
  return (
    <>
      <div>{`Level ${level + 1}`}</div>
      <button
        type="button"
        onClick={() => {
          setLayout(level);
          navigate("/game");
        }}
      >
        Play
      </button>
      <button type="button" onClick={() => navigate("/score")}>
        Score
      </button>
    </>
  );
};

const MainMenu = () => {
  const navigate = useNavigate();
  const { layouts } = useGame();

  return (
    <>
      <h2>Pixel Basher 9001</h2>
      {layouts.map((layout, index) => {
        return <LevelButton level={index}></LevelButton>;
      })}
      <button
        type="button"
        onClick={() => {
          localStorage.removeItem("user");
          navigate("/login");
        }}
      >
        Logout
      </button>
    </>
  );
};

export default MainMenu;
