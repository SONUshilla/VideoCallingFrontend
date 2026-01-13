import React, { useState, useEffect, useRef } from 'react';
import { 
  MdMic, 
  MdMicOff, 
  MdVideocam, 
  MdVideocamOff, 
  MdCallEnd,
  MdScreenShare,
  MdStopScreenShare,
  MdPeople,
  MdChat,
  MdMoreVert,
  MdSettings
} from 'react-icons/md';
import { 
  PiSpeakerHighFill, 
  PiSpeakerNoneFill 
} from 'react-icons/pi';

const ControlBar = ({ 
  isAudioEnabled, 
  isVideoEnabled, 
  onToggleAudio, 
  onToggleVideo,
  onLeaveCall,
  onScreenShare,
  isScreenSharing,
  participantsCount = 0,
  onToggleParticipants,
  onToggleChat
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const [isHovered, setIsHovered] = useState(false);
  const [showMoreOptions, setShowMoreOptions] = useState(false);
  const timeoutRef = useRef(null);
  const controlBarRef = useRef(null);

  // Auto-hide functionality
  useEffect(() => {
    const handleMouseMove = () => {
      setIsVisible(true);
      resetTimer();
    };

    const resetTimer = () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => {
        if (!isHovered && !showMoreOptions) {
          setIsVisible(false);
        }
      }, 3000); // Hide after 3 seconds of inactivity
    };

    document.addEventListener('mousemove', handleMouseMove);
    resetTimer();

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [isHovered, showMoreOptions]);

  // Close more options when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (controlBarRef.current && !controlBarRef.current.contains(event.target)) {
        setShowMoreOptions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleToggleAudio = () => {
    onToggleAudio();
  };

  const handleToggleVideo = () => {
    onToggleVideo();
  };

  const handleLeaveCall = () => {
    onLeaveCall();
  };

  const handleScreenShare = () => {
    onScreenShare();
  };

  if (!isVisible) {
    return (
      <div 
        className="fixed bottom-8 left-1/2 transform -translate-x-1/2 opacity-0 hover:opacity-100 transition-opacity duration-300"
        onMouseEnter={() => setIsVisible(true)}
      >
        <div className="w-12 h-12 bg-gray-800 rounded-full flex items-center justify-center">
          <MdMoreVert className="text-white text-xl" />
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={controlBarRef}
      className="fixed bottom-8 left-1/2 transform -translate-x-1/2 transition-all duration-300 ease-in-out"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex items-center gap-2 bg-gray-900 bg-opacity-90 backdrop-blur-lg rounded-2xl px-4 py-3 shadow-2xl border border-gray-700">
        
        {/* Audio Control */}
        <button
          onClick={handleToggleAudio}
          className={`flex items-center justify-center w-12 h-12 rounded-full transition-all duration-200 ${
            isAudioEnabled 
              ? 'bg-gray-700 hover:bg-gray-600 text-white' 
              : 'bg-red-500 hover:bg-red-600 text-white'
          }`}
          title={isAudioEnabled ? "Mute microphone" : "Unmute microphone"}
        >
          {isAudioEnabled ? (
            <MdMic className="text-xl" />
          ) : (
            <MdMicOff className="text-xl" />
          )}
        </button>

        {/* Video Control */}
        <button
          onClick={handleToggleVideo}
          className={`flex items-center justify-center w-12 h-12 rounded-full transition-all duration-200 ${
            isVideoEnabled 
              ? 'bg-gray-700 hover:bg-gray-600 text-white' 
              : 'bg-red-500 hover:bg-red-600 text-white'
          }`}
          title={isVideoEnabled ? "Turn off camera" : "Turn on camera"}
        >
          {isVideoEnabled ? (
            <MdVideocam className="text-xl" />
          ) : (
            <MdVideocamOff className="text-xl" />
          )}
        </button>

        {/* Screen Share */}
        <button
          onClick={handleScreenShare}
          className={`flex items-center justify-center w-12 h-12 rounded-full transition-all duration-200 ${
            isScreenSharing 
              ? 'bg-blue-500 hover:bg-blue-600 text-white' 
              : 'bg-gray-700 hover:bg-gray-600 text-white'
          }`}
          title={isScreenSharing ? "Stop screen share" : "Share screen"}
        >
          {isScreenSharing ? (
            <MdStopScreenShare className="text-xl" />
          ) : (
            <MdScreenShare className="text-xl" />
          )}
        </button>

        {/* Participants */}
        <button
          onClick={onToggleParticipants}
          className="flex items-center justify-center w-12 h-12 rounded-full bg-gray-700 hover:bg-gray-600 text-white transition-all duration-200 relative"
          title="Participants"
        >
          <MdPeople className="text-xl" />
          {participantsCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-green-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
              {participantsCount}
            </span>
          )}
        </button>

        {/* Leave Call */}
        <button
          onClick={handleLeaveCall}
          className="flex items-center justify-center w-12 h-12 rounded-full bg-red-500 hover:bg-red-600 text-white transition-all duration-200"
          title="Leave call"
        >
          <MdCallEnd className="text-xl" />
        </button>

        {/* More Options */}
        <div className="relative">
          <button
            onClick={() => setShowMoreOptions(!showMoreOptions)}
            className="flex items-center justify-center w-12 h-12 rounded-full bg-gray-700 hover:bg-gray-600 text-white transition-all duration-200"
            title="More options"
          >
            <MdMoreVert className="text-xl" />
          </button>

          {showMoreOptions && (
            <div className="absolute bottom-16 right-0 bg-gray-900 bg-opacity-95 backdrop-blur-lg rounded-2xl p-3 shadow-2xl border border-gray-700 min-w-48">
              <div className="flex flex-col gap-2">
                <button
                  onClick={onToggleChat}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gray-800 text-white transition-colors duration-200"
                >
                  <MdChat className="text-xl" />
                  <span>Chat</span>
                </button>
                
                <button className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gray-800 text-white transition-colors duration-200">
                  <PiSpeakerHighFill className="text-xl" />
                  <span>Speaker</span>
                </button>
                
                <button className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gray-800 text-white transition-colors duration-200">
                  <MdSettings className="text-xl" />
                  <span>Settings</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ControlBar;