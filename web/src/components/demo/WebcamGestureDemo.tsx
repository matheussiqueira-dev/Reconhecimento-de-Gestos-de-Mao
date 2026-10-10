"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Camera, Loader2, Square, Video } from "lucide-react";
import {
  countFingersFromLandmarks,
  type GestureSummary,
  type LandmarkPoint,
  summarizeGesture,
} from "@/lib/gestures";

type HandLandmarker = import("@mediapipe/tasks-vision").HandLandmarker;

type DetectionResult = {
  landmarks?: LandmarkPoint[][];
  handednesses?: Array<Array<{ categoryName?: string }>>;
};

const initialGesture = summarizeGesture({
  thumb: false,
  index: false,
  middle: false,
  ring: false,
  pinky: false,
});

const connections = [
  [0, 1],
  [1, 2],
  [2, 3],
  [3, 4],
  [0, 5],
  [5, 6],
  [6, 7],
  [7, 8],
  [5, 9],
  [9, 10],
  [10, 11],
  [11, 12],
  [9, 13],
  [13, 14],
  [14, 15],
  [15, 16],
  [13, 17],
  [17, 18],
  [18, 19],
  [19, 20],
] as const;

export function WebcamGestureDemo() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const landmarkerRef = useRef<HandLandmarker | null>(null);
  const frameRef = useRef<number | null>(null);
  const lastFrameAtRef = useRef<number | null>(null);

  const [status, setStatus] = useState<
    "idle" | "requesting" | "loading" | "running" | "error"
  >("idle");
  const [message, setMessage] = useState("Camera parada.");
  const [gesture, setGesture] = useState<GestureSummary>(initialGesture);
  const [fps, setFps] = useState(0);
  const [frames, setFrames] = useState(0);

  const stopCamera = useCallback(() => {
    if (frameRef.current !== null) {
      cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    }
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setStatus("idle");
    setMessage("Camera parada.");
  }, []);

  useEffect(() => stopCamera, [stopCamera]);

  const drawLandmarks = useCallback((landmarks: LandmarkPoint[]) => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video) {
      return;
    }

    const width = video.videoWidth || 960;
    const height = video.videoHeight || 540;
    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext("2d");
    if (!context) {
      return;
    }

    context.clearRect(0, 0, width, height);
    context.lineWidth = 4;
    context.strokeStyle = "#0f766e";
    context.fillStyle = "#f59e0b";

    for (const [start, end] of connections) {
      const startPoint = landmarks[start];
      const endPoint = landmarks[end];
      context.beginPath();
      context.moveTo(startPoint.x * width, startPoint.y * height);
      context.lineTo(endPoint.x * width, endPoint.y * height);
      context.stroke();
    }

    for (const point of landmarks) {
      context.beginPath();
      context.arc(point.x * width, point.y * height, 5, 0, Math.PI * 2);
      context.fill();
    }
  }, []);

  const clearCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (canvas && context) {
      context.clearRect(0, 0, canvas.width, canvas.height);
    }
  }, []);

  const runDetectionLoop = useCallback(function detectFrame() {
    const video = videoRef.current;
    const landmarker = landmarkerRef.current;
    if (!video || !landmarker || video.readyState < 2) {
      frameRef.current = requestAnimationFrame(detectFrame);
      return;
    }

    const now = performance.now();
    const result = landmarker.detectForVideo(video, now) as DetectionResult;
    const firstHand = result.landmarks?.[0];

    if (firstHand) {
      const handedness =
        result.handednesses?.[0]?.[0]?.categoryName ?? "Right";
      const fingerState = countFingersFromLandmarks(firstHand, handedness);
      setGesture(summarizeGesture(fingerState));
      drawLandmarks(firstHand);
    } else {
      setGesture(initialGesture);
      clearCanvas();
    }

    if (lastFrameAtRef.current !== null) {
      const delta = Math.max(now - lastFrameAtRef.current, 1);
      setFps(1000 / delta);
    }
    lastFrameAtRef.current = now;
    setFrames((current) => current + 1);
    frameRef.current = requestAnimationFrame(detectFrame);
  }, [clearCanvas, drawLandmarks]);

  const startCamera = async () => {
    if (typeof window === "undefined" || !navigator.mediaDevices) {
      setStatus("error");
      setMessage("Este navegador nao oferece suporte a webcam.");
      return;
    }

    try {
      setStatus("requesting");
      setMessage("Solicitando permissao da camera...");
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: "user",
        },
        audio: false,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      setStatus("loading");
      setMessage("Carregando MediaPipe no navegador...");
      const { FilesetResolver, HandLandmarker } = await import(
        "@mediapipe/tasks-vision"
      );
      const vision = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.35/wasm",
      );
      landmarkerRef.current = await HandLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath:
            "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",
          delegate: "GPU",
        },
        numHands: 1,
        runningMode: "VIDEO",
      });

      setStatus("running");
      setMessage("Reconhecimento ativo.");
      frameRef.current = requestAnimationFrame(runDetectionLoop);
    } catch (error) {
      stopCamera();
      setStatus("error");
      setMessage(
        error instanceof Error
          ? error.message
          : "Nao foi possivel iniciar a camera.",
      );
    }
  };

  const isBusy = status === "requesting" || status === "loading";
  const isRunning = status === "running";

  return (
    <section className="grid gap-5 lg:grid-cols-[1fr_340px]">
      <div className="surface overflow-hidden">
        <div className="relative aspect-video bg-[var(--ink)]">
          <video
            ref={videoRef}
            className="h-full w-full scale-x-[-1] object-cover"
            muted
            playsInline
          />
          <canvas
            ref={canvasRef}
            className="pointer-events-none absolute inset-0 h-full w-full scale-x-[-1]"
          />
          {!isRunning && (
            <div className="absolute inset-0 grid place-items-center px-6 text-center text-white">
              <div>
                <Video aria-hidden="true" className="mx-auto mb-4" size={42} />
                <p className="text-lg font-semibold">{message}</p>
              </div>
            </div>
          )}
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--border)] p-4">
          <p className="text-sm text-[var(--muted)]">{message}</p>
          {isRunning ? (
            <button
              type="button"
              onClick={stopCamera}
              className="focus-ring inline-flex items-center gap-2 rounded-md bg-[var(--red)] px-4 py-2 text-sm font-semibold text-white"
            >
              <Square aria-hidden="true" size={16} />
              Parar
            </button>
          ) : (
            <button
              type="button"
              onClick={startCamera}
              disabled={isBusy}
              className="focus-ring inline-flex items-center gap-2 rounded-md bg-[var(--teal)] px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isBusy ? (
                <Loader2 aria-hidden="true" className="animate-spin" size={16} />
              ) : (
                <Camera aria-hidden="true" size={16} />
              )}
              Iniciar camera
            </button>
          )}
        </div>
      </div>

      <aside className="grid gap-4">
        <div className="metric-card">
          <p className="text-sm text-[var(--muted)]">Gesto atual</p>
          <p className="mt-3 text-3xl font-bold text-[var(--ink)]">
            {gesture.label}
          </p>
          <p className="mt-2 text-sm text-[var(--muted)]">
            Confianca {(gesture.confidence * 100).toFixed(0)}%
          </p>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="metric-card">
            <p className="text-sm text-[var(--muted)]">Dedos</p>
            <p className="mt-3 text-3xl font-bold text-[var(--blue)]">
              {gesture.fingers}
            </p>
          </div>
          <div className="metric-card">
            <p className="text-sm text-[var(--muted)]">FPS</p>
            <p className="mt-3 text-3xl font-bold text-[var(--teal)]">
              {fps.toFixed(1)}
            </p>
          </div>
        </div>
        <div className="metric-card">
          <p className="text-sm text-[var(--muted)]">Frames processados</p>
          <p className="mt-3 text-3xl font-bold text-[var(--amber)]">{frames}</p>
        </div>
      </aside>
    </section>
  );
}
