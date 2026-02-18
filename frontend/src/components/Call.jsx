import { useEffect, useRef, useState } from "react";
import socket from "../socket";

export default function Call({ roomId, onEnd }) {
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const pcRef = useRef(null);
  const localStreamRef = useRef(null);
  const timerRef = useRef(null);

  // 🔁 retry loop refs
  const retryIntervalRef = useRef(null);
  const retryStartTimeRef = useRef(null);

  const [state, setState] = useState("Initializing camera…");
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [isLocalLarge, setIsLocalLarge] = useState(false);
  const [callSeconds, setCallSeconds] = useState(0);

  const MAX_RETRY_TIME = 30000;
  const RETRY_INTERVAL = 5000;

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  const stopRetryLoop = () => {
    if (retryIntervalRef.current) clearInterval(retryIntervalRef.current);
    retryIntervalRef.current = null;
    retryStartTimeRef.current = null;
  };

  const cleanupMedia = () => {
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    pcRef.current?.close();

    if (timerRef.current) clearInterval(timerRef.current);

    stopRetryLoop();

    timerRef.current = null;
    setCallSeconds(0);
  };

  const handleEndCall = () => {
    cleanupMedia();
    socket.emit("end-call", roomId); // ✅ emit ONLY on manual end
    onEnd?.();
  };

  const toggleMic = () => {
    const track = localStreamRef.current?.getAudioTracks()[0];
    if (!track) return;
    track.enabled = !track.enabled;
    setMicOn(track.enabled);
  };

  const toggleCam = () => {
    const track = localStreamRef.current?.getVideoTracks()[0];
    if (!track) return;
    track.enabled = !track.enabled;
    setCamOn(track.enabled);
  };

  const swapVideos = () => setIsLocalLarge((p) => !p);

  /* ---------- START CALL ---------- */
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

        stream.getTracks().forEach((t) => pc.addTrack(t, stream));

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

        pc.onconnectionstatechange = async () => {
          const s = pc.connectionState;

          if (s === "connected") {
            setState("Connected");
            stopRetryLoop();
          }

          if (s === "disconnected") {
            setState("Reconnecting…");

            if (!retryIntervalRef.current) {
              retryStartTimeRef.current = Date.now();

              retryIntervalRef.current = setInterval(async () => {
                const elapsed = Date.now() - retryStartTimeRef.current;

                if (pc.connectionState === "connected") {
                  stopRetryLoop();
                  return;
                }

                if (elapsed >= MAX_RETRY_TIME) {
                  stopRetryLoop();
                  setState("Connection lost"); // ✅ CHANGED message

                  cleanupMedia(); // ✅ CHANGED: local cleanup only
                  onEnd?.();      // ✅ CHANGED: exit UI WITHOUT emitting end-call
                  return;
                }

                try {
                  const offer = await pc.createOffer({ iceRestart: true });
                  await pc.setLocalDescription(offer);
                  socket.emit("offer", { roomId, offer });
                } catch (err) {
                  console.error("ICE restart failed", err);
                }
              }, RETRY_INTERVAL);
            }
          }

          if (s === "failed") {
            setState("Connection lost"); // ✅ CHANGED wording
            stopRetryLoop();

            cleanupMedia(); // ✅ CHANGED: no end-call emit
            onEnd?.();      // ✅ CHANGED
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

  /* ---------- SIGNALING ---------- */
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

    const handleIce = async ({ candidate }) => {
      try {
        if (candidate && pcRef.current) {
          await pcRef.current.addIceCandidate(candidate);
        }
      } catch (e) {
        console.error("ICE error:", e);
      }
    };

    const handleCallEnded = () => {
      alert("The other user ended the call");
      cleanupMedia(); // ✅ CHANGED: avoid re-emitting end-call
      onEnd?.();      // ✅ CHANGED
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

  /* ---------- TIMER ---------- */
  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current);

    if (state === "Connected") {
      timerRef.current = setInterval(() => {
        setCallSeconds((p) => p + 1);
      }, 1000);
    }

    return () => timerRef.current && clearInterval(timerRef.current);
  }, [state]);

  /* ---------- UI ---------- */
  return (
    <div className="call-container">
      <div className="room-bar">
        <span>Room ID:</span>
        <code>{roomId}</code>
        <button onClick={() => navigator.clipboard.writeText(roomId)}>Copy</button>
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