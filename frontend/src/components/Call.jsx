import { useEffect, useRef, useState } from "react";
import socket from "../socket";

export default function Call({ roomId, onEnd }) {
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const pcRef = useRef(null);
  const localStreamRef = useRef(null);

  const [state, setState] = useState("Waiting for other user…");
  const [focusLocal, setFocusLocal] = useState(false);
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);

  /* -------- END CALL -------- */
  const handleEndCall = () => {
    localStreamRef.current?.getTracks().forEach(t => t.stop());
    pcRef.current?.close();
    socket.emit("end-call", roomId);
    onEnd();
  };

  /* -------- TOGGLE MIC -------- */
  const toggleMic = () => {
    const audioTrack = localStreamRef.current
      ?.getAudioTracks()[0];

    if (!audioTrack) return;

    audioTrack.enabled = !audioTrack.enabled;
    setMicOn(audioTrack.enabled);
  };

  /* -------- TOGGLE CAMERA -------- */
  const toggleCam = () => {
    const videoTrack = localStreamRef.current
      ?.getVideoTracks()[0];

    if (!videoTrack) return;

    videoTrack.enabled = !videoTrack.enabled;
    setCamOn(videoTrack.enabled);
  };

  /* -------- START CALL -------- */
  useEffect(() => {
    let mounted = true;

    async function startCall() {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });

      if (!mounted) return;

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
      mounted = false;
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
    <div
      className={`call-container ${focusLocal ? "focus-local" : ""}`}
    >
      <div className="call-status">{state}</div>

      {/* Remote video */}
      <video
        ref={remoteVideoRef}
        autoPlay
        playsInline
        className="remote-video"
        onClick={() => setFocusLocal(false)}
      />

      {/* Local video */}
      <video
        ref={localVideoRef}
        autoPlay
        muted
        playsInline
        className="local-video"
        onClick={() => setFocusLocal(true)}
      />

      {/* Controls */}
      <div className="controls">
        <button
          className={`control-btn ${!micOn ? "off" : ""}`}
          onClick={toggleMic}
        >
          {micOn ? "Mic" : "Mic Off"}
        </button>

        <button
          className={`control-btn ${!camOn ? "off" : ""}`}
          onClick={toggleCam}
        >
          {camOn ? "Cam" : "Cam Off"}
        </button>

        <button
          className="control-btn end-call"
          onClick={handleEndCall}
        >
          End
        </button>
      </div>
    </div>
  );
}
