import { Navigate } from "react-router-dom";

function ProtectedRoute({ children, roleRequired }) {
  const role = localStorage.getItem("role");

  if (!role) {
    return <Navigate to="/login" />;
  }

  if (roleRequired && role !== roleRequired) {
    return <Navigate to="/" />;
  }

  return children;
}

export default ProtectedRoute;