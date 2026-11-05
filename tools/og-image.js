// Crea l'immagine per le condivisioni social (og.png) e l'icona per iPhone.
// Uso: npm run og  (poi npm run build)
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Resvg } from "@resvg/resvg-js";
import sharp from "sharp";

const RADICE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const IMG = path.join(RADICE, "src", "risorse", "img");

// Sfondo: il palcoscenico, ritagliato in formato 1200x630
const sfondo = await sharp(path.join(IMG, "scene", "sipario.jpg")).resize(1200, 630, { fit: "cover", position: "north" }).jpeg({ quality: 82 }).toBuffer();
const b64 = sfondo.toString("base64");

const lampadine = (y) => Array.from({ length: 34 }, (_, i) => `<circle cx="${138 + i * 28}" cy="${y}" r="4" fill="#ffe7a3"/>`).join("");
const laterali = (x) => Array.from({ length: 7 }, (_, i) => `<circle cx="${x}" cy="${214 + i * 28}" r="4" fill="#ffe7a3"/>`).join("");

const og = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <radialGradient id="faro" cx="50%" cy="42%" r="60%"><stop offset="0" stop-color="#ffd68c" stop-opacity=".35"/><stop offset="1" stop-color="#120a09" stop-opacity="0"/></radialGradient>
    <linearGradient id="scuro" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#120a09" stop-opacity=".45"/><stop offset="1" stop-color="#120a09" stop-opacity=".9"/></linearGradient>
  </defs>
  <image href="data:image/jpeg;base64,${b64}" width="1200" height="630"/>
  <rect width="1200" height="630" fill="url(#scuro)"/>
  <rect width="1200" height="630" fill="url(#faro)"/>
  <rect x="120" y="190" width="960" height="210" rx="34" fill="#3a0a12" fill-opacity=".72" stroke="#e7b75a" stroke-width="3"/>
  ${lampadine(204)}${lampadine(386)}${laterali(134)}${laterali(1066)}
  <rect x="520" y="128" width="160" height="38" rx="7" fill="#a3182b" stroke="#ff6070"/>
  <circle cx="546" cy="147" r="6" fill="#ff4053"/>
  <text x="612" y="154" text-anchor="middle" font-family="Arial" font-weight="bold" font-size="18" letter-spacing="4" fill="#ffe1e1">IN ONDA</text>
  <text x="600" y="330" text-anchor="middle" font-family="Georgia" font-weight="bold" font-size="104" fill="#fff4de">Sandra <tspan font-style="italic" font-weight="normal" fill="#e7b75a" font-size="80">e</tspan> Raimondo</text>
  <text x="600" y="470" text-anchor="middle" font-family="Georgia" font-size="32" fill="#f0dfc6">Biografie, programmi, cronologia e un quiz</text>
  <text x="600" y="530" text-anchor="middle" font-family="Arial" font-weight="bold" font-size="19" letter-spacing="4" fill="#e7b75a">ARCHIVIO NON UFFICIALE DEGLI APPASSIONATI</text>
</svg>`;

const icona = fs.readFileSync(path.join(IMG, "favicon.svg"), "utf8");

function png(svg, larghezza, file) {
  const r = new Resvg(svg, { fitTo: { mode: "width", value: larghezza }, font: { loadSystemFonts: true, defaultFontFamily: "Georgia" } });
  fs.writeFileSync(path.join(IMG, file), r.render().asPng());
  console.log("Creato src/risorse/img/" + file);
}

png(og, 1200, "og.png");
await sharp(path.join(IMG, "og.png")).jpeg({ quality: 84 }).toFile(path.join(IMG, "og.jpg"));
fs.rmSync(path.join(IMG, "og.png"));
png(icona, 180, "apple-touch-icon.png");
