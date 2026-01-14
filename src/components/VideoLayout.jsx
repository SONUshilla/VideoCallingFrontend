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
  
  // Layout state 
  const [layout, setLayout] = useState({ 
    basis: "100%", 
    height: "100%" // Changed from maxHeight to strict height
  });

  // --- 1. User List Management ---
  useEffect(() => {
    setUsers(() => {
      const newUsers = [];
      if (localStream && socketId) {
        newUsers.push({
          socketId,
          name: username || "Me",
          profilePic,
          stream: localStream,
          isLocal: true
        });
      }
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

  // --- 2. Precise Layout Calculator ---
  useEffect(() => {
    const count = users.length;
    const isMobile = window.innerWidth < 640;
    const gap = "1rem"; // gap-4 is 1rem (16px)

    let newLayout = { basis: "100%", height: "100%" };

    if (isMobile) {
      if (count === 1) {
        // 1 User: Full
        newLayout = { basis: "100%", height: "100%" };
      } 
      else if (count === 2) {
        // 2 Users: 1x2 (Stacked vertically)
        // Height: (100% space - 1 gap) / 2
        newLayout = { basis: "100%", height: `calc((100% - ${gap}) / 2)` };
      } 
      else if (count === 3) {
        // 3 Users: 1x3 (Stacked vertically)
        // Height: (100% space - 2 gaps) / 3
        newLayout = { basis: "100%", height: `calc((100% - 2 * ${gap}) / 3)` };
      } 
      else if (count === 4) {
        // 4 Users: 2x2 (Grid)
        // Width: (100% - 1 gap) / 2
        // Height: (100% - 1 gap) / 2
        newLayout = { 
          basis: `calc((100% - ${gap}) / 2)`, 
          height: `calc((100% - ${gap}) / 2)` 
        };
      } 
      else if (count >= 5) {
        // 5 Users: 2x2 + 1 (Grid, 3 rows total)
        // Width: Same as 2x2
        // Height: (100% - 2 gaps) / 3 (because it takes 3 rows to show 5 items)
        newLayout = { 
          basis: `calc((100% - ${gap}) / 2)`, 
          height: `calc((100% - 2 * ${gap}) / 3)` 
        };
      }
    } else {
      // Desktop Logic (Standard Grid)
      if (count === 1) newLayout = { basis: "100%", height: "100%" };
      else if (count === 2) newLayout = { basis: `calc((100% - ${gap}) / 2)`, height: "100%" };
      else if (count <= 4) newLayout = { basis: `calc((100% - ${gap}) / 2)`, height: `calc((100% - ${gap}) / 2)` };
      else if (count <= 6) newLayout = { basis: `calc((100% - 2 * ${gap}) / 3)`, height: `calc((100% - ${gap}) / 2)` };
      else newLayout = { basis: `calc((100% - 2 * ${gap}) / 3)`, height: `calc((100% - 2 * ${gap}) / 3)` };
    }

    setLayout(newLayout);
  }, [users.length]);

  return (
    // P-4 adds padding around the edges.
    // Flex-wrap handles the grid.
    // Content-center ensures if there is slight space left, it centers vertically.
    <div className="h-[100dvh] w-full bg-[#202124] p-4 box-border overflow-hidden">
      <motion.div
        layout
        className="
          flex flex-wrap 
          justify-center content-center 
          gap-4
          w-full h-full
        "
      >
        <AnimatePresence mode="popLayout">
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
                height: layout.height, // Strict height to force the calc() logic
                width: layout.basis
              }}
              className="relative flex-grow-0 flex-shrink-0"
            >
              <div className={`
                w-full h-full rounded-xl overflow-hidden shadow-lg 
                ${user.socketId === activeSpeaker ? "ring-2 ring-blue-500" : "border border-white/10"}
              `}>
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