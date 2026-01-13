import React from "react";
import { Navigate } from "react-router-dom";
import { useLoginContext } from "./LoginContext";

const PrivateRoute = ({ children }) => {
  const { isLoggedIn } = useLoginContext();

  if (!isLoggedIn) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default PrivateRoute;
