"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState, useSyncExternalStore, type CSSProperties } from "react";
import {
  Camera,
  CircleAlert,
  CircleCheck,
  Hand,
  LoaderCircle,
  OctagonX,
  RotateCcw,
  ShieldCheck,
  Square,
} from "lucide-react";
import { Switch } from "@/components/ui/Switch";
import { HandReadout } from "@/components/demo/HandReadout";
import { clearOverlay, drawOverlay, readOverlayColors, type OverlayColors } from "@/components/demo/overlay";
import {
  cameraProblem,
  problemFromMediaError,
  readSupportEnvironment,
  supportProblem,
  type CameraProblem,
} from "@/lib/camera";
import { formatDecimal, formatInteger, formatPercent } from "@/lib/format";
import { gestureLabel, HandReadingTracker, type HandReading } from "@/lib/gestures";
import { CAMERA_CONSTRAINTS } from "@/lib/mediapipe/config";
import {
  createHandTracker,
  TrackerLoadError,
  type Delegate,
  type HandTracker,
  type LoadStage,
} from "@/lib/mediapipe/loader";
import { preferencesStore } from "@/lib/preferences";
import { sessionStore } from "@/lib/session";

type Phase = "idle" | "requesting" | "loading" | "running" | "error";

/** React state is refreshed at ~10 Hz; the overlay is drawn on every video frame. */
const UI_INTERVAL_MS = 100;
/** Screen readers hear a stable gesture at most every 1.5 s. */
const ANNOUNCE_INTERVAL_MS = 1500;

type FrameHandle = { kind: "video" | "animation"; id: number };

function stopStream(stream: MediaStream | null) {
  stream?.getTracks().forEach((track) => track.stop());
}

function describeHand(reading: HandReading) {
  const side = reading.handedness === "Right" ? "direita" : "esquerda";
  return `Mão ${side}: ${gestureLabel(reading.gesture)}, ${reading.total} ${reading.total === 1 ? "dedo" : "dedos"}`;
}

export function CameraDemo() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const trackerRef = useRef<HandTracker | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const frameRef = useRef<FrameHandle | null>(null);
  const generationRef = useRef(0);
  const readingsRef = useRef(new HandReadingTracker());
  const colorsRef = useRef<OverlayColors | null>(null);
  const loopRef = useRef<() => void>(() => undefined);
  const timingRef = useRef({ lastFrameAt: 0, lastVideoTime: -1, fps: 0, latency: 0, lastUiAt: 0 });
  const announceRef = useRef({ at: 0, text: "" });

  const preferences = useSyncExternalStore(
    preferencesStore.subscribe,
    preferencesStore.getSnapshot,
    preferencesStore.getServerSnapshot,
  );
  const preferencesRef = useRef(preferences);
  useEffect(() => {
    preferencesRef.current = preferences;
  }, [preferences]);

  const [phase, setPhase] = useState<Phase>("idle");
  const [problem, setProblem] = useState<CameraProblem | null>(null);
  const [loadStage, setLoadStage] = useState<LoadStage | null>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [readings, setReadings] = useState<HandReading[]>([]);
  const [stats, setStats] = useState({ fps: 0, latency: 0 });
  const [delegate, setDelegate] = useState<Delegate | null>(null);
  const [aspectRatio, setAspectRatio] = useState("16 / 9");
  const [announcement, setAnnouncement] = useState("");

  const cancelFrame = useCallback(() => {
    const handle = frameRef.current;
    const video = videoRef.current;
    if (handle?.kind === "video" && video && "cancelVideoFrameCallback" in video) {
      video.cancelVideoFrameCallback(handle.id);
    } else if (handle) {
      cancelAnimationFrame(handle.id);
    }
    frameRef.current = null;
  }, []);

  const scheduleFrame = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    const next = () => loopRef.current();
    frameRef.current =
      "requestVideoFrameCallback" in video
        ? { kind: "video", id: video.requestVideoFrameCallback(next) }
        : { kind: "animation", id: requestAnimationFrame(next) };
  }, []);

  /** Releases camera tracks, the model and the frame loop. Safe to call at any time. */
  const release = useCallback(() => {
    generationRef.current += 1;
    abortRef.current?.abort();
    abortRef.current = null;
    cancelFrame();
    stopStream(streamRef.current);
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    trackerRef.current?.close();
    trackerRef.current = null;
    readingsRef.current.reset();
    clearOverlay(canvasRef.current);
    sessionStore.stop(performance.now());
  }, [cancelFrame]);

  const stop = useCallback(() => {
    release();
    setPhase("idle");
    setReadings([]);
    setLoadStage(null);
    setProgress(null);
  }, [release]);

  const fail = useCallback(
    (next: CameraProblem) => {
      release();
      setProblem(next);
      setPhase("error");
      setReadings([]);
      setLoadStage(null);
    },
    [release],
  );

  useEffect(() => {
    loopRef.current = () => {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const tracker = trackerRef.current;
      if (!video || !canvas || !tracker) return;

      const timing = timingRef.current;
      if (video.readyState >= 2 && video.currentTime !== timing.lastVideoTime) {
        timing.lastVideoTime = video.currentTime;
        const startedAt = performance.now();
        let current: HandReading[];
        try {
          current = readingsRef.current.read(tracker.detectForVideo(video, startedAt));
        } catch {
          fail(cameraProblem("model-init"));
          return;
        }
        const inferenceMs = performance.now() - startedAt;

        const prefs = preferencesRef.current;
        drawOverlay(
          canvas,
          video,
          current.map((reading) => ({
            landmarks: reading.landmarks,
            highlight: reading.gesture !== "unknown",
          })),
          { mirrored: prefs.mirror, visible: prefs.showLandmarks, colors: colorsRef.current ?? readOverlayColors() },
        );
        sessionStore.recordFrame({ now: startedAt, inferenceMs, gesture: current[0]?.gesture ?? null });

        if (timing.lastFrameAt) {
          const instantFps = 1000 / Math.max(startedAt - timing.lastFrameAt, 1);
          timing.fps = timing.fps ? timing.fps * 0.9 + instantFps * 0.1 : instantFps;
        }
        timing.latency = timing.latency ? timing.latency * 0.9 + inferenceMs * 0.1 : inferenceMs;
        timing.lastFrameAt = startedAt;

        if (startedAt - timing.lastUiAt >= UI_INTERVAL_MS) {
          timing.lastUiAt = startedAt;
          setReadings(current);
          setStats({ fps: timing.fps, latency: timing.latency });
          const text = current.length ? current.map(describeHand).join(". ") : "Nenhuma mão detectada.";
          const announced = announceRef.current;
          if (text !== announced.text && startedAt - announced.at >= ANNOUNCE_INTERVAL_MS) {
            announceRef.current = { at: startedAt, text };
            setAnnouncement(text);
          }
        }
      }
      scheduleFrame();
    };
  }, [fail, scheduleFrame]);

  const start = useCallback(async () => {
    release();
    const generation = generationRef.current;
    const isStale = () => generation !== generationRef.current;
    setProblem(null);
    setReadings([]);

    const unsupported = supportProblem(readSupportEnvironment());
    if (unsupported) {
      fail(unsupported);
      return;
    }

    setPhase("requesting");
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia(CAMERA_CONSTRAINTS);
    } catch (error) {
      if (!isStale()) fail(problemFromMediaError(error));
      return;
    }
    if (isStale()) {
      stopStream(stream);
      return;
    }
    streamRef.current = stream;

    const video = videoRef.current;
    if (!video) return;
    video.srcObject = stream;
    try {
      await video.play();
    } catch {
      if (!isStale()) fail(cameraProblem("unknown"));
      return;
    }
    if (isStale()) return;
    if (video.videoWidth && video.videoHeight) {
      setAspectRatio(`${video.videoWidth} / ${video.videoHeight}`);
    }

    setPhase("loading");
    const controller = new AbortController();
    abortRef.current = controller;
    let tracker: HandTracker;
    try {
      tracker = await createHandTracker({
        signal: controller.signal,
        onStage: (stage) => {
          if (isStale()) return;
          setLoadStage(stage);
        },
        onProgress: (ratio) => {
          if (!isStale()) setProgress(ratio);
        },
      });
    } catch (error) {
      if (!isStale()) {
        fail(error instanceof TrackerLoadError ? cameraProblem(error.kind) : cameraProblem("unknown"));
      }
      return;
    }
    if (isStale()) {
      tracker.close();
      return;
    }

    trackerRef.current = tracker;
    colorsRef.current = readOverlayColors();
    timingRef.current = { lastFrameAt: 0, lastVideoTime: -1, fps: 0, latency: 0, lastUiAt: 0 };
    announceRef.current = { at: 0, text: "" };
    setDelegate(tracker.delegate);
    setLoadStage(null);
    setProgress(null);
    setPhase("running");
    sessionStore.start(tracker.delegate, performance.now());
    scheduleFrame();
  }, [fail, release, scheduleFrame]);

  // Leaving the page must turn the camera off.
  useEffect(() => release, [release]);

  const isBusy = phase === "requesting" || phase === "loading";
  const isRunning = phase === "running";
  const primary = readings[0];
  const stageStyle = { "--ms-stage-ratio": aspectRatio } as CSSProperties;

  let statusText = "Câmera desligada.";
  if (phase === "requesting") statusText = "Aguardando a permissão da câmera…";
  if (phase === "loading") {
    statusText =
      loadStage === "runtime" ? "Iniciando o MediaPipe no navegador…" : "Baixando o modelo de mãos…";
  }
  if (phase === "running") statusText = "Reconhecimento ativo.";
  if (phase === "error" && problem) statusText = problem.title;

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)]">
      <section aria-labelledby="camera-title" className="ms-card grid grid-cols-1 content-start gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id="camera-title" className="text-h3">
            Câmera
          </h2>
          <PhaseBadge phase={phase} delegate={delegate} />
        </div>

        <div className="ms-stage" style={stageStyle} data-mirrored={preferences.mirror}>
          <video
            ref={videoRef}
            aria-label={
              preferences.mirror ? "Pré-visualização da câmera, espelhada" : "Pré-visualização da câmera"
            }
            muted
            playsInline
          />
          <canvas ref={canvasRef} aria-hidden="true" />
          {isRunning && (
            <p className="ms-stage-chip" aria-hidden="true">
              <Hand size={16} strokeWidth={1.75} aria-hidden="true" />
              {primary ? describeHand(primary) : "Nenhuma mão detectada"}
            </p>
          )}
          {!isRunning && (
            <StageMessage
              phase={phase}
              problem={problem}
              loadStage={loadStage}
              progress={progress}
              onStart={start}
            />
          )}
        </div>

        <p role="status" className="text-caption text-fg-secondary" data-testid="camera-status">
          {statusText}
        </p>

        <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
          {(isRunning || isBusy) && (
            <button type="button" className="ms-btn ms-btn--secondary" onClick={stop}>
              <Square size={16} strokeWidth={1.75} aria-hidden="true" />
              {isRunning ? "Parar câmera" : "Cancelar"}
            </button>
          )}
          <Switch
            label="Espelhar vídeo"
            checked={preferences.mirror}
            onChange={(mirror) => preferencesStore.update({ mirror })}
          />
          <Switch
            label="Mostrar landmarks"
            checked={preferences.showLandmarks}
            onChange={(showLandmarks) => preferencesStore.update({ showLandmarks })}
          />
        </div>

        {isRunning && (
          <p className="ms-num text-fine text-fg-tertiary" data-testid="camera-stats">
            {formatDecimal(stats.fps)} quadros/s · inferência {formatInteger(stats.latency)} ms ·{" "}
            {delegate === "GPU" ? "GPU (WebGL)" : "CPU"}
          </p>
        )}
      </section>

      <section aria-labelledby="reading-title" className="ms-card grid grid-cols-1 content-start gap-5">
        <h2 id="reading-title" className="text-h3">
          Leitura
        </h2>
        {isRunning && readings.length === 0 && (
          <div className="grid justify-items-start gap-2" data-testid="no-hand">
            <Hand size={24} strokeWidth={1.75} className="text-fg-tertiary" aria-hidden="true" />
            <p className="font-semibold text-fg">Nenhuma mão detectada</p>
            <p className="text-caption text-fg-secondary">
              Mostre a palma para a câmera, a cerca de meio metro, com boa iluminação.
            </p>
          </div>
        )}
        {!isRunning && (
          <p className="text-caption text-fg-secondary">
            A leitura aparece aqui quando a câmera estiver ativa: gesto, dedos levantados e a confiança do
            modelo para cada mão (até duas).
          </p>
        )}
        {isRunning &&
          readings.map((reading) => <HandReadout key={reading.handedness} reading={reading} />)}
        <p className="text-caption text-fg-secondary">
          As métricas desta sessão ficam no{" "}
          <Link href="/dashboard" className="ms-link">
            painel da sessão
          </Link>
          .
        </p>
      </section>

      <p aria-live="polite" className="ms-sr-only">
        {announcement}
      </p>
    </div>
  );
}

