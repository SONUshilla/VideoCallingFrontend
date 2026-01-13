import './App.css';
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Dashboard from './components/Dashboard.jsx';
import GoogleAuth from './components/GoogleLogin.jsx';
import Socket from './pages/Socket.jsx';
import { SocketProvider } from "./context/SocketContext.jsx";
import { LoginProvider } from './context/LoginContext.jsx';
import PrivateRoute from './context/PrivateRoute.jsx';

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
