import React, { useState, useEffect, useRef } from 'react';
import AgoraRTC from 'agora-rtc-sdk-ng';
import { X, Phone, Video, Mic, MicOff, VideoOff } from 'lucide-react';
import './TeleConsultation.css';

const TeleConsultation = ({ isOpen, onClose, sessionData }) => {
  const [joined, setJoined] = useState(false);
  const [client, setClient] = useState(null);
  const [micMuted, setMicMuted] = useState(false);
  const [videoMuted, setVideoMuted] = useState(false);

  let localAudioTrackRef = useRef(null);
  let localVideoTrackRef = useRef(null);

  useEffect(() => {
    if (!isOpen || !sessionData) return;

    const agoraClient = AgoraRTC.createClient({
      mode: "rtc",
      codec: "vp8",
    });

    setClient(agoraClient);
    setupEventListeners(agoraClient);

    return () => {
      if (client) {
        client.leave().then(() => {
          // left
        }).catch(() => {});
      }
    };
    // eslint-disable-next-line
  }, [isOpen, sessionData]);

  const joinCall = async () => {
    try {
      if (!client || !sessionData) return;

      const agoraAppId = import.meta.env.VITE_AGORA_APP_ID
      await client.join(
        agoraAppId,
        sessionData.channelName,
        sessionData.token,
        sessionData.uid
      );

      await createLocalMediaTracks();
      displayLocalVideo();
      publishLocalTracks();

      setJoined(true);
    } catch (err) {
      console.error('Failed to join the call:', err);
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
    client.on("user-published", async (user, mediaType) => {
      await client.subscribe(user, mediaType);
      if (mediaType === "video") {
        displayRemoteVideo(user);
      }
      if (mediaType === "audio") {
        user.audioTrack.play();
      }
    });

    client.on("user-unpublished", async (user) => {
      const remotePlayerContainer = document.getElementById(user.uid);
      if (remotePlayerContainer) remotePlayerContainer.remove();
    });
  }

  // Improved name tag/styling for local video
  function displayLocalVideo() {
    const localPlayerContainer = document.createElement("div");
    localPlayerContainer.id = sessionData.uid;
    localPlayerContainer.className = "video-player local-player";
    
    // Name tag
    const nameTag = document.createElement('span');
    nameTag.className = "name-tag";
    nameTag.innerText = "Patient (You)";
    localPlayerContainer.appendChild(nameTag);

    const videoContainer = document.getElementById("video-container");
    if (videoContainer) {
      videoContainer.append(localPlayerContainer);
      localVideoTrackRef.current.play(localPlayerContainer);
    }
  }

  function displayRemoteVideo(user) {
    const remotePlayerContainer = document.createElement("div");
    remotePlayerContainer.id = user.uid.toString();
    remotePlayerContainer.className = "video-player remote-player";

    // Name tag
    const nameTag = document.createElement('span');
    nameTag.className = "name-tag";
    nameTag.innerText = "Doctor";
    remotePlayerContainer.appendChild(nameTag);

    const videoContainer = document.getElementById("video-container");
    if (videoContainer) {
      videoContainer.append(remotePlayerContainer);
      user.videoTrack.play(remotePlayerContainer);
    }
  }

  const leaveCall = async () => {
    if (localAudioTrackRef.current) {
      localAudioTrackRef.current.close();
      localAudioTrackRef.current = null;
    }
    if (localVideoTrackRef.current) {
      localVideoTrackRef.current.close();
      localVideoTrackRef.current = null;
    }
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
    if (localVideoTrackRef.current) {
      const videoMutedVal = !videoMuted;
      localVideoTrackRef.current.setMuted(videoMutedVal);
      setVideoMuted(videoMutedVal);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="teleconsultation-modal">
      <div className="teleconsultation-modal-content">
        {/* Header */}
        <div className="teleconsultation-header">
          <h3>Your Teleconsultation</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 p-2 rounded-full focus:outline-none focus:ring"
            aria-label="Close"
          >
            <X size={24} />
          </button>
        </div>

        <div className="teleconsultation-body" style={{ position: 'relative', flex: 1, minHeight: 0 }}>
          {/* Video Section */}
          <div id="video-container" className="video-container">
            {/* fallback prompt */}
            {!joined && (
              <div className="join-prompt">
                Click "Join Consultation" to start your session with the doctor
              </div>
            )}
          </div>

          {/* Join Button */}
          {!joined && (
            <div className="join-section">
              <button
                className="join-button mt-2 flex items-center gap-2"
                onClick={joinCall}
              >
                <Video size={16} />
                Join Consultation
              </button>
            </div>
          )}

          {/* Floating Controls */}
          {joined && (
            <div className="control-dock">
              <button
                aria-label={micMuted ? "Unmute mic" : "Mute mic"}
                onClick={toggleMic}
                className={`mute-button ${micMuted ? 'muted' : ''}`}
                title={micMuted ? "Unmute Mic" : "Mute Mic"}
              >
                {micMuted ? <MicOff size={20} /> : <Mic size={20} />}
              </button>
              <button
                aria-label={videoMuted ? "Start video" : "Stop video"}
                onClick={toggleVideo}
                className={`mute-button ${videoMuted ? 'muted' : ''}`}
                title={videoMuted ? "Turn Camera On" : "Turn Camera Off"}
              >
                {videoMuted ? <VideoOff size={20} /> : <Video size={20} />}
              </button>
              <button
                aria-label="End call"
                onClick={leaveCall}
                className="leave-button"
                title="End Call"
              >
                <Phone size={20} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TeleConsultation;
