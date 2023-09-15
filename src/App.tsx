import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  Outlet,
} from "react-router-dom";

import LoginForm from "./components/LoginForm/LoginForm";
import GameApp from "./components/GameApp/GameApp";
import { GameProvider } from "./providers/GameProvider";
import useAuth, { AuthProvider } from "./providers/AuthProvider";
import "./App.css";
import { createUserAPI, loginUserAPI } from "./pixelbasher-api/pixelbasher-api";

const PrivateRoute = () => {
  const { user } = useAuth();
  let isAuth = false;

  if (user) {
    isAuth = true;
  }

  return isAuth ? <Outlet /> : <Navigate to="/login" />;
};

function App() {
  return (
    <AuthProvider>
      <GameProvider>
        <BrowserRouter>
          <Routes>
            <Route
              path="/login"
              element={
                <LoginForm
                  title={"Login"}
                  message={"Don't have an account?  Create one"}
                  to={"/create"}
                  login={loginUserAPI}
                />
              }
            />
            <Route
              path="/create"
              element={
                <LoginForm
                  title={"Create Account"}
                  message={"Already have an account?  Login"}
                  to={"/login"}
                  login={createUserAPI}
                />
              }
            />
            <Route element={<PrivateRoute />}>
              <Route path="*" element={<GameApp />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </GameProvider>
    </AuthProvider>
  );
}

export default App;
