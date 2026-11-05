// Prepara per il web le foto d'epoca scaricate da Wikimedia Commons.
// Legge src/originali/commons e scrive src/risorse/img/foto.
// Uso: npm run foto  (poi npm run build)
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const RADICE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ORIGINALI = path.join(RADICE, "src", "originali", "commons");
const DEST = path.join(RADICE, "src", "risorse", "img", "foto");

// Ritagli 4:5 per i ritratti nella cornice ovale (coordinate sull'originale).
const RITAGLI = {
  "sandra-tante-scuse-1974": { left: 121, top: 0, width: 640, height: 800 },
  "raimondo-letti-sbagliati-1965": { left: 417, top: 0, width: 837, height: 1046 },
};

fs.mkdirSync(DEST, { recursive: true });
for (const file of fs.readdirSync(ORIGINALI).filter((f) => /\.(jpe?g|png)$/i.test(f))) {
  const nome = file.replace(/\.\w+$/, "");
  const sorgente = path.join(ORIGINALI, file);
  const info = await sharp(sorgente)
    .resize({ width: 1200, height: 1000, fit: "inside", withoutEnlargement: true })
    .jpeg({ quality: 80, mozjpeg: true })
    .toFile(path.join(DEST, `${nome}.jpg`));
  console.log(`foto/${nome}.jpg  ${info.width}x${info.height}  ${Math.round(info.size / 1024)} KB`);
  if (RITAGLI[nome]) {
    const r = await sharp(sorgente)
      .extract(RITAGLI[nome])
      .resize(480, 600)
      .jpeg({ quality: 82, mozjpeg: true })
      .toFile(path.join(DEST, `${nome}-ritratto.jpg`));
    console.log(`foto/${nome}-ritratto.jpg  ${r.width}x${r.height}  ${Math.round(r.size / 1024)} KB`);
  }
}
