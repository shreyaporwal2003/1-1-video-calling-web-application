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

  /*
     START CALL
  */
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

        /* ✅ STUN + TURN with TCP (important) */
        const pc = new RTCPeerConnection({
          iceServers: [
            { urls: "stun:stun.l.google.com:19302" },
            {
              urls: "turn:openrelay.metered.ca:80?transport=tcp",
              username: "openrelayproject",
              credential: "openrelayproject",
            },
            {
              urls: "turn:openrelay.metered.ca:443?transport=tcp",
              username: "openrelayproject",
              credential: "openrelayproject",
            },
          ],
        });

        pcRef.current = pc;

        stream.getTracks().forEach((track) => pc.addTrack(track, stream));

        /* ✅ Remote stream attach + force play */
        pc.ontrack = (e) => {
          const video = remoteVideoRef.current;
          if (video) {
            video.srcObject = e.streams[0];
            video.play().catch(() => {});
          }
          setState("Connected");
        };

        pc.onicecandidate = (e) => {
          if (e.candidate) {
            socket.emit("ice-candidate", { roomId, candidate: e.candidate });
          }
        };

        pc.onconnectionstatechange = () => {
          const s = pc.connectionState;

          if (s === "connected") setState("Connected");
          if (s === "disconnected" || s === "failed") setState("Connection lost");
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

  /*
     SIGNALING
  */
  useEffect(() => {
    const handlePeerJoined = async () => {
      if (!pcRef.current) return;

      setState("Connecting…");

      const offer = await pcRef.current.createOffer();
      await pcRef.current.setLocalDescription(offer);

      socket.emit("offer", { roomId, offer });
    };

    const handleOffer = async (offer) => {
      if (!pcRef.current) return;

      setState("Connecting…");

      await pcRef.current.setRemoteDescription(offer);

      const answer = await pcRef.current.createAnswer();
      await pcRef.current.setLocalDescription(answer);

      socket.emit("answer", { roomId, answer });
    };

    const handleAnswer = async (answer) => {
      if (!pcRef.current) return;

      await pcRef.current.setRemoteDescription(answer);
      setState("Connected");
    };

    /* ✅ Safe ICE add */
    const handleIce = async ({ candidate }) => {
      try {
        if (candidate && pcRef.current) {
          await pcRef.current.addIceCandidate(candidate);
        }
      } catch (err) {
        console.error("ICE add error:", err);
      }
    };

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

  /*
     TIMER
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
     UI
  */
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