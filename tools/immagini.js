// Ottimizza le immagini decorative di src/originali in JPG leggeri per il sito.
// Uso: npm run immagini
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const RADICE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DA = path.join(RADICE, "src", "originali");
const A = path.join(RADICE, "src", "risorse", "img", "scene");
fs.mkdirSync(A, { recursive: true });

for (const f of fs.readdirSync(DA).filter((x) => /\.(png|jpe?g)$/i.test(x))) {
  const nome = f.replace(/\.\w+$/, "");
  for (const [suffisso, larghezza, qualita] of [["", 1024, 76], ["-piccola", 560, 72]]) {
    const out = path.join(A, `${nome}${suffisso}.jpg`);
    await sharp(path.join(DA, f)).resize({ width: larghezza }).jpeg({ quality: qualita, mozjpeg: true, progressive: true }).toFile(out);
    console.log(`${out.replace(RADICE, ".")}  ${Math.round(fs.statSync(out).size / 1024)} KB`);
  }
}
