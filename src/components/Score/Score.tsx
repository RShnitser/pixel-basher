import { useNavigate } from "react-router-dom";

const Score = () => {
  const navigate = useNavigate();
  return (
    <div>
      <h2>Score</h2>
      <div>10</div>
      <button type="button" onClick={() => navigate("/")}>
        Back
      </button>
    </div>
  );
};

export default Score;
