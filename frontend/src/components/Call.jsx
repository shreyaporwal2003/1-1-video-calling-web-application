import { useEffect, useRef, useState } from "react";
import socket from "../socket";

export default function Call({ roomId, onEnd }) {
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const pcRef = useRef(null);
  const localStreamRef = useRef(null);

  const [state, setState] = useState("Waiting for other user…");
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [isLocalLarge, setIsLocalLarge] = useState(false); // Track which video is large

  /* -------- END CALL -------- */
  const handleEndCall = () => {
    localStreamRef.current?.getTracks().forEach(t => t.stop());
    pcRef.current?.close();
    socket.emit("end-call", roomId);
    onEnd();
  };

  /* -------- TOGGLE MIC -------- */
  const toggleMic = () => {
    const audioTrack = localStreamRef.current?.getAudioTracks()[0];
    if (!audioTrack) return;
    audioTrack.enabled = !audioTrack.enabled;
    setMicOn(audioTrack.enabled);
  };

  /* -------- TOGGLE CAMERA -------- */
  const toggleCam = () => {
    const videoTrack = localStreamRef.current?.getVideoTracks()[0];
    if (!videoTrack) return;
    videoTrack.enabled = !videoTrack.enabled;
    setCamOn(videoTrack.enabled);
  };

  /* -------- SWAP VIDEOS -------- */
  const swapVideos = () => {
    setIsLocalLarge(!isLocalLarge);
  };

  /* -------- START CALL -------- */
  useEffect(() => {
    async function startCall() {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });

      localStreamRef.current = stream;
      localVideoRef.current.srcObject = stream;

      const pc = new RTCPeerConnection({
        iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
      });

      pcRef.current = pc;

      stream.getTracks().forEach(track => pc.addTrack(track, stream));

      pc.ontrack = e => {
        remoteVideoRef.current.srcObject = e.streams[0];
        setState("Connected");
      };

      pc.onicecandidate = e => {
        if (e.candidate) {
          socket.emit("ice-candidate", {
            roomId,
            candidate: e.candidate
          });
        }
      };

      socket.emit("join-room", roomId);
    }

    startCall();

    return () => {
      localStreamRef.current?.getTracks().forEach(t => t.stop());
      pcRef.current?.close();
    };
    // eslint-disable-next-line
  }, []);

  /* -------- SIGNALING -------- */
  useEffect(() => {
    socket.on("peer-joined", async () => {
      setState("Connecting…");
      const offer = await pcRef.current.createOffer();
      await pcRef.current.setLocalDescription(offer);
      socket.emit("offer", { roomId, offer });
    });

    socket.on("offer", async offer => {
      setState("Connecting…");
      await pcRef.current.setRemoteDescription(offer);
      const answer = await pcRef.current.createAnswer();
      await pcRef.current.setLocalDescription(answer);
      socket.emit("answer", { roomId, answer });
    });

    socket.on("answer", async answer => {
      await pcRef.current.setRemoteDescription(answer);
      setState("Connected");
    });

    socket.on("ice-candidate", c => {
      pcRef.current?.addIceCandidate(c);
    });

    socket.on("call-ended", () => {
      alert("The other user ended the call");
      handleEndCall();
    });

    return () => socket.off();
    // eslint-disable-next-line
  }, []);

  /* -------- UI -------- */
  return (
    <div className="call-container">
      {/* ROOM ID BAR */}
      <div
        style={{
          position: "absolute",
          top: 12,
          left: "50%",
          transform: "translateX(-50%)",
          background: "rgba(249, 249, 249, 0.6)",
          padding: "8px 14px",
          borderRadius: "8px",
          fontSize: "14px",
          display: "flex",
          gap: "8px",
          alignItems: "center",
          zIndex: 10
        }}
      >
        <span>Room ID:</span>
        <code>{roomId}</code>
        <button
          style={{ cursor: "pointer" }}
          onClick={() => navigator.clipboard.writeText(roomId)}
        >
          Copy
        </button>
      </div>

      {/* STATUS */}
      <div className="call-status">{state}</div>

      {/* REMOTE VIDEO - Large or Small based on state */}
      <video
        ref={remoteVideoRef}
        autoPlay
        playsInline
        className={isLocalLarge ? "local-video" : "remote-video"}
        onClick={swapVideos}
        style={{ cursor: "pointer" }}
      />

      {/* LOCAL VIDEO - Small or Large based on state */}
      <video
        ref={localVideoRef}
        autoPlay
        muted
        playsInline
        className={isLocalLarge ? "remote-video" : "local-video"}
        onClick={swapVideos}
        style={{ cursor: "pointer" }}
      />

      {/* CONTROLS */}
      <div className="controls">
        <button className="control-btn" onClick={toggleMic}>
          {micOn ? "🔊" : "🔇"}
        </button>

        <button className="control-btn" onClick={toggleCam}>
          {camOn ? "📸" : "📸 off"}
        </button>

        <button className="control-btn end-call" onClick={handleEndCall}>
          End
        </button>
      </div>
    </div>
  );
}