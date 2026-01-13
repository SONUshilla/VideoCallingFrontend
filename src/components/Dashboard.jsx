import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useSocket } from '../context/SocketContext';
import { useNavigate } from "react-router-dom";
import { useLoginContext } from '../context/LoginContext';

const Dashboard = () => {
  const [meetingLink, setMeetingLink] = useState('');
  const [meetingId,setMeetingId]=useState();
  const [showMeetingCreated, setShowMeetingCreated] = useState(false);
  const [joinMeetingId, setJoinMeetingId] = useState('');
  const navigate = useNavigate(); // <-- this is how you get the navigate function
  let socketRef= useSocket();
  let {isLoggedIn,username,profilePic}=useLoginContext();
  const[socket,setSocket]=useState();

  useEffect(()=>{
    if(!isLoggedIn)
    {
      navigate("/login");
    }
  },[isLoggedIn])

  useEffect(()=>{
    // Wait until socket is initialized
    if (!socketRef) return;
    setSocket(socketRef);
    },[socketRef]);






// Create a new meeting
const createMeeting = () => {
  console.log("creating meeting")
  if (!socket) return;
  console.log("no socket")
  // Emit createMeeting and provide a callback to receive meetingId
  socket.emit("createMeeting", (response) => {
    if (response.error) {
      console.error("Failed to create meeting:", response.error);
      return;
    }

    const meetingId = response.meetingId;
    console.log("New meeting created. Meeting ID:", meetingId);

    // Optional: generate a meeting link for sharing
    const meetingLink = `http://localhost:5000/meeting?meetingId=${meetingId}`;
    setMeetingId(meetingId);
    setMeetingLink(meetingLink);
    setShowMeetingCreated(true);
  });
};


  // Copy meeting link to clipboard
  const copyMeetingLink = async () => {
    try {
      await navigator.clipboard.writeText(meetingLink);
      alert('Meeting link copied to clipboard!');
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  };

  // Join an existing meeting
  const joinMeeting = async() => {
    if(!socket)return;
    await socket.emit("joinRoom",{roomId:meetingId},()=>{
      navigate("/socket");
    });
  };

  const joinMeetingWithId = async ()=>{
      if(!joinMeetingId)alert("please enter the id");
      if(!socket && username && profilePic)return;
      await socket.emit("joinRoom",{roomId:joinMeetingId,name:username,profilePic:profilePic},()=>{
        navigate("/socket");
      });
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-full mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">Z</span>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                <img className="h-full w-full object-cover" src={profilePic} alt='P'/>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Welcome back, {username}! 👋
          </h1>
          <p className="text-xl text-gray-600">
            Ready to start or join a meeting?
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Create Meeting Card */}
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <div className="text-center">
              <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-3xl">🎥</span>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Create New Meeting
              </h2>
              <p className="text-gray-600 mb-6">
                Start an instant meeting and invite others to join
              </p>
              <button
                onClick={createMeeting}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 px-6 rounded-lg transition duration-200"
              >
                Create Meeting
              </button>
            </div>

            {/* Meeting Created Section */}
            {showMeetingCreated && (
              <div className="mt-6 p-4 bg-green-50 rounded-lg border border-green-200">
                <h3 className="font-semibold text-green-800 mb-2">
                  Meeting Created Successfully!
                </h3>
                <p className="text-sm text-green-600 mb-3">
                  Share this link with participants:
                </p>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={meetingLink}
                    readOnly
                    className="flex-1 px-3 py-2 border border-green-300 rounded text-sm bg-white"
                  />
                  <button
                    onClick={copyMeetingLink}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded text-sm"
                  >
                    Copy
                  </button>
                </div>
                <button
                  onClick={() => joinMeeting()}
                  className="w-full mt-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded"
                >
                  Join Meeting Now
                </button>
              </div>
            )}
          </div>

          {/* Join Meeting Card */}
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <div className="text-center">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-3xl">🔗</span>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Join Meeting
              </h2>
              <p className="text-gray-600 mb-6">
                Enter a meeting ID to join an existing meeting
              </p>
              
              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="Enter Meeting ID"
                  value={joinMeetingId}
                  onChange={(e) => setJoinMeetingId(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={joinMeetingWithId}
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-4 px-6 rounded-lg transition duration-200"
                >
                  Join Meeting
                </button>
              </div>
            </div>
          </div>
        </div>


      </main>
    </div>
  );
};

export default Dashboard;