import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  Outlet,
  useLocation,
} from "react-router-dom";

import Game from "./components/Game/Game";
import MainMenu from "./components/MainMenu/MainMenu";
import Score from "./components/Score/Score";
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
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MainMenu />} />
        <Route path="/game" element={<Game />} />
        <Route path="/score" element={<Score />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
