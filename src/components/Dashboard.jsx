import React, { useEffect, useState } from 'react';
import { useSocket } from '../context/SocketContext';
import { useNavigate } from "react-router-dom";
import { useLoginContext } from '../context/LoginContext';

// --- Icons ---
const VideoIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m22 8-6 4 6 4V8Z"/><rect width="14" height="12" x="2" y="6" rx="2" ry="2"/></svg>
);
const KeyboardIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2" ry="2"/><path d="M6 8h.001"/><path d="M10 8h.001"/><path d="M14 8h.001"/><path d="M18 8h.001"/><path d="M6 12h.001"/><path d="M10 12h.001"/><path d="M14 12h.001"/><path d="M18 12h.001"/><path d="M7 16h10"/></svg>
);
const CopyIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
);
const CheckIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
);
const PlusIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
);

const Dashboard = () => {
  const [meetingLink, setMeetingLink] = useState('');
  const [meetingId, setMeetingId] = useState('');
  const [showMeetingCreated, setShowMeetingCreated] = useState(false);
  
  // Join Input State
  const [joinMeetingId, setJoinMeetingId] = useState('');
  
  // Copy States
  const [isLinkCopied, setIsLinkCopied] = useState(false);
  const [isIdCopied, setIsIdCopied] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const navigate = useNavigate();
  let socketRef = useSocket();
  let { isLoggedIn, username, profilePic } = useLoginContext();
  const [socket, setSocket] = useState();

  useEffect(() => {
    if (!isLoggedIn) navigate("/login");
  }, [isLoggedIn, navigate]);

  useEffect(() => {
    if (socketRef) setSocket(socketRef);
  }, [socketRef]);

  // --- Create Meeting ---
  const createMeeting = () => {
    if (!socket) return;
    setIsLoading(true);
    socket.emit("createMeeting", (response) => {
      setIsLoading(false);
      if (response.error) return console.error(response.error);
      
      const mId = response.meetingId;
      setMeetingId(mId);
      // Dynamically uses current origin (localhost or production domain)
      setMeetingLink(`${window.location.origin}/meeting?meetingId=${mId}`);
      setShowMeetingCreated(true);
    });
  };

  // --- Copy Logic (Separated) ---
  const copyToClipboard = async (text, type) => {
    try {
      await navigator.clipboard.writeText(text);
      if (type === 'link') {
        setIsLinkCopied(true);
        setTimeout(() => setIsLinkCopied(false), 2000);
      } else {
        setIsIdCopied(true);
        setTimeout(() => setIsIdCopied(false), 2000);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // --- Smart Input Handler ---
  // If user pastes a full URL, we extract just the ID
  const handleJoinInputChange = (e) => {
    const value = e.target.value;
    try {
      // Attempt to check if it's a URL
      const url = new URL(value);
      const idParam = url.searchParams.get("meetingId");
      if (idParam) {
        setJoinMeetingId(idParam);
      } else {
        setJoinMeetingId(value);
      }
    } catch (err) {
      // Not a URL, just set the text
      setJoinMeetingId(value);
    }
  };

  const joinMeeting = async () => {
    if (!socket) return;
    await socket.emit("joinRoom", { roomId: meetingId }, () => navigate("/socket"));
  };

  const joinMeetingWithId = async () => {
    if (!joinMeetingId || (!socket && username)) return;
    await socket.emit("joinRoom", { roomId: joinMeetingId, name: username, profilePic }, () => navigate("/socket"));
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans">
      
      {/* --- Navbar --- */}
      <nav className="sticky top-0 z-50 bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">Z</div>
              <span className="font-semibold text-lg tracking-tight">ZoomClone</span>
            </div>
            
            <div className="flex items-center gap-3 pl-4 border-l border-gray-200 ml-4">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-gray-900">{username}</p>
                <p className="text-xs text-gray-500">Free Account</p>
              </div>
              <img 
                src={profilePic || "https://via.placeholder.com/40"} 
                alt="Profile" 
                className="h-9 w-9 rounded-full bg-gray-200 border border-gray-200 object-cover"
              />
            </div>
          </div>
        </div>
      </nav>

      {/* --- Main Content --- */}
      <main className="max-w-5xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        
        <div className="mb-10 text-center md:text-left">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 mt-1">Manage your meetings and connections.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* 1. Create Meeting Card */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col overflow-hidden">
            <div className="p-6 flex-1">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                  <VideoIcon />
                </div>
                <h2 className="text-lg font-semibold text-gray-900">New Meeting</h2>
              </div>
              <p className="text-gray-500 text-sm mb-6">
                Create a new meeting instantly. Share the code or the full link.
              </p>

              {!showMeetingCreated ? (
                <div className="mt-auto">
                   <button
                    onClick={createMeeting}
                    disabled={isLoading}
                    className="w-full h-12 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-medium rounded-lg transition-colors focus:ring-4 focus:ring-blue-100 disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {isLoading ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <PlusIcon /> Start Meeting
                      </>
                    )}
                  </button>
                </div>
              ) : (
                /* Success State - Split View */
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className="p-4 bg-green-50 border border-green-100 rounded-lg space-y-3">
                    <div className="flex items-center gap-2 text-green-700 font-medium text-sm">
                      <CheckIcon /> Meeting Ready
                    </div>
                    
                    {/* Row 1: Meeting Code (Primary for joining manually) */}
                    <div>
                      <p className="text-xs text-green-700 font-semibold mb-1 uppercase tracking-wider">Meeting Code</p>
                      <div className="flex gap-2">
                        <code className="flex-1 bg-white border border-green-200 text-gray-900 font-bold text-lg p-2 rounded text-center tracking-widest">
                          {meetingId}
                        </code>
                        <button
                          onClick={() => copyToClipboard(meetingId, 'id')}
                          className="flex-shrink-0 px-3 flex items-center justify-center bg-white border border-green-200 text-green-700 hover:bg-green-100 rounded transition-colors"
                          title="Copy ID"
                        >
                          {isIdCopied ? <CheckIcon /> : <CopyIcon />}
                        </button>
                      </div>
                    </div>

                    {/* Row 2: Full Link (Secondary for sharing) */}
                    <div>
                      <p className="text-xs text-green-700 font-semibold mb-1 uppercase tracking-wider">Invite Link</p>
                      <div className="flex gap-2">
                        <input 
                          readOnly 
                          value={meetingLink} 
                          className="flex-1 bg-white/50 border border-green-200 text-green-800 text-xs p-2 rounded truncate"
                        />
                        <button
                          onClick={() => copyToClipboard(meetingLink, 'link')}
                          className="flex-shrink-0 px-3 flex items-center justify-center bg-white border border-green-200 text-green-700 hover:bg-green-100 rounded transition-colors"
                          title="Copy Link"
                        >
                          {isLinkCopied ? <CheckIcon /> : <CopyIcon />}
                        </button>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => joinMeeting()}
                    className="w-full h-12 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors shadow-sm"
                  >
                    Join Now
                  </button>
                </div>
              )}
            </div>
            <div className="h-1.5 w-full bg-gradient-to-r from-blue-500 to-blue-600"></div>
          </div>

          {/* 2. Join Meeting Card */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col overflow-hidden">
            <div className="p-6 flex-1">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
                  <KeyboardIcon />
                </div>
                <h2 className="text-lg font-semibold text-gray-900">Join Meeting</h2>
              </div>
              <p className="text-gray-500 text-sm mb-6">
                Enter the <strong>Meeting ID</strong> or paste the <strong>Full Link</strong> below.
              </p>

              <div className="mt-auto space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5 uppercase tracking-wide">
                    Meeting ID / Link
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 123-456-789 or http://..."
                    value={joinMeetingId}
                    onChange={handleJoinInputChange}
                    className="w-full h-12 px-4 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  />
                </div>
                
                <button
                  onClick={joinMeetingWithId}
                  disabled={!joinMeetingId}
                  className="w-full h-12 bg-white border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 active:bg-gray-100 transition-colors focus:ring-4 focus:ring-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Join Meeting
                </button>
              </div>
            </div>
            <div className="h-1.5 w-full bg-gradient-to-r from-purple-500 to-purple-600"></div>
          </div>

        </div>
      </main>
    </div>
  );
};

export default Dashboard;