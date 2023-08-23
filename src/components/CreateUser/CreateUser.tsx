import { useState } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";

const CreateUser = () => {
  const navigate = useNavigate();
  const location = useLocation();

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

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    if (validateInput()) {
      localStorage.setItem("user", "true");
      const { from } = location.state || { from: { pathname: "/" } };
      navigate(from, { replace: true });
    }
  };

  return (
    <>
      <h2>Create Account</h2>
      <div>{error}</div>
      <form onSubmit={handleSubmit}>
        <label>
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
        <label>
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
        <input type="submit" value="Create Account" />
      </form>
      <Link to="/login">{"Already have an account?  Login"}</Link>
    </>
  );
};

export default CreateUser;
