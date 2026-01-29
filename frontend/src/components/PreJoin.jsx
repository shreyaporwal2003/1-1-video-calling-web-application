import { useEffect, useRef, useState } from "react";

export default function PreJoin({ onJoin }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [roomId, setRoomId] = useState("");

  useEffect(() => {
    async function init() {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });
      streamRef.current = stream;
      videoRef.current.srcObject = stream;
    }
    init();

    return () => {
      streamRef.current?.getTracks().forEach(t => t.stop());
    };
  }, []);

  const toggleMic = () => {
    const track = streamRef.current.getAudioTracks()[0];
    track.enabled = !micOn;
    setMicOn(!micOn);
  };

  const toggleCam = () => {
    const track = streamRef.current.getVideoTracks()[0];
    track.enabled = !camOn;
    setCamOn(!camOn);
  };

  const join = () => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    onJoin(roomId.trim());
  };

  return (
    <div className="prejoin-container">
      <div className="prejoin-card">
        <h3>Device Check</h3>

        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          className="prejoin-video"
        />

        <div className="prejoin-controls">
          <button className="control-btn" onClick={toggleMic}>
            {micOn ? "Mic" : "Mic Off"}
          </button>
          <button className="control-btn" onClick={toggleCam}>
            {camOn ? "Cam" : "Cam Off"}
          </button>
        </div>

        <input
          className="room-input"
          placeholder="Room ID"
          value={roomId}
          onChange={e => setRoomId(e.target.value)}
        />

        <button
          className="join-btn"
          disabled={!roomId.trim()}
          onClick={join}
        >
          Join Call
        </button>
      </div>
    </div>
  );
}
