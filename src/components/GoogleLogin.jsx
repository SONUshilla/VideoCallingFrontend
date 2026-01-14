import { GoogleOAuthProvider } from "@react-oauth/google";
import { GoogleLogin } from "@react-oauth/google";
import React, { useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useLoginContext } from "../context/LoginContext";

function GoogleAuth() {
    const navigate = useNavigate();
    const {login,isLoggedIn}=useLoginContext();

    useEffect(()=>{
      if(isLoggedIn)navigate("/dashboard");
    },[isLoggedIn]);
    
  return (
    <div>
      <GoogleOAuthProvider clientId="647318582878-omk6c5njf4bddspc6evu5vnjfuk75duo.apps.googleusercontent.com">
        <GoogleLogin
          onSuccess={async (credentialResponse) => {
            try {
              const token = credentialResponse.credential; // correct field
                console.log("this is the token",token);
              const response = await axios.post(
                "https://videocallbackend.dairykhatabook.online/auth/google",
                {
                  token
                }
              );

              if (response.status === 200) {
                localStorage.setItem("User",response.data.user);
                login(response.data.token);
                navigate("/");
              }
            } catch (error) {
              console.error("An error occurred while creating user:", error);
            }
          }}
          onError={() => {
            console.log("Login Failed");
          }}
        />
      </GoogleOAuthProvider>
    </div>
  );
}

export default GoogleAuth;
