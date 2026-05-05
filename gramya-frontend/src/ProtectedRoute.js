import { Navigate } from "react-router-dom";

/**
 * ProtectedRoute — only accessible if the user is logged in with the correct role.
 * If not authenticated → redirect to /login.
 * If wrong role → redirect to home.
 */
function ProtectedRoute({ children, roleRequired }) {
  const role = localStorage.getItem("role");

  if (!role) {
    return <Navigate to="/login" replace />;
  }

  if (roleRequired && role !== roleRequired) {
    // Logged in but wrong role — send to their own dashboard
    return <Navigate to={role === "admin" ? "/dashboard" : "/UserDashboard"} replace />;
  }

  return children;
}

/**
 * PublicRoute — only accessible if the user is NOT logged in.
 * If already logged in → redirect to the appropriate dashboard.
 * Used to wrap /login, /signup, /register so returning users skip auth pages.
 */
function PublicRoute({ children }) {
  const role = localStorage.getItem("role");

  if (role === "admin") return <Navigate to="/dashboard" replace />;
  if (role === "user")  return <Navigate to="/UserDashboard" replace />;

  return children;
}

export { PublicRoute };
export default ProtectedRoute;