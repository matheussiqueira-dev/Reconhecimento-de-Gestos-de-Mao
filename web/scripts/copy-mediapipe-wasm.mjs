// Copies the MediaPipe WebAssembly runtime from node_modules into
// public/mediapipe/<version>/wasm so the demo serves it from its own origin.
// Runs before `next dev` and `next build` (npm pre-scripts). The output is
// gitignored; the version in the path makes long-lived caching safe.
import { copyFile, mkdir, readFile, readdir, rm, stat } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const webRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const packageName = "@mediapipe/tasks-vision";
const runtimeFiles = [
  "vision_wasm_internal.js",
  "vision_wasm_internal.wasm",
  "vision_wasm_nosimd_internal.js",
  "vision_wasm_nosimd_internal.wasm",
];

async function readJson(path) {
  return JSON.parse(await readFile(path, "utf8"));
}

const pinned = (await readJson(join(webRoot, "package.json"))).dependencies[packageName];
const packageDir = join(webRoot, "node_modules", packageName);
const installed = (await readJson(join(packageDir, "package.json"))).version;

if (pinned !== installed) {
  throw new Error(
    `${packageName}: package.json pins ${pinned} but ${installed} is installed. Run npm ci.`,
  );
}

const publicRoot = join(webRoot, "public", "mediapipe");
const target = join(publicRoot, installed, "wasm");
await mkdir(target, { recursive: true });

// Drop runtimes left over from previous versions so they are not deployed.
for (const entry of await readdir(publicRoot)) {
  if (entry !== installed) {
    await rm(join(publicRoot, entry), { recursive: true, force: true });
  }
}

for (const file of runtimeFiles) {
  const from = join(packageDir, "wasm", file);
  const to = join(target, file);
  const [source, existing] = await Promise.all([stat(from), stat(to).catch(() => null)]);
  if (!existing || existing.size !== source.size) {
    await copyFile(from, to);
  }
}

console.log(`MediaPipe ${installed} runtime ready in public/mediapipe/${installed}/wasm`);
