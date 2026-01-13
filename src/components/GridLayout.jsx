import React, { useEffect, useState } from "react";
import VideoElement from "./VideoElement";
import { motion } from "framer-motion";

function nextPerfectSquareRoot(n) {
  return Math.ceil(Math.sqrt(n));
}

function GridLayout() {
  const [cols, setCols] = useState(3);
  const [users, setUsers] = useState([]);
  const[isAudioEnabled,setIsAudioEnabled]=useState();
  const[isVideoEnabled,setIsVideoEnabled]=useState();
let activeSpeaker;
useEffect(()=>{
  setCols(Math.min(3,nextPerfectSquareRoot(users.length)));
},[users]);
  // 🔥 Load Dummy Users
useEffect(() => {
  const dummy = [
    { id: 1, name: "Alice", stream: null },
    { id: 2, name: "Bob", stream: null },
    { id: 3, name: "Bob", stream: null },
    { id: 4, name: "Alice", stream: null },
    { id: 5, name: "Bob", stream: null },
    { id: 6, name: "Bob", stream: null },
    { id: 7, name: "Alice", stream: null },
    { id: 8, name: "Bob", stream: null },
    { id: 9, name: "Bob", stream: null },
    { id: 1, name: "Alice", stream: null },
    { id: 2, name: "Bob", stream: null },
    { id: 3, name: "Bob", stream: null },
    { id: 4, name: "Alice", stream: null },
    { id: 5, name: "Bob", stream: null },
    { id: 6, name: "Bob", stream: null },
    { id: 7, name: "Alice", stream: null },
    { id: 8, name: "Bob", stream: null },
    { id: 9, name: "Bob", stream: null },
  ];

  let i = 0;

  const interval = setInterval(() => {
    if (i >= dummy.length) {
      clearInterval(interval);
      return;
    }

    // IMPORTANT: create a NEW array each time
    setUsers(prev => [...prev, dummy[i]]);
    i++;
  }, 2000); // try 500ms so you can SEE animation

  return () => clearInterval(interval);
}, []);



  useEffect(() => {
    const updateCols = () => {
      const width = window.innerWidth;

      if (width < 300) setCols(1);
      else if (width < 900) setCols(2);
      else if (width < 1200) setCols(3);
      else setCols(4);
    };

    updateCols(); // initial run
    window.addEventListener("resize", updateCols);
    return () => window.removeEventListener("resize", updateCols);
  }, []);
 

  return (
    <motion.div
      layout
      className="grid gap-4 min-h-screen"
      style={{ gridTemplateColumns: `repeat(${2 * cols}, 1fr)` }}
      transition={{
        layout: { duration: 0.5, ease: "easeInOut" }   // 👈 slow & visible
      }}
    >
      {users.map((user, rowIndex) => (
        users.length - (users.length % cols) === rowIndex ? (
          <motion.div
            layout
            className="layout col-span-2 h-full"
            style={{ gridColumnStart: `${cols - users.length % cols + 1}` }}
          >
            <div key={user.id } className="h-full bg-black rounded-md overflow-hidden flex items-center justify-center text-white">
            <VideoElement
                stream={user.stream}
                profileUrl={user.profilePic}
                isActiveSpeaker={user.socketId === activeSpeaker}
                socketId={user.socketId}
                name={user.name}
                Audio={isAudioEnabled}
                Video={isVideoEnabled}
                isLocal={user.isLocal || false}
              />
            </div>
          </motion.div>
        ) : (
          <motion.div
            layout
            className="layout col-span-2"
          >
            <div key={user.id }  className="h-full bg-black rounded-md overflow-hidden flex items-center justify-center text-white">
            <VideoElement
                stream={user.stream}
                profileUrl={user.profilePic}
                isActiveSpeaker={user.socketId === activeSpeaker}
                socketId={user.socketId}
                name={user.name}
                Audio={isAudioEnabled}
                Video={isVideoEnabled}
                isLocal={user.isLocal || false}
              />
            </div>
          </motion.div>
        )
      ))}
    </motion.div>
  );
  
}

export default GridLayout;
