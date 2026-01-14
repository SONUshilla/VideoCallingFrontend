import React, { useEffect, useState, useRef, useMemo, useCallback } from "react";
import VideoElement from "./VideoElement";
import { useLoginContext } from "../context/LoginContext";
import { motion, AnimatePresence } from "framer-motion";
import { 
  FaDesktop, 
  FaCompress, 
  FaExpand
} from "react-icons/fa";
import { BsGrid3X3GapFill } from "react-icons/bs";

function ScreenShareLayout({ 
  remoteStreams, 
  activeSpeaker, 
  localStream, 
  socketId, 
  userDetails,
  isAudioEnabled,
  isVideoEnabled,
  screenShareStream,
  screenSharerSocketId,
  isLocalScreenSharing
}) {
  const [users, setUsers] = useState([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  // --- NEW: UI Visibility State ---
  const [showControls, setShowControls] = useState(true);
  const controlsTimeoutRef = useRef(null);
  
  const containerRef = useRef(null);
  const { username, profilePic } = useLoginContext();

  // --- 1. Auto-Hide Logic ---
  const resetControlsTimeout = useCallback(() => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    // Hide after 3 seconds of inactivity
    controlsTimeoutRef.current = setTimeout(() => {
      setShowControls(false);
    }, 3000);
  }, []);

  // Initial timer setup
  useEffect(() => {
    resetControlsTimeout();
    return () => clearTimeout(controlsTimeoutRef.current);
  }, [resetControlsTimeout]);

  // --- 2. Get Presenter Name ---
  const presenterName = useMemo(() => {
    if (isLocalScreenSharing) return "You";
    if (userDetails && screenSharerSocketId) {
       const sharer = userDetails.get(screenSharerSocketId);
       if (sharer) return sharer.name;
    }
    return "Unknown User";
  }, [isLocalScreenSharing, screenSharerSocketId, userDetails]);

  // --- 3. Build Users List ---
  useEffect(() => {
    const buildUsersArray = () => {
      const allUsers = [];
      if (userDetails) {
        userDetails.forEach((value, id) => {
           allUsers.push({ ...value, socketId: id, isLocal: false });
        });
      }
      if (localStream && socketId) {
        allUsers.push({
          socketId,
          name: username || "Me",
          profilePic,
          stream: localStream,
          isLocal: true,
        });
      }
      return allUsers;
    };
    setUsers(buildUsersArray());
  }, [userDetails, socketId, localStream, profilePic, username]);

  // --- 4. Fullscreen Toggle ---
  const toggleFullscreen = (e) => {
    e.stopPropagation(); // Prevent triggering the hide logic immediately
    resetControlsTimeout(); // Keep controls visible when clicking
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.();
      setIsFullscreen(false);
    }
  };

  return (
    <div 
      ref={containerRef} 
      // Add listeners to the main container to detect activity
      onMouseMove={resetControlsTimeout}
      onTouchStart={resetControlsTimeout}
      onClick={resetControlsTimeout}
      className="h-[100dvh] w-full bg-[#121212] flex flex-col text-white overflow-hidden font-sans relative"
    >
      



      {/* =========================================
          MAIN CONTENT AREA
      ========================================= */}
      <div className="flex-1 flex flex-col lg:flex-row min-h-0 overflow-hidden relative">
        
        {/* --- STAGE (Screen Share) --- */}
        <div className="flex-1 bg-black relative flex items-center justify-center p-0 lg:p-4 min-w-0 min-h-0">
                {/* =========================================
          TOP CONTROL BAR (Auto-Hiding)
      ========================================= */}
      <AnimatePresence>
        {showControls && (
          <motion.div 
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -100, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="absolute top-0 left-0 right-0 h-16 bg-gradient-to-b from-black/90 to-transparent flex items-center justify-between px-4 z-50 pointer-events-none"
          >
            {/* pointer-events-none on parent allows clicking through to video
               pointer-events-auto on children re-enables clicking buttons 
            */}
            
            {/* Left: Info Badge */}
            <div className="flex items-center gap-3 pointer-events-auto bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10">
                <div className="text-red-500 animate-pulse">
                    <FaDesktop size={14} />
                </div>
                <div className="flex flex-col justify-center">
                    <span className="text-xs font-bold text-gray-100 leading-tight">
                      {isLocalScreenSharing ? "You are presenting" : `${presenterName} is presenting`}
                    </span>
                </div>
            </div>

            {/* Right: Controls */}
            <div className="flex gap-2 pointer-events-auto">
                <button 
                    onClick={(e) => { e.stopPropagation(); setIsSidebarOpen(!isSidebarOpen); }}
                    className={`p-2 rounded-lg transition-all active:scale-95 ${isSidebarOpen ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'bg-black/50 text-gray-300 border border-white/10 hover:bg-white/10'}`}
                    title="Toggle Participants"
                >
                    <BsGrid3X3GapFill size={16} />
                </button>
                <button 
                    onClick={toggleFullscreen}
                    className="p-2 bg-black/50 border border-white/10 text-gray-300 hover:bg-white/10 rounded-lg transition-all active:scale-95"
                    title="Toggle Fullscreen"
                >
                    {isFullscreen ? <FaCompress size={16} /> : <FaExpand size={16} />}
                </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
            {screenShareStream ? (
                <div className="w-full h-full flex items-center justify-center">
                    <div className="w-full h-full max-w-full max-h-full aspect-video relative rounded-lg overflow-hidden">
                        <VideoElement 
                            stream={screenShareStream}
                            // Name only shows on hover of video element now (handled by VideoElement internal hover logic usually)
                            // or we rely on the top bar for the main info.
                            name={isLocalScreenSharing ? "Your Screen" : `${presenterName}'s Screen`}
                            isLocal={false}
                            isScreenShare={true} 
                            Audio={false}
                            Video={true}
                        />
                    </div>
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center text-gray-500 opacity-60">
                    <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mb-4 animate-pulse">
                        <FaDesktop size={24} />
                    </div>
                    <p className="text-sm font-medium">Waiting for share...</p>
                </div>
            )}
        </div>

        {/* --- SIDEBAR / FILMSTRIP --- */}
        <AnimatePresence>
            {isSidebarOpen && (
                <motion.div
                    initial={window.innerWidth >= 1024 ? { width: 0, opacity: 0 } : { height: 0, opacity: 0 }}
                    animate={window.innerWidth >= 1024 ? { width: "280px", opacity: 1 } : { height: "140px", opacity: 1 }}
                    exit={window.innerWidth >= 1024 ? { width: 0, opacity: 0 } : { height: 0, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    className="
                        bg-[#1e1e1e]
                        flex-none
                        border-t lg:border-t-0 lg:border-l border-white/10
                        flex lg:flex-col flex-row
                        overflow-x-auto lg:overflow-y-auto
                        p-3 gap-3
                        z-40
                        scrollbar-thin scrollbar-thumb-gray-700
                    "
                    // Stop propagation so clicking the sidebar doesn't trigger the "Show Controls" 
                    // if you prefer, OR remove this to let sidebar clicks also wake up the UI.
                    // keeping it interactive usually feels better:
                    onClick={(e) => { e.stopPropagation(); resetControlsTimeout(); }}
                >
                    {users.map((user) => (
                        <div 
                            key={user.socketId}
                            className={`
                                relative flex-none
                                lg:w-full lg:h-[160px] 
                                w-[160px] h-full       
                                rounded-xl overflow-hidden bg-[#2c2c2c]
                                transition-all duration-300
                                ${activeSpeaker === user.socketId ? "ring-2 ring-blue-500" : "border border-white/5"}
                            `}
                        >
                            <VideoElement
                                stream={user.stream}
                                profileUrl={user.profilePic}
                                isActiveSpeaker={activeSpeaker === user.socketId}
                                socketId={user.socketId}
                                name={user.name}
                                Audio={isAudioEnabled}
                                Video={isVideoEnabled}
                                isLocal={user.isLocal}
                            />
                        </div>
                    ))}
                </motion.div>
            )}
        </AnimatePresence>

      </div>
    </div>
  );
}

export default ScreenShareLayout;