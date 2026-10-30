#!/usr/bin/env node
/**
 * Auto-Publicador Multi-Red 100% Gratuito para Keyframes
 * (TikTok + Instagram Reels + YouTube Shorts + Facebook Reels)
 *
 * Lee automáticamente `<slug>.mp4`, `cover.jpg` y `caption.txt` de una carpeta de `workspace/output/`
 * y las credenciales configuradas en `/Users/rol.travel/.gemini/antigravity/scratch/keyframes/.env.local`.
 *
 * Modos soportados:
 *   1. `buffer` (POR DEFECTO · 100% GRATIS $0 PARA SIEMPRE, sin tarjeta):
 *      - Plan gratis de Buffer permite 3 canales gratis (TikTok + Instagram Reels + YouTube Shorts) + 1 API Key gratis.
 *      - Instagram replica automáticamente tus Reels a Facebook Reels gratis activando el switch en la app de Instagram.
 *      - Sube automáticamente el MP4 local a un enlace HTTPS temporal gratuito (Litterbox 72h / tmpfiles.org) para que Buffer lo descargue sin pagar S3.
 *      Variables en `.env.local`:
 *        PUBLISH_PROVIDER=buffer
 *        BUFFER_API_KEY=tu_api_key_gratis_de_buffer
 *        BUFFER_MODE=shareNow   # (o addToQueue)
 *
 *   2. `youtube-direct` (100% GRATIS $0 vía Google Cloud OAuth2 directo a YouTube Shorts):
 *      Variables en `.env.local`:
 *        PUBLISH_PROVIDER=youtube-direct
 *        YOUTUBE_CLIENT_ID=...
 *        YOUTUBE_CLIENT_SECRET=...
 *        YOUTUBE_REFRESH_TOKEN=...
 *
 *   3. `upload-post` / `postiz` (Alternativas API adicionales):
 *        PUBLISH_PROVIDER=upload-post | postiz
 */
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const KF_ROOT = "/Users/rol.travel/.gemini/antigravity/scratch/keyframes";
const ENV_PATH = path.join(KF_ROOT, ".env.local");

