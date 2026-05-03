import Navbar from "./Navbar";
import { Outlet } from "react-router-dom";

function Layout() {
  return (
    <div>
      <Navbar />
      <div className="main-content">
        <Outlet />
      </div>
    </div>
  );
}

export default Layout;