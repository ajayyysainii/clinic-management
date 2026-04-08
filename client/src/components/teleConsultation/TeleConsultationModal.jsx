import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  Copy,
  X
} from 'lucide-react';
import './TeleConsultation.css';
import { withBasePath } from '../../utils/basePath.js';

const TeleConsultationModal = ({ isOpen, onClose, appointment, sessionData }) => {
  const [joined, setJoined] = useState(false);
  const [client, setClient] = useState(null);
  const [micMuted, setMicMuted] = useState(false);
  const [videoMuted, setVideoMuted] = useState(false);
  const [showInvitation, setShowInvitation] = useState(true);
  const [invitationLink, setInvitationLink] = useState('');
  const [participants, setParticipants] = useState([]);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
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

  useEffect(() => {
    if (sessionData && appointment) {
      const baseUrl = window.location.origin;
      setInvitationLink(`${baseUrl}${withBasePath(`/teleconsultation/patient/${appointment._id}`)}`);
    }
  }, [sessionData, appointment]);

  // Update participants list
  useEffect(() => {
    const localParticipant = {
      id: sessionData?.uid || 'local',
      name: 'You (Doctor)',
      isLocal: true,
      videoEnabled: !videoMuted,
      audioEnabled: !micMuted
    };

    const remoteParticipants = Array.from(remoteUsers.values()).map(user => ({
      id: user.uid,
      name: user.uid === sessionData?.patientUid ? 'Patient' : `User ${user.uid}`,
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
    if (!isOpen || !sessionData) return;
    
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
  }, [isOpen, sessionData, client]);

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
      setShowInvitation(false);
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
    onClose();
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

  const copyInvitationLink = () => {
    navigator.clipboard.writeText(invitationLink);
    alert('Invitation link copied to clipboard!');
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

  if (!isOpen) return null;

  if (!joined) {
    return (
      <div className="fixed inset-0 bg-gray-900 z-50 flex items-center justify-center">
        <div className="text-center">
          {showInvitation && (
            <div className="mb-8 bg-blue-50 border border-blue-200 rounded-lg p-6 max-w-md mx-auto">
              <h3 className="text-lg font-semibold mb-2 text-center text-gray-800">Invite Patient</h3>
              <p className="mb-4 text-gray-700 text-center text-sm">Share this link with your patient:</p>
              <div className="flex gap-2 mb-4">
                <input 
                  value={invitationLink} 
                  readOnly 
                  className="flex-1 px-3 py-2 border border-gray-300 rounded text-sm"
                />
                <button 
                  onClick={copyInvitationLink}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded text-sm flex items-center gap-1"
                >
                  <Copy size={14} />
                  Copy
                </button>
              </div>
            </div>
          )}
          
          <div className="mb-8">
            <div className="w-32 h-32 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Video className="w-16 h-16 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">Ready to join?</h1>
            <p className="text-gray-400">Click the button below to join the teleconsultation</p>
          </div>
          
          <div className="flex gap-4 justify-center">
            <button
              onClick={joinCall}
              className="bg-blue-500 hover:bg-blue-600 text-white px-8 py-3 rounded-full font-medium transition-colors duration-200"
            >
              Join Call
            </button>
            <button
              onClick={onClose}
              className="bg-gray-600 hover:bg-gray-700 text-white px-8 py-3 rounded-full font-medium transition-colors duration-200"
            >
              Cancel
            </button>
          </div>
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
            onClick={onClose}
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

export default TeleConsultationModal;