function loadEnv() {
  const env = { ...process.env };
  if (fs.existsSync(ENV_PATH)) {
    for (const raw of fs.readFileSync(ENV_PATH, "utf8").split(/\r?\n/)) {
      const line = raw.trim();
      if (!line || line.startsWith("#") || !line.includes("=")) continue;
      const idx = line.indexOf("=");
      const k = line.slice(0, idx).trim();
      const v = line.slice(idx + 1).trim().replace(/^['"]|['"]$/g, "");
      if (!env[k]) env[k] = v;
    }
  }
  return env;
}

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const opt = (flag) => (args.includes(flag) ? args[args.indexOf(flag) + 1] : undefined);
const skipValues = new Set([opt("--platforms"), opt("--schedule"), opt("--provider")].filter(Boolean));
const folderArg = args.find((a) => !a.startsWith("--") && !skipValues.has(a));

if (!folderArg) {
  console.error(
    "Uso: node publish_reel.mjs <carpeta-output> [--dry-run] [--provider buffer|youtube-direct|upload-post|postiz] [--platforms tiktok,instagram,youtube,facebook]",
  );
  process.exit(1);
}

const outDir = path.resolve(KF_ROOT, folderArg);
if (!fs.existsSync(outDir)) {
  console.error(`No existe la carpeta: ${outDir}`);
  process.exit(1);
}

const files = fs.readdirSync(outDir);
const mp4Name = files.find((f) => f.endsWith(".mp4"));
if (!mp4Name) {
  console.error(`No se encontró ningún archivo .mp4 en ${outDir}`);
  process.exit(1);
}
const mp4Path = path.join(outDir, mp4Name);
const coverPath = fs.existsSync(path.join(outDir, "cover.jpg")) ? path.join(outDir, "cover.jpg") : null;
const captionPath = path.join(outDir, "caption.txt");
const caption = fs.existsSync(captionPath) ? fs.readFileSync(captionPath, "utf8").trim() : path.basename(mp4Name, ".mp4");
const rawFirstLine = caption.split(/\r?\n/)[0].replace(/[.]+$/, "").trim();
const firstLine =
  rawFirstLine.length <= 92
    ? rawFirstLine
    : rawFirstLine.slice(0, 92).replace(/\s+\S*$/, "").trim();

const env = loadEnv();
const provider = (opt("--provider") || env.PUBLISH_PROVIDER || "buffer").toLowerCase();
const platforms = (opt("--platforms") || env.PUBLISH_PLATFORMS || "tiktok,instagram,youtube,facebook")
  .split(",")
  .map((s) => s.trim().toLowerCase())
  .filter(Boolean);
const scheduleAt = opt("--schedule") || "";

const statMb = (fs.statSync(mp4Path).size / (1024 * 1024)).toFixed(2);
console.log("=== KEYFRAMES AUTO-PUBLISHER ($0 GRATIS) ===");
console.log(`Proveedor   : ${provider}`);
console.log(`Redes       : ${platforms.join(", ")}`);
console.log(`Video MP4   : ${mp4Path} (${statMb} MB)`);
console.log(`Portada     : ${coverPath ?? "(automática)"}`);
console.log(`Título YT   : ${firstLine}`);
console.log(`Caption     : ${caption.length} caracteres`);
if (scheduleAt) console.log(`Programado  : ${scheduleAt}`);

if (dryRun) {
  const configured =
    (provider === "buffer" && Boolean(env.BUFFER_API_KEY)) ||
    (provider === "youtube-direct" && Boolean(env.YOUTUBE_CLIENT_ID && env.YOUTUBE_CLIENT_SECRET && env.YOUTUBE_REFRESH_TOKEN)) ||
    (provider === "upload-post" && Boolean(env.UPLOAD_POST_API_KEY && env.UPLOAD_POST_USER)) ||
    (provider === "postiz" && Boolean(env.POSTIZ_API_KEY && env.POSTIZ_CHANNEL_IDS));
  console.log(`\n[DRY-RUN OK] Paquete validado y listo para subir gratis ($0).`);
  console.log(
    configured
      ? "Credenciales detectadas en .env.local: listo para publicar sin --dry-run."
      : "Pendiente: agrega BUFFER_API_KEY en /Users/rol.travel/.gemini/antigravity/scratch/keyframes/.env.local.",
  );
  process.exit(0);
}

/**
 * Sube gratuitamente el archivo .mp4 local a un enlace HTTPS directo temporal (72 horas)
 * sin necesidad de cuenta ni tarjeta, para que la API de Buffer pueda ingerir el video.
 */
function stageTempPublicMp4(localMp4) {
  if (env.PUBLIC_VIDEO_URL) return env.PUBLIC_VIDEO_URL;
  console.log("\nSubiendo MP4 a enlace temporal HTTPS gratuito (72h) para Buffer...");
  try {
    const url = execFileSync(
      "curl",
      [
        "-sS",
        "--fail",
        "-F",
        "reqtype=fileupload",
        "-F",
        "time=72h",
        "-F",
        `fileToUpload=@${localMp4}`,
        "https://litterbox.catbox.moe/resources/internals/api.php",
      ],
      { encoding: "utf8" },
    ).trim();
    if (url.startsWith("https://") && url.endsWith(".mp4")) {
      console.log(`Enlace temporal listo: ${url}`);
      return url;
    }
  } catch (_) {
    // Fallback a tmpfiles.org si litterbox estuviera ocupado
  }
  const raw = execFileSync("curl", ["-sS", "--fail", "-F", `file=@${localMp4}`, "https://tmpfiles.org/api/v1/upload"], {
    encoding: "utf8",
  });
  const parsed = JSON.parse(raw);
  const pageUrl = parsed?.data?.url || "";
  if (!pageUrl) throw new Error(`No se pudo generar URL pública temporal: ${raw}`);
  const directUrl = pageUrl.replace("http://", "https://").replace("tmpfiles.org/", "tmpfiles.org/dl/");
  console.log(`Enlace temporal listo: ${directUrl}`);
  return directUrl;
}

async function bufferGraphql(apiKey, query, variables = {}) {
  const res = await fetch("https://api.buffer.com", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ query, variables }),
  });
  const json = await res.json();
  if (json.errors) {
    throw new Error(`Buffer GraphQL error: ${JSON.stringify(json.errors)}`);
  }
  return json.data;
}

async function publishBuffer() {
  const apiKey = env.BUFFER_API_KEY;
  if (!apiKey) {
    throw new Error("Falta BUFFER_API_KEY en .env.local (obtenla gratis en https://publish.buffer.com/settings/api)");
  }

  // 1. Obtener organización y canales conectados en Buffer Gratis
  const orgData = await bufferGraphql(
    apiKey,
    `query GetOrgs { account { organizations { id name } } }`,
  );
  const orgs = orgData?.account?.organizations || [];
  if (orgs.length === 0) throw new Error("No se encontraron organizaciones en tu cuenta de Buffer.");
  const orgId = env.BUFFER_ORG_ID || orgs[0].id;

  const chData = await bufferGraphql(
    apiKey,
    `query GetChannels($orgId: OrganizationId!) {
      channels(input: { organizationId: $orgId }) {
        id
        name
        service
      }
    }`,
    { orgId },
  );
  const allChannels = chData?.channels || [];
  if (allChannels.length === 0) {
    throw new Error("No tienes canales conectados aún en Buffer. Conecta TikTok, Instagram y YouTube en buffer.com.");
  }

  const targetChannels = allChannels.filter((c) =>
    platforms.some((p) => String(c.service || "").toLowerCase().includes(p)),
  );
  if (targetChannels.length === 0) {
    throw new Error(
      `Ningún canal conectado (${allChannels.map((c) => c.service).join(", ")}) coincide con: ${platforms.join(", ")}`,
    );
  }

  // 2. Generar URL directa HTTPS temporal gratuita para el MP4 local
  const videoUrl = stageTempPublicMp4(mp4Path);
  const mode = scheduleAt ? "customScheduled" : env.BUFFER_MODE || "shareNow";

  // 3. Publicar en cada canal conectado
  for (const ch of targetChannels) {
    const svc = String(ch.service || "").toLowerCase();
    const input = {
      channelId: ch.id,
      text: svc.includes("youtube") ? `${firstLine} #Shorts\n\n${caption}` : caption,
      schedulingType: "automatic",
      mode,
      ...(scheduleAt ? { dueAt: scheduleAt } : {}),
      assets: [
        {
          video: {
            url: videoUrl,
            metadata: { thumbnailOffset: 4500 },
          },
        },
      ],
      ...(svc.includes("instagram") ? { metadata: { instagram: { type: "reel" } } } : {}),
    };

    try {
      const postRes = await bufferGraphql(
        apiKey,
        `mutation CreateVideoPost($input: CreatePostInput!) {
          createPost(input: $input) {
            ... on PostActionSuccess {
              post { id status dueAt }
            }
            ... on MutationError {
              message
            }
          }
        }`,
        { input },
      );
      console.log(`✓ [${ch.service} · ${ch.name}] ->`, JSON.stringify(postRes?.createPost));
    } catch (err) {
      // Reintento limpio sin metadata específica si el esquema del canal varía
      const { metadata: _drop, ...fallbackInput } = input;
      const postRes = await bufferGraphql(
        apiKey,
        `mutation CreateVideoPostFallback($input: CreatePostInput!) {
          createPost(input: $input) {
            ... on PostActionSuccess {
              post { id status dueAt }
            }
            ... on MutationError {
              message
            }
          }
        }`,
        { input: fallbackInput },
      );
      console.log(`✓ [${ch.service} · ${ch.name}] (fallback) ->`, JSON.stringify(postRes?.createPost));
    }
  }
}

async function publishUploadPost() {
  const apiKey = env.UPLOAD_POST_API_KEY;
  const user = env.UPLOAD_POST_USER;
  if (!apiKey || !user) {
    throw new Error("Faltan UPLOAD_POST_API_KEY o UPLOAD_POST_USER en .env.local");
  }
  const curlArgs = [
    "-sS",
    "-X",
    "POST",
    "https://api.upload-post.com/api/upload",
    "-H",
    `Authorization: Apikey ${apiKey}`,
    "-F",
    `user=${user}`,
    "-F",
    `title=${caption}`,
    "-F",
    `youtube_title=${firstLine}`,
    "-F",
    `video=@${mp4Path}`,
  ];
  for (const p of platforms) {
    curlArgs.push("-F", `platform[]=${p}`);
  }
  if (scheduleAt) {
    curlArgs.push("-F", `scheduled_date=${scheduleAt}`);
  }
  const out = execFileSync("curl", curlArgs, { encoding: "utf8" });
  console.log("\nRespuesta Upload-Post:\n", out);
}

async function publishPostiz() {
  const apiKey = env.POSTIZ_API_KEY;
  const baseUrl = (env.POSTIZ_BASE_URL || "https://api.postiz.com/public/v1").replace(/\/$/, "");
  const channelIds = (env.POSTIZ_CHANNEL_IDS || "").split(",").map((s) => s.trim()).filter(Boolean);
  if (!apiKey || channelIds.length === 0) {
    throw new Error("Faltan POSTIZ_API_KEY o POSTIZ_CHANNEL_IDS en .env.local");
  }
  const upRaw = execFileSync(
    "curl",
    ["-sS", "-X", "POST", `${baseUrl}/upload`, "-H", `Authorization: ${apiKey}`, "-F", `file=@${mp4Path}`],
    { encoding: "utf8" },
  );
  const media = JSON.parse(upRaw);
  const payload = {
    type: scheduleAt ? "schedule" : "now",
    date: scheduleAt || new Date().toISOString(),
    shortLink: false,
    tags: [],
    posts: channelIds.map((id) => ({
      integration: { id },
      value: [{ content: caption, image: [{ id: media.id, path: media.path }] }],
    })),
  };
  const res = await fetch(`${baseUrl}/posts`, {
    method: "POST",
    headers: { Authorization: apiKey, "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  console.log("\nRespuesta Postiz:\n", await res.text());
}

async function publishYoutubeDirect() {
  const { YOUTUBE_CLIENT_ID, YOUTUBE_CLIENT_SECRET, YOUTUBE_REFRESH_TOKEN } = env;
  if (!YOUTUBE_CLIENT_ID || !YOUTUBE_CLIENT_SECRET || !YOUTUBE_REFRESH_TOKEN) {
    throw new Error("Faltan YOUTUBE_CLIENT_ID, YOUTUBE_CLIENT_SECRET o YOUTUBE_REFRESH_TOKEN en .env.local");
  }
  const tokRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: YOUTUBE_CLIENT_ID,
      client_secret: YOUTUBE_CLIENT_SECRET,
      refresh_token: YOUTUBE_REFRESH_TOKEN,
      grant_type: "refresh_token",
    }),
  });
  const tok = await tokRes.json();
  if (!tok.access_token) throw new Error(`Error OAuth YouTube: ${JSON.stringify(tok)}`);

  const initRes = await fetch(
    "https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${tok.access_token}`,
        "Content-Type": "application/json; charset=UTF-8",
        "X-Upload-Content-Type": "video/mp4",
        "X-Upload-Content-Length": String(fs.statSync(mp4Path).size),
      },
      body: JSON.stringify({
        snippet: {
          title: `${firstLine} #Shorts`.slice(0, 100),
          description: caption,
          categoryId: "28",
        },
        status: {
          privacyStatus: env.YOUTUBE_PRIVACY || "public",
          selfDeclaredMadeForKids: false,
        },
      }),
    },
  );
  const uploadUrl = initRes.headers.get("location");
  if (!uploadUrl) throw new Error(`YouTube no devolvió URL resumable: ${await initRes.text()}`);

  const videoBytes = fs.readFileSync(mp4Path);
  const putRes = await fetch(uploadUrl, {
    method: "PUT",
    headers: { "Content-Type": "video/mp4", "Content-Length": String(videoBytes.length) },
    body: videoBytes,
  });
  console.log("\nPublicado en YouTube Shorts:\n", await putRes.text());
}

if (provider === "buffer") {
  await publishBuffer();
} else if (provider === "upload-post") {
  await publishUploadPost();
} else if (provider === "postiz") {
  await publishPostiz();
} else if (provider === "youtube-direct") {
  await publishYoutubeDirect();
} else {
  console.error(`Proveedor desconocido: ${provider}`);
  process.exit(1);
}
