import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion'; 
import { useSocket } from '../context/SocketContext';

// --- Icons (Inline for consistency) ---
const CloseIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>;
const SearchIcon = () => <svg className="h-5 w-5 text-[#9aa0a6] group-focus-within:text-[#e8eaed]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>;
const AddUserIcon = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /></svg>;
const MicIcon = () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>;
const DotsIcon = () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" /></svg>;
const LinkIcon = () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>;

const ParticipantsBar = ({ 
  currentUser, 
  userDetails, 
  isOpen, 
  onClose
}) => {
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isCopied, setIsCopied] = useState(false);
  
  // --- 1. Merge & Manage Users ---
  useEffect(() => {
    let allUsers = [];
    
    // Add Current User (You)
    if (currentUser) {
      allUsers.push({ ...currentUser, isLocal: true });
    }

    // Add Remote Users
    if (userDetails) {
      userDetails.forEach((user) => {
        if (user.socketId !== currentUser?.socketId) {
          allUsers.push({ ...user, isLocal: false });
        }
      });
    }

    setOnlineUsers(allUsers);
  }, [userDetails, currentUser]);

  // --- 2. Handle Search ---
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredUsers(onlineUsers);
    } else {
      const lowerTerm = searchTerm.toLowerCase();
      setFilteredUsers(
        onlineUsers.filter(user => user.name?.toLowerCase().includes(lowerTerm))
      );
    }
  }, [searchTerm, onlineUsers]);

  // --- 3. Copy Link Logic ---
  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const getInitials = (name) => (name ? name.charAt(0).toUpperCase() : "?");

  // --- Animation Variants ---
  const sidebarVariants = {
    open: { x: 0, opacity: 1, transition: { type: "spring", stiffness: 300, damping: 30 } },
    closed: { x: "100%", opacity: 0, transition: { type: "spring", stiffness: 300, damping: 30 } },
  };

  return (
    <motion.div
      initial="closed"
      animate={isOpen ? "open" : "closed"}
      variants={sidebarVariants}
      className="fixed inset-y-0 right-0 z-[60] flex flex-col w-full md:w-[360px] bg-[#202124] shadow-2xl border-l border-[#3c4043]"
    >
      
      {/* ================= HEADER ================= */}
      <div className="flex items-center justify-between px-6 py-5 bg-[#202124] border-b border-[#3c4043] shrink-0">
        <h3 className="text-[#e8eaed] font-medium text-lg tracking-wide font-sans flex items-center gap-3">
          Participants
          <span className="flex items-center justify-center min-w-[20px] h-5 px-1.5 text-xs font-bold text-[#202124] bg-[#8ab4f8] rounded-full">
            {onlineUsers.length}
          </span>
        </h3>
        
        <button
          onClick={onClose}
          className="p-2 rounded-full hover:bg-[#3c4043] text-[#9aa0a6] hover:text-[#e8eaed] transition-all"
        >
          <CloseIcon />
        </button>
      </div>

      {/* ================= SEARCH BAR ================= */}
      <div className="px-4 py-4 shrink-0">
        <div className="relative group">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <SearchIcon />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search for people"
            className="block w-full pl-10 pr-3 py-3 border border-transparent rounded-lg leading-5 bg-[#3c4043] text-[#e8eaed] placeholder-[#9aa0a6] focus:outline-none focus:bg-[#202124] focus:ring-2 focus:ring-[#8ab4f8] focus:border-transparent sm:text-sm transition-all duration-200"
          />
        </div>
      </div>

      {/* ================= LIST AREA ================= */}
      <div className="flex-1 overflow-y-auto px-2 py-2 scrollbar-thin scrollbar-thumb-[#3c4043] scrollbar-track-transparent">
        
        {/* Invite Prompt (Top of list) */}
        {!searchTerm && (
          <div className="mb-2 px-2">
              <button 
                  onClick={handleCopyLink}
                  className="w-full flex items-center gap-4 p-3 text-left rounded-lg hover:bg-[#3c4043]/50 transition-colors group border border-transparent hover:border-[#3c4043]"
              >
                  <div className="w-10 h-10 rounded-full bg-[#8ab4f8]/10 flex items-center justify-center text-[#8ab4f8] group-hover:bg-[#8ab4f8] group-hover:text-[#202124] transition-colors">
                      <AddUserIcon />
                  </div>
                  <div>
                      <p className="text-sm font-medium text-[#e8eaed]">Add people</p>
                      <p className={`text-xs transition-colors mt-0.5 ${isCopied ? 'text-green-400' : 'text-[#9aa0a6]'}`}>
                          {isCopied ? "Link copied!" : "Share joining info"}
                      </p>
                  </div>
              </button>
          </div>
        )}

        {/* Separator */}
        {filteredUsers.length > 0 && (
          <div className="px-4 py-3 text-xs font-bold text-[#9aa0a6] uppercase tracking-wider">
            In Meeting
          </div>
        )}

        {filteredUsers.length === 0 ? (
          <div className="flex flex-col items-center justify-center pt-10 opacity-60">
             <p className="text-[#9aa0a6] text-sm">No results found</p>
          </div>
        ) : (
          <div className="space-y-1">
            {filteredUsers.map((user) => (
              <div 
                key={user.socketId} 
                className="flex items-center justify-between p-2 rounded-lg hover:bg-[#3c4043]/40 transition-colors group mx-2"
              >
                <div className="flex items-center gap-3 overflow-hidden">
                  {/* Avatar */}
                  <div className="relative flex-shrink-0">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-sm font-bold text-white shadow-sm overflow-hidden border border-[#3c4043]">
                      {user.profilePic ? (
                        <img 
                          src={user.profilePic} 
                          alt={user.name} 
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextElementSibling.style.display = 'flex';
                          }}
                        />
                      ) : null}
                      <div className={`w-full h-full flex items-center justify-center bg-[#3c4043] text-[#e8eaed] ${user.profilePic ? 'hidden' : 'flex'}`}>
                          {getInitials(user.name)}
                      </div>
                    </div>
                  </div>

                  {/* Name */}
                  <div className="min-w-0 flex flex-col">
                    <p className="text-sm font-medium text-[#e8eaed] truncate max-w-[140px]">
                      {user.name}
                      {user.isLocal && <span className="text-[#9aa0a6] font-normal ml-1">(You)</span>}
                    </p>
                    {user.isHost && (
                      <span className="text-[10px] text-[#8ab4f8] bg-[#8ab4f8]/10 px-1.5 py-0.5 rounded w-fit mt-0.5">
                        Host
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions (Mic / Menu) */}
                <div className="flex items-center gap-1">
                    {/* Mic Icon */}
                    <div className="p-2 text-[#e8eaed] opacity-70">
                        <MicIcon />
                    </div>
                    
                    {/* 3 Dots Menu */}
                    {!user.isLocal && (
                        <button className="p-2 rounded-full text-[#9aa0a6] hover:text-[#e8eaed] hover:bg-[#5f6368] opacity-0 group-hover:opacity-100 transition-all focus:opacity-100">
                            <DotsIcon />
                        </button>
                    )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ================= FOOTER (Link) ================= */}
      <div className="p-4 border-t border-[#3c4043] bg-[#202124] shrink-0">
         <div className="bg-[#303134] rounded-lg p-3.5 flex flex-col gap-2 shadow-sm">
             <p className="text-xs text-[#e8eaed] font-medium px-1">Meeting Link</p>
             <div className="flex items-center gap-2 bg-[#202124] rounded border border-[#3c4043] p-1 pr-1">
                 <p className="text-xs text-[#9aa0a6] truncate flex-1 font-mono pl-2 select-all">
                    {window.location.href}
                 </p>
                 <button 
                   onClick={handleCopyLink}
                   className="text-[#8ab4f8] hover:bg-[#8ab4f8]/10 p-1.5 rounded-md transition-colors"
                   title="Copy joining link"
                 >
                    <LinkIcon />
                 </button>
             </div>
         </div>
      </div>

    </motion.div>
  );
};

export default ParticipantsBar;