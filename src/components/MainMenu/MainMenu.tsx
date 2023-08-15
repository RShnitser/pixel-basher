import { useNavigate } from "react-router-dom";

type MenuButtonProps = {
  // label: string;
  // path: string;
  level: string;
};

const LevelButton = ({ level }: MenuButtonProps) => {
  const navigate = useNavigate();
  return (
    <>
      <div>{`Level ${level}`}</div>
      <button type="button" onClick={() => navigate("/game")}>
        Play
      </button>
      <button type="button" onClick={() => navigate("/score")}>
        Score
      </button>
    </>
  );
};

const MainMenu = () => {
  return (
    <div>
      <h2>Pixel Basher 9001</h2>
      <div>
        <LevelButton level={"1"} />
      </div>
    </div>
  );
};

export default MainMenu;
