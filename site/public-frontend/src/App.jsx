import { RouterProvider, createBrowserRouter } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import HomePage from "./routes/homePage/homePage";
import ListPage from "./routes/listPage/listPage";
import SinglePage from "./routes/singlePage/singlePage";
import ProfilePage from "./routes/profilePage/profilePage";
import Nearby from "./routes/nearby/nearby";
import Login from "./routes/login/login";
import Register from "./routes/register/register";
import ProfileUpdatePage from "./routes/profileUpdatePage/profileUpdatePage";
import NewPostPage from "./routes/newPostPage/newPostPage";
import EditPostPage from "./routes/editPostPage/editPostPage";
import CityLandingPage from "./routes/cityLandingPage/cityLandingPage";
import NewBuildHubPage from "./routes/newBuildHubPage/newBuildHubPage";
import { Layout, RequireAuth } from "./routes/layout/layout";
import {
  catalogLoader,
  listPageLoader,
  profilePageLoader,
  singlePageLoader,
} from "./lib/loaders";

function App() {
  const router = createBrowserRouter([
    {
      path: "/",
      element: <Layout />,
      children: [
        { path: "/", element: <HomePage />, loader: catalogLoader },
        { path: "/list", element: <ListPage />, loader: listPageLoader },
        { path: "/:id", element: <SinglePage />, loader: singlePageLoader },
        { path: "/login", element: <Login /> },
        { path: "/register", element: <Register /> },
        { path: "/nearby", element: <Nearby /> },
        { path: "/city/:city", element: <CityLandingPage />, loader: catalogLoader },
        { path: "/new-builds", element: <NewBuildHubPage />, loader: catalogLoader },
      ],
    },
    {
      path: "/",
      element: <RequireAuth />,
      children: [
        { path: "/profile", element: <ProfilePage />, loader: profilePageLoader },
        { path: "/profile/update", element: <ProfileUpdatePage /> },
        { path: "/add", element: <NewPostPage /> },
        { path: "/edit/:id", element: <EditPostPage /> },
      ],
    },
  ]);

  return (
    <>
      <ToastContainer position="top-right" />
      <RouterProvider router={router} />
    </>
  );
}

export default App;
