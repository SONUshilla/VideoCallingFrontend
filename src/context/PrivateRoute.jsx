import React from "react";
import { Navigate, useLocation } from "react-router-dom"; // 1. Import useLocation
import { useLoginContext } from "./LoginContext";

const PrivateRoute = ({ children }) => {
  const { isLoggedIn } = useLoginContext();
  const location = useLocation(); // 2. Capture the current location (includes query params)

  if (!isLoggedIn) {
    // 3. Pass the 'location' object in state so the Login page knows where to return
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

export default PrivateRoute;