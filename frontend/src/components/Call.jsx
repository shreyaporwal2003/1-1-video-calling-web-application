import { useEffect, useRef, useState } from "react";
import socket from "../socket";

/*
  Call Component Responsibilities:
  - Capture local camera & microphone
  - Create WebRTC peer connection
  - Exchange signaling data via Socket.io
  - Show local & remote video
  - Handle call controls (mute, camera, end)
  - Manage cleanup + timer + connection state
*/
export default function Call({ roomId, onEnd }) {
  /* ---------- REFERENCES (persist across renders) ---------- */

  // Local video element
  const localVideoRef = useRef(null);

  // Remote video element
  const remoteVideoRef = useRef(null);

  // RTCPeerConnection instance
  const pcRef = useRef(null);

  // Local media stream (camera + mic)
  const localStreamRef = useRef(null);

  // Timer interval reference
  const timerRef = useRef(null);

  /* ---------- UI STATE ---------- */

  // Current call status shown to user
  const [state, setState] = useState("Initializing camera…");

  // Mic enabled/disabled
  const [micOn, setMicOn] = useState(true);

  // Camera enabled/disabled
  const [camOn, setCamOn] = useState(true);

  // Whether local video is large or small
  const [isLocalLarge, setIsLocalLarge] = useState(false);

  // Call duration in seconds
  const [callSeconds, setCallSeconds] = useState(0);

  /* ---------- FORMAT TIMER ---------- */
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;

    // Returns "MM:SS"
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  /* ---------- CLEANUP FUNCTION ---------- */
  const cleanupMedia = () => {
    // Stop all camera & mic tracks
    localStreamRef.current?.getTracks().forEach((t) => t.stop());

    // Close peer connection
    pcRef.current?.close();

    // Clear timer if running
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    // Reset timer UI
    setCallSeconds(0);
  };

  /* ---------- END CALL ---------- */
  const handleEndCall = () => {
    cleanupMedia();          // release devices + close connection
    socket.emit("end-call", roomId); // notify other user
    onEnd?.();               // return to previous screen
  };

  /* ---------- TOGGLE MICROPHONE ---------- */
  const toggleMic = () => {
    const audioTrack = localStreamRef.current?.getAudioTracks()[0];
    if (!audioTrack) return;

    audioTrack.enabled = !audioTrack.enabled;
    setMicOn(audioTrack.enabled);
  };

  /* ---------- TOGGLE CAMERA ---------- */
  const toggleCam = () => {
    const videoTrack = localStreamRef.current?.getVideoTracks()[0];
    if (!videoTrack) return;

    videoTrack.enabled = !videoTrack.enabled;
    setCamOn(videoTrack.enabled);
  };

  /* ---------- SWAP VIDEO SIZES ---------- */
  const swapVideos = () => setIsLocalLarge((prev) => !prev);

  /*
      START CALL → get media + create RTCPeerConnection
     */
  useEffect(() => {
    let isMounted = true;

    async function startCall() {
      try {
        /* ---- Request camera + microphone ---- */
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });

        if (!isMounted) return;

        // Save stream reference
        localStreamRef.current = stream;

        // Show local preview
        localVideoRef.current.srcObject = stream;

        /* ---- Create WebRTC Peer Connection ---- */
        const pc = new RTCPeerConnection({
          iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
        });

        pcRef.current = pc;

        /* ---- Add local tracks to peer connection ---- */
        stream.getTracks().forEach((track) => pc.addTrack(track, stream));

        /* ---- When remote stream arrives ---- */
        pc.ontrack = (e) => {
          remoteVideoRef.current.srcObject = e.streams[0];
          setState("Connected");
        };

        /* ---- Send ICE candidates to other peer ---- */
        pc.onicecandidate = (e) => {
          if (e.candidate) {
            socket.emit("ice-candidate", { roomId, candidate: e.candidate });
          }
        };

        /* ---- Detect connection loss ---- */
        pc.onconnectionstatechange = () => {
          if (
            pc.connectionState === "disconnected" ||
            pc.connectionState === "failed"
          ) {
            setState("Connection lost");
          }
        };

        setState("Waiting for other user…");

        /* ---- Join signaling room ---- */
        socket.emit("join-room", roomId);
      } catch (err) {
        console.error(err);
        setState("Camera/Microphone permission denied");
      }
    }

    startCall();

    /* ---- Cleanup on component unmount ---- */
    return () => {
      isMounted = false;
      cleanupMedia();
    };
  }, [roomId]);

  /*
      SIGNALING FLOW (offer → answer → ICE)
     */
  useEffect(() => {
    /* ---- When second user joins ---- */
    const handlePeerJoined = async () => {
      setState("Connecting…");

      const offer = await pcRef.current.createOffer();
      await pcRef.current.setLocalDescription(offer);

      socket.emit("offer", { roomId, offer });
    };

    /* ---- When receiving offer ---- */
    const handleOffer = async (offer) => {
      setState("Connecting…");

      await pcRef.current.setRemoteDescription(offer);

      const answer = await pcRef.current.createAnswer();
      await pcRef.current.setLocalDescription(answer);

      socket.emit("answer", { roomId, answer });
    };

    /* ---- When receiving answer ---- */
    const handleAnswer = async (answer) => {
      await pcRef.current.setRemoteDescription(answer);
      setState("Connected");
    };

    /* ---- When receiving ICE candidate ---- */
    const handleIce = (c) => pcRef.current?.addIceCandidate(c);

    /* ---- When other user ends call ---- */
    const handleCallEnded = () => {
      alert("The other user ended the call");
      handleEndCall();
    };

    /* ---- Register socket listeners ---- */
    socket.on("peer-joined", handlePeerJoined);
    socket.on("offer", handleOffer);
    socket.on("answer", handleAnswer);
    socket.on("ice-candidate", handleIce);
    socket.on("call-ended", handleCallEnded);

    /* ---- Remove ONLY these listeners on cleanup ---- */
    return () => {
      socket.off("peer-joined", handlePeerJoined);
      socket.off("offer", handleOffer);
      socket.off("answer", handleAnswer);
      socket.off("ice-candidate", handleIce);
      socket.off("call-ended", handleCallEnded);
    };
  }, [roomId]);

  /* 
      CALL TIMER (starts only when connected)
      */
  useEffect(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (state === "Connected") {
      timerRef.current = setInterval(() => {
        setCallSeconds((prev) => prev + 1);
      }, 1000);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [state]);

  /*
     UI RENDER
      */
  return (
    <div className="call-container">
      {/* ---- Room ID display ---- */}
      <div className="room-bar">
        <span>Room ID:</span>
        <code>{roomId}</code>
        <button onClick={() => navigator.clipboard.writeText(roomId)}>
          Copy
        </button>
      </div>

      {/* ---- Call status ---- */}
      <div className="call-status">{state}</div>

      {/* ---- Timer ---- */}
      {state === "Connected" && (
        <div className="call-timer">{formatTime(callSeconds)}</div>
      )}

      {/* ---- Remote video ---- */}
      <video
        ref={remoteVideoRef}
        autoPlay
        playsInline
        className={isLocalLarge ? "local-video" : "remote-video"}
        onClick={swapVideos}
      />

      {/* ---- Local video ---- */}
      <video
        ref={localVideoRef}
        autoPlay
        muted
        playsInline
        className={isLocalLarge ? "remote-video" : "local-video"}
        onClick={swapVideos}
      />

      {/* ---- Call controls ---- */}
      <div className="controls">
        <button onClick={toggleMic}>{micOn ? "🔊" : "🔇"}</button>
        <button onClick={toggleCam}>{camOn ? "📸" : "📸 off"}</button>
        <button className="end-call" onClick={handleEndCall}>
          End
        </button>
      </div>
    </div>
  );
}