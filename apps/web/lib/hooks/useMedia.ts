import { useRef, useState, useCallback } from "react";

interface UseMediaProps {
  onAudioData: (b64: string, rms: number) => void;
  onFrameData: (b64: string) => void;
  onScreenLost: (pending: boolean) => void;
  onScreenRestored: () => void;
  onTerminate: (reason: string) => void;
}

export function useMedia({
  onAudioData,
  onFrameData,
  onScreenLost,
  onScreenRestored,
  onTerminate,
}: UseMediaProps) {
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const frameIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const frameWorkerRef = useRef<Worker | null>(null);
  const screenLostTimerRef = useRef<NodeJS.Timeout | null>(null);

  const [screenLost, setScreenLostState] = useState(false);
  const screenActiveRef = useRef<boolean>(true);
  const isSpeakingRef = useRef(false);

  const setScreenActive = (active: boolean) => {
    screenActiveRef.current = active;
  };

  const setIsSpeaking = (speaking: boolean) => {
    isSpeakingRef.current = speaking;
  };

  const arrayBufferToBase64 = (buffer: ArrayBuffer): string => {
    const bytes = new Uint8Array(buffer);
    let binary = "";
    const chunkSize = 8192;
    for (let i = 0; i < bytes.length; i += chunkSize) {
      binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
    }
    return btoa(binary);
  };

  const setupAudioProcessing = async (stream: MediaStream) => {
    const ctx = new AudioContext({ sampleRate: 16000 });
    audioContextRef.current = ctx;
    if (ctx.state === "suspended") await ctx.resume();
    const source = ctx.createMediaStreamSource(stream);

    try {
      await ctx.audioWorklet.addModule("/audio-processor.js");
      const node = new AudioWorkletNode(ctx, "audio-processor");

      node.port.onmessage = (e: MessageEvent) => {
        const { buffer, rms } = e.data;
        const b64 = arrayBufferToBase64(buffer);
        onAudioData(b64, rms);
      };

      source.connect(node);
      node.connect(ctx.destination);
    } catch (err) {
      console.error("[Audio] AudioWorklet setup failed:", err);
    }
  };

  const setupScreenProcessing = (stream: MediaStream) => {
    const video = document.createElement("video");
    video.srcObject = stream;
    video.play();

    try {
      frameWorkerRef.current = new Worker("/frame-worker.js");
      frameWorkerRef.current.onmessage = (e) => {
        if (e.data.b64) onFrameData(e.data.b64);
      };
    } catch (err) {
      console.warn("[Screen] Worker init failed");
    }

    let alreadyLost = false;
    const handleScreenEnded = () => {
      if (alreadyLost) return;
      alreadyLost = true;
      setScreenLostState(true);
      if (frameIntervalRef.current) {
        clearInterval(frameIntervalRef.current);
        frameIntervalRef.current = null;
      }

      if (screenLostTimerRef.current) clearTimeout(screenLostTimerRef.current);
      screenLostTimerRef.current = setTimeout(() => {
        onTerminate("screen_share_not_restored");
      }, 10_000);

      onScreenLost(isSpeakingRef.current);
    };

    stream.getTracks().forEach((track) => {
      track.addEventListener("ended", handleScreenEnded);
    });

    frameIntervalRef.current = setInterval(async () => {
      if (!screenActiveRef.current) return;
      const tracks = stream.getTracks();
      if (tracks.length > 0 && tracks[0].readyState === "ended") {
        handleScreenEnded();
        return;
      }
      if (video.readyState < 2) return;

      try {
        if (frameWorkerRef.current && typeof createImageBitmap === "function") {
          const bitmap = await createImageBitmap(video);
          frameWorkerRef.current.postMessage(
            { bitmap, maxDim: 800, quality: 0.5 },
            [bitmap],
          );
        }
      } catch (err) {
        console.error("Frame capture error:", err);
      }
    }, 200);
  };

  const acquireMediaStreams = async (): Promise<{
    audio: MediaStream;
    screen: MediaStream;
  } | null> => {
    try {
      const audioStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
        },
      });
      mediaStreamRef.current = audioStream;

      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: { frameRate: 5, displaySurface: "monitor" as any },
        audio: false,
      });
      screenStreamRef.current = screenStream;
      return { audio: audioStream, screen: screenStream };
    } catch (err) {
      console.error("Media acquisition failed:", err);
      return null;
    }
  };

  const stopMedia = useCallback(() => {
    mediaStreamRef.current?.getTracks().forEach((t) => t.stop());
    screenStreamRef.current?.getTracks().forEach((t) => t.stop());
    if (frameIntervalRef.current) clearInterval(frameIntervalRef.current);
    if (screenLostTimerRef.current) clearTimeout(screenLostTimerRef.current);
    audioContextRef.current?.close();
    frameWorkerRef.current?.terminate();
    setScreenLostState(false);
  }, []);

  const stopScreenShare = useCallback(() => {
    screenStreamRef.current?.getTracks().forEach((t) => t.stop());
    setScreenLostState(true);
    if (screenLostTimerRef.current) clearTimeout(screenLostTimerRef.current);
    screenLostTimerRef.current = setTimeout(() => {
      onTerminate("screen_share_not_restored");
    }, 10_000);
    onScreenLost(false);
  }, [onScreenLost, onTerminate]);

  const reshareScreen = useCallback(async () => {
    try {
      const newStream = await navigator.mediaDevices.getDisplayMedia({
        video: { frameRate: 5 },
        audio: false,
      });
      if (screenLostTimerRef.current) {
        clearTimeout(screenLostTimerRef.current);
        screenLostTimerRef.current = null;
      }
      screenStreamRef.current?.getTracks().forEach((t) => t.stop());
      screenStreamRef.current = newStream;
      setupScreenProcessing(newStream);
      setScreenLostState(false);
      onScreenRestored();
    } catch (err) {
      console.error("[Screen] Re-share failed:", err);
    }
  }, [onScreenRestored]);

  const toggleMute = useCallback((isMuted: boolean) => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getAudioTracks().forEach((track) => {
        track.enabled = !isMuted;
      });
    }
  }, []);

  return {
    acquireMediaStreams,
    setupAudioProcessing,
    setupScreenProcessing,
    stopMedia,
    stopScreenShare,
    reshareScreen,
    toggleMute,
    screenLost,
    setScreenActive,
    setIsSpeaking,
    mediaStream: mediaStreamRef.current,
    screenStream: screenStreamRef.current,
  };
}
