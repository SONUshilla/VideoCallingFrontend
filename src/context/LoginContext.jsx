import { createContext, useState, useContext, useEffect } from "react";
import axios from "axios";

const LoginContext = createContext();

export const useLoginContext = () => useContext(LoginContext);

export const LoginProvider = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [profilePic,setProfilePic]=useState();
  const [username,setUserName]=useState();

  // Verify token whenever it changes
  useEffect(() => {
    const verifyToken = async () => {
      try {
        if (!token) {
          setIsLoggedIn(false);
          return;
        }

        const response = await axios.get("http://72.61.115.157:3000/auth/verifyToken", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.status === 200) {
          setIsLoggedIn(true);
          setProfilePic(response.data.user.profilePic);
          setUserName(response.data.user.name);
        }
      } catch (err) {
        console.error("Token invalid:", err);
        setIsLoggedIn(false);
      }
    };

    verifyToken();
  }, [token]);

  // When user logs in
  const login = (jwt) => {
    localStorage.setItem("token", jwt);
    console.log("token in login is",token)
    setToken(jwt);
    setIsLoggedIn(true);
  };

  // When user logs out
  const logout = () => {
    localStorage.removeItem("token");
    setToken(null);
    setIsLoggedIn(false);
  };

  return (
    <LoginContext.Provider
      value={{
        isLoggedIn,
        login,
        logout,
        token,
        profilePic,
        username
      }}
    >
      {children}
    </LoginContext.Provider>
  );
};
