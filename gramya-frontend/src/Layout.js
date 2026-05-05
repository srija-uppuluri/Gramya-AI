import Navbar from "./Navbar";
import { Outlet } from "react-router-dom";

function Layout() {
  return (
    <div className="app-layout">
      <Navbar />
      <main style={{ flex: 1, width: "100%" }}>
        <Outlet />
      </main>
    </div>
  );
}

export default Layout;