"use client";

import { useRef, useState, useCallback } from "react";

// States in which an active interview is happening — used for session cleanup
const ACTIVE_STATES = new Set([
  "GREETING", "ENV_CHECK", "PROBLEM_DELIVERY", "THINK_TIME",
  "APPROACH_LISTEN", "CODING", "HINT_DELIVERY", "TESTING",
  "OPTIMIZATION", "FLAGGED", "SCREEN_NOT_VISIBLE",
]);

export function useInterview(sessionId: string = "default-session") {
  const [isConnected, setIsConnected] = useState(false);
  const [feedback, setFeedback] = useState<string[]>([]);
  const [currentState, setCurrentState] = useState<string>("IDLE");
  const [screenLost, setScreenLost] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isUserSpeaking, setIsUserSpeaking] = useState(false);
  const [violationReason, setViolationReason] = useState<string | null>(null);
  const [tabSwitchWarning, setTabSwitchWarning] = useState<{
    count: number;
    max: number;
  } | null>(null);
  const [isTerminated, setIsTerminated] = useState(false);
  // Increments each time connect() is called so consumers can reset their own state
  const [resetKey, setResetKey] = useState(0);
  // True once the agent has finished its opening greeting turn — gates the Share Screen button
  const [greetingDone, setGreetingDone] = useState(false);
  const [questionData, setQuestionData] = useState<{
    title: string;
    description: string;
    testCases: { input: string; output: string }[];
    optimalTimeComplexity: string;
    optimalSpaceComplexity: string;
  } | null>(null);
  const [scorecardData, setScorecardData] = useState<Record<string, unknown> | null>(null);

  const socketRef = useRef<WebSocket | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const frameIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const screenActiveRef = useRef<boolean>(true); // phase-gated frame sending
  const speakingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const vadSilenceTimerRef = useRef<NodeJS.Timeout | null>(null);
  // Playback context as refs so they're accessible outside connect() closure
  const playbackCtxRef = useRef<AudioContext | null>(null);
  const nextPlayAtRef = useRef(0);
  // Ref mirror of isSpeaking so closures (screen handler, etc.) can read it
  const isSpeakingRef = useRef(false);
  // If screen share ends while agent is speaking, defer the notification
  const screenShareLostPendingRef = useRef(false);
  // Tab switch detection
  const tabSwitchCountRef = useRef(0);
  const visibilityHandlerRef = useRef<(() => void) | null>(null);
  // Ref mirror of currentState so the visibilitychange closure reads live value
  const currentStateRef = useRef("IDLE");
  // Tab-away auto-terminate timer
  const tabReturnTimerRef = useRef<NodeJS.Timeout | null>(null);
  // Screen-loss auto-terminate timer (10s)
  const screenLostTimerRef = useRef<NodeJS.Timeout | null>(null);
  // Frame worker for offscreen canvas encoding (Fix 5)
  const frameWorkerRef = useRef<Worker | null>(null);
  // Code sync debounce timer (Fix 1)
  const codeSyncTimerRef = useRef<NodeJS.Timeout | null>(null);
  // Copy buffer tracking for paste false-positive prevention (Fix 6)
  const lastCopiedTextRef = useRef<string>("");
  // beforeunload handler ref so we can remove it on disconnect
  const beforeUnloadRef = useRef<(() => void) | null>(null);

  // ── Helper: send a JSON event over WebSocket ────────────────────────────
  const send = useCallback((obj: object) => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify(obj));
    }
  }, []);

  const sendEvent = useCallback(
    (type: string, payload?: unknown) => {
      send({ type: "event", payload: type, data: payload });
    },
    [send],
  );

  // ── Fix 1: Debounced code sync (sends editor contents to backend) ──────
  const sendCode = useCallback(
    (code: string) => {
      if (codeSyncTimerRef.current) clearTimeout(codeSyncTimerRef.current);
      codeSyncTimerRef.current = setTimeout(() => {
        send({ type: "code_update", payload: code });
      }, 1500); // Debounce: send at most every 1.5 seconds
    },
    [send],
  );

  // ── Fix 6: Track the last copied text for paste comparison ──────────────
  const setLastCopied = useCallback((text: string) => {
    lastCopiedTextRef.current = text;
  }, []);

  const getLastCopied = useCallback(() => {
    return lastCopiedTextRef.current;
  }, []);

  // ── Request media permissions (must be called inside a user gesture) ────
  const acquireMediaStreams = async (): Promise<boolean> => {
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
        video: {
          frameRate: 5,
          // Hint Chrome/Edge to pre-select "Entire Screen" in the picker
          displaySurface: "monitor" as DisplayCaptureSurfaceType,
        },
        audio: false,
      });
      screenStreamRef.current = screenStream;
      return true;
    } catch (err) {
      console.error("Media acquisition failed:", err);
      return false;
    }
  };

  // ── AudioWorklet: PCM16 capture → WebSocket + VAD ────────────────────────
  /** Convert ArrayBuffer → base64 safely (avoids call-stack overflow for large buffers) */
  const arrayBufferToBase64 = (buffer: ArrayBuffer): string => {
    const bytes = new Uint8Array(buffer);
    let binary = "";
    const chunkSize = 8192;
    for (let i = 0; i < bytes.length; i += chunkSize) {
      binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
    }
    return btoa(binary);
  };

  const setupAudioProcessing = async (stream: MediaStream): Promise<void> => {
    const ctx = new AudioContext({ sampleRate: 16000 });
    audioContextRef.current = ctx;
    if (ctx.state === "suspended") await ctx.resume();
    const source = ctx.createMediaStreamSource(stream);

    try {
      await ctx.audioWorklet.addModule("/audio-processor.js");
      const node = new AudioWorkletNode(ctx, "audio-processor");
      console.log("[Audio] AudioWorklet loaded successfully");

      const VAD_THRESHOLD = 0.01; // quiet room noise floor
      let audioChunksSent = 0;

      node.port.onmessage = (e: MessageEvent) => {
        if (socketRef.current?.readyState !== WebSocket.OPEN) return;
        try {
          const { buffer, rms } = e.data as {
            buffer: ArrayBuffer;
            rms: number;
          };
          const b64 = arrayBufferToBase64(buffer);
          send({ type: "audio", payload: b64 });
          audioChunksSent++;
          if (audioChunksSent === 1 || audioChunksSent % 50 === 0) {
            console.log(`[Audio] Sent ${audioChunksSent} chunks to backend`);
          }

          // VAD: drive isUserSpeaking state
          if (rms > VAD_THRESHOLD) {
            setIsUserSpeaking(true);
            if (vadSilenceTimerRef.current) {
              clearTimeout(vadSilenceTimerRef.current);
              vadSilenceTimerRef.current = null;
            }
          } else if (!vadSilenceTimerRef.current) {
            // 400ms of continuous silence → user stopped speaking
            vadSilenceTimerRef.current = setTimeout(() => {
              setIsUserSpeaking(false);
              vadSilenceTimerRef.current = null;
            }, 400);
          }
        } catch (err) {
          console.error("[Audio] Failed to encode/send chunk:", err);
        }
      };

      source.connect(node);
      node.connect(ctx.destination);
    } catch (err) {
      console.error("[Audio] AudioWorklet setup failed:", err);
    }
  };

  // ── Screen frame capture → WebSocket (via OffscreenCanvas Worker) ──────
  const setupScreenProcessing = (stream: MediaStream): void => {
    const video = document.createElement("video");
    video.srcObject = stream;
    video.play();

    // Create the frame worker for off-main-thread JPEG encoding
    try {
      frameWorkerRef.current = new Worker("/frame-worker.js");
      frameWorkerRef.current.onmessage = (e: MessageEvent) => {
        if (e.data.b64 && socketRef.current?.readyState === WebSocket.OPEN) {
          send({ type: "frame", payload: e.data.b64 });
        }
      };
    } catch (err) {
      console.warn(
        "[Screen] Worker init failed, falling back to main thread",
        err,
      );
    }

    // Fallback canvas for browsers without OffscreenCanvas / createImageBitmap support
    let fallbackCanvas: HTMLCanvasElement | null = null;
    let fallbackCtx: CanvasRenderingContext2D | null = null;

    // Detect when screen sharing stops (both event-based and poll-based for reliability)
    let alreadyLost = false;
    const handleScreenEnded = () => {
      if (alreadyLost) return;
      alreadyLost = true;
      console.log("[Screen] Screen share ended");
      setScreenLost(true);
      if (frameIntervalRef.current) {
        clearInterval(frameIntervalRef.current);
        frameIntervalRef.current = null;
      }
      // Start 10s auto-terminate timer
      if (screenLostTimerRef.current) clearTimeout(screenLostTimerRef.current);
      screenLostTimerRef.current = setTimeout(() => {
        screenLostTimerRef.current = null;
        setIsTerminated(true);
        send({ type: "event", payload: "terminate_session", data: { reason: "screen_share_not_restored" } });
      }, 10_000);
      if (isSpeakingRef.current) {
        // Agent is mid-sentence — let it finish, then warn about missing screen
        console.log(
          "[Screen] Agent speaking; deferring screen_share_ended until turn_complete",
        );
        screenShareLostPendingRef.current = true;
      } else {
        send({ type: "event", payload: "screen_share_ended" });
      }
    };
    stream.getTracks().forEach((track) => {
      track.addEventListener("ended", handleScreenEnded);
      track.onended = handleScreenEnded;
    });

    frameIntervalRef.current = setInterval(async () => {
      if (socketRef.current?.readyState !== WebSocket.OPEN) return;
      if (!screenActiveRef.current) return; // only send when phase requires it
      // Poll-based fallback: detect interrupted screen share
      const tracks = stream.getTracks();
      if (tracks.length > 0 && tracks[0].readyState === "ended") {
        handleScreenEnded();
        return;
      }
      if (video.readyState < 2) return;

      try {
        if (frameWorkerRef.current && typeof createImageBitmap === "function") {
          // Preferred path: send ImageBitmap to worker for off-main-thread encoding
          const bitmap = await createImageBitmap(video);
          frameWorkerRef.current.postMessage(
            { bitmap, maxDim: 800, quality: 0.5 },
            [bitmap], // transfer ownership
          );
        } else {
          // Fallback: encode on main thread (legacy browsers)
          const MAX_DIM = 800;
          let width = video.videoWidth;
          let height = video.videoHeight;
          if (width > height) {
            if (width > MAX_DIM) {
              height = Math.round((height * MAX_DIM) / width);
              width = MAX_DIM;
            }
          } else {
            if (height > MAX_DIM) {
              width = Math.round((width * MAX_DIM) / height);
              height = MAX_DIM;
            }
          }
          if (!fallbackCanvas) {
            fallbackCanvas = document.createElement("canvas");
            fallbackCtx = fallbackCanvas.getContext("2d");
          }
          fallbackCanvas.width = width;
          fallbackCanvas.height = height;
          fallbackCtx?.drawImage(video, 0, 0, width, height);
          const b64 = fallbackCanvas.toDataURL("image/jpeg", 0.5).split(",")[1];
          send({ type: "frame", payload: b64 });
        }
      } catch (err) {
        console.error("Frame capture error:", err);
      }
    }, 200); // 5 fps
  };

  // ── Manually stop screen share (removes browser recording indicator) ────
  const stopScreenShare = useCallback(() => {
    screenStreamRef.current?.getTracks().forEach((t) => t.stop());
    setScreenLost(true);
    send({ type: "event", payload: "screen_share_ended" });
    if (screenLostTimerRef.current) clearTimeout(screenLostTimerRef.current);
    screenLostTimerRef.current = setTimeout(() => {
      screenLostTimerRef.current = null;
      setIsTerminated(true);
      send({ type: "event", payload: "terminate_session", data: { reason: "screen_share_not_restored" } });
    }, 10_000);
  }, [send]);

  // ── Re-share screen after it was stopped ────────────────────────────────
  const reshareScreen = useCallback(async () => {
    try {
      const newStream = await navigator.mediaDevices.getDisplayMedia({
        video: { frameRate: 5 },
        audio: false,
      });
      // Cancel the auto-terminate timer since screen was restored
      if (screenLostTimerRef.current) {
        clearTimeout(screenLostTimerRef.current);
        screenLostTimerRef.current = null;
      }
      screenStreamRef.current?.getTracks().forEach((t) => t.stop());
      screenStreamRef.current = newStream;
      if (frameIntervalRef.current) clearInterval(frameIntervalRef.current);
      setupScreenProcessing(newStream);
      setScreenLost(false);
      send({ type: "event", payload: "screen_share_active" });
    } catch (err) {
      console.error("[Screen] Re-share failed:", err);
    }
  }, [send]);

  // ── Acquire media + start processing (called after greeting, as user gesture) ─
  const acquireAndStartMedia = useCallback(async () => {
    const ok = await acquireMediaStreams();
    if (!ok) {
      alert(
        "Failed to access microphone or screen — please check permissions.",
      );
      return;
    }

    // Reject browser tab sharing — Gemini can only see other apps if full screen is shared.
    // Chrome/Edge report displaySurface; Firefox/Safari return undefined (allowed through).
    const screenTrack = screenStreamRef.current?.getTracks()[0];
    const surface = screenTrack?.getSettings().displaySurface;
    if (surface === "browser") {
      screenStreamRef.current?.getTracks().forEach((t) => t.stop());
      screenStreamRef.current = null;
      alert(
        "Please share your Entire Screen — not a browser tab.\n\n" +
          "Click 'Share Screen & Mic' again, go to the 'Entire Screen' or 'Screen' tab in the picker, and select your monitor.",
      );
      return; // Stay in GREETING — button remains available to retry
    }

    if (mediaStreamRef.current)
      await setupAudioProcessing(mediaStreamRef.current);
    if (screenStreamRef.current) setupScreenProcessing(screenStreamRef.current);
    sendEvent("screen_share_active");
  }, [send, sendEvent]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Connect: open WebSocket only — no media acquired yet ────────────────
  const connect = useCallback(() => {
    // Reset all hook state for a fresh session
    setFeedback([]);
    setCurrentState("IDLE");
    currentStateRef.current = "IDLE";
    setScreenLost(false);
    setIsSpeaking(false);
    isSpeakingRef.current = false;
    setIsUserSpeaking(false);
    screenShareLostPendingRef.current = false;
    setViolationReason(null);
    setTabSwitchWarning(null);
    setIsTerminated(false);
    setQuestionData(null);
    setScorecardData(null);
    setGreetingDone(false);
    tabSwitchCountRef.current = 0;
    setResetKey((k) => k + 1);

    const ws = new WebSocket(`ws://localhost:8000/ws/live/${sessionId}`);
    socketRef.current = ws;

    // Send end_interview when the tab/window is closed mid-session
    const handleBeforeUnload = () => {
      if (ws.readyState === WebSocket.OPEN && ACTIVE_STATES.has(currentStateRef.current)) {
        ws.send(JSON.stringify({ type: "event", payload: "end_interview", data: { reason: "page_closed" } }));
      }
    };
    if (beforeUnloadRef.current) window.removeEventListener("beforeunload", beforeUnloadRef.current);
    beforeUnloadRef.current = handleBeforeUnload;
    window.addEventListener("beforeunload", handleBeforeUnload);

    ws.onopen = () => {
      setIsConnected(true);
      // Notify backend — Gemini will greet and ask candidate to share screen
      sendEvent("candidate_connect");
    };

    ws.onmessage = (ev) => {
      const data = JSON.parse(ev.data);

      if (data.type === "text") {
        setFeedback((prev) => [...prev, data.payload]);
      } else if (data.type === "state_update") {
        setCurrentState(data.payload);
        currentStateRef.current = data.payload;
        if (typeof data.screenRequired === "boolean") {
          screenActiveRef.current = data.screenRequired;
        }
        if (data.metadata?.cheat_reason) {
          setViolationReason(data.metadata.cheat_reason);
        }
        if (
          data.payload === "COMPLETED" &&
          (data.metadata?.terminated_for_cheating || data.metadata?.terminated_screen_loss)
        ) {
          setIsTerminated(true);
        }
        if (data.payload === "SCREEN_NOT_VISIBLE") {
          setScreenLost(true);
        }
        // Extract question data for editor injection
        if (data.metadata?.question) {
          setQuestionData(data.metadata.question);
        }
        // ── Flush audio playback on state change ──────────────────
        // Close and re-create the playback context so old phase audio
        // doesn't bleed into the new phase.
        if (playbackCtxRef.current) {
          playbackCtxRef.current.close().catch(() => {});
          playbackCtxRef.current = null;
          nextPlayAtRef.current = 0;
        }
      } else if (data.type === "scorecard") {
        setScorecardData(data.payload);
      } else if (data.type === "turn_complete") {
        // Gemini's turn is definitively done — clear Speaking
        setIsSpeaking(false);
        isSpeakingRef.current = false;
        // First turn_complete in GREETING means the agent has finished its opening speech
        if (currentStateRef.current === "GREETING") {
          setGreetingDone(true);
        }
        if (speakingTimerRef.current) {
          clearTimeout(speakingTimerRef.current);
          speakingTimerRef.current = null;
        }
        // If screen share was lost while agent was speaking, send the deferred event now
        if (screenShareLostPendingRef.current) {
          screenShareLostPendingRef.current = false;
          send({ type: "event", payload: "screen_share_ended" });
        }
      } else if (data.type === "audio") {
        // Agent started (or is) speaking
        setIsSpeaking(true);
        isSpeakingRef.current = true;
        if (speakingTimerRef.current) clearTimeout(speakingTimerRef.current);
        // 3s fallback in case turn_complete is delayed
        speakingTimerRef.current = setTimeout(() => setIsSpeaking(false), 3000);

        // Play AI voice output
        if (!playbackCtxRef.current) {
          playbackCtxRef.current = new AudioContext({ sampleRate: 16000 });
          nextPlayAtRef.current = playbackCtxRef.current.currentTime;
        }
        const playbackCtx = playbackCtxRef.current;
        try {
          const binary = atob(data.payload);
          const bytes = new Uint8Array(binary.length);
          for (let i = 0; i < binary.length; i++)
            bytes[i] = binary.charCodeAt(i);

          const i16 = new Int16Array(bytes.buffer);
          const f32 = new Float32Array(i16.length);
          for (let i = 0; i < i16.length; i++) f32[i] = i16[i] / 0x7fff;

          const buf = playbackCtx.createBuffer(1, f32.length, 16000);
          buf.getChannelData(0).set(f32);

          const src = playbackCtx.createBufferSource();
          src.buffer = buf;
          src.connect(playbackCtx.destination);

          if (nextPlayAtRef.current < playbackCtx.currentTime)
            nextPlayAtRef.current = playbackCtx.currentTime;
          src.start(nextPlayAtRef.current);
          nextPlayAtRef.current += buf.duration;
        } catch (e) {
          console.error("Playback error:", e);
        }
      } else if (data.type === "error") {
        console.error("Server error:", data.payload);
      }
    };

    ws.onclose = () => setIsConnected(false);
    ws.onerror = (e) => console.error("WebSocket error:", e);

    // ── Tab switch detection via Page Visibility API ─────────────────────
    const TAB_SWITCH_LIMIT = 2;
    const TAB_AWAY_TERMINATE_MS = 6000; // 6s away → auto-terminate

    // Penalise switches in all active coding phases.
    // GREETING is excluded — OS screen-picker legitimately hides the tab there.
    const TAB_GUARDED_STATES = new Set([
      "PROBLEM_DELIVERY",
      "APPROACH_LISTEN",
      "CODING",
      "HINT_DELIVERY",
      "TESTING",
      "OPTIMIZATION",
    ]);

    const handleVisibilityChange = () => {
      // ── Candidate RETURNED to tab ─────────────────────────────
      if (!document.hidden) {
        // Cancel the auto-terminate timer
        if (tabReturnTimerRef.current) {
          clearTimeout(tabReturnTimerRef.current);
          tabReturnTimerRef.current = null;
        }
        return;
      }

      // ── Tab hidden (switched away) ────────────────────────────
      if (!TAB_GUARDED_STATES.has(currentStateRef.current)) return;
      tabSwitchCountRef.current += 1;
      const count = tabSwitchCountRef.current;
      setTabSwitchWarning({ count, max: TAB_SWITCH_LIMIT });
      send({ type: "event", payload: "tab_switch", data: { count } });

      if (count >= TAB_SWITCH_LIMIT) {
        // Hard limit reached — let agent say goodbye, then close
        setIsTerminated(true);
        send({
          type: "event",
          payload: "end_interview",
          data: { reason: "tab_switch_limit" },
        });
        setTimeout(() => socketRef.current?.close(), 5000);
      } else {
        // Start countdown — if they don't come back, terminate
        if (tabReturnTimerRef.current) clearTimeout(tabReturnTimerRef.current);
        tabReturnTimerRef.current = setTimeout(() => {
          tabReturnTimerRef.current = null;
          setIsTerminated(true);
          send({
            type: "event",
            payload: "end_interview",
            data: { reason: "tab_away_timeout" },
          });
          setTimeout(() => socketRef.current?.close(), 5000);
        }, TAB_AWAY_TERMINATE_MS);
      }
    };
    visibilityHandlerRef.current = handleVisibilityChange;
    document.addEventListener("visibilitychange", handleVisibilityChange);
  }, [sessionId, send, sendEvent]);

  // ── Disconnect ───────────────────────────────────────────────────────────
  const disconnect = useCallback(() => {
    // Remove beforeunload handler — we're handling cleanup explicitly here
    if (beforeUnloadRef.current) {
      window.removeEventListener("beforeunload", beforeUnloadRef.current);
      beforeUnloadRef.current = null;
    }
    // Notify backend so it can mark the session as ended in Firestore
    if (socketRef.current?.readyState === WebSocket.OPEN && ACTIVE_STATES.has(currentStateRef.current)) {
      socketRef.current.send(JSON.stringify({ type: "event", payload: "end_interview" }));
    }
    socketRef.current?.close();
    mediaStreamRef.current?.getTracks().forEach((t) => t.stop());
    screenStreamRef.current?.getTracks().forEach((t) => t.stop());
    if (frameIntervalRef.current) clearInterval(frameIntervalRef.current);
    if (speakingTimerRef.current) clearTimeout(speakingTimerRef.current);
    if (vadSilenceTimerRef.current) clearTimeout(vadSilenceTimerRef.current);
    if (screenLostTimerRef.current) { clearTimeout(screenLostTimerRef.current); screenLostTimerRef.current = null; }
    audioContextRef.current?.close();
    playbackCtxRef.current?.close();
    playbackCtxRef.current = null;
    setIsConnected(false);
    setIsSpeaking(false);
    isSpeakingRef.current = false;
    setIsUserSpeaking(false);
    screenShareLostPendingRef.current = false;
    // Remove tab switch listener and reset counter
    if (visibilityHandlerRef.current) {
      document.removeEventListener(
        "visibilitychange",
        visibilityHandlerRef.current,
      );
      visibilityHandlerRef.current = null;
    }
    tabSwitchCountRef.current = 0;
    setTabSwitchWarning(null);
    if (tabReturnTimerRef.current) {
      clearTimeout(tabReturnTimerRef.current);
      tabReturnTimerRef.current = null;
    }
    if (codeSyncTimerRef.current) {
      clearTimeout(codeSyncTimerRef.current);
      codeSyncTimerRef.current = null;
    }
    if (frameWorkerRef.current) {
      frameWorkerRef.current.terminate();
      frameWorkerRef.current = null;
    }
  }, []);

  return {
    isConnected,
    feedback,
    currentState,
    resetKey,
    greetingDone,
    screenLost,
    isSpeaking,
    isUserSpeaking,
    violationReason,
    tabSwitchWarning,
    isTerminated,
    questionData,
    scorecardData,
    isListening: isConnected && !isSpeaking,
    connect,
    disconnect,
    sendEvent,
    sendCode,
    setLastCopied,
    getLastCopied,
    reshareScreen,
    stopScreenShare,
    acquireAndStartMedia,
  };
}
