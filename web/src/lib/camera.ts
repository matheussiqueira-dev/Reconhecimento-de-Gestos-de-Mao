export type CameraProblemKind =
  | "insecure-context"
  | "unsupported"
  | "no-webassembly"
  | "denied"
  | "not-found"
  | "busy"
  | "overconstrained"
  | "security"
  | "model-download"
  | "model-init"
  | "unknown";

export type CameraProblem = {
  kind: CameraProblemKind;
  title: string;
  description: string;
  steps?: string[];
  retryable: boolean;
};

const PROBLEMS: Record<CameraProblemKind, Omit<CameraProblem, "kind">> = {
  "insecure-context": {
    title: "A câmera só funciona em conexão segura",
    description: "Abra a demo por um endereço https:// (ou localhost durante o desenvolvimento).",
    retryable: false,
  },
  unsupported: {
    title: "Este navegador não oferece acesso à câmera",
    description: "Use uma versão recente do Chrome, Edge, Firefox ou Safari.",
    retryable: false,
  },
  "no-webassembly": {
    title: "WebAssembly está indisponível",
    description:
      "O modelo roda em WebAssembly. Verifique se o navegador está atualizado e se nenhuma política o bloqueia.",
    retryable: false,
  },
  denied: {
    title: "Permissão de câmera negada",
    description: "A demo precisa da câmera para localizar a mão. Nada é gravado ou enviado.",
    steps: [
      "Clique no ícone de câmera ou de cadeado na barra de endereço.",
      "Escolha Permitir para a câmera neste site.",
      "Volte aqui e selecione Tentar novamente.",
    ],
    retryable: true,
  },
  "not-found": {
    title: "Nenhuma câmera encontrada",
    description: "Conecte uma webcam ou verifique se ela está ativada no sistema e tente de novo.",
    retryable: true,
  },
  busy: {
    title: "A câmera está em uso",
    description:
      "Outro aplicativo ou aba está usando a câmera (por exemplo, uma chamada de vídeo). Feche-o e tente de novo.",
    retryable: true,
  },
  overconstrained: {
    title: "A câmera não aceitou a resolução pedida",
    description: "Tente novamente; se persistir, use outra câmera.",
    retryable: true,
  },
  security: {
    title: "O acesso à câmera foi bloqueado",
    description:
      "Uma política do navegador ou do sistema impede o uso da câmera nesta página.",
    retryable: true,
  },
  "model-download": {
    title: "Não foi possível baixar o modelo",
    description: "Verifique a conexão com a internet e tente de novo. O vídeo não foi enviado.",
    retryable: true,
  },
  "model-init": {
    title: "O modelo não pôde ser iniciado",
    description: "O navegador não conseguiu iniciar o MediaPipe. Atualize a página e tente de novo.",
    retryable: true,
  },
  unknown: {
    title: "Não foi possível iniciar a câmera",
    description: "Ocorreu um erro inesperado. Tente de novo.",
    retryable: true,
  },
};

export function cameraProblem(kind: CameraProblemKind): CameraProblem {
  return { kind, ...PROBLEMS[kind] };
}

/** Maps a getUserMedia rejection to a localized problem (never shows the raw message). */
export function problemFromMediaError(error: unknown): CameraProblem {
  const name = error instanceof Error || error instanceof DOMException ? error.name : "";
  switch (name) {
    case "NotAllowedError":
    case "PermissionDeniedError":
      return cameraProblem("denied");
    case "NotFoundError":
    case "DevicesNotFoundError":
      return cameraProblem("not-found");
    case "NotReadableError":
    case "TrackStartError":
    case "AbortError":
      return cameraProblem("busy");
    case "OverconstrainedError":
      return cameraProblem("overconstrained");
    case "SecurityError":
      return cameraProblem("security");
    default:
      return cameraProblem("unknown");
  }
}

export type SupportEnvironment = {
  isSecureContext: boolean;
  hasGetUserMedia: boolean;
  hasWebAssembly: boolean;
};

/** First blocking problem in this browser, or null when the demo can start. */
export function supportProblem(env: SupportEnvironment): CameraProblem | null {
  if (!env.isSecureContext) return cameraProblem("insecure-context");
  if (!env.hasGetUserMedia) return cameraProblem("unsupported");
  if (!env.hasWebAssembly) return cameraProblem("no-webassembly");
  return null;
}

export function readSupportEnvironment(): SupportEnvironment {
  return {
    isSecureContext: window.isSecureContext,
    hasGetUserMedia: typeof navigator.mediaDevices?.getUserMedia === "function",
    hasWebAssembly: typeof WebAssembly === "object",
  };
}

/** GPU inference needs WebGL2; without it MediaPipe runs on the CPU. */
export function hasWebGL2(): boolean {
  try {
    return document.createElement("canvas").getContext("webgl2") !== null;
  } catch {
    return false;
  }
}
