import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams } from 'react-router';
import { BACKEND_URL } from '../../utils/urlConstants';
import AgoraRTC from 'agora-rtc-sdk-ng';
import { 
  Mic, 
  MicOff, 
  Video, 
  VideoOff, 
  Phone, 
  PhoneOff, 
  Monitor, 
  MoreVertical,
  MessageSquare,
  Users,
  Settings,
  Grid3x3,
  Info,
  X
} from 'lucide-react';
import './TeleConsultation.css';

const PatientTeleConsultation = () => {
  const { appointmentId } = useParams();
  const [sessionData, setSessionData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [joined, setJoined] = useState(false);
  const [client, setClient] = useState(null);
  const [micMuted, setMicMuted] = useState(false);
  const [videoMuted, setVideoMuted] = useState(false);
  const [participants, setParticipants] = useState([]);
  const [isScreenSharing] = useState(false);
  const [remoteUsers, setRemoteUsers] = useState(new Map());

  const localAudioTrackRef = useRef(null);
  const localVideoTrackRef = useRef(null);

  // Define video display functions first
  const displayLocalVideo = useCallback(() => {
    // Use setTimeout to ensure DOM is ready
    setTimeout(() => {
      const localPlayerContainer = document.getElementById(`participant-${sessionData?.uid}`);
      console.log('Displaying local video in container:', localPlayerContainer, 'Track:', localVideoTrackRef.current);
      if (localPlayerContainer && localVideoTrackRef.current) {
        try {
          localVideoTrackRef.current.play(localPlayerContainer);
          // Add class to hide fallback content
          localPlayerContainer.classList.add('video-playing');
          console.log('Local video started playing');
        } catch (error) {
          console.error('Error playing local video:', error);
        }
      }
    }, 100);
  }, [sessionData?.uid]);

  const displayRemoteVideo = useCallback((user) => {
    // Use setTimeout to ensure DOM is ready
    setTimeout(() => {
      const remotePlayerContainer = document.getElementById(`participant-${user.uid}`);
      console.log('Displaying remote video for user:', user.uid, 'Container:', remotePlayerContainer, 'Track:', user.videoTrack);
      if (remotePlayerContainer && user.videoTrack) {
        try {
          user.videoTrack.play(remotePlayerContainer);
          // Add class to hide fallback content
          remotePlayerContainer.classList.add('video-playing');
          console.log('Remote video started playing for user:', user.uid);
        } catch (error) {
          console.error('Error playing remote video:', error);
        }
      }
    }, 100);
  }, []);

  const generateSessionData = async () => {
    setLoading(true);
    setError(null);

    try {
      const url = `${BACKEND_URL}/teleconsultation/patient/${appointmentId}/token`;
      console.log('Requesting URL:', url);
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      console.log("Session data:", data);
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to generate session data');
      }

      setSessionData(data.data);
    } catch (err) {
      setError(err.message);
      console.error('Error generating session data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Update participants list
  useEffect(() => {
    const localParticipant = {
      id: sessionData?.uid || 'local',
      name: 'You (Patient)',
      isLocal: true,
      videoEnabled: !videoMuted,
      audioEnabled: !micMuted
    };

    const remoteParticipants = Array.from(remoteUsers.values()).map(user => ({
      id: user.uid,
      name: 'Doctor',
      isLocal: false,
      videoEnabled: !!user.videoTrack,
      audioEnabled: !!user.audioTrack
    }));

    setParticipants([localParticipant, ...remoteParticipants]);
  }, [micMuted, videoMuted, remoteUsers, sessionData]);

  // Re-display videos when participants change
  useEffect(() => {
    if (joined && localVideoTrackRef.current && sessionData && !videoMuted) {
      displayLocalVideo();
    }
  }, [participants, joined, videoMuted, sessionData, displayLocalVideo]);

  // Re-display remote videos when they change
  useEffect(() => {
    remoteUsers.forEach((user) => {
      if (user.videoTrack) {
        displayRemoteVideo(user);
      }
    });
  }, [remoteUsers, displayRemoteVideo]);

  useEffect(() => {
    if (!sessionData) return;
    
    if (client) {
      return;
    }
    
    const agoraClient = AgoraRTC.createClient({
      mode: "rtc",
      codec: "vp8",
    });

    setClient(agoraClient);
    setupEventListeners(agoraClient);

    return () => {
      if (client) {
        client.leave().then(() => {
          console.log("Left the channel successfully");
        }).catch((err) => {
          console.error("Error leaving channel:", err);
        });
      }
    };
    // eslint-disable-next-line
  }, [sessionData, client]);

  const joinCall = async () => {
    try {
      if (!client || !sessionData) return;

      // Join the channel using sessionData from API
      const uid = await client.join(
        sessionData.appId,
        sessionData.channelName,
        sessionData.token,
        sessionData.uid
      );
      console.log(`User ${uid} joined the channel`);

      await createLocalMediaTracks();
      displayLocalVideo();
      publishLocalTracks();

      setJoined(true);
    } catch (err) {
      console.error('Error joining the channel:', err);
      alert('Failed to join the call. Please try again.');
    }
  };

  async function createLocalMediaTracks() {
    localAudioTrackRef.current = await AgoraRTC.createMicrophoneAudioTrack();
    localVideoTrackRef.current = await AgoraRTC.createCameraVideoTrack();
  }

  async function publishLocalTracks() {
    await client.publish([localAudioTrackRef.current, localVideoTrackRef.current]);
  }

  function setupEventListeners(client) {
    // Declare event handler for "user-published"
    client.on("user-published", async (user, mediaType) => {
      console.log({user, mediaType});
      // Subscribe to media streams
      await client.subscribe(user, mediaType);
      
      // Update remote users map
      setRemoteUsers(prev => {
        const updated = new Map(prev);
        const existingUser = updated.get(user.uid) || { uid: user.uid };
        
        if (mediaType === "video") {
          existingUser.videoTrack = user.videoTrack;
          displayRemoteVideo(user);
        }
        if (mediaType === "audio") {
          existingUser.audioTrack = user.audioTrack;
          user.audioTrack.play();
        }
        
        updated.set(user.uid, existingUser);
        return updated;
      });
    });

    // Handle the "user-unpublished" event
    client.on("user-unpublished", async (user, mediaType) => {
      setRemoteUsers(prev => {
        const updated = new Map(prev);
        const existingUser = updated.get(user.uid);
        
        if (existingUser) {
          if (mediaType === "video") {
            existingUser.videoTrack = null;
            const remotePlayerContainer = document.getElementById(`user-${user.uid}`);
            if (remotePlayerContainer) remotePlayerContainer.remove();
          }
          if (mediaType === "audio") {
            existingUser.audioTrack = null;
          }
          
          updated.set(user.uid, existingUser);
        }
        
        return updated;
      });
    });

    // Handle user leaving
    client.on("user-left", (user) => {
      setRemoteUsers(prev => {
        const updated = new Map(prev);
        updated.delete(user.uid);
        const remotePlayerContainer = document.getElementById(`user-${user.uid}`);
        if (remotePlayerContainer) remotePlayerContainer.remove();
        return updated;
      });
    });
  }

  const leaveCall = async () => {
    // Leave the channel and clean up
    // Stop the local media tracks to release the microphone and camera resources
    if (localAudioTrackRef.current) {
      localAudioTrackRef.current.close();
      localAudioTrackRef.current = null;
    }
    if (localVideoTrackRef.current) {
      localVideoTrackRef.current.close();
      localVideoTrackRef.current = null;
    }
    // Leave the channel
    if (client) {
      await client.leave();
    }
    setJoined(false);
    // Navigate back or close the session
    window.history.back();
  };

  const toggleMic = () => {
    if (localAudioTrackRef.current) {
      const micMutedVal = !micMuted;
      localAudioTrackRef.current.setMuted(micMutedVal);
      setMicMuted(micMutedVal);
    }
  };

  const toggleVideo = () => {
    if (localVideoTrackRef.current && sessionData) {
      const videoMutedVal = !videoMuted;
      localVideoTrackRef.current.setMuted(videoMutedVal);
      setVideoMuted(videoMutedVal);
      
      const localPlayerContainer = document.getElementById(`participant-${sessionData.uid}`);
      
      if (videoMutedVal) {
        // Video muted - remove video-playing class to show fallback
        if (localPlayerContainer) {
          localPlayerContainer.classList.remove('video-playing');
        }
      } else {
        // Video unmuted - re-display video
        setTimeout(() => displayLocalVideo(), 100);
      }
    }
  };

  const toggleScreenShare = () => {
    // TODO: Implement actual screen sharing logic
  };

  // UI Components
  const ParticipantTile = ({ participant }) => {
    const initials = participant.name.split(' ').map(n => n[0]).join('').toUpperCase();
    const tileClass = "relative w-full h-full bg-gray-900 rounded-lg overflow-hidden min-h-[200px]";

    return (
      <div className={tileClass}>
        {participant.videoEnabled ? (
          // Video container - Agora will render video here
          <div 
            id={`participant-${participant.id}`} 
            className="w-full h-full bg-black relative overflow-hidden"
            style={{ 
              position: 'relative',
              width: '100%',
              height: '100%'
            }}
          >
            {/* Fallback content while video loads - will be hidden when video plays */}
            <div className="participant-fallback absolute inset-0 bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center z-10">
              <div className="text-white text-4xl font-bold">{initials}</div>
            </div>
          </div>
        ) : (
          // No video - show avatar
          <div className="w-full h-full bg-gradient-to-br from-gray-600 to-gray-800 flex items-center justify-center">
            <div className="text-white text-4xl font-bold">{initials}</div>
          </div>
        )}
        
        {/* Participant info overlay */}
        <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between">
          <div className="bg-black bg-opacity-50 px-2 py-1 rounded text-white text-sm font-medium">
            {participant.name}
          </div>
          <div className="flex items-center space-x-1">
            {!participant.audioEnabled && (
              <div className="bg-red-500 p-1 rounded-full">
                <MicOff className="w-3 h-3 text-white" />
              </div>
            )}
            {!participant.videoEnabled && (
              <div className="bg-red-500 p-1 rounded-full">
                <VideoOff className="w-3 h-3 text-white" />
              </div>
            )}
          </div>
        </div>

        {/* Local user controls overlay */}
        {participant.isLocal && (
          <div className="absolute top-2 right-2 flex space-x-1">
            <button className="bg-black bg-opacity-50 p-1 rounded-full hover:bg-opacity-70 transition-opacity">
              <Settings className="w-4 h-4 text-white" />
            </button>
            <button className="bg-black bg-opacity-50 p-1 rounded-full hover:bg-opacity-70 transition-opacity">
              <MoreVertical className="w-4 h-4 text-white" />
            </button>
          </div>
        )}
      </div>
    );
  };

  const ControlButton = ({ icon, isActive, onClick, className = "", activeColor = "bg-blue-500" }) => {
    const IconComponent = icon;
    return (
      <button
        onClick={onClick}
        className={`p-3 rounded-full transition-all duration-200 hover:scale-110 ${
          isActive 
            ? `${activeColor} text-white`
            : "bg-gray-700 text-gray-300 hover:bg-gray-600"
        } ${className}`}
      >
        <IconComponent className="w-5 h-5" />
      </button>
    );
  };

  const getGridLayout = (count) => {
    if (count <= 1) return "grid-cols-1";
    if (count <= 4) return "grid-cols-2";
    if (count <= 6) return "grid-cols-3";
    return "grid-cols-4";
  };

  if (!joined) {
    return (
      <div className="fixed inset-0 bg-gray-900 z-50 flex items-center justify-center">
        <div className="text-center">
          {error && (
            <div className="mb-8 bg-red-50 border border-red-200 rounded-lg p-6 max-w-md mx-auto">
              <h3 className="text-lg font-semibold mb-2 text-center text-red-800">Error</h3>
              <p className="mb-4 text-red-700 text-center text-sm">{error}</p>
              <button 
                onClick={generateSessionData}
                className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
              >
                Try Again
              </button>
            </div>
          )}
          
          {!sessionData && !loading && !error && (
            <div className="mb-8 bg-blue-50 border border-blue-200 rounded-lg p-6 max-w-md mx-auto">
              <h3 className="text-lg font-semibold mb-2 text-center text-gray-800">Start Consultation</h3>
              <p className="mb-4 text-gray-700 text-center text-sm">Click the button below to start your consultation session.</p>
              <button 
                onClick={generateSessionData}
                disabled={loading}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 mx-auto"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Starting Session...
                  </>
                ) : (
                  'Start Consultation Session'
                )}
              </button>
            </div>
          )}

          {loading && (
            <div className="mb-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-400">Starting your consultation session...</p>
            </div>
          )}
          
          {sessionData && (
            <div className="mb-8">
              <div className="w-32 h-32 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Video className="w-16 h-16 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-white mb-2">Ready to join?</h1>
              <p className="text-gray-400">Click the button below to join the teleconsultation</p>
            </div>
          )}
          
          {sessionData && (
            <div className="flex gap-4 justify-center">
              <button
                onClick={joinCall}
                className="bg-blue-500 hover:bg-blue-600 text-white px-8 py-3 rounded-full font-medium transition-colors duration-200"
              >
                Join Call
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-gray-900 z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-gray-800 border-b border-gray-700">
        <div className="flex items-center space-x-2">
          <span className="text-white text-sm">{new Date().toLocaleTimeString()}</span>
          <span className="text-gray-400">|</span>
          <span className="text-gray-400 text-sm">{sessionData?.channelName || 'teleconsultation'}</span>
        </div>
        <div className="flex items-center space-x-2">
          <button className="text-gray-400 hover:text-white p-2">
            <Info className="w-5 h-5" />
          </button>
          <button className="text-gray-400 hover:text-white p-2">
            <Users className="w-5 h-5" />
          </button>
          <button className="text-gray-400 hover:text-white p-2">
            <MessageSquare className="w-5 h-5" />
          </button>
          <button className="text-gray-400 hover:text-white p-2">
            <Grid3x3 className="w-5 h-5" />
          </button>
          <button 
            onClick={() => window.history.back()}
            className="text-gray-400 hover:text-white p-2"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main video area */}
      <div className="flex-1 p-4">
        <div className={`grid gap-4 h-full ${getGridLayout(participants.length)}`}>
          {participants.map((participant) => (
            <div key={participant.id} className="min-h-[200px]">
              <ParticipantTile participant={participant} />
            </div>
          ))}
        </div>
      </div>

      {/* Bottom controls */}
      <div className="p-4 bg-gray-800 border-t border-gray-700">
        <div className="flex items-center justify-center space-x-4">
          <ControlButton
            icon={micMuted ? MicOff : Mic}
            isActive={!micMuted}
            onClick={toggleMic}
            activeColor={micMuted ? "bg-red-500" : "bg-gray-700"}
          />
          
          <ControlButton
            icon={videoMuted ? VideoOff : Video}
            isActive={!videoMuted}
            onClick={toggleVideo}
            activeColor={videoMuted ? "bg-red-500" : "bg-gray-700"}
          />

          <ControlButton
            icon={Monitor}
            isActive={isScreenSharing}
            onClick={toggleScreenShare}
            activeColor="bg-blue-500"
          />

          <ControlButton
            icon={MoreVertical}
            isActive={false}
            onClick={() => {}}
          />

          <button
            onClick={leaveCall}
            className="bg-red-500 hover:bg-red-600 text-white p-3 rounded-full transition-all duration-200 hover:scale-110 ml-8"
          >
            <PhoneOff className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default PatientTeleConsultation; 