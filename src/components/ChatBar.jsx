import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const ChatBar = ({
  isOpen,
  onClose,
  messages = [],
  typingUsers = new Set(),
  sendMessage,
  startTyping,
  stopTyping,
  currentUser,
  userDetails,
}) => {
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const [newMessage, setNewMessage] = useState("");

  /* ---------------- Scroll Handling ---------------- */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typingUsers, isOpen]);

  /* ---------------- Focus Handling ---------------- */
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  /* ---------------- Helpers ---------------- */
  const formatTime = (timestamp) =>
    new Date(timestamp).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

  const getSenderInfo = (senderId) => {
    if (senderId === "system") return { name: "System", profilePic: null };
    if (senderId === currentUser?.socketId) return currentUser;
    return userDetails?.get(senderId) || { name: "Unknown", profilePic: null };
  };

  const getInitials = (name) => (name ? name.charAt(0).toUpperCase() : "?");

  /* ---------------- Handlers ---------------- */
  const handleChange = (e) => {
    setNewMessage(e.target.value);
    startTyping();
  };

  const handleSend = (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    sendMessage(newMessage);
    setNewMessage("");
    stopTyping();
    // Keep focus on input after sending
    inputRef.current?.focus();
  };

  /* ---------------- Status Logic Fix ---------------- */
  const getStatusText = () => {
    if (!userDetails) return "Connecting...";
    if (userDetails.size <= 1) return "You are the only one here";
    return `${userDetails.size} participants`;
  };

  /* ---------------- Animation Variants ---------------- */
  const sidebarVariants = {
    open: { x: 0, opacity: 1, transition: { type: "spring", stiffness: 260, damping: 30 } },
    closed: { x: "100%", opacity: 0, transition: { type: "spring", stiffness: 260, damping: 30 } },
  };

  return (
    <motion.div
      initial="closed"
      animate={isOpen ? "open" : "closed"}
      variants={sidebarVariants}
      className="fixed inset-y-0 right-0 z-[60] flex flex-col w-full md:w-[380px] bg-[#202124] shadow-2xl border-l border-[#3c4043]"
    >
      {/* ================= HEADER ================= */}
      <div className="flex items-center justify-between px-5 py-4 bg-[#202124] border-b border-[#3c4043] shadow-sm z-10">
        <div>
          <h3 className="text-[#e8eaed] font-medium text-lg tracking-wide font-sans">In-call messages</h3>
          <div className="flex items-center gap-2 mt-1">
            {/* Status Dot */}
            <span className={`w-2 h-2 rounded-full ${userDetails?.size > 0 ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]" : "bg-yellow-500"}`}></span>
            <p className="text-xs text-[#9aa0a6] font-medium">
              {getStatusText()}
            </p>
          </div>
        </div>
        
        <button
          onClick={onClose}
          className="p-2 rounded-full hover:bg-[#3c4043] text-[#9aa0a6] hover:text-[#e8eaed] transition-colors"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        </button>
      </div>

      {/* ================= MESSAGES LIST ================= */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5 bg-[#202124]">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-[#9aa0a6] opacity-70">
            <div className="bg-[#3c4043] p-4 rounded-full mb-3">
              <svg className="w-8 h-8 text-[#e8eaed]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
            </div>
            <p className="text-sm font-medium">Messages can only be seen</p>
            <p className="text-sm">by people in the call</p>
          </div>
        )}

        {messages.map((msg, index) => {
          if (msg.type === "system") {
            return (
              <div key={msg.id || index} className="flex justify-center my-2">
                <span className="bg-[#3c4043] text-[#9aa0a6] text-[11px] px-3 py-1 rounded-full font-medium">
                  {msg.text}
                </span>
              </div>
            );
          }

          const isMe = msg.sender === currentUser?.socketId;
          const sender = getSenderInfo(msg.sender);
          const showAvatar = !isMe && (index === 0 || messages[index - 1].sender !== msg.sender);

          return (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              key={msg.id || index}
              className={`flex w-full ${isMe ? "justify-end" : "justify-start"}`}
            >
              <div className={`flex max-w-[85%] ${isMe ? "flex-row-reverse" : "flex-row"} gap-3`}>
                
                {/* Avatar */}
                {!isMe && (
                  <div className="flex-shrink-0 w-8 h-8 mt-1">
                    {showAvatar ? (
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-xs text-white font-bold shadow-md ring-2 ring-[#202124]">
                        {sender.profilePic ? (
                          <img src={sender.profilePic} alt={sender.name} className="w-full h-full object-cover rounded-full" />
                        ) : (
                          getInitials(sender.name)
                        )}
                      </div>
                    ) : (
                      <div className="w-8" />
                    )}
                  </div>
                )}

                {/* Bubble Container */}
                <div className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                  {!isMe && showAvatar && (
                    <div className="flex items-center gap-2 mb-1 ml-1">
                      <span className="text-[12px] font-semibold text-[#e8eaed]">{sender.name}</span>
                      <span className="text-[10px] text-[#9aa0a6]">{formatTime(msg.timestamp)}</span>
                    </div>
                  )}

                  <div
                    className={`
                      px-4 py-2.5 rounded-2xl text-[14px] leading-relaxed shadow-sm break-words relative
                      ${isMe 
                        ? "bg-[#8ab4f8] text-[#202124] rounded-tr-sm font-medium" // High contrast "Me" bubble
                        : "bg-[#3c4043] text-[#e8eaed] rounded-tl-sm border border-[#5f6368]/30" // Dark grey "Other" bubble
                      }
                    `}
                  >
                    {msg.text}
                    {isMe && (
                       // Timestamp inside sent bubble
                      <div className="text-[9px] text-[#202124]/70 text-right -mb-1 mt-1 font-bold">
                        {formatTime(msg.timestamp)}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
        
        {/* Typing Indicator */}
        {typingUsers.size > 0 && (
          <div className="flex items-center gap-2 ml-11">
             <div className="flex space-x-1 bg-[#3c4043] px-3 py-2 rounded-2xl rounded-tl-sm border border-[#5f6368]/30">
                <div className="w-1.5 h-1.5 bg-[#9aa0a6] rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                <div className="w-1.5 h-1.5 bg-[#9aa0a6] rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                <div className="w-1.5 h-1.5 bg-[#9aa0a6] rounded-full animate-bounce"></div>
             </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* ================= INPUT AREA (Google Meet Style) ================= */}
      <div className="p-4 bg-[#202124] pb-6">
        <form
          onSubmit={handleSend}
          className={`
            relative flex items-center gap-3 rounded-full px-4 py-3 transition-all duration-300
            bg-[#3c4043] border border-transparent
            focus-within:bg-[#202124] focus-within:border-[#8ab4f8] focus-within:shadow-[0_0_0_1px_#8ab4f8]
          `}
        >
          <input
            ref={inputRef}
            value={newMessage}
            onChange={handleChange}
            onBlur={stopTyping}
            placeholder="Send a message"
            className="flex-1 bg-transparent border-none outline-none text-[#e8eaed] text-sm placeholder-[#9aa0a6]"
            autoComplete="off"
          />
          <button
            type="submit"
            disabled={!newMessage.trim()}
            className={`
              p-1.5 rounded-full flex items-center justify-center transition-all duration-200
              ${newMessage.trim() 
                ? "text-[#8ab4f8] hover:bg-[#8ab4f8]/10 cursor-pointer transform scale-100 opacity-100" 
                : "text-[#9aa0a6] cursor-not-allowed transform scale-90 opacity-60"
              }
            `}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13"></line>
              <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
            </svg>
          </button>
        </form>
      </div>
    </motion.div>
  );
};

export default ChatBar;