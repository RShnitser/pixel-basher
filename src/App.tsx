import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  Outlet,
  useLocation,
} from "react-router-dom";

import LoginUser from "./components/LoginUser/LoginUser";
import CreateUser from "./components/CreateUser/CreateUser";
import GameApp from "./components/GameApp/GameApp";
import { GameProvider } from "./providers/GameProvider";
import { AuthProvider } from "./providers/AuthProvider";
import "./App.css";

const PrivateRoute = () => {
  const location = useLocation();

  let isAuth = false;

  const loggedInUser = localStorage.getItem("user");
  if (loggedInUser) {
    isAuth = true;
  }

  return isAuth ? (
    <Outlet />
  ) : (
    <Navigate to="/login" replace state={{ from: location }} />
  );
};

function App() {
  return (
    <AuthProvider>
      <GameProvider>
        <BrowserRouter>
          <Routes>
            {/* <Route path="/" element={<MainMenu />} />
            <Route path="/game" element={<Game />} />
            <Route path="/score" element={<Score />} /> */}
            <Route path="/login" element={<LoginUser />} />
            <Route path="/create" element={<CreateUser />} />
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
