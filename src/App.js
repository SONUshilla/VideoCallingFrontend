import './App.css';
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Dashboard from './components/Dashboard.jsx';
import GoogleAuth from './components/GoogleLogin.jsx';
import Socket from './pages/Socket.jsx';
import { SocketProvider } from "./context/SocketContext.jsx";
import { LoginProvider } from './context/LoginContext.jsx';
import PrivateRoute from './context/PrivateRoute.jsx';

// src/main.jsx (or index.js)

// Automatically detects if the app is built for production
if (process.env.NODE_ENV === "production") {
  // Save the original method to the window object in case you need to restore it live
  window.originalConsoleLog = console.log;
  
  // Override console.log with an empty function
  console.log = () => {};
  
  // Optional: Mute warnings too, but keep errors!
  console.warn = () => {};
  // console.error = () => {}; // Recommend keeping errors visible
}

function App() {
  return (
    <LoginProvider>
      <SocketProvider>
        <Router>
          <div className="App bg-white">
            <Routes>
              {/* Public routes */}
              <Route path="/" element={<GoogleAuth />} />   {/* Login page */}
              <Route path="/login" element={<GoogleAuth />} />

              {/* Protected routes */}
              <Route 
                path="/dashboard" 
                element={
                  <PrivateRoute>
                    <Dashboard />
                  </PrivateRoute>
                } 
              />
              <Route 
                path="/socket" 
                element={
                  <PrivateRoute>
                    <Socket />
                  </PrivateRoute>
                } 
              />
            </Routes>
          </div>
        </Router>
      </SocketProvider>
    </LoginProvider>
  );
}

export default App;
