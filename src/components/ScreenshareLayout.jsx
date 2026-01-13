import React, { useEffect, useState, useRef } from "react";
import VideoElement from "./VideoElement";
import { useLoginContext } from "../context/LoginContext";
import { motion } from "framer-motion";

import { 
  FaUsers,
  FaDesktop,
  FaExpand,
  FaCompress,
  FaChevronLeft,
  FaChevronRight
} from "react-icons/fa";

function ScreenShareLayout({ 
  remoteStreams, 
  activeSpeaker, 
  currentUser, 
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
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const screenShareRef = useRef(null);
  const { username, profilePic } = useLoginContext();

  // Build users array
  useEffect(() => {
    if (!userDetails && !localStream) return;

    const buildUsersArray = () => {
      const newUsers = new Map();

      // Add remote users from userDetails
      if (userDetails && userDetails.size > 0) {
        for (const [id, value] of userDetails.entries()) {
          if (id === screenSharerSocketId) {
            const hasWebcamStream = value.stream || remoteStreams?.get(id);
            if (hasWebcamStream) {
              newUsers.set(id, {
                ...value,
                socketId: id,
                isLocal: false,
                isScreenSharing: true
              });
            }
          } else {
            newUsers.set(id, {
              ...value,
              socketId: id,
              isLocal: false,
              isScreenSharing: false
            });
          }
        }
      }

      // Add local user
      if (localStream && socketId) {
        const shouldShowLocal = !isLocalScreenSharing || 
                               (isLocalScreenSharing && (isVideoEnabled || localStream));
        
        if (shouldShowLocal) {
          newUsers.set(socketId, {
            socketId,
            name: username || "Me",
            profilePic: profilePic || "",
            stream: localStream,
            isLocal: true,
            isScreenSharing: isLocalScreenSharing
          });
        }
      }

      return Array.from(newUsers.values());
    };

    setUsers(buildUsersArray());
  }, [
    userDetails, 
    socketId, 
    localStream, 
    profilePic, 
    username, 
    screenSharerSocketId, 
    isLocalScreenSharing, 
    remoteStreams, 
    isVideoEnabled
  ]);

  // Handle fullscreen toggle
  const toggleFullscreen = () => {
    if (!screenShareRef.current) return;

    if (!isFullscreen) {
      if (screenShareRef.current.requestFullscreen) {
        screenShareRef.current.requestFullscreen();
      } else if (screenShareRef.current.webkitRequestFullscreen) {
        screenShareRef.current.webkitRequestFullscreen();
      } else if (screenShareRef.current.msRequestFullscreen) {
        screenShareRef.current.msRequestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      } else if (document.msExitFullscreen) {
        document.msExitFullscreen();
      }
    }
  };

  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('msfullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('msfullscreenchange', handleFullscreenChange);
    };
  }, []);

  // Get screen sharer's name
  const getScreenSharerName = () => {
    if (isLocalScreenSharing) return "You";
    
    if (screenSharerSocketId) {
      const sharer = users.find(u => u.socketId === screenSharerSocketId);
      return sharer?.name || "Someone";
    }
    
    return "Someone";
  };

  // Get active speaker name
  const getActiveSpeakerName = () => {
    if (!activeSpeaker) return null;
    
    if (activeSpeaker === screenSharerSocketId) {
      return isLocalScreenSharing ? "You are speaking" : `${getScreenSharerName()} is speaking`;
    }
    
    const speaker = users.find(u => u.socketId === activeSpeaker);
    return speaker ? `${speaker.name} is speaking` : "Someone is speaking";
  };

  return (
    <div className="flex h-screen bg-gray-900 text-white overflow-hidden">
      {/* Main Screen Share Area */}
      <div 
        ref={screenShareRef}
        className={`relative ${sidebarCollapsed ? 'w-full' : 'w-3/4'} transition-all duration-300 bg-black`}
      >
        {/* Screen Share Header */}
        <div className="absolute top-0 left-0 right-0 z-50 bg-gradient-to-b from-black/90 via-black/70 to-transparent p-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-red-600 p-2 rounded-lg">
              <FaDesktop size={20} />
            </div>
            <div>
              <h2 className="font-bold text-lg">Screen Sharing</h2>
              <p className="text-gray-300 text-sm">
                {getScreenSharerName()} is presenting
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Participants Count */}
            <div className="flex items-center gap-2 bg-gray-800/90 px-4 py-2 rounded-lg">
              <FaUsers size={18} />
              <span className="font-semibold">{users.length}</span>
              <span className="text-gray-400 text-sm">participants</span>
            </div>
            
            {/* Fullscreen Toggle */}
            <button
              onClick={toggleFullscreen}
              className="flex items-center gap-2 px-4 py-2 bg-gray-800/90 hover:bg-gray-700/90 rounded-lg transition-colors"
            >
              {isFullscreen ? (
                <>
                  <FaCompress size={16} />
                  <span>Exit Fullscreen</span>
                </>
              ) : (
                <>
                  <FaExpand size={16} />
                  <span>Fullscreen</span>
                </>
              )}
            </button>
            
            {/* Toggle Sidebar */}
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="p-3 bg-gray-800/90 hover:bg-gray-700/90 rounded-lg transition-colors"
              title={sidebarCollapsed ? "Show participants" : "Hide participants"}
            >
              {sidebarCollapsed ? <FaChevronLeft size={18} /> : <FaChevronRight size={18} />}
            </button>
          </div>
        </div>

        {/* Screen Share Video Area */}
        <div className="h-full flex items-center justify-center p-4 pt-20">
          {screenShareStream ? (
            <div className="relative w-full h-full max-w-7xl">
              <VideoElement
                stream={screenShareStream}
                isActiveSpeaker={screenSharerSocketId === activeSpeaker}
                socketId={screenSharerSocketId}
                name={`${getScreenSharerName()}'s Screen`}
                Audio={false}
                Video={true}
                isLocal={isLocalScreenSharing}
                isScreenShare={true}
                className="rounded-xl shadow-2xl"
              />
              

            </div>
          ) : (
            <div className="text-center p-8">
              <div className="bg-gray-800/50 p-8 rounded-2xl inline-block">
                <FaDesktop size={80} className="mx-auto mb-6 text-gray-600" />
                <h3 className="text-2xl font-bold mb-3">No Screen Sharing</h3>
                <p className="text-gray-400 max-w-md">
                  Waiting for someone to share their screen. <br />
                  The screen share will appear here automatically.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Controls */}
        <div className="absolute bottom-0 left-0 right-0  bg-gradient-to-t from-black/90 via-black/70 to-transparent p-4">
          <div className="flex justify-between items-center">
            {/* Active Speaker Indicator */}
            {activeSpeaker && (
              <div className="flex items-center gap-3 bg-gray-800/90 px-4 py-3 rounded-lg">
                <div className="relative">
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                  <div className="absolute inset-0 bg-green-500 rounded-full animate-ping opacity-75"></div>
                </div>
                <span className="font-medium">{getActiveSpeakerName()}</span>
              </div>
            )}
            
            {/* Connection Status */}
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>Screen sharing connection active</span>
            </div>
          </div>
        </div>
      </div>

      {/* Participants Sidebar */}
      {!sidebarCollapsed && (
        <motion.div 
          initial={{ x: 20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 20, opacity: 0 }}
          className="w-1/4 border-l border-gray-800 bg-gray-900/95 backdrop-blur-sm flex flex-col"
        >
          {/* Sidebar Header */}
          <div className="p-6 border-b border-gray-800">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-xl flex items-center gap-3">
                <FaUsers size={20} />
                Participants
              </h3>
              <div className="bg-blue-600 text-white text-sm font-bold px-3 py-1 rounded-full">
                {users.length}
              </div>
            </div>
            <p className="text-gray-400 text-sm mt-2">
              People in this meeting
            </p>
          </div>

          {/* Participants List */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-4 space-y-4">
              {/* Screen Sharer Section (if in sidebar) */}
              {screenSharerSocketId && users.some(u => u.socketId === screenSharerSocketId) && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-400 mb-3 uppercase tracking-wider">
                    Presenter
                  </h4>
                  <div className="relative group">
                    <div className="absolute -top-2 left-2 z-20 bg-red-600 text-xs px-3 py-1.5 rounded-lg flex items-center gap-2 font-bold shadow-lg">
                      <FaDesktop size={12} />
                      <span>PRESENTING</span>
                    </div>
                    {users
                      .filter(u => u.socketId === screenSharerSocketId)
                      .map(user => (
                        <VideoElement
                          key={user.socketId}
                          stream={user.stream}
                          profileUrl={user.profilePic}
                          isActiveSpeaker={user.socketId === activeSpeaker}
                          socketId={user.socketId}
                          name={user.name}
                          Audio={isAudioEnabled}
                          Video={isVideoEnabled}
                          isLocal={user.isLocal}
                          isScreenSharing={user.isScreenSharing}
                          className="border-2 border-red-500 shadow-lg"
                          compact={true}
                        />
                      ))}
                  </div>
                </div>
              )}

              {/* Other Participants */}
              {users.filter(u => u.socketId !== screenSharerSocketId).length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-400 mb-3 uppercase tracking-wider">
                    Participants
                  </h4>
                  <div className="space-y-3">
                    {users
                      .filter(u => u.socketId !== screenSharerSocketId)
                      .map(user => (
                        <VideoElement
                          key={user.socketId}
                          stream={user.stream}
                          profileUrl={user.profilePic}
                          isActiveSpeaker={user.socketId === activeSpeaker}
                          socketId={user.socketId}
                          name={user.name}
                          Audio={isAudioEnabled}
                          Video={isVideoEnabled}
                          isLocal={user.isLocal}
                          compact={true}
                          className="hover:border-gray-600 transition-colors"
                        />
                      ))}
                  </div>
                </div>
              )}

              {/* Empty State */}
              {users.length === 0 && (
                <div className="text-center py-12">
                  <FaUsers size={64} className="mx-auto mb-6 text-gray-700" />
                  <h4 className="text-lg font-semibold mb-2">No other participants</h4>
                  <p className="text-gray-500 text-sm">
                    You're the only one here. <br />
                    Invite others to join the meeting.
                  </p>
                </div>
              )}
            </div>
          </div>


        </motion.div>
      )}

      {/* Collapsed Sidebar Button */}
      {sidebarCollapsed && (
        <button
          onClick={() => setSidebarCollapsed(false)}
          className="absolute right-0 top-1/2 transform -translate-y-1/2 bg-gray-900/80 hover:bg-gray-800 p-3 rounded-l-lg transition-colors z-40"
        >
          <FaChevronLeft size={20} />
        </button>
      )}
    </div>
  );
}

export default ScreenShareLayout;