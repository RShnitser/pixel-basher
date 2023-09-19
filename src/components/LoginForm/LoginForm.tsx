import { useState } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import "./LoginForm.css";
import { Response, User } from "../../pixelbasher-api/pixelbasher-api";
import useAuth from "../../providers/AuthProvider";
import useAudio from "../../providers/AudioProvider";

type LoginProps = {
  title: string;
  message: string;
  to: string;
  login: (userName: string, password: string) => Promise<Response<User>>;
};

const LoginForm = ({ title, message, to, login }: LoginProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { setUser } = useAuth();
  const { play } = useAudio();

  const [userName, setUserName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const validateInput = () => {
    let success = true;
    if (!password.length) {
      setError("Enter Password");
      success = false;
    }

    if (!userName.length) {
      setError("Enter UserName");
      success = false;
    }

    return success;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    if (validateInput()) {
      //localStorage.setItem("user", "true");
      let result: Response<User> = { success: false, message: "Login Failed" };

      result = await login(userName, password);

      if (result.success) {
        setUser({ userName: result.data.userName, token: result.data.token });
        const { from } = location.state || { from: { pathname: "/" } };
        play();
        navigate(from, { replace: true });
      } else {
        setError(result.message);
      }
    }
  };

  return (
    <div className="login-container ratio-wrapper">
      <h2 className="login-title">PIXEL BASHER 9001</h2>
      <h3>{title}</h3>
      <div className="input-error">{error}</div>
      <form className="login-form" onSubmit={handleSubmit}>
        <label className="input-container">
          {"User Name: "}
          <input
            type="text"
            placeholder="Enter User Name"
            name="name"
            value={userName}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              setUserName(e.target.value);
            }}
          />
        </label>
        <label className="input-container">
          {"Password: "}
          <input
            type="password"
            placeholder="Enter Password"
            name="password"
            value={password}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              setPassword(e.target.value);
            }}
          />
        </label>
        <div className="input-container">
          <input type="submit" value={title} />
        </div>
      </form>
      <Link to={to}>{message}</Link>
    </div>
  );
};

export default LoginForm;
