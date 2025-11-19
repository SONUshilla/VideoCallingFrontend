import { io } from "socket.io-client";
import React, { useEffect, useRef, useState } from "react";
import * as mediasoupClient from "mediasoup-client";

function Socket() {
  const userVideoRef = useRef(null);
  const remoteStreamsRef = useRef([]);
  const [remoteStreams, setRemoteStreams] = useState([]);
  const socketRef = useRef(null);
  const deviceRef = useRef(null);
  const sendTransportRef = useRef(null);
  const recvTransportRef = useRef(null);
  const producersRef = useRef([]); // Track producers for cleanup
  const consumersRef = useRef([]);
// Add this state to track troubleshooting results
const [debugResults, setDebugResults] = useState([]);

// Main troubleshooting function
const troubleshootConsumers = async () => {
  const results = [];
  console.log("this is the current state of receive transport",recvTransportRef.current.connectionState)
  if (!consumersRef.current || consumersRef.current.length === 0) {
    results.push({
      type: 'error',
      message: 'No consumers found in consumersRef'
    });
    setDebugResults(results);
    return;
  }

  console.group('🔍 Mediasoup Consumers Troubleshooting');
  
  for (const [index, consumerInfo] of consumersRef.current.entries()) {
    const { producerId, consumer } = consumerInfo;
    
    console.group(`Consumer ${index} (Producer: ${producerId})`);
    
    const consumerResult = await checkSingleConsumer(consumer, producerId, index);
    results.push(consumerResult);
    
    console.groupEnd();
  }
  
  console.groupEnd();
  setDebugResults(results);
};

// Function to check individual consumer
const checkSingleConsumer = async (consumer, producerId, index) => {
  const result = {
    producerId,
    index,
    consumerId: consumer.id,
    kind: consumer.kind,
    status: 'unknown',
    issues: [],
    stats: null
  };

  try {
    // Basic consumer checks
    console.log('1. ✅ Basic Consumer Checks');
    console.log('   ID:', consumer.id);
    console.log('   Producer ID:', producerId);
    console.log('   Kind:', consumer.kind);
    console.log('   Paused:', consumer.paused);
    console.log('   Closed:', consumer.closed);

    if (consumer.closed) {
      result.issues.push('Consumer is closed');
      result.status = 'error';
    }

    if (consumer.paused) {
      result.issues.push('Consumer is paused');
      result.status = 'warning';
    }

    // Track checks
    console.log('2. 📡 Track Checks');
    if (consumer.track) {
      console.log('   ✅ Track exists');
      console.log('   Track ID:', consumer.track.id);
      console.log('   Track kind:', consumer.track.kind);
      console.log('   Track readyState:', consumer.track.readyState);
      console.log('   Track muted:', consumer.track.muted);

      if (consumer.track.readyState === 'ended') {
        result.issues.push('Track has ended');
        result.status = 'error';
      }

      if (consumer.track.muted) {
        result.issues.push('Track is muted');
        result.status = 'warning';
      }
    } else {
      console.log('   ❌ No track found');
      result.issues.push('No track associated with consumer');
      result.status = 'error';
    }

    // Transport checks
    console.log('3. 🚚 Transport Checks');
    if (consumer.transport) {
      console.log('   Transport state:', consumer.transport.state);
      console.log('   Transport connection state:', consumer.transport.connectionState);

      if (consumer.transport.connectionState !== 'connected') {
        result.issues.push(`Transport not connected (state: ${consumer.transport.connectionState})`);
        result.status = 'error';
      }
    } else {
      console.log('   ❌ No transport found');
      result.issues.push('No transport associated with consumer');
      result.status = 'error';
    }

    // Statistics check
    console.log('4. 📊 Statistics Check');
    try {
      const stats = await consumer.getStats();
      const inboundRtp = Array.from(stats.values()).find(stat => stat.type === 'inbound-rtp');
      
      if (inboundRtp) {
        console.log('   ✅ Inbound RTP stats found');
        console.log('   Bytes received:', inboundRtp.bytesReceived);
        console.log('   Packets received:', inboundRtp.packetsReceived);
        console.log('   Packets lost:', inboundRtp.packetsLost);
        console.log('   Jitter:', inboundRtp.jitter);

        result.stats = {
          bytesReceived: inboundRtp.bytesReceived,
          packetsReceived: inboundRtp.packetsReceived,
          packetsLost: inboundRtp.packetsLost,
          jitter: inboundRtp.jitter
        };

        if (inboundRtp.bytesReceived === 0) {
          result.issues.push('No data received (0 bytes)');
          result.status = result.status === 'unknown' ? 'error' : result.status;
        } else {
          console.log('   ✅ Data is flowing');
          if (result.status === 'unknown') result.status = 'healthy';
        }
      } else {
        console.log('   ❌ No inbound RTP stats found');
        result.issues.push('No inbound RTP statistics available');
        result.status = 'error';
      }
    } catch (statsError) {
      console.log('   ❌ Error getting stats:', statsError);
      result.issues.push(`Failed to get statistics: ${statsError.message}`);
      result.status = 'error';
    }

    // Video element check (for video consumers)
    if (consumer.kind === 'video') {
      console.log('5. 📹 Video Element Check');
      const videoElement = document.getElementById(`remote-video-${producerId}`) || 
                          document.getElementById('remote-video') ||
                          document.querySelector('video');
      
      if (videoElement) {
        console.log('   ✅ Video element found');
        console.log('   Video readyState:', videoElement.readyState);
        console.log('   Video paused:', videoElement.paused);
        console.log('   Video srcObject:', videoElement.srcObject);

        if (!videoElement.srcObject) {
          result.issues.push('Video element has no srcObject');
          result.status = 'error';
        }

        // Check if video can play
        try {
          await videoElement.play();
          console.log('   ✅ Video can play');
        } catch (playError) {
          console.log('   ❌ Video play failed:', playError);
          result.issues.push(`Video play failed: ${playError.message}`);
          result.status = 'error';
        }
      } else {
        console.log('   ❌ No video element found');
        result.issues.push('No video element found for video consumer');
        result.status = 'error';
      }
    }

  } catch (error) {
    console.log('   ❌ Error checking consumer:', error);
    result.issues.push(`Check failed: ${error.message}`);
    result.status = 'error';
  }

  // Final status
  if (result.status === 'unknown') {
    result.status = 'healthy';
  }

  console.log(`6. 🎯 Final Status: ${result.status.toUpperCase()}`);
  if (result.issues.length > 0) {
    console.log('   Issues found:', result.issues);
  } else {
    console.log('   ✅ No issues detected');
  }

  return result;
};
  useEffect(() => {
    console.log("MOUNTED");

    socketRef.current = io("https://videocallingbackend-ftll.onrender.com/");

    // Step 1: Create device
    deviceRef.current = new mediasoupClient.Device();

    // Step 2: Ask server for RTP caps
    socketRef.current.on("connect", () => {
      console.log("Connected to server");
      socketRef.current.emit("get-rtp-capabilities");
    });

    socketRef.current.on("disconnect", () => {
      console.log("Disconnected from server");
    });

    socketRef.current.on("error", (error) => {
      console.error("Socket error:", error);
    });

    // Step 3: Load device
    socketRef.current.on("rtp-capabilities", async (caps) => {
      try {
        if(!caps)
        {
          console.log("server not sent rtpCapabilities");
        }
        await deviceRef.current.load({ routerRtpCapabilities: caps });
        console.log("Device loaded: ",deviceRef.current.loaded);
        // Step 4: Request recv transport params
        socketRef.current.emit("create-recv-transport", async (params) => {

          if(!params)console.log("no params");

          console.log("Recv params:", params);

          //recieve transport created
          recvTransportRef.current = deviceRef.current.createRecvTransport(params);


          console.log("RecvTransport created successfully");

          recvTransportRef.current.on(
            "connect",
            async ({ dtlsParameters }, callback, errback) => {
              try{
                console.log("Connecting recv Transport");
                await new Promise((resolve,reject)=>{
                  socketRef.current.emit(
                    "connect-recv-transport",
                    { dtlsParameters },
                    (res) => {
                      if (res?.error)
                        {
                          console.log("error connecting recv transport",res.error);
                          return reject(res.error);
                        } 
                      resolve(res);
                    }
                  );
                })
                callback();
                console.log("State of recv transport",recvTransportRef.current.connectionState);
              }
              catch (error) {
                console.error("Error connecting recv transport:", error);
                errback(error);
              }
            }
          );
          // Add error handling for the transport
        recvTransportRef.current.on("connectionstatechange", (state) => {
          console.log("Recieve transport state:", state);
          if (state === "failed" || state === "disconnected") {
            console.error("recv transport connection failed");
          }
        });     

        recvTransportRef.current.on("connectionstatechange", (state) => {
          console.log("recv transport:", state);
        
          if (state === "connected") {
            console.log("Transport ready → now attach consumer streams");
        
            // Now update UI
            setRemoteStreams([...remoteStreamsRef.current]);
        
            // Resume all consumers
            consumersRef.current.forEach(({ consumer }) => {
              socketRef.current.emit("consumerResume", { consumerId: consumer.id });
            });
          }
        });
        

        recvTransportRef.current.on("close", () => {
          console.log("Send transport closed");
        });
        });
        socketRef.current.emit("create-send-transport");
        socketRef.current.emit("get-existing-producers");
      } catch (error) {
        console.error("Error loading device:", error);
      }
    });

    
    
    socketRef.current.on("existingProducers", async ({ producerIds }) => {
      producerIds.forEach((id) => {
        console.log("existing ones", id);
        socketRef.current.emit("consume",
          { id, rtpCapabilities: deviceRef.current.rtpCapabilities },
          async (data) => {
            const consumer = await recvTransportRef.current.consume({
              id: data.id,
              producerId: data.producerId,
              kind: data.kind,
              rtpParameters: data.rtpParameters,
            });
            consumersRef.current.push({
              producerId:id,
              consumer,
            });
            console.log("cosumer created");
  
            const { track } = consumer;
  
            let stream = new MediaStream();
  
            stream.addTrack(track);
            remoteStreamsRef.current.push({
              producerId:id,
              stream,
            });
            setRemoteStreams([...remoteStreamsRef.current]); // force re-render
          }
        );
      });
    });

    // Step 4: Create send transport
    socketRef.current.on("send-transport-created", async (params) => {
      try {
        // Create send transport
        sendTransportRef.current = deviceRef.current.createSendTransport(params);
        console.log("Send transport created");

        // Handle produce event - CRITICAL: This connects client produce to server
        sendTransportRef.current.on("produce",
          async (parameters, callback, errback) => {
            try {
              console.log("Produce event triggered:", parameters.kind);

              // Signal the server to create a producer
              socketRef.current.emit(
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
              try{
              await new Promise((resolve,reject)=>{
                   socketRef.current.emit("transport-connect",{ dtlsParameters },
                    (res) => {
                        if (res?.error) {
                          return reject(res.error); // stop here
                        }
                        resolve();
                    }
                  );
                });
                callback(); // only call if no error
                console.log("Send transport connected successfully");
              }
                catch (err) {
                console.error("Unexpected error in transport-connect callback:", err);
                errback(err);
              }

              });

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

    socketRef.current.on("newProducer", async ({ producerId }) => {
      console.log("New producer:", producerId);
      await startConsume(producerId);
    });

    async function startConsume(producerId) {
      // Ask server to create a consumer
      socketRef.current.emit(
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
          });

          consumersRef.current.push({
            producerId,
            consumer,
          });
          console.log("cosumer created");

          const { track } = consumer;

          let stream = new MediaStream();

          stream.addTrack(track);
          remoteStreamsRef.current.push({
            producerId,
            stream,
          });
          // Required step
          recvTransportRef.current.on("connectionstatechange", (state) => {
            console.log("recv transport:", state);
          
            if (state === "connected") {
              console.log("Transport ready → now attach consumer streams");
          
              // Now update UI
                setRemoteStreams([...remoteStreamsRef.current]);
                socketRef.current.emit("consumerResume", { consumerId: consumer.id });
            }
          });
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
        userVideoRef.current.srcObject = stream;

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
          console.log("Video producer created:", videoProducer.id);
        }
        /*
        // Produce audio track
        if (stream.getAudioTracks().length > 0) {
          const audioTrack = stream.getAudioTracks()[0];
          const audioProducer = await sendTransportRef.current.produce({
            track: audioTrack,
            appData: { mediaType: "audio" },
          });
          producersRef.current.push(audioProducer);
          console.log("audio producer created:", audioProducer.id);
        }*/

        console.log("Webcam and audio are being produced to SFU!");
      } catch (error) {
        console.error("Error in sendWebcam:", error);
      }
    }

    socketRef.current.on("producer-closed", ({ producerId }) => {
      console.log("Producer closed:", producerId);

      // 1. Close the consumer
      const entry = consumersRef.current.find(
        (c) => c.producerId === producerId
      );
      if (entry) {
        try {
          entry.consumer.close();
        } catch {}
      }

      // 2. Remove it from array
      consumersRef.current = consumersRef.current.filter(
        (c) => c.producerId !== producerId
      );

      // 3. Remove the remote media stream
      remoteStreamsRef.current = remoteStreamsRef.current.filter(
        (s) => s.producerId !== producerId
      );
      console.log("length after filter", remoteStreamsRef.current.length);

      setRemoteStreams([...remoteStreamsRef.current]);
    });

    // Cleanup function
    return () => {
      console.log("Cleaning up...");

      // Close all producers
      if (producersRef.current) {
        producersRef.current.forEach((producer) => {
          remoteStreamsRef.current = remoteStreamsRef.current.filter(
            (s) => s.producerId !== producer.id
          );
          setRemoteStreams([...remoteStreamsRef.current]);
          producer.close();
        });
        producersRef.current = [];
      }

      // Close transport
      if (sendTransportRef.current) {
        sendTransportRef.current.close();
        sendTransportRef.current = null;
      }

      if (consumersRef.current && consumersRef.current.length > 0) {
        consumersRef.current.forEach(({ consumer }) => {
          try {
            consumer.close();
          } catch (err) {
            console.warn("Error closing consumer:", err);
          }
        });

        consumersRef.current = [];
      }

      // Disconnect socket
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, []);

  return (
    <div
      style={{
        display: "flex",
        gap: "20px",
        padding: "20px",
        background: "#111",
        height: "100vh",
        boxSizing: "border-box",
      }}
    >
      {/* LOCAL VIDEO */}
      <video
        ref={userVideoRef}
        autoPlay
        muted
        playsInline
        style={{
          width: "40%",
          height: "auto",
          borderRadius: "10px",
          background: "#000",
          border: "2px solid #444",
        }}
      />

      {/* REMOTE VIDEOS */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))",
          gap: "15px",
          width: "60%",
        }}
      >
        {remoteStreams.map(({ stream }, i) => (
          <video
            key={i}
            autoPlay
            playsInline
            ref={(video) => {
              if (video) video.srcObject = stream;
            }}
            style={{
              width: "100%",
              height: "200px",
              objectFit: "cover",
              borderRadius: "10px",
              background: "#000",
              border: "2px solid #444",
            }}
          />
        ))}
      </div>
    </div>
  );
}

export default Socket;
