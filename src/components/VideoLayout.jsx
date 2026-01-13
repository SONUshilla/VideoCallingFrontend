import React, { useEffect, useState } from "react";
import VideoElement from "./VideoElement";
import { useLoginContext } from "../context/LoginContext";
import { motion, AnimatePresence } from "framer-motion";

function VideoLayout({ 
  remoteStreams, 
  activeSpeaker, 
  localStream, 
  socketId, 
  userDetails, 
  isAudioEnabled, 
  isVideoEnabled 
}) {
  const [users, setUsers] = useState([]);
  const { username, profilePic } = useLoginContext();
  
  // Layout state to control sizing
  const [layout, setLayout] = useState({ 
    basis: "100%", // Width of each tile
    maxWidth: "100%", 
    maxHeight: "100%" 
  });

  // --- 1. User List Management ---
  useEffect(() => {
    setUsers(() => {
      const newUsers = [];
      
      // Add Local User
      if (localStream && socketId) {
        newUsers.push({
          socketId,
          name: username || "Me",
          profilePic,
          stream: localStream,
          isLocal: true
        });
      }

      // Add Remote Users
      if (userDetails) {
        userDetails.forEach((value, id) => {
          if (id !== socketId) {
            newUsers.push({ ...value, socketId: id, isLocal: false });
          }
        });
      }
      return newUsers;
    });
  }, [userDetails, socketId, localStream, profilePic, username]);

  // --- 2. Smart Layout Calculator (Google Meet Style) ---
  useEffect(() => {
    const count = users.length;
    const isMobile = window.innerWidth < 640;
    
    // Default: Full screen spotlight
    let newLayout = { basis: "100%", maxWidth: "900px", maxHeight: "100%" };

    if (isMobile) {
      if (count > 2) newLayout = { basis: "46%", maxWidth: "50%", maxHeight: "25%" }; // 2 cols on mobile
      else if (count === 2) newLayout = { basis: "100%", maxWidth: "100%", maxHeight: "48%" }; // Stacked
    } else {
      // Desktop Logic
      if (count === 1) {
        newLayout = { basis: "100%", maxWidth: "1000px", maxHeight: "100%" };
      } else if (count === 2) {
        newLayout = { basis: "48%", maxWidth: "48%", maxHeight: "100%" }; // Side-by-side
      } else if (count <= 4) {
        newLayout = { basis: "48%", maxWidth: "48%", maxHeight: "48%" }; // 2x2
      } else if (count <= 6) {
        newLayout = { basis: "32%", maxWidth: "32%", maxHeight: "48%" }; // 3x2 (Google Meet style)
      } else if (count <= 9) {
        newLayout = { basis: "32%", maxWidth: "32%", maxHeight: "32%" }; // 3x3
      } else {
        newLayout = { basis: "24%", maxWidth: "24%", maxHeight: "24%" }; // 4x4
      }
    }

    setLayout(newLayout);
  }, [users.length]);

  return (
    <div className="h-[100dvh] w-full bg-[#202124] flex items-center justify-center p-4 overflow-hidden relative">
      <motion.div
        layout
        className="
          flex flex-wrap 
          justify-center items-center content-center
          gap-4
          w-full h-full
        "
      >
        <AnimatePresence>
          {users.map((user) => (
            <motion.div
              key={user.socketId}
              layout
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.5 }}
              transition={{ duration: 0.3 }}
              style={{
                flexBasis: layout.basis,
                maxWidth: layout.maxWidth,
                maxHeight: layout.maxHeight // Helps keeping aspect ratio on specific screens
              }}
              className={`
                relative
                aspect-video
                flex-grow-0 flex-shrink-0
                min-w-[200px]
              `}
            >
              <div className={`w-full h-full rounded-xl overflow-hidden shadow-lg transition-all duration-300
                 ${user.socketId === activeSpeaker ? "ring-2 ring-blue-500" : "border border-white/10"}`
              }>
                <VideoElement
                  stream={user.stream}
                  profileUrl={user.profilePic}
                  isActiveSpeaker={user.socketId === activeSpeaker}
                  socketId={user.socketId}
                  name={user.name}
                  Audio={isAudioEnabled} 
                  Video={isVideoEnabled} 
                  isLocal={user.isLocal}
                />
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

export default VideoLayout;