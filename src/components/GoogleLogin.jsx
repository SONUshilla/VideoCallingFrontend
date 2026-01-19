import { GoogleOAuthProvider, GoogleLogin } from "@react-oauth/google";
import React, { useEffect } from "react";
import axios from "axios";
import { useNavigate, useLocation } from "react-router-dom";
import { useLoginContext } from "../context/LoginContext";

// --- Simple Logo Icon ---
const VideoLogo = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-600">
    <path d="m22 8-6 4 6 4V8Z" />
    <rect width="14" height="12" x="2" y="6" rx="2" ry="2" />
  </svg>
);

function GoogleAuth() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isLoggedIn } = useLoginContext();

  // --- Logic Preserved Exactly as Before ---
  const handleRedirect = () => {
    const origin = location.state?.from?.pathname || "/dashboard";
    const search = location.state?.from?.search || "";
    navigate(origin + search, { replace: true });
  };

  useEffect(() => {
    if (isLoggedIn) {
      handleRedirect();
    }
  }, [isLoggedIn]);

  // --- New UI Layout ---
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 sm:px-6 lg:px-8 font-sans text-gray-900">
      
      {/* Main Card Container */}
      <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-2xl shadow-xl border border-gray-100">
        
        {/* Header Section */}
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-blue-50 rounded-2xl">
              <VideoLogo />
            </div>
          </div>
          <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">
            Welcome to ZoomClone
          </h2>
          <p className="mt-2 text-sm text-gray-500">
            Seamless video meetings for everyone. <br/>
            Sign in to start or join a meeting.
          </p>
        </div>

        {/* Divider */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">Continue with</span>
          </div>
        </div>

        {/* Google Login Button Container */}
        <div className="flex justify-center mt-6">
          <GoogleOAuthProvider clientId={process.env.REACT_APP_CLIENT_ID}>
            <GoogleLogin
              theme="filled_blue"
              size="large"
              width="300"
              shape="pill"
              logo_alignment="left"
              onSuccess={async (credentialResponse) => {
                try {
                  const token = credentialResponse.credential;
                  console.log("Token received:", token);
                  
                  const response = await axios.post(
                    `${process.env.REACT_APP_BACKEND_URL}/auth/google`,
                    { token }
                  );

                  if (response.status === 200) {
                    localStorage.setItem("User", response.data.user);
                    login(response.data.token);
                    handleRedirect(); 
                  }
                } catch (error) {
                  console.error("Login Error:", error);
                }
              }}
              onError={() => {
                console.log("Login Failed");
              }}
            />
          </GoogleOAuthProvider>
        </div>

        {/* Footer Text */}
        <p className="mt-8 text-center text-xs text-gray-400">
          By signing in, you agree to our Terms of Service and Privacy Policy.
        </p>
      </div>
    </div>
  );
}

export default GoogleAuth;