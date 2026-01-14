import React, { useEffect, useState, useRef, memo } from "react";
import { CiMicrophoneOff } from "react-icons/ci";
import { FaUser } from "react-icons/fa";

function VideoElement({
  stream,
  profileUrl,
  producerId,
  isActiveSpeaker,
  name,
  Audio,
  Video,
  isLocal,
  isScreenShare, // <--- 1. ADD THIS (It was missing)
}) {
  const [isVideoEnabled, setIsVideoEnabled] = useState(Video);
  const [isAudioEnabled, setIsAudioEnabled] = useState(Audio);
  const streamRef = useRef(null);
  const videoRef = useRef(null);

  // --- 1. Handle Stream Tracks ---
  useEffect(() => {
    if (!stream) return;

    streamRef.current = stream;
    
    const videoTrack = stream.getVideoTracks()[0];
    const audioTrack = stream.getAudioTracks()[0];

    // For screen shares, we generally force video to be considered "enabled"
    // initially to prevent the initial blink of the fallback image.
    if (videoTrack) setIsVideoEnabled(videoTrack.enabled);
    if (audioTrack) setIsAudioEnabled(audioTrack.enabled);

    const handleAddTrack = (event) => {
      const track = event.track;
      if (track.kind === "video") {
        setIsVideoEnabled(track.enabled);
        track.onmute = () => setIsVideoEnabled(false);
        track.onunmute = () => setIsVideoEnabled(true);
      } else if (track.kind === "audio") {
        setIsAudioEnabled(track.enabled);
        track.onmute = () => setIsAudioEnabled(false);
        track.onunmute = () => setIsAudioEnabled(true);
      }
    };

    const handleRemoveTrack = (event) => {
      if (event.track.kind === "video") setIsVideoEnabled(false);
      if (event.track.kind === "audio") setIsAudioEnabled(false);
    };

    stream.addEventListener("addtrack", handleAddTrack);
    stream.addEventListener("removetrack", handleRemoveTrack);

    // Track listeners
    stream.getTracks().forEach((track) => {
      track.onmute = () => {
        if (track.kind === "video") setIsVideoEnabled(false);
        if (track.kind === "audio") setIsAudioEnabled(false);
      };
      track.onunmute = () => {
        if (track.kind === "video") setIsVideoEnabled(true);
        if (track.kind === "audio") setIsAudioEnabled(true);
      };
    });

    return () => {
      if (streamRef.current) {
        streamRef.current.removeEventListener("addtrack", handleAddTrack);
        streamRef.current.removeEventListener("removetrack", handleRemoveTrack);
      }
      // Be careful cleaning up onmute/onunmute directly on tracks if stream is shared
    };
  }, [stream]); 

  // --- 2. External Props ---
  useEffect(() => {
    if (isLocal) {
      setIsAudioEnabled(Audio);
      setIsVideoEnabled(Video);
    }
  }, [Audio, Video, isLocal]);

  // --- 3. Source Object Assignment ---
  useEffect(() => {
    const videoEl = videoRef.current;
    if (videoEl && stream) {
      if (videoEl.srcObject?.id !== stream.id) {
        videoEl.srcObject = stream;
        videoEl.play().catch(e => console.error("Auto-play failed", e));
      }
    } else if (videoEl && !stream) {
      videoEl.srcObject = null;
    }
  }, [stream]);

  // --- 4. Logic for showing video vs fallback ---
  // If it is a screen share, we prefer showing the video element (even if black/loading)
  // over showing the user profile picture.
  const showVideo = isVideoEnabled || isScreenShare; 
  const showFallbackImage = !isVideoEnabled && !isScreenShare;

  return (
    <div className={`w-full h-full relative rounded-md overflow-hidden bg-gray-900`}>
      {/* Name Tag */}
      <div className="z-10 absolute top-2 left-2 bg-black/50 backdrop-blur-sm text-white px-2 py-1 rounded-md text-sm font-medium">
        {name}
      </div>

      {/* Video Element */}
      {/* Remove 'hidden' class based on strictly isVideoEnabled if it's a screen share */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={!isAudioEnabled || isLocal} 
        className={`w-full h-full ${isScreenShare ? 'object-contain' : 'object-cover'} ${!showVideo ? 'hidden' : ''}`}
      />

      {/* Active Speaker Indicator */}
      {isActiveSpeaker && (
        <div className="absolute bottom-2 left-2 bg-green-500 text-white w-6 h-6 flex items-center justify-center rounded-full shadow-md z-20 animate-pulse">
          <FaUser size={12} />
        </div>
      )}

      {/* Fallback (User Profile Image) - ONLY if NOT screen share */}
      {showFallbackImage && (
        <div className={`absolute inset-0 flex items-center justify-center text-white ${isActiveSpeaker ? "border-2 border-green-500 rounded-md" : ""}`}>
          <div className="relative">
            {isActiveSpeaker && <div className="absolute inset-0 bg-green-500 blur-xl opacity-20 rounded-full"></div>}
            <img
              className="w-24 h-24 rounded-full object-cover border-2 border-gray-700 bg-gray-800"
              src={profileUrl || "https://via.placeholder.com/150"}
              alt={name}
              onError={(e) => {
                 e.target.onerror = null; 
                 e.target.src = "https://cdn-icons-png.flaticon.com/512/149/149071.png";
              }}
            />
          </div>
        </div>
      )}

      {/* Muted Icon */}
      {!isAudioEnabled && (
        <div className="absolute top-2 right-2 bg-red-500/80 text-white w-7 h-7 flex items-center justify-center rounded-full shadow-md z-20">
          <CiMicrophoneOff size={16} />
        </div>
      )}
    </div>
  );
}

export default memo(VideoElement);