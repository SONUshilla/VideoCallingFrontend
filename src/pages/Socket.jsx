import { io } from "socket.io-client";
import React, { useEffect, useRef, useState } from "react";
import * as mediasoupClient from "mediasoup-client";
import Draggable from "react-draggable";
import VideoElement from "../components/VideoElement";
import VideoLayout from "../components/VideoLayout";
import ControlBar from "../components/ControlBar";
import { useSocket } from "../context/SocketContext.jsx";
import { useCallback } from "react";
import { useLoginContext } from "../context/LoginContext.jsx";
import {useNavigate} from "react-router-dom";
import ChatBar from "../components/ChatBar.jsx";
import { getUserScreen } from "../utils/ScreenShare.jsx";
import ParticipantsBar from "../components/Participants.jsx";
import ScreenShareLayout from "../components/ScreenshareLayout.jsx";
import { useChat } from "../hooks/UseChat.js";
function Socket() {
  const userVideoRef = useRef(null);
  const remoteStreamsRef = useRef([]);
  const [remoteStreams, setRemoteStreams] = useState([]);
  const deviceRef = useRef(null);
  const sendTransportRef = useRef(null);
  const recvTransportRef = useRef(null);
  const producersRef = useRef([]); // Track producers for cleanup
  const consumersRef = useRef([]);
  const localStreamRef = useRef(null);
  const currentStreams = new Map();
  const audioProducerRef = useRef(null);
  const videoProducerRef = useRef(null);
  const currentConsumers = new Map();
  const [userDetails, setUserDetails] = useState(new Map());
  const [createRecvTransport, setCreatingRecvTransport] = useState(false);
  const [localStream, setLocalStream] = useState();
  const [socketId, setSocketId] = useState(null);
  const [ActiveSpeaker, setActiveSpeaker] = useState();
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [participantsCount, setParticipantsCount] = useState(1);
  const [isChatOpen,setChatOpen]=useState(false);
  const [isParticipantsBar,setIsParicipantsBar]=useState(false);
  const [firstScreenShareStream,setFirstScreenShareStream]=useState(null);
  const [screenSharerSocketId,setScreenShareSocketId]=useState(null);
  const [isLocalScreenSharing,setIsLocalScreenSharing]=useState(false);
  let socketRef = useSocket();
  const navigate=useNavigate();
  const [socket, setSocket] = useState(null);
  const {username,profilePic}=useLoginContext();

  const screenSharesMap = new Map(); // Only for screens
  // Example user data
  const currentUser = {
    id: socketId,
    name: username,
    profilePic: profilePic // Optional profile picture URL
  };
  const chat = useChat({ currentUser, userDetails });

    // Comprehensive cleanup function
    const performCleanup = useCallback(async () => {
      console.log("Performing comprehensive cleanup...");
  
      try {
        // Close all producers
        if (audioProducerRef.current) {
          try {
            audioProducerRef.current.close();
          } catch (err) {
            console.warn("Error closing audio producer:", err);
          }
          audioProducerRef.current = null;
        }
  
        if (videoProducerRef.current) {
          try {
            videoProducerRef.current.close();
          } catch (err) {
            console.warn("Error closing video producer:", err);
          }
          videoProducerRef.current = null;
        }
  
        // Close all producers in the array
        producersRef.current.forEach((producer) => {
          try {
            producer.close();
          } catch (err) {
            console.warn("Error closing producer:", err);
          }
        });
        producersRef.current = [];
  
        // Close all consumers
        consumersRef.current.forEach(({ consumer }) => {
          try {
            consumer.close();
          } catch (err) {
            console.warn("Error closing consumer:", err);
          }
        });
        consumersRef.current = [];
  
        // Close transports
        if (sendTransportRef.current) {
          try {
            sendTransportRef.current.removeAllListeners();
            sendTransportRef.current.close();
          } catch (err) {
            console.warn("Error closing send transport:", err);
          }
          sendTransportRef.current = null;
        }
  
        if (recvTransportRef.current) {
          try {
            recvTransportRef.current.removeAllListeners();
            recvTransportRef.current.close();
          } catch (err) {
            console.warn("Error closing recv transport:", err);
          }
          recvTransportRef.current = null;
        }
  
        // Stop local stream tracks
        if (localStream) {
          localStream.getTracks().forEach(track => {
            try {
              track.stop();
              track.enabled = false;
            } catch (err) {
              console.warn("Error stopping local track:", err);
            }
          });
          setLocalStream(null);
        }
  
        // Stop remote stream tracks
        remoteStreamsRef.current.forEach(remoteStream => {
          if (remoteStream.stream) {
            remoteStream.stream.getTracks().forEach(track => {
              try {
                track.stop();
                track.enabled = false;
              } catch (err) {
                console.warn("Error stopping remote track:", err);
              }
            });
          }
        });
  
        // Clear maps and arrays
        currentStreams.clear();
        currentConsumers.clear();
        remoteStreamsRef.current = [];
        setRemoteStreams([]);
        setUserDetails(new Map());
        // Reset device
        deviceRef.current = null;
  
        // Notify server
        if (socket) {
          socket.emit("leftMeeting");
        }
  
        console.log("Cleanup completed successfully");
      } catch (error) {
        console.error("Error during cleanup:", error);
      }
    }, [localStream, socket]);

  // Enhanced media control functions
  const toggleAudio = async () => {
    if (isAudioEnabled) {
      await disableAudio();
    } else {
      await enableAudio();
    }
    setIsAudioEnabled(!isAudioEnabled);
  };

  const toggleVideo = async () => {
    if (isVideoEnabled) {
      await disableVideo();
    } else {
      await enableVideo();
    }
    setIsVideoEnabled(!isVideoEnabled);
  };

  let screenProducer = useRef(null);
  let screenTrack =  useRef(null);
  
  const toggleScreenShare = async () => {
    try {

      if (!isScreenSharing) {
        if(firstScreenShareStream)
          {
            
          }
        const stream = await getUserScreen();
        setFirstScreenShareStream(stream);
        if (!stream) return;
  
        screenTrack.current = stream.getVideoTracks()[0];
  
        screenProducer.current = await sendTransportRef.current.produce({
          track: screenTrack.current,
          appData: { mediaTag: "screen",socketId:socketId }
        });
        producersRef.current.push(screenProducer.current);
        // Auto-stop if user clicks "Stop sharing"
        screenTrack.current.onended = () => {
          stopScreenShare();
        };
  
        setIsScreenSharing(true);
        setIsLocalScreenSharing(true);
      } else {
        stopScreenShare();
      }
    } catch (err) {
      console.error("Screen share error", err);
    }
  };
  const stopScreenShare = () => {
    const producer = screenProducer.current;
  
    if (producer) {
      socket.emit("screenShareStopped", { producerId:producer.id });
      producer.close(); 
      screenProducer.current = null;
    }
  
    if (screenTrack) {
      screenTrack.current.stop();
      screenTrack.current= null;
    }
  
    setFirstScreenShareStream(null);
    setIsScreenSharing(false);
    setIsLocalScreenSharing(false);
  };
  
  
  
  

  const leaveCall = () => {
    // Implement leave call logic
    console.log("Leaving call...");
    // Add your cleanup logic here
    socket.emit("leftMeeting");
    navigate("/dashboard");
  };

  const toggleParticipants = () => {
    setIsParicipantsBar(!isParticipantsBar);
  };

  const toggleChat = () => {
    setChatOpen(!isChatOpen);
  };

  // Update participants count when remote streams change
  useEffect(() => {
    setParticipantsCount(userDetails.size + 1); // +1 for local user
  }, [userDetails]);

  // Disable video - pause both track AND producer
  function disableVideo() {
    if (localStream) {
      const stream = localStream;
      const videoTracks = stream.getVideoTracks();

      // Disable local track
      videoTracks.forEach((track) => {
        track.enabled = false;
        console.log("Video track disabled locally");
      });

      // Pause SFU producer (this will trigger the observer events)
      if (videoProducerRef.current) {
        console.log("Pausing video producer...");
        // let server know
        socket.emit("producer-paused", {
          producerId: videoProducerRef.current.id,
          kind: videoProducerRef.current.kind,
        });
        videoProducerRef.current.pause();
        console.log("Video producer paused - server should see 'pause' event");
      }
    }
  }

  // Enable video - resume both track AND producer
  function enableVideo() {
    if (localStream) {
      const stream = localStream;
      const videoTracks = stream.getVideoTracks();

      // Enable local track
      videoTracks.forEach((track) => {
        track.enabled = true;
        console.log("Video track enabled locally");
      });
      socket.emit("producer-resume", {
        producerId: videoProducerRef.current.id,
        kind: videoProducerRef.current.kind,
      });

      // Resume SFU producer (this will trigger the observer events)
      if (videoProducerRef.current) {
        console.log("Resuming video producer...");
        videoProducerRef.current.resume();
        console.log(
          "Video producer resumed - server should see 'resume' event"
        );
      }
    }
  }

  // Disable audio (microphone active but no audio sent)
  function disableAudio() {
    if (localStream) {
      const stream = localStream;
      const audioTracks = stream.getAudioTracks();
      if (audioProducerRef.current) audioProducerRef.current.pause();

      socket.emit("producer-paused", {
        producerId: audioProducerRef.current.id,
        kind: audioProducerRef.current.kind,
      });
      audioTracks.forEach((track) => {
        track.enabled = false; // Disables the track but doesn't release hardware
        console.log("Audio disabled");
      });
    }
  }

  function enableAudio() {
    if (localStream) {
      const stream = localStream;
      const audioTracks = stream.getAudioTracks();

      if (audioProducerRef.current) audioProducerRef.current.resume();

      socket.emit("producer-resume", {
        producerId: audioProducerRef.current.id,
        kind: audioProducerRef.current.kind,
      });

      audioTracks.forEach((track) => {
        track.enabled = true;
        console.log("Audio enabled");
      });
    }
  }

  useEffect(() => {
    // Wait until socket is initialized
    if (!socketRef) return;
    setSocket(socketRef);
  }, [socketRef]);

  useEffect(() => {
    if (!socket) return;

    console.log("Connected to server");

    // Step 1: Create device
    deviceRef.current = new mediasoupClient.Device();

    //get-exisiting users present in the meeting
    socket.emit("get-existing-users");

    // Step 2: Ask server for RTP caps
    socket.emit("get-rtp-capabilities");

    

    setSocketId(socket.id);

    socket.on("existingUsers", ({ existingUsers }) => {
      setUserDetails(prev => {
        const newMap = new Map(prev);
    
        existingUsers.forEach(user => {
          const existing = newMap.get(user.socketId) || {};
          if (!existing.stream) {
            let stream = currentStreams.get(user.socketId);
            if (!stream) {
              stream = new MediaStream();
              currentStreams.set(user.socketId, stream);
            }
            existing.stream = stream; // <-- THIS is the correct assignment
          }
          
          newMap.set(user.socketId, {
            socketId: user.socketId,
            name: user.name || existing.name || 'Unknown',
            profilePic: user.profilePic || existing.profilePic || null,
            stream: existing.stream ,
          });
        });
    
        return newMap;
      });
    });



    // Step 3: Load device
    socket.on("rtp-capabilities", async (caps) => {
      try {
        if (!caps) {
          console.log("server not sent rtpCapabilities");
        }
        await deviceRef.current.load({ routerRtpCapabilities: caps });
        console.log("Device loaded: ", deviceRef.current.loaded);

        // Step 4: Request recv transport params
        socket.emit("create-recv-transport", async (params) => {
          if (!params) console.log("no params");
          console.log("Recv params:", params);
          setCreatingRecvTransport(true);

          //recieve transport created
          recvTransportRef.current =deviceRef.current.createRecvTransport(params);
          console.log("RecvTransport created successfully");
          socket.emit("get-existing-producers");
          recvTransportRef.current.on(
            "connect",
            async ({ dtlsParameters }, callback, errback) => {
              try {
                console.log("Connecting recv Transport");
                await new Promise((resolve, reject) => {
                  socket.emit(
                    "connect-recv-transport",
                    { dtlsParameters },
                    (res) => {
                      if (res?.error) {
                        console.log(
                          "error connecting recv transport",
                          res.error
                        );
                        return reject(res.error);
                      }
                      resolve(res);
                    }
                  );
                });
                callback();
                console.log(
                  "State of recv transport",
                  recvTransportRef.current.connectionState
                );
              } catch (error) {
                console.error("Error connecting recv transport:", error);
                errback(error);
              } finally {
                setCreatingRecvTransport(false);
              }
            }
          );
 

          recvTransportRef.current.on("connectionstatechange", (state) => {
            console.log("Recieve transport state:", state);
            if (state === "failed" || state === "disconnected") {
              console.error("recv transport connection failed");
            }
            if (state === "connected") {
              console.log("Transport ready → now attach consumer streams");

              // Now update UI
              setRemoteStreams([...remoteStreamsRef.current]);

              // Resume all consumers
              consumersRef.current.forEach(({ consumer }) => {
                socket.emit("consumerResume", { consumerId: consumer.id });
              });
            }
          });

          recvTransportRef.current.on("close", () => {
            console.log("Send transport closed");
          });
        });
        socket.emit("create-send-transport");
        
      } catch (error) {
        console.error("Error loading device:", error);
      }
    });
    

    socket.on("existingProducers", async ({ producers }) => {
      // 1. ADD appData to the destructuring here 👇
      producers.forEach(({ id, socketId, isPaused}) => {
      socket.emit("consume",
          {
            rtpCapabilities: deviceRef.current.rtpCapabilities,
            id: id,
          },
          async (data) => {
            // 2. Use the appData from the loop (or fallback to data.appData)
            const consumer = await recvTransportRef.current.consume({
              id: data.id,
              producerId: data.producerId,
              kind: data.kind,
              rtpParameters: data.rtpParameters,
              appData: data.appData , 
            });    
            currentConsumers.set(id, consumer);
            consumersRef.current.push({
              producerId:id,
              consumer,
              appData: consumer.appData 
            });
    
            const { track } = consumer;
            consumer.track.enabled = !isPaused;
    
            // 3. Now this check will work because consumer.appData is populated
            const isScreen = consumer.appData?.mediaTag === "screen";
    
            // ... rest of your logic ...
            const mapToUse = isScreen ? screenSharesMap : currentStreams;
            const streamKey = isScreen ? `${socketId}-screen` : socketId;
    
            let stream = mapToUse.get(socketId);
            if (!stream) {
              stream = new MediaStream();
              mapToUse.set(streamKey, stream);
    
              remoteStreamsRef.current.push({
                socketId,
                stream,
                type: isScreen ? "screen" : "camera",
              });
            }
            if (isScreen) {
              setFirstScreenShareStream(stream);
              setScreenShareSocketId(socketId);
            }
    
            stream.addTrack(track);
            stream.dispatchEvent(new MediaStreamTrackEvent("addtrack", { track }));
    
            if (recvTransportRef.current.connectionState === "connected") {
              setRemoteStreams([...remoteStreamsRef.current]);
              console.log(
                `Resuming consumer for ${consumer.kind} (${isScreen ? "SCREEN" : "CAMERA"})`
              );
              socket.emit("consumerResume", { consumerId: consumer.id });
            }
          }
        );
      });
    });

    // Step 4: Create send transport
    socket.on("send-transport-created", async (params) => {
      try {
        // Create send transport
        sendTransportRef.current =
          deviceRef.current.createSendTransport(params);
        console.log("Send transport created");

        // Handle produce event - CRITICAL: This connects client produce to server
        sendTransportRef.current.on(
          "produce",
          async (parameters, callback, errback) => {
            try {
              console.log("Produce event triggered:", parameters.kind);

              // Signal the server to create a producer
              socket.emit(
                "produce",
                {
                  transportId: sendTransportRef.current.id,
                  kind: parameters.kind,
                  rtpParameters: parameters.rtpParameters,
                  appData: parameters.appData,
                },
                (response) => {
                  if (response && response.id) {
                    console.log(`Producer created with id: ${response.id}`);
                    callback({ id: response.id });
                  } else {
                    errback(new Error("Failed to create producer"));
                  }
                }
              );
            } catch (error) {
              console.error("Error in produce event:", error);
              errback(error);
            }
          }
        );

        // CONNECT (DTLS handshake)
        sendTransportRef.current.on(
          "connect",
          async ({ dtlsParameters }, callback, errback) => {
            console.log("Send transport connecting...");
            // Signal local DTLS parameters to the server side transport
            try {
              await new Promise((resolve, reject) => {
                socket.emit("transport-connect", { dtlsParameters }, (res) => {
                  if (res?.error) {
                    return reject(res.error); // stop here
                  }
                  resolve();
                });
              });
              callback(); // only call if no error
              console.log("Send transport connected successfully");
            } catch (err) {
              console.error(
                "Unexpected error in transport-connect callback:",
                err
              );
              errback(err);
            }
          }
        );

        // Add error handling for the transport
        sendTransportRef.current.on("connectionstatechange", (state) => {
          console.log("Send transport state:", state);
          if (state === "failed" || state === "disconnected") {
            console.error("Send transport connection failed");
          }
        });

        sendTransportRef.current.on("close", () => {
          console.log("Send transport closed");
        });

        // Now start webcam
        await sendWebcam();
      } catch (error) {
        console.error("Error creating send transport:", error);
      }
    });

    socket.on("newProducer", async ({ producerId, socketId,isPaused,appData }) => {
      console.log("New producer:", producerId);
      await startConsume(producerId, socketId,isPaused,appData);
    });

    async function startConsume(producerId, socketId, isPaused) {
      socket.emit(
        "consume",
        {
          rtpCapabilities: deviceRef.current.rtpCapabilities,
          id: producerId,
        },
        async (data) => {
          const consumer = await recvTransportRef.current.consume({
            id: data.id,
            producerId: data.producerId,
            kind: data.kind,
            rtpParameters: data.rtpParameters,
            appData:data.appData,
          });
    
          currentConsumers.set(producerId, consumer);
          consumersRef.current.push({
            producerId,
            consumer,
            appData: data.appData
          });
    
          const { track } = consumer;
          consumer.track.enabled = !isPaused;
    
          const isScreen = consumer.appData?.mediaTag === "screen";
    
          // Use separate maps
          const mapToUse = isScreen ? screenSharesMap : currentStreams;
          const streamKey = isScreen ? `${socketId}-screen` : socketId;
    
          let stream = mapToUse.get(streamKey);
          if (!stream || isScreen) {
            stream = new MediaStream();
            mapToUse.set(streamKey, stream);
    
            // Add to remoteStreamsRef for UI
            remoteStreamsRef.current.push({
              socketId,
              stream,
              type: isScreen ? "screen" : "camera",
            });
          }
          if(isScreen)
          {
            setFirstScreenShareStream(stream);
            setScreenShareSocketId(socketId)
          }
    
          stream.addTrack(track);
          stream.dispatchEvent(new MediaStreamTrackEvent("addtrack", { track }));
    
          if (recvTransportRef.current.connectionState === "connected") {
            setRemoteStreams([...remoteStreamsRef.current]);
            console.log(
              `Resuming consumer for ${consumer.kind} (${isScreen ? "SCREEN" : "CAMERA"})`
            );
            socket.emit("consumerResume", { consumerId: consumer.id });
          }
        }
      );
    }
    

    async function sendWebcam() {
      try {
        console.log("Getting user media...");
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            frameRate: { ideal: 30 },
          },
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
        });

        setLocalStream(stream);
        localStreamRef.current=stream;
        console.log(
          "Got user media, tracks:",
          stream.getVideoTracks().length,
          "video,",
          stream.getAudioTracks().length,
          "audio"
        );

        // Produce video track
        if (stream.getVideoTracks().length > 0) {
          const videoTrack = stream.getVideoTracks()[0];
          const videoProducer = await sendTransportRef.current.produce({
            track: videoTrack,
            appData: { mediaType: "video" },
          });
          producersRef.current.push(videoProducer);
          videoProducerRef.current = videoProducer;
          console.log("Video producer created:", videoProducer.id);
        }

        // Produce audio track
        if (stream.getAudioTracks().length > 0) {
          const audioTrack = stream.getAudioTracks()[0];
          const audioProducer = await sendTransportRef.current.produce({
            track: audioTrack,
            appData: { mediaType: "audio" },
          });
          producersRef.current.push(audioProducer);
          audioProducerRef.current = audioProducer;
          console.log("audio producer created:", audioProducer.id);
        }

        console.log("Webcam and audio are being produced to SFU!");
      } catch (error) {
        console.error("Error in sendWebcam:", error);
      }
    }

    socket.on("producer-closed", ({ producerId }) => {
      console.log("Producer closed:", producerId);
    
      const entry = consumersRef.current.find(c => c.producerId === producerId);
      if (!entry) return;
    
      if (entry.consumer.appData?.mediaTag === "screen") {
        console.log("✅ this is the screen sharing producer");
        setFirstScreenShareStream(null);
    
        // Also remove from screenSharesMap & remoteStreamsRef
        const socketId = entry.consumer.appData.socketId;
        screenSharesMap.delete(`${socketId}-screen`);
        remoteStreamsRef.current = remoteStreamsRef.current.filter(
          s => !(s.socketId === socketId && s.type === "screen")
        );
        setRemoteStreams([...remoteStreamsRef.current]);
      }
    
      entry.consumer.close();
      consumersRef.current = consumersRef.current.filter(c => c.producerId !== producerId);
    });
    
    

    socket.on("userDisconnected", ({ socketId }) => {
      // 3. Remove the remote media stream
      remoteStreamsRef.current = remoteStreamsRef.current.filter(
        (s) => s.socketId !== socketId
      );
      console.log("length after filter", remoteStreamsRef.current.length);
      currentStreams.delete(socketId);
      setRemoteStreams([...remoteStreamsRef.current]);
      // 3. Remove from userDetails Map immutably
      setUserDetails((prev) => {
        const newMap = new Map(prev); // copy previous Map
        newMap.delete(socketId); // remove the disconnected user
        return newMap;
      });
    });

    socket.on("producerpaused", ({ producerId }) => {
      const consumer = currentConsumers.get(producerId);
      if (!consumer) return;
      console.log("consumer is paused", consumer.kind);
      consumer.pause();
      consumer.track.enabled = false; // works for audio OR video
    });

    socket.on("producerresume", ({ producerId }) => {
      const consumer = currentConsumers.get(producerId);
      if (!consumer) return;
      console.log("consumer is resumed", consumer.kind);
      consumer.resume();
      consumer.track.enabled = true; // works for audio OR video
    });

    socket.on("ActiveSpeaker", ({ socketId, producerId }) => {
      setActiveSpeaker(socketId);
    });
    socket.on("silence", () => {
      setActiveSpeaker(null);
    });




    socket.on("newUserJoined", ({ socketId, name, profilePic }) => {
      console.log("the dtails of newly joined user is",socketId, name, profilePic)
      setUserDetails(prev => {
        const newMap = new Map(prev);
        const existing = newMap.get(socketId) || {};
        if (!existing.stream) {
          let stream = currentStreams.get(socketId);
        
          if (!stream) {
            stream = new MediaStream();
            currentStreams.set(socketId, stream);
          }
        
          existing.stream = stream; // <-- THIS is the correct assignment
        }
        
        newMap.set(socketId, {
          socketId,
          name: name || existing.name || 'Unknown',
          profilePic: profilePic || existing.profilePic || null,
          stream: existing.stream
        });
        return newMap;
      });
    });
    


    // Cleanup function
    // Cleanup function
    return () => {
      console.log("Socket component unmounting - performing cleanup");
      performCleanup();

      // Remove all socket listeners
      const events = [
        "disconnect", "error", "rtp-capabilities", "send-transport-created",
        "existingProducers", "newProducer", "producer-closed", "producerpaused",
        "producerresume", "userDisconnected", "ActiveSpeaker", "silence","newUserJoined","existingUsers"
      ];

      events.forEach(event => {
        socket.off(event);
      });
    };
  }, [socket]);

if (firstScreenShareStream)
{
  return <div className="relative w-full h-full bg-gray-900 p-4">
    <ScreenShareLayout
  remoteStreams={remoteStreams}
  activeSpeaker={ActiveSpeaker}
  currentUser={currentUser}
  localStream={localStream}
  socketId={socketId}
  userDetails={userDetails}
  isAudioEnabled={isAudioEnabled}
  isVideoEnabled={isVideoEnabled}
  screenSharerSocketId={screenSharerSocketId}
  screenShareStream={firstScreenShareStream}
  isLocalScreenSharing={isLocalScreenSharing}
/>


    <ControlBar
      isAudioEnabled={isAudioEnabled}
      isVideoEnabled={isVideoEnabled}
      onToggleAudio={toggleAudio}
      onToggleVideo={toggleVideo}
      onLeaveCall={leaveCall}
      onScreenShare={toggleScreenShare}
      isScreenSharing={isScreenSharing}
      participantsCount={participantsCount}
      onToggleParticipants={toggleParticipants}
      onToggleChat={toggleChat}
    />
    {isChatOpen && (
      <div className="fixed inset-y-0 right-0 flex z-40">
                        <ChatBar
        isOpen={isChatOpen}
        onClose={() => setChatOpen(false)}
        messages={chat.messages}
        typingUsers={chat.typingUsers}
        sendMessage={chat.sendMessage}
        startTyping={chat.startTyping}
        stopTyping={chat.stopTyping}
        currentUser={currentUser}
        userDetails={userDetails}
      />
      </div>
    )}
    {isParticipantsBar && (
      <div className="fixed inset-y-0 right-0 flex z-40">
        <ParticipantsBar
          currentUser={currentUser}
          userDetails={userDetails}
          isOpen={isParticipantsBar}
        />
      </div>
    )}
  </div>;
}
  return (
    <div className="relative w-full h-full bg-gray-900">
      <VideoLayout
        remoteStreams={remoteStreams}
        socketId={socketId}
        activeSpeaker={ActiveSpeaker}
        currentUser={audioProducerRef.current}
        localStream={localStream}
        userDetails={userDetails}
        isAudioEnabled={isAudioEnabled}
        isVideoEnabled={isVideoEnabled}
        isScreenSharing={isScreenSharing}
      />

      <ControlBar
        isAudioEnabled={isAudioEnabled}
        isVideoEnabled={isVideoEnabled}
        onToggleAudio={toggleAudio}
        onToggleVideo={toggleVideo}
        onLeaveCall={leaveCall}
        onScreenShare={toggleScreenShare}
        isScreenSharing={isScreenSharing}
        participantsCount={participantsCount}
        onToggleParticipants={toggleParticipants}
        onToggleChat={toggleChat}
      />
      {isChatOpen && (
        <div className="fixed inset-y-0 right-0 flex z-40">
                <ChatBar
        isOpen={isChatOpen}
        onClose={() => setChatOpen(false)}
        messages={chat.messages}
        typingUsers={chat.typingUsers}
        sendMessage={chat.sendMessage}
        startTyping={chat.startTyping}
        stopTyping={chat.stopTyping}
        currentUser={currentUser}
        userDetails={userDetails}
      />

        </div>
      )}
      {isParticipantsBar && (
        <div className="fixed inset-y-0 right-0 flex z-40">
        <ParticipantsBar
          currentUser={currentUser}
          userDetails={userDetails}
          isOpen={isParticipantsBar}
        />
        </div>
      )}
    </div>
  );
}

export default Socket;
