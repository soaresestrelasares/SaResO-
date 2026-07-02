import { useEffect, useRef, useState, useCallback } from "react";
import { getSocket } from "@/lib/socket";
import { Phone, PhoneOff, Mic, MicOff, Video, VideoOff, X } from "lucide-react";

interface Props {
  targetUserId: number;
  targetDisplayName: string;
  callType: "video" | "audio";
  onClose: () => void;
  incomingOffer?: RTCSessionDescriptionInit;
  callerId?: number;
}

type CallState = "outgoing" | "incoming" | "active" | "ended" | "rejected";

export function CallModal({
  targetUserId,
  targetDisplayName,
  callType,
  onClose,
  incomingOffer,
  callerId,
}: Props) {
  const [callState, setCallState] = useState<CallState>(incomingOffer ? "incoming" : "outgoing");
  const [muted, setMuted] = useState(false);
  const [cameraOff, setCameraOff] = useState(false);
  const [error, setError] = useState("");
  const [duration, setDuration] = useState(0);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const cleanup = useCallback(() => {
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    pcRef.current?.close();
    if (timerRef.current) clearInterval(timerRef.current);
    const socket = getSocket();
    socket.off("call:answered");
    socket.off("call:rejected");
    socket.off("call:ended");
    socket.off("call:ice-candidate");
  }, []);

  const formatDuration = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  const getMedia = useCallback(async () => {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: callType === "video",
    });
    localStreamRef.current = stream;
    if (localVideoRef.current) localVideoRef.current.srcObject = stream;
    return stream;
  }, [callType]);

  const createPC = (stream: MediaStream, remoteId: number) => {
    const pc = new RTCPeerConnection({ iceServers: [{ urls: "stun:stun.l.google.com:19302" }] });
    pcRef.current = pc;
    stream.getTracks().forEach((track) => pc.addTrack(track, stream));
    pc.ontrack = (e) => {
      if (remoteVideoRef.current) remoteVideoRef.current.srcObject = e.streams[0];
    };
    pc.onicecandidate = (e) => {
      if (e.candidate)
        getSocket().emit("call:ice-candidate", { targetUserId: remoteId, candidate: e.candidate });
    };
    return pc;
  };

  useEffect(() => {
    if (callState !== "outgoing") return;
    (async () => {
      try {
        const stream = await getMedia();
        const pc = createPC(stream, targetUserId);
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        getSocket().emit("call:offer", { targetUserId, offer, callType });

        getSocket().on(
          "call:answered",
          async ({ answer }: { answer: RTCSessionDescriptionInit }) => {
            await pc.setRemoteDescription(answer);
            setCallState("active");
            timerRef.current = setInterval(() => setDuration((d) => d + 1), 1000);
          },
        );
        getSocket().on("call:rejected", () => {
          setCallState("rejected");
          setTimeout(onClose, 2000);
        });
        getSocket().on("call:ended", () => {
          setCallState("ended");
          setTimeout(onClose, 2000);
        });
        getSocket().on(
          "call:ice-candidate",
          async ({ candidate }: { candidate: RTCIceCandidateInit }) => {
            await pc.addIceCandidate(candidate).catch(() => {});
          },
        );
      } catch {
        setError("Não foi possível aceder ao microfone/câmara. Verifica as permissões.");
      }
    })();
    return cleanup;
  }, [callState, targetUserId, callType, cleanup, onClose, getMedia]);

  const acceptCall = async () => {
    try {
      const stream = await getMedia();
      const pc = createPC(stream, callerId!);
      await pc.setRemoteDescription(incomingOffer!);
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      getSocket().emit("call:answer", { callerId, answer });
      setCallState("active");
      timerRef.current = setInterval(() => setDuration((d) => d + 1), 1000);
      getSocket().on("call:ended", () => {
        setCallState("ended");
        setTimeout(onClose, 2000);
      });
      getSocket().on(
        "call:ice-candidate",
        async ({ candidate }: { candidate: RTCIceCandidateInit }) => {
          await pc.addIceCandidate(candidate).catch(() => {});
        },
      );
    } catch {
      setError("Não foi possível aceder ao microfone/câmara.");
    }
  };

  const rejectCall = () => {
    getSocket().emit("call:reject", { callerId });
    setCallState("ended");
    setTimeout(onClose, 800);
  };

  const endCall = () => {
    const remoteId = callState === "incoming" ? callerId : targetUserId;
    getSocket().emit("call:end", { targetUserId: remoteId });
    cleanup();
    setCallState("ended");
    setTimeout(onClose, 1200);
  };

  const toggleMute = () => {
    const track = localStreamRef.current?.getAudioTracks()[0];
    if (track) {
      track.enabled = muted;
      setMuted((m) => !m);
    }
  };

  const toggleCamera = () => {
    const track = localStreamRef.current?.getVideoTracks()[0];
    if (track) {
      track.enabled = cameraOff;
      setCameraOff((c) => !c);
    }
  };

  const stateLabel: Record<CallState, string> = {
    outgoing: "A ligar...",
    incoming: `Chamada de ${callType === "video" ? "vídeo" : "áudio"} a entrar`,
    active: formatDuration(duration),
    ended: "Chamada terminada",
    rejected: "Chamada rejeitada",
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black flex flex-col max-w-[480px] mx-auto">
      {/* Remote video / background */}
      <div className="flex-1 relative bg-gray-950 flex items-center justify-center overflow-hidden">
        {callType === "video" && callState === "active" && (
          <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full object-cover" />
        )}

        {/* Avatar overlay */}
        <div
          className={`absolute inset-0 flex flex-col items-center justify-center gap-4 ${callType === "video" && callState === "active" ? "opacity-0 pointer-events-none" : ""}`}
        >
          <div
            className="w-28 h-28 rounded-full flex items-center justify-center text-5xl font-black text-white"
            style={{ background: "linear-gradient(135deg,#1E90FF,#0047AB)" }}
          >
            {targetDisplayName.charAt(0).toUpperCase()}
          </div>
          <p className="text-white text-2xl font-bold">{targetDisplayName}</p>
          <p className="text-gray-400 text-sm tracking-wide">{stateLabel[callState]}</p>
          {error && (
            <p className="text-red-400 text-sm text-center px-8 bg-red-900/20 py-2 rounded-xl">
              {error}
            </p>
          )}
        </div>

        {/* Local video PiP */}
        {callType === "video" && (
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className="absolute bottom-4 right-4 w-28 h-40 rounded-2xl object-cover border-2 border-white/30 shadow-lg"
          />
        )}

        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 bg-black/50 rounded-full backdrop-blur-sm"
        >
          <X className="w-5 h-5 text-white" />
        </button>
      </div>

      {/* Controls */}
      <div className="bg-black/90 backdrop-blur-sm px-6 py-8 flex items-center justify-center gap-8 border-t border-gray-800">
        {callState === "incoming" ? (
          <>
            <button onClick={rejectCall} className="flex flex-col items-center gap-2">
              <div className="w-16 h-16 rounded-full bg-red-600 flex items-center justify-center shadow-lg shadow-red-900/50">
                <PhoneOff className="w-7 h-7 text-white" />
              </div>
              <span className="text-gray-400 text-xs">Rejeitar</span>
            </button>
            <button onClick={acceptCall} className="flex flex-col items-center gap-2">
              <div className="w-16 h-16 rounded-full bg-green-600 flex items-center justify-center shadow-lg shadow-green-900/50">
                <Phone className="w-7 h-7 text-white" />
              </div>
              <span className="text-gray-400 text-xs">Aceitar</span>
            </button>
          </>
        ) : callState === "active" ? (
          <>
            <button onClick={toggleMute} className="flex flex-col items-center gap-2">
              <div
                className={`w-14 h-14 rounded-full flex items-center justify-center ${muted ? "bg-gray-600" : "bg-gray-800"}`}
              >
                {muted ? (
                  <MicOff className="w-6 h-6 text-white" />
                ) : (
                  <Mic className="w-6 h-6 text-white" />
                )}
              </div>
              <span className="text-gray-500 text-xs">{muted ? "Ativar" : "Silêncio"}</span>
            </button>
            <button onClick={endCall} className="flex flex-col items-center gap-2">
              <div className="w-16 h-16 rounded-full bg-red-600 flex items-center justify-center shadow-lg shadow-red-900/50">
                <PhoneOff className="w-7 h-7 text-white" />
              </div>
              <span className="text-gray-400 text-xs">Terminar</span>
            </button>
            {callType === "video" && (
              <button onClick={toggleCamera} className="flex flex-col items-center gap-2">
                <div
                  className={`w-14 h-14 rounded-full flex items-center justify-center ${cameraOff ? "bg-gray-600" : "bg-gray-800"}`}
                >
                  {cameraOff ? (
                    <VideoOff className="w-6 h-6 text-white" />
                  ) : (
                    <Video className="w-6 h-6 text-white" />
                  )}
                </div>
                <span className="text-gray-500 text-xs">{cameraOff ? "Câmara" : "Câmara"}</span>
              </button>
            )}
          </>
        ) : callState === "outgoing" ? (
          <button onClick={endCall} className="flex flex-col items-center gap-2">
            <div className="w-16 h-16 rounded-full bg-red-600 flex items-center justify-center">
              <PhoneOff className="w-7 h-7 text-white" />
            </div>
            <span className="text-gray-400 text-xs">Cancelar</span>
          </button>
        ) : null}
      </div>
    </div>
  );
}
