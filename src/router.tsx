import { createBrowserRouter } from "react-router";
import Home from "./pages/Home";
import Layout from "./components/Layout";
import Keys from "./pages/Keys";
import Edit from "./pages/Edit";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";

export const router = createBrowserRouter([
  {
    path: "/",
    element: (
      <Layout>
        <Home />
      </Layout>
    ),
  },
  {
    path: "/keys",
    element: (
      <Layout>
        <Keys />
      </Layout>
    ),
  },
  {
    path: "/edit/:id",
    element: (
      <Layout>
        <Edit />
      </Layout>
    ),
  },
  {
    path: "/terms",
    element: (
      <Layout>
        <Terms />
      </Layout>
    ),
  },
  {
    path: "/privacy",
    element: (
      <Layout>
        <Privacy />
      </Layout>
    ),
  },
]);
