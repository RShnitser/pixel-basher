import { useNavigate, useLocation } from "react-router-dom";

const LoginUser = () => {
  const navigate = useNavigate();
  const location = useLocation();
  return (
    <>
      <button
        type="button"
        onClick={() => {
          localStorage.setItem("user", "true");
          const { from } = location.state || { from: { pathname: "/" } };
          navigate(from, { replace: true });

          navigate("/");
        }}
      >
        Login
      </button>
      <button type="button" onClick={() => navigate("/create")}>
        Create
      </button>
    </>
  );
};

export default LoginUser;
