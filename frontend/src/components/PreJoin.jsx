import { useEffect, useRef, useState } from "react";

export default function PreJoin({ onCreate, onJoin }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  const [roomId, setRoomId] = useState("");
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);

  // 🔹 Device preview (camera + mic check)
  useEffect(() => {
    async function init() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true
        });
        streamRef.current = stream;
        videoRef.current.srcObject = stream;
      } catch {
        alert("Camera and microphone permission is required");
      }
    }

    init();

    return () => {
      streamRef.current?.getTracks().forEach(t => t.stop());
    };
  }, []);

  // 🔹 Toggle mic
  const toggleMic = () => {
    const track = streamRef.current?.getAudioTracks()[0];
    if (!track) return;
    track.enabled = !track.enabled;
    setMicOn(track.enabled);
  };

  // 🔹 Toggle camera
  const toggleCam = () => {
    const track = streamRef.current?.getVideoTracks()[0];
    if (!track) return;
    track.enabled = !track.enabled;
    setCamOn(track.enabled);
  };

  // 🔹 Join existing room
  const handleJoin = () => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    onJoin(roomId.trim());
  };

  // 🔹 Create new room
  const handleCreate = () => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    onCreate();
  };

  return (
    <div className="prejoin-container">
      <div className="prejoin-card">
        <h3>Video Call</h3>

        {/* Camera preview */}
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          className="prejoin-video"
        />

        {/* Mic / Cam controls */}
        <div className="prejoin-controls">
          <button className="control-btn" onClick={toggleMic}>
            {micOn ? "Mic On" : "Mic Off"}
          </button>
          <button className="control-btn" onClick={toggleCam}>
            {camOn ? "Cam On" : "Cam Off"}
          </button>
        </div>

        {/* CREATE CALL */}
        <button
          className="join-btn"
          style={{ marginBottom: "12px" }}
          onClick={handleCreate}
        >
          Create Call
        </button>

        <div style={{ margin: "12px 0", opacity: 0.6 }}>OR</div>

        {/* JOIN CALL */}
        <input
          className="room-input"
          placeholder="Enter Room ID"
          value={roomId}
          onChange={e => setRoomId(e.target.value)}
        />

        <button
          className="join-btn"
          disabled={!roomId.trim()}
          onClick={handleJoin}
        >
          Join Call
        </button>
      </div>
    </div>
  );
}
