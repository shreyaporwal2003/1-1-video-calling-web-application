import { useEffect, useRef, useState } from "react";
import socket from "../socket";

export default function Call({ roomId, onEnd }) {
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const pcRef = useRef(null);
  const localStreamRef = useRef(null);
  const timerRef = useRef(null);

  const [state, setState] = useState("Initializing camera…");
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [isLocalLarge, setIsLocalLarge] = useState(false);
  const [callSeconds, setCallSeconds] = useState(0);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  const cleanupMedia = () => {
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    pcRef.current?.close();

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    setCallSeconds(0);
  };

  const handleEndCall = () => {
    cleanupMedia();
    socket.emit("end-call", roomId);
    onEnd?.();
  };

  const toggleMic = () => {
    const audioTrack = localStreamRef.current?.getAudioTracks()[0];
    if (!audioTrack) return;

    audioTrack.enabled = !audioTrack.enabled;
    setMicOn(audioTrack.enabled);
  };

  const toggleCam = () => {
    const videoTrack = localStreamRef.current?.getVideoTracks()[0];
    if (!videoTrack) return;

    videoTrack.enabled = !videoTrack.enabled;
    setCamOn(videoTrack.enabled);
  };

  const swapVideos = () => setIsLocalLarge((prev) => !prev);

  useEffect(() => {
    let isMounted = true;

    async function startCall() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });

        if (!isMounted) return;

        localStreamRef.current = stream;
        localVideoRef.current.srcObject = stream;

        const pc = new RTCPeerConnection({
          iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
        });

        pcRef.current = pc;

        stream.getTracks().forEach((track) => pc.addTrack(track, stream));

        pc.ontrack = (e) => {
          remoteVideoRef.current.srcObject = e.streams[0];
          setState("Connected");
        };

        pc.onicecandidate = (e) => {
          if (e.candidate) {
            socket.emit("ice-candidate", { roomId, candidate: e.candidate });
          }
        };

        pc.onconnectionstatechange = () => {
          if (
            pc.connectionState === "disconnected" ||
            pc.connectionState === "failed"
          ) {
            setState("Connection lost");
          }
        };

        setState("Waiting for other user…");
        socket.emit("join-room", roomId);
      } catch (err) {
        console.error(err);
        setState("Camera/Microphone permission denied");
      }
    }

    startCall();

    return () => {
      isMounted = false;
      cleanupMedia();
    };
  }, [roomId]);

  useEffect(() => {
    const handlePeerJoined = async () => {
      setState("Connecting…");

      const offer = await pcRef.current.createOffer();
      await pcRef.current.setLocalDescription(offer);

      socket.emit("offer", { roomId, offer });
    };

    const handleOffer = async (offer) => {
      setState("Connecting…");

      await pcRef.current.setRemoteDescription(offer);

      const answer = await pcRef.current.createAnswer();
      await pcRef.current.setLocalDescription(answer);

      socket.emit("answer", { roomId, answer });
    };

    const handleAnswer = async (answer) => {
      await pcRef.current.setRemoteDescription(answer);
      setState("Connected");
    };

    const handleIce = (c) => pcRef.current?.addIceCandidate(c);

    const handleCallEnded = () => {
      alert("The other user ended the call");
      handleEndCall();
    };

    socket.on("peer-joined", handlePeerJoined);
    socket.on("offer", handleOffer);
    socket.on("answer", handleAnswer);
    socket.on("ice-candidate", handleIce);
    socket.on("call-ended", handleCallEnded);

    return () => {
      socket.off("peer-joined", handlePeerJoined);
      socket.off("offer", handleOffer);
      socket.off("answer", handleAnswer);
      socket.off("ice-candidate", handleIce);
      socket.off("call-ended", handleCallEnded);
    };
  }, [roomId]);

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

  return (
    <div className="call-container">
      <div className="room-bar">
        <span>Room ID:</span>
        <code>{roomId}</code>
        <button onClick={() => navigator.clipboard.writeText(roomId)}>
          Copy
        </button>
      </div>

      <div className="call-status">{state}</div>

      {state === "Connected" && (
        <div className="call-timer">{formatTime(callSeconds)}</div>
      )}

      <video
        ref={remoteVideoRef}
        autoPlay
        playsInline
        className={isLocalLarge ? "local-video" : "remote-video"}
        onClick={swapVideos}
      />

      <video
        ref={localVideoRef}
        autoPlay
        muted
        playsInline
        className={isLocalLarge ? "remote-video" : "local-video"}
        onClick={swapVideos}
      />

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