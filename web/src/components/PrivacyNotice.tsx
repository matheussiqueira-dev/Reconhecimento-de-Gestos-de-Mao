import { ShieldCheck } from "lucide-react";

/** What leaves the browser, stated precisely (see docs/PRIVACY.md). */
export function PrivacyNotice() {
  return (
    <section aria-labelledby="privacy-title" className="ms-panel grid gap-3">
      <h2 id="privacy-title" className="inline-flex items-center gap-2 text-h4">
        <ShieldCheck size={20} strokeWidth={1.75} className="text-fg-secondary" aria-hidden="true" />
        Privacidade
      </h2>
      <ul className="grid list-disc gap-2 pl-5 text-caption text-fg-secondary">
        <li>O vídeo é processado no seu navegador; nenhum quadro, imagem ou ponto da mão é enviado.</li>
        <li>
          Ao ativar a câmera, o navegador baixa o modelo de mãos (7,8 MB) do Google Cloud Storage. Esse
          download não leva dados seus além do que qualquer requisição web leva (IP e navegador).
        </li>
        <li>Não há analytics, cookies nem cadastro. As métricas da sessão ficam só na memória da aba.</li>
        <li>Suas preferências (espelhar vídeo, mostrar landmarks) ficam no armazenamento local do navegador.</li>
      </ul>
    </section>
  );
}
