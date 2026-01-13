import { useEffect, useRef, useState } from "react";
import { useSocket } from "../context/SocketContext.jsx";

export function useChat({ currentUser, userDetails }) {
  const socket = useSocket();
  const typingTimeoutRef = useRef(null);

  const [messages, setMessages] = useState([]);
  const [typingUsers, setTypingUsers] = useState(new Set());

  useEffect(() => {
    if (!socket || !currentUser) return;

    const handleReceiveMessage = (data) => {
      const user = userDetails?.get(data.senderId);

      setMessages((prev) => [
        ...prev,
        {
          id: Date.now(),
          text: data.message,
          sender: data.senderId,
          username: user?.name || data.username,
          userDp: user?.profilePic || data.userDp,
          type: "message",
          timestamp: data.timestamp || new Date().toISOString(),
        },
      ]);
    };

    const handleTyping = ({ senderId }) => {
      if (senderId !== currentUser.socketId) {
        setTypingUsers((prev) => new Set(prev).add(senderId));
      }
    };

    const handleStopTyping = ({ senderId }) => {
      setTypingUsers((prev) => {
        const next = new Set(prev);
        next.delete(senderId);
        return next;
      });
    };

    socket.on("receive_message", handleReceiveMessage);
    socket.on("user_typing", handleTyping);
    socket.on("user_stopped_typing", handleStopTyping);

    return () => {
      socket.off("receive_message", handleReceiveMessage);
      socket.off("user_typing", handleTyping);
      socket.off("user_stopped_typing", handleStopTyping);
    };
  }, [socket, currentUser, userDetails]);

  const sendMessage = (text) => {
    if (!text.trim() || !socket || !currentUser) return;

    const payload = {
      message: text,
      senderId: currentUser.socketId,
      username: currentUser.name,
      userDp: currentUser.profilePic,
      timestamp: new Date().toISOString(),
    };

    socket.emit("send_message", payload);

    setMessages((prev) => [
      ...prev,
      {
        id: Date.now(),
        text,
        sender: currentUser.socketId,
        username: currentUser.name,
        userDp: currentUser.profilePic,
        type: "message",
        timestamp: payload.timestamp,
      },
    ]);
  };

  const startTyping = () => {
    if (!socket || !currentUser) return;

    socket.emit("typing", {
      senderId: currentUser.socketId,
    });

    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(stopTyping, 2000);
  };

  const stopTyping = () => {
    if (!socket || !currentUser) return;

    socket.emit("stop_typing", {
      senderId: currentUser.socketId,
    });

    clearTimeout(typingTimeoutRef.current);
  };

  return {
    messages,
    typingUsers,
    sendMessage,
    startTyping,
    stopTyping,
  };
}