function PhaseBadge({ phase, delegate }: { phase: Phase; delegate: Delegate | null }) {
  if (phase === "running") {
    return (
      <span className="ms-badge ms-badge--positive">
        <CircleCheck size={14} strokeWidth={1.75} aria-hidden="true" />
        Ativa{delegate ? ` · ${delegate}` : ""}
      </span>
    );
  }
  if (phase === "error") {
    return (
      <span className="ms-badge ms-badge--danger">
        <OctagonX size={14} strokeWidth={1.75} aria-hidden="true" />
        Falhou
      </span>
    );
  }
  if (phase === "requesting" || phase === "loading") {
    return (
      <span className="ms-badge ms-badge--info">
        <LoaderCircle size={14} strokeWidth={1.75} className="ms-spinner" aria-hidden="true" />
        Iniciando
      </span>
    );
  }
  return <span className="ms-badge">Desligada</span>;
}

function StageMessage({
  phase,
  problem,
  loadStage,
  progress,
  onStart,
}: {
  phase: Phase;
  problem: CameraProblem | null;
  loadStage: LoadStage | null;
  progress: number | null;
  onStart: () => void;
}) {
  return (
    <div className="relative grid place-items-center bg-canvas p-4 sm:p-6">
      {phase === "idle" && (
        <div className="grid max-w-md justify-items-center gap-3 text-center">
          <Camera size={24} strokeWidth={1.75} className="text-fg-tertiary" aria-hidden="true" />
          <p className="font-semibold text-fg">A câmera fica desligada até você ativá-la</p>
          <p className="text-caption text-fg-secondary">
            Ela é usada só para localizar os 21 pontos da mão e aplicar as regras de gesto.
          </p>
          <button type="button" className="ms-btn ms-btn--primary" onClick={onStart}>
            <Camera size={16} strokeWidth={1.75} aria-hidden="true" />
            Ativar câmera
          </button>
          <p className="text-caption text-fg-secondary">
            <ShieldCheck
              size={16}
              strokeWidth={1.75}
              className="mr-1 inline-block align-[-3px]"
              aria-hidden="true"
            />
            O vídeo é processado no seu navegador; nada é enviado.
          </p>
        </div>
      )}

      {(phase === "requesting" || phase === "loading") && (
        <div className="grid w-full max-w-sm gap-3" aria-busy="true">
          <div className="ms-skeleton h-3 w-2/3" />
          <div className="ms-skeleton h-3 w-1/2" />
          {phase === "requesting" && (
            <p className="text-caption text-fg-secondary">Responda ao pedido de permissão do navegador.</p>
          )}
          {phase === "loading" && loadStage === "model" && (
            <>
              <progress
                className="ms-progress"
                max={1}
                value={progress ?? undefined}
                aria-label="Download do modelo"
              />
              <p className="ms-num text-caption text-fg-secondary">
                Baixando o modelo (7,8 MB) do Google Cloud Storage
                {progress !== null ? ` · ${formatPercent(progress)}` : "…"}
              </p>
            </>
          )}
          {phase === "loading" && loadStage === "runtime" && (
            <p className="text-caption text-fg-secondary">Iniciando o MediaPipe (WebAssembly)…</p>
          )}
        </div>
      )}

      {phase === "error" && problem && (
        <div className="ms-alert ms-alert--danger w-full max-w-md" role="alert">
          <CircleAlert size={20} strokeWidth={1.75} className="ms-alert__icon" aria-hidden="true" />
          <div className="grid gap-2">
            <p className="font-semibold text-fg">{problem.title}</p>
            <p className="text-caption text-fg-secondary">{problem.description}</p>
            {problem.steps && (
              <ol className="list-decimal pl-5 text-caption text-fg-secondary">
                {problem.steps.map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ol>
            )}
            {problem.retryable && (
              <div>
                <button type="button" className="ms-btn ms-btn--primary" onClick={onStart}>
                  <RotateCcw size={16} strokeWidth={1.75} aria-hidden="true" />
                  Tentar novamente
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
