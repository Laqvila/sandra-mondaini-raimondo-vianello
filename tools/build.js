// Genera il sito statico in dist/ a partire da src/.
// Uso: npm run build
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import matter from "gray-matter";
import { Marked } from "marked";
import config from "../src/config.js";
import * as T from "../src/templates.js";

const RADICE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SRC = path.join(RADICE, "src");
const DIST = path.join(RADICE, "dist");
const crediti = []; // foto pubblicate nei testi, per la pagina Crediti fotografici
const pagineSitemap = [];

config.versione = new Date().toISOString().slice(0, 16).replace(/\D/g, "");
config.editore.pivaFrase = config.editore.piva ? `, partita IVA ${config.editore.piva}` : "";
config.editore.sedeFrase = config.editore.indirizzo ? `, con sede in ${config.editore.indirizzo}` : "";

const SCENA = {
  sipario: "/assets/img/scene/sipario.jpg",
  studio: "/assets/img/scene/studio.jpg",
  salotto: "/assets/img/scene/salotto.jpg",
  camera: "/assets/img/scene/camera.jpg",
};

/* ---------- Utilità ---------- */

const leggiJson = (f) => JSON.parse(fs.readFileSync(path.join(SRC, "dati", f), "utf8"));

function leggiCartella(cartella) {
  const dir = path.join(SRC, "contenuti", cartella);
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".md"))
    .map((f) => {
      const { data, content } = matter(fs.readFileSync(path.join(dir, f), "utf8"));
      return { ...data, slug: data.slug || f.replace(/\.md$/, ""), corpo: content, file: `${cartella}/${f}` };
    });
}

function scrivi(percorso, html, { sitemap = true } = {}) {
  const dest = percorso.endsWith(".html") ? path.join(DIST, percorso) : path.join(DIST, percorso, "index.html");
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, tipografia(html));
  if (sitemap) pagineSitemap.push(percorso);
}

function copiaCartella(da, a) {
  if (!fs.existsSync(da)) return;
  fs.mkdirSync(a, { recursive: true });
  for (const voce of fs.readdirSync(da, { withFileTypes: true })) {
    const s = path.join(da, voce.name);
    const d = path.join(a, voce.name);
    voce.isDirectory() ? copiaCartella(s, d) : fs.copyFileSync(s, d);
  }
}

// Apostrofi tipografici nel testo visibile (non tocca tag, script e stili).
function tipografia(html) {
  return html
    .split(/(<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>|<[^>]+>)/)
    .map((pezzo) =>
      pezzo.startsWith("<")
        ? pezzo
        : pezzo.replace(/(\p{L})(?:'|&#39;)(\p{L}|\d)/gu, "$1’$2").replace(/\b(po|mo|di|da|fa|va|sta|be)(?:'|&#39;)(?=[\s.,;!?)]|$)/gu, "$1’")
    )
    .join("");
}

const valoreConfig = (chiave) => chiave.split(".").reduce((o, k) => (o == null ? undefined : o[k]), config);

function attributi(s) {
  const out = {};
  for (const m of s.matchAll(/(\w+)="([^"]*)"/g)) out[m[1]] = m[2];
  return out;
}

const marked = new Marked({ gfm: true });

// Markdown con due scorciatoie:
// {{foto src="..." alt="..." didascalia="..." autore="..." fonte="..." url="..." licenza="..." formato="verticale"}}
// {{video youtube="ID" titolo="..." canale="..." titolare="..."}}
function registraFoto(f, contesto) {
  for (const campo of ["src", "alt", "autore", "fonte", "licenza"]) {
    if (!f[campo]) throw new Error(`Foto senza "${campo}" in ${contesto}. Ogni foto deve avere autore, fonte e licenza.`);
  }
  crediti.push({ ...f, pagina: contesto });
}

function markdown(testo, contesto) {
  let md = testo.replace(/\{\{\s*foto\s+([^}]*)\}\}/g, (_, a) => {
    const f = attributi(a);
    registraFoto(f, contesto);
    const classe = f.formato ? `foto foto-${T.esc(f.formato)}` : "foto";
    return `<figure class="${classe}" data-rivela><img src="${T.esc(f.src)}" alt="${T.esc(f.alt)}" loading="lazy"><figcaption>${T.esc(f.didascalia || "")} <span class="credito">${T.credito(f)}</span></figcaption></figure>`;
  });
  // Due foto «affiancata» di seguito diventano una coppia sulla stessa riga
  md = md.replace(/(<figure class="foto foto-affiancata"[\s\S]*?<\/figure>)\s*(<figure class="foto foto-affiancata"[\s\S]*?<\/figure>)/g, '<div class="foto-coppia">$1$2</div>');
  md = md.replace(/\{\{\s*video\s+([^}]*)\}\}/g, (_, a) => {
    const v = attributi(a);
    if (!v.youtube || !v.canale || !v.titolare) throw new Error(`Video incompleto in ${contesto}. Servono youtube, canale e titolare.`);
    return `<figure class="video" data-youtube="${T.esc(v.youtube)}">
      <button type="button" class="video-avvia">Carica il video da YouTube<span>${T.esc(v.titolo || "")}</span></button>
      <figcaption>Video pubblicato da ${T.esc(v.canale)}. I diritti appartengono a ${T.esc(v.titolare)}. Il video si carica solo se lo avvii, e da quel momento YouTube può usare i suoi cookie.</figcaption>
    </figure>`;
  });
  md = md.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (tutto, chiave) => {
    const v = valoreConfig(chiave);
    return v === undefined ? tutto : String(v);
  });
  return marked.parse(md);
}

const briciole = (...voci) => [{ titolo: "Home", url: "/" }, ...voci];
const lista = (xs) =>
  `<ul class="lista-semplice">${xs.map((x) => `<li><a href="/programmi/${x.slug}/">${T.esc(x.titolo)}</a> <span>${T.esc(x.anni)}</span></li>`).join("")}</ul>`;

/* ---------- Dati ---------- */

const pagine = leggiCartella("pagine");
const programmi = leggiCartella("programmi")
  .sort((a, b) => a.inizio - b.inizio)
  .map((p, i) => ({ ...p, tono: i % 8 }));
const racconti = leggiCartella("racconti").sort((a, b) => String(b.data).localeCompare(String(a.data)));
const eventi = leggiJson("cronologia.json").sort((a, b) => a.anno - b.anno || (a.mese || 0) - (b.mese || 0) || (a.giorno || 0) - (b.giorno || 0));
const libri = leggiJson("libri.json");
const bibliografia = leggiJson("bibliografia.json");
const domande = leggiJson("quiz.json");
const trovaPagina = (percorso) => pagine.find((p) => p.percorso === percorso);
const anniversari = eventi.filter((e) => e.giorno && e.mese).map((e) => ({ g: e.giorno, m: e.mese, a: e.anno, t: e.testo, c: e.chi, l: e.link || "" }));

/* ---------- Pulizia e risorse ---------- */

fs.rmSync(DIST, { recursive: true, force: true });
fs.mkdirSync(DIST, { recursive: true });
copiaCartella(path.join(SRC, "risorse"), path.join(DIST, "assets"));
const FONT = {
  "fraunces-full-normal.woff2": "@fontsource-variable/fraunces/files/fraunces-latin-full-normal.woff2",
  "fraunces-full-italic.woff2": "@fontsource-variable/fraunces/files/fraunces-latin-full-italic.woff2",
  "source-serif-4-wght-normal.woff2": "@fontsource-variable/source-serif-4/files/source-serif-4-latin-wght-normal.woff2",
  "source-serif-4-wght-italic.woff2": "@fontsource-variable/source-serif-4/files/source-serif-4-latin-wght-italic.woff2",
  "inter-wght-normal.woff2": "@fontsource-variable/inter/files/inter-latin-wght-normal.woff2",
};
fs.mkdirSync(path.join(DIST, "assets/fonts"), { recursive: true });
for (const [nome, sorgente] of Object.entries(FONT)) fs.copyFileSync(path.join(RADICE, "node_modules", sorgente), path.join(DIST, "assets/fonts", nome));

/* ---------- Pagine di testo ---------- */

function extra(p) {
  if (p.extra === "sostieni") {
    const don = config.donazioni.url
      ? `<p><a class="bottone" href="${T.esc(config.donazioni.url)}" rel="noopener" target="_blank">Fai una donazione</a></p>`
      : `<p class="nota-tenue">Il modulo per le donazioni sarà attivo a breve.</p>`;
    const nl = config.newsletter.url
      ? `<p><a class="bottone bottone-chiaro" href="${T.esc(config.newsletter.url)}" rel="noopener" target="_blank">Iscriviti alla newsletter</a></p>`
      : `<p class="nota-tenue">La newsletter partirà a breve. Nel frattempo puoi scriverci a <a href="mailto:${T.esc(config.email)}">${T.esc(config.email)}</a> per essere avvisato.</p>`;
    return `<section class="riquadro"><h2>Donazioni</h2>${don}</section><section class="riquadro"><h2>Newsletter</h2>${nl}</section>`;
  }
  if (p.extra === "segnalazioni") {
    const oggetto = encodeURIComponent("Segnalazione dal sito");
    const testo = encodeURIComponent("Nome:\nPagina interessata:\nMotivo (errore, diritti su foto o video, richiesta di un familiare, ricordo da pubblicare, altro):\nMessaggio:\n\nPer i ricordi: preferisco che venga pubblicato con il mio nome / in forma anonima\n");
    return `<p class="lista-bottoni"><a class="bottone" href="mailto:${T.esc(config.email)}?subject=${oggetto}&amp;body=${testo}">Scrivi la tua segnalazione</a></p>`;
  }
  if (p.extra === "crediti") {
    if (!crediti.length) return `<p class="riquadro">Al momento il sito non pubblica fotografie di persone. Quando ne aggiungeremo, qui troverai per ognuna autore, fonte e licenza.</p>`;
    const dove = new Map([
      ...pagine.map((x) => [x.file, { titolo: x.titolo, url: x.percorso }]),
      ...programmi.map((x) => [x.file, { titolo: x.titolo, url: `/programmi/${x.slug}/` }]),
      ...racconti.map((x) => [x.file, { titolo: x.titolo, url: `/racconti/${x.slug}/` }]),
    ]);
    const righe = crediti
      .map((c) => {
        const pg = dove.get(c.pagina);
        const pagina = pg ? `<a href="${pg.url}">${T.esc(pg.titolo)}</a>` : T.esc(c.pagina);
        const fonte = c.url ? `<a href="${T.esc(c.url)}" rel="noopener">${T.esc(c.fonte)}</a>` : T.esc(c.fonte);
        return `<tr><td>${T.esc(c.alt)}</td><td>${pagina}</td><td>${T.esc(c.autore)}</td><td>${fonte}</td><td>${T.esc(c.licenza)}</td></tr>`;
      })
      .join("");
    return `<div class="tabella-scorri"><table><thead><tr><th>Immagine</th><th>Pagina</th><th>Autore</th><th>Fonte</th><th>Licenza</th></tr></thead><tbody>${righe}</tbody></table></div>`;
  }
  return "";
}

function renderPagina(p) {
  const corpo = markdown(p.corpo, p.file);
  const voci = briciole({ titolo: p.titolo, url: p.percorso });
  const jsonld = [T.jsonBriciole(voci)];
  let contenuto;

  if (p.layout === "biografia") {
    jsonld.push({
      "@type": "ProfilePage",
      name: p.titolo,
      url: config.url + p.percorso,
      mainEntity: {
        "@type": "Person",
        name: p.persona.nome,
        birthDate: p.persona.nascita,
        birthPlace: p.persona.luogoNascita,
        deathDate: p.persona.morte,
        deathPlace: p.persona.luogoMorte,
        sameAs: p.persona.sameAs || [],
        spouse: p.persona.coniuge ? { "@type": "Person", name: p.persona.coniuge } : undefined,
      },
    });
    if (p.foto && p.foto.src) registraFoto(p.foto, p.file);
    const suoi = eventi.filter((e) => e.chi === p.chi || e.chi === "SR");
    const suoiProgrammi = programmi.filter((x) => x.chi === p.chi || x.chi === "SR");
    contenuto = `
    ${T.testaPagina({ voci, occhiello: p.date, titolo: p.titolo, sommario: p.sommario, img: SCENA.sipario, lato: T.ritratto(p) })}
    <div class="contenitore">
      <article class="foglio">
        <div class="foglio-griglia">
          <div class="prosa atti con-capolettera">
            ${corpo}
            ${T.pubblicita(p)}
          </div>
          <aside class="lato">
            ${T.biglietto(p.inBreve || [], { titolo: "In breve", etichetta: p.persona.nome })}
            <section class="lato-blocco"><h2>I suoi programmi</h2>${lista(suoiProgrammi)}</section>
          </aside>
        </div>
        <section class="gruppo" style="margin-top:3.5rem">
          <h2 class="titolo-sezione">La cronologia di ${T.esc(p.persona.nome.split(" ")[0])}</h2>
          ${T.cronologia(suoi, { conFiltri: false, livello: "h3" })}
          <p><a class="bottone" href="/cronologia/">Tutta la cronologia</a></p>
        </section>
        ${T.fonti(p.fonti)}
      </article>
    </div>`;
  } else {
    const classi = ["prosa"];
    if (p.capolettera) classi.push("con-capolettera");
    if (p.atti) classi.push("atti");
    contenuto = `
    ${T.testaPagina({ voci, occhiello: p.occhiello, titolo: p.titolo, sommario: p.sommario, img: p.immagine ? SCENA[p.immagine] : SCENA.studio })}
    <div class="contenitore">
      <article class="foglio ${p.layout === "legale" ? "legale" : ""}">
        <div class="${classi.join(" ")}">
          ${corpo}
          ${extra(p)}
          ${T.pubblicita(p)}
          ${T.fonti(p.fonti)}
        </div>
      </article>
    </div>`;
  }
  scrivi(p.percorso, T.pagina({ titolo: p.titolo, descrizione: p.descrizione, percorso: p.percorso, contenuto, jsonld, tipoOg: p.layout === "biografia" ? "profile" : "website", lettura: true }));
}

/* ---------- Programmi ---------- */

function renderProgrammi() {
  programmi.forEach((p, i) => {
    const percorso = `/programmi/${p.slug}/`;
    const voci = briciole({ titolo: "Programmi", url: "/programmi/" }, { titolo: p.titolo, url: percorso });
    const opera = {
      "@type": p.tipoSchema || "TVSeries",
      name: p.titolo,
      genre: p.genere,
      startDate: String(Math.floor(p.inizio)),
      endDate: p.fine ? String(p.fine) : undefined,
      actor: (p.attoriSchema || []).map((n) => ({ "@type": "Person", name: n })),
    };
    const altri = programmi.filter((x) => x.slug !== p.slug && (x.chi === p.chi || x.chi === "SR" || p.chi === "SR")).slice(0, 5);
    const prec = programmi[i - 1];
    const succ = programmi[i + 1];
    const naviga = `<nav class="naviga-schede" aria-label="Altre schede">
      ${prec ? `<a class="tono-${prec.tono}" href="/programmi/${prec.slug}/"><small>‹ Programma precedente</small><strong>${T.esc(prec.titolo)}</strong></a>` : "<span></span>"}
      ${succ ? `<a class="tono-${succ.tono}" href="/programmi/${succ.slug}/"><small>Programma successivo ›</small><strong>${T.esc(succ.titolo)}</strong></a>` : ""}
    </nav>`;
    const contenuto = `
    ${T.testaPagina({ voci, occhielloHtml: `<p class="occhiello"><span class="rete">${T.esc(p.rete)}</span> ${T.esc(p.anni)}</p>`, titolo: p.titolo, sommario: p.descrizione, tono: p.tono })}
    <div class="contenitore">
      <article class="foglio">
        <div class="foglio-griglia">
          <div class="prosa">
            ${markdown(p.corpo, p.file)}
            ${T.doveVederlo(p.dove)}
            ${T.pubblicita({ pubblicita: true })}
            ${T.fonti(p.fonti)}
          </div>
          <aside class="lato">
            ${T.biglietto(
              [
                ["Anni", p.anni],
                ["Rete", p.rete],
                ["Genere", p.genere],
                ["Con", T.nomeChi(p.chi)],
                ["Ruolo", p.ruolo],
                ["Autori", p.autori],
                ["Regia", p.regia],
                ["Nel cast", p.cast],
                ["Puntate", p.puntate],
              ],
              { titolo: p.titolo, etichetta: "Scheda" }
            )}
            ${altri.length ? `<section class="lato-blocco"><h2>Guarda anche</h2>${lista(altri)}</section>` : ""}
          </aside>
        </div>
        ${naviga}
      </article>
    </div>`;
    scrivi(percorso, T.pagina({ titolo: p.titolo, descrizione: p.descrizione, percorso, contenuto, jsonld: [T.jsonBriciole(voci), opera], lettura: true }));
  });

  const intro = trovaPagina("/programmi/");
  const gruppi = [
    { titolo: "Gli anni della Rai", filtro: (p) => p.epoca === "rai" },
    { titolo: "Dal 1982, gli anni di Canale 5", filtro: (p) => p.epoca === "canale5" },
  ];
  const sezioni = gruppi
    .map((g) => {
      const xs = programmi.filter(g.filtro);
      return xs.length ? `<section class="gruppo"><h2 class="titolo-sezione">${g.titolo}</h2><div class="locandine">${xs.map(T.locandina).join("")}</div></section>` : "";
    })
    .join("");
  const voci = briciole({ titolo: "Programmi", url: "/programmi/" });
  const contenuto = `
  ${T.testaPagina({ voci, occhiello: "Il palinsesto", titolo: intro?.titolo || "I programmi", sommario: intro?.sommario, img: SCENA.studio })}
  <div class="contenitore">
    <div class="foglio">
      ${intro ? `<div class="prosa">${markdown(intro.corpo, intro.file)}</div>` : ""}
      ${T.filtri("Filtra i programmi")}
      ${sezioni}
    </div>
  </div>`;
  scrivi("/programmi/", T.pagina({ titolo: intro?.titolo || "I programmi", descrizione: intro?.descrizione, percorso: "/programmi/", contenuto, jsonld: [T.jsonBriciole(voci)] }));
}

/* ---------- Racconti ---------- */

function renderRacconti() {
  for (const r of racconti) {
    const percorso = `/racconti/${r.slug}/`;
    const voci = briciole({ titolo: "Racconti", url: "/racconti/" }, { titolo: r.titolo, url: percorso });
    const articolo = {
      "@type": "Article",
      headline: r.titolo,
      description: r.descrizione,
      datePublished: String(r.data),
      inLanguage: "it",
      image: r.immagine ? config.url + r.immagine : undefined,
      author: { "@type": "Person", name: config.editore.nome },
      publisher: { "@type": "Organization", name: config.nome, url: config.url },
      mainEntityOfPage: config.url + percorso,
    };
    const data = new Date(r.data).toLocaleDateString("it-IT", { day: "numeric", month: "long", year: "numeric" });
    const altri = racconti.filter((x) => x.slug !== r.slug);
    const contenuto = `
    ${T.testaPagina({ voci, occhielloHtml: `<p class="occhiello">${T.esc(r.rubrica || "Racconti")} · <time datetime="${T.esc(r.data)}">${data}</time></p>`, titolo: r.titolo, sommario: r.descrizione, img: r.immagine })}
    <div class="contenitore">
      <article class="foglio">
        <div class="prosa con-capolettera" style="margin-inline:auto">
          ${markdown(r.corpo, r.file)}
          ${T.pubblicita({ pubblicita: true })}
          ${T.fonti(r.fonti)}
        </div>
        ${altri.length ? `<section class="gruppo" style="margin-top:3rem"><h2 class="titolo-sezione">Leggi anche</h2><div class="storie">${altri.slice(0, 2).map(T.storia).join("")}</div></section>` : ""}
      </article>
    </div>`;
    scrivi(percorso, T.pagina({ titolo: r.titolo, descrizione: r.descrizione, percorso, contenuto, jsonld: [T.jsonBriciole(voci), articolo], tipoOg: "article", lettura: true, immagineOg: r.immagine }));
  }
  const intro = trovaPagina("/racconti/");
  const voci = briciole({ titolo: "Racconti", url: "/racconti/" });
  const contenuto = `
  ${T.testaPagina({ voci, occhiello: "Dietro le quinte", titolo: intro?.titolo || "Racconti", img: SCENA.camera })}
  <div class="contenitore">
    <div class="foglio">
      ${intro ? `<div class="prosa">${markdown(intro.corpo, intro.file)}</div>` : ""}
      <div class="storie">${racconti.map(T.storia).join("")}</div>
    </div>
  </div>`;
  scrivi("/racconti/", T.pagina({ titolo: intro?.titolo || "Racconti", descrizione: intro?.descrizione, percorso: "/racconti/", contenuto, jsonld: [T.jsonBriciole(voci)] }));
}

/* ---------- Cronologia, libri, fonti, quiz ---------- */

function renderCronologia() {
  const intro = trovaPagina("/cronologia/");
  const voci = briciole({ titolo: "Cronologia", url: "/cronologia/" });
  const contenuto = `
  ${T.testaPagina({ voci, occhiello: "Date e tappe", titolo: intro?.titolo || "Cronologia", img: SCENA.sipario })}
  <div class="contenitore">
    <div class="foglio">
      ${intro ? `<div class="prosa">${markdown(intro.corpo, intro.file)}</div>` : ""}
      ${T.cronologia(eventi)}
      ${T.fonti(intro?.fonti)}
    </div>
  </div>`;
  scrivi("/cronologia/", T.pagina({ titolo: intro?.titolo || "Cronologia", descrizione: intro?.descrizione, percorso: "/cronologia/", contenuto, jsonld: [T.jsonBriciole(voci)] }));
}

function linkAcquisto(l) {
  if (!l.url) return "";
  let url = l.url;
  const affiliato = config.amazon.tag && /amazon\.it/.test(url);
  if (affiliato) url += (url.includes("?") ? "&" : "?") + "tag=" + encodeURIComponent(config.amazon.tag);
  return `<a class="bottone" href="${T.esc(url)}" rel="noopener${affiliato ? " sponsored nofollow" : ""}" target="_blank">${T.esc(l.etichetta || "Scheda del libro")}</a>`;
}

function renderLibri() {
  const intro = trovaPagina("/libri-e-dvd/");
  const voci = briciole({ titolo: "Libri e DVD", url: "/libri-e-dvd/" });
  const card = (l, i) => `<article class="libro tono-${(i * 3) % 8}" data-rivela>
      <p class="rubrica">${l.tipo === "dvd" ? "DVD" : "Libro"}${l.anno ? " · " + T.esc(l.anno) : ""}</p>
      <h3>${T.esc(l.titolo)}</h3>
      <p class="libro-autore">${T.esc([l.autore, l.editore].filter(Boolean).join(", "))}</p>
      ${l.isbn ? `<p class="libro-isbn">ISBN ${T.esc(l.isbn)}</p>` : ""}
      <p>${T.esc(l.nota || "")}</p>
      ${linkAcquisto(l)}
    </article>`;
  const avvisoAff = config.amazon.tag
    ? `<aside class="avviso"><p>Alcuni link di questa pagina sono di affiliazione. Se acquisti attraverso questi link il sito riceve una piccola commissione, senza costi in più per te. Scegliamo i titoli per il loro valore e nessun editore paga per comparire qui.</p><p>In qualità di Affiliato Amazon, ${T.esc(config.nome)} riceve un guadagno dagli acquisti idonei.</p></aside>`
    : "";
  const contenuto = `
  ${T.testaPagina({ voci, occhiello: "Da leggere e da rivedere", titolo: intro?.titolo || "Libri e DVD", img: SCENA.salotto })}
  <div class="contenitore">
    <div class="foglio">
      ${intro ? `<div class="prosa">${markdown(intro.corpo, intro.file)}</div>` : ""}
      ${avvisoAff}
      <section class="gruppo"><h2 class="titolo-sezione">Libri</h2><div class="libri">${libri.filter((l) => l.tipo !== "dvd").map(card).join("")}</div></section>
      <section class="gruppo"><h2 class="titolo-sezione">DVD</h2><div class="libri">${libri.filter((l) => l.tipo === "dvd").map((l, i) => card(l, i + 5)).join("")}</div></section>
    </div>
  </div>`;
  scrivi("/libri-e-dvd/", T.pagina({ titolo: intro?.titolo || "Libri e DVD", descrizione: intro?.descrizione, percorso: "/libri-e-dvd/", contenuto, jsonld: [T.jsonBriciole(voci)] }));
}

function renderFonti() {
  const intro = trovaPagina("/fonti/");
  const voci = briciole({ titolo: "Fonti", url: "/fonti/" });
  const tutte = new Map();
  for (const x of [...pagine, ...programmi, ...racconti]) for (const f of x.fonti || []) if (f.url && !tutte.has(f.url)) tutte.set(f.url, f);
  const web = [...tutte.values()].sort((a, b) => a.titolo.localeCompare(b.titolo, "it"));
  const contenuto = `
  ${T.testaPagina({ voci, occhiello: "Da dove vengono le informazioni", titolo: intro?.titolo || "Fonti", img: SCENA.studio })}
  <div class="contenitore">
    <div class="foglio">
      <div class="prosa">
        ${intro ? markdown(intro.corpo, intro.file) : ""}
        <h2>Bibliografia</h2>
        <ul>${bibliografia.map((b) => `<li>${T.esc(b)}</li>`).join("")}</ul>
        <h2>Fonti in rete</h2>
        <ul class="fonti-web">${web.map((f) => `<li><a href="${T.esc(f.url)}" rel="noopener" target="_blank">${T.esc(f.titolo)}</a></li>`).join("")}</ul>
      </div>
    </div>
  </div>`;
  scrivi("/fonti/", T.pagina({ titolo: intro?.titolo || "Fonti", descrizione: intro?.descrizione, percorso: "/fonti/", contenuto, jsonld: [T.jsonBriciole(voci)] }));
}

function renderQuiz() {
  const intro = trovaPagina("/quiz/");
  const voci = briciole({ titolo: "Quiz", url: "/quiz/" });
  const contenuto = `
  ${T.testaPagina({ voci, occhiello: "Il gioco a premi, senza premi", titolo: intro?.titolo || "Il quiz", sommario: intro?.sommario, img: SCENA.studio })}
  <div class="contenitore">
    <div class="foglio">
      ${intro ? `<div class="prosa" style="margin:0 auto 2rem">${markdown(intro.corpo, intro.file)}</div>` : ""}
      ${T.quiz(domande, { id: "quiz-pagina" })}
    </div>
  </div>`;
  const ld = {
    "@type": "Quiz",
    name: intro?.titolo || "Il quiz su Sandra e Raimondo",
    about: [{ "@type": "Person", name: "Sandra Mondaini" }, { "@type": "Person", name: "Raimondo Vianello" }],
    inLanguage: "it",
  };
  scrivi("/quiz/", T.pagina({ titolo: intro?.titolo || "Il quiz", descrizione: intro?.descrizione, percorso: "/quiz/", contenuto, jsonld: [T.jsonBriciole(voci), ld] }));
}

/* ---------- Home ---------- */

function renderHome() {
  const h = trovaPagina("/");
  const inPalinsesto = (h.palinsesto || []).map((s) => programmi.find((p) => p.slug === s)).filter(Boolean);
  const duo = (k, classe, url) => {
    const d = h.duo[k];
    const bio = trovaPagina(url);
    return `<a class="duo-card ${classe}" href="${url}" data-rivela>
      ${T.ritratto({ iniziale: k, foto: bio && bio.foto }, { compatta: true })}
      <div>
        <p class="duo-ruolo">${T.esc(d.ruolo)}</p>
        <h3>${T.esc(d.nome)}</h3>
        <p class="duo-date">${T.esc(d.date)}</p>
        <ul class="duo-tratti">${d.tratti.map((t) => `<li>${T.esc(t)}</li>`).join("")}</ul>
        <span class="duo-vai">Leggi la biografia ›</span>
      </div>
    </a>`;
  };
  const contenuto = `
  <section class="palco" aria-labelledby="titolo-palco">
    <div class="palco-sfondo" aria-hidden="true"></div>
    <div class="mantovana" aria-hidden="true"></div>
    <div class="tenda tenda-sx" aria-hidden="true"></div>
    <div class="tenda tenda-dx" aria-hidden="true"></div>
    <div class="palco-contenuto contenitore">
      <p class="in-onda"><span class="spia" aria-hidden="true"></span>In onda</p>
      <div><div class="insegna luci"><h1 id="titolo-palco">Sandra <em>e</em> Raimondo</h1></div></div>
      <div class="palco-sotto">${markdown(h.corpo, h.file)}</div>
      <p class="lista-bottoni" style="justify-content:center">
        <a class="bottone bottone-oro" href="#il-duo">Entra in scena</a>
        <a class="bottone bottone-vetro" href="#quiz-home">Gioca al quiz</a>
      </p>
    </div>
    <a class="scorri" href="#il-duo" aria-label="Scorri verso il basso">↓</a>
  </section>

  ${T.nastro(programmi)}

  <section class="duo contenitore" id="il-duo" aria-labelledby="duo-titolo">
    <div class="centrato" data-rivela>
      <p class="occhiello">I protagonisti</p>
      <h2 id="duo-titolo" class="titolo-sezione">${T.esc(h.duoTitolo)}</h2>
    </div>
    <div class="duo-griglia">
      ${duo("R", "duo-raimondo", "/raimondo-vianello/")}
      <span class="duo-e" aria-hidden="true">&amp;</span>
      ${duo("S", "duo-sandra", "/sandra-mondaini/")}
    </div>
  </section>

  <section class="scuro grana sezione-tv" aria-labelledby="tv-titolo">
    <div class="contenitore tv-griglia">
      <div class="tv-testo" data-rivela>
        <p class="occhiello">Gira la manopola</p>
        <h2 id="tv-titolo" class="titolo-sezione">Accadde oggi</h2>
        <p>Ogni giorno questo televisore si sintonizza su un anniversario della loro carriera. Usa le manopole per cambiare canale e viaggiare tra debutti, prime puntate e ricorrenze.</p>
        <p><a class="bottone bottone-oro" href="/cronologia/">Tutta la cronologia</a></p>
      </div>
      ${T.tv(anniversari)}
    </div>
  </section>

  <section class="contenitore palinsesto" aria-labelledby="palinsesto-titolo">
    <div class="sezione-testa" data-rivela>
      <div>
        <p class="occhiello">Il palinsesto</p>
        <h2 id="palinsesto-titolo" class="titolo-sezione">Stasera in onda</h2>
        <p>Dal bianco e nero della Rai alle sitcom di Canale 5, i programmi che hanno fatto la loro storia.</p>
      </div>
      <a href="/programmi/">Tutte le ${programmi.length} schede ›</a>
    </div>
    <div class="locandine scorrevoli">${inPalinsesto.map(T.locandina).join("")}</div>
  </section>

  <section class="fascia-immagine" style="--img:url('${SCENA.salotto}')" aria-labelledby="casa-titolo">
    <div class="contenitore">
      <div class="fascia-testo" data-rivela>
        <p class="occhiello">1988-2007 · 16 stagioni</p>
        <h2 id="casa-titolo">${T.esc(h.casa.titolo)}</h2>
        <p class="citazione-grande">«Che barba, che noia»</p>
        <p>${T.esc(h.casa.testo)}</p>
        <p class="lista-bottoni"><a class="bottone bottone-oro" href="/programmi/casa-vianello/">La scheda di Casa Vianello</a><a class="bottone bottone-vetro" href="/racconti/che-barba-che-noia/">La storia del finale</a></p>
      </div>
    </div>
  </section>

  <section class="numeri-fascia" aria-label="La loro storia in numeri">
    <div class="contenitore">
      <ol class="numeri">${(h.numeri || []).map((n) => `<li data-rivela><span class="numero" data-conta="${T.esc(n.valore)}">${T.esc(n.valore)}</span><span>${T.esc(n.testo)}</span></li>`).join("")}</ol>
    </div>
  </section>

  <section class="contenitore sezione-quiz" aria-label="Quiz">
    ${T.quiz(domande, { id: "quiz-home" })}
  </section>

  ${racconti.length ? `<section class="contenitore" aria-labelledby="racconti-titolo">
    <div class="sezione-testa" data-rivela>
      <div><p class="occhiello">Dietro le quinte</p><h2 id="racconti-titolo" class="titolo-sezione">Racconti</h2></div>
      <a href="/racconti/">Tutti gli articoli ›</a>
    </div>
    <div class="storie">${racconti.slice(0, 3).map(T.storia).join("")}</div>
  </section>` : ""}

  <section class="contenitore home-fondo">
    <aside class="riquadro ricordo" data-rivela>
      <p class="occhiello" style="color:#7a1222">Testimonianze</p>
      <h2>Hai un ricordo di Sandra e Raimondo?</h2>
      <p>Un autografo all'uscita di un teatro, una puntata vista in famiglia, una foto scattata da te. Raccontacelo e, se vuoi, lo pubblichiamo.</p>
      <p><a class="bottone" href="/segnalazioni/">Mandaci il tuo ricordo</a></p>
    </aside>
    <div data-rivela>${T.avvisoNonUfficiale()}</div>
  </section>`;
  const jsonld = [{ "@type": "WebSite", name: config.nome, url: config.url, inLanguage: "it", description: config.descrizione }];
  scrivi("/", T.pagina({ titoloCompleto: `${config.nome}. ${config.sottotitolo} su Sandra Mondaini e Raimondo Vianello`, descrizione: h.descrizione || config.descrizione, percorso: "/", contenuto, jsonld, classe: "home" }));
}

/* ---------- 404, sitemap, robots ---------- */

function renderServizio() {
  const contenuto = `
  <section class="palco errore-palco">
    <div class="palco-sfondo" aria-hidden="true"></div>
    <div class="mantovana" aria-hidden="true"></div>
    <div class="palco-contenuto contenitore">
      <p class="in-onda"><span class="spia" aria-hidden="true"></span>Errore 404</p>
      <div><div class="insegna luci"><h1>Fuori onda</h1></div></div>
      <p class="palco-sotto">Questa pagina non esiste o è stata spostata. Torna in studio e scegli un altro canale.</p>
      <p class="lista-bottoni" style="justify-content:center"><a class="bottone bottone-oro" href="/">Torna alla home</a> <a class="bottone bottone-vetro" href="/programmi/">I programmi</a></p>
    </div>
  </section>`;
  scrivi("404.html", T.pagina({ titolo: "Pagina non trovata", percorso: "/404.html", contenuto, indicizza: false }), { sitemap: false });

  const oggi = new Date().toISOString().slice(0, 10);
  const urls = pagineSitemap.map((p) => `  <url><loc>${config.url}${p}</loc><lastmod>${oggi}</lastmod></url>`).join("\n");
  fs.writeFileSync(path.join(DIST, "sitemap.xml"), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`);
  fs.writeFileSync(path.join(DIST, "robots.txt"), `User-agent: *\nAllow: /\n\nSitemap: ${config.url}/sitemap.xml\n`);
  fs.writeFileSync(path.join(DIST, "CNAME"), new URL(config.url).hostname + "\n");
  fs.writeFileSync(path.join(DIST, ".nojekyll"), "");
}

/* ---------- Esecuzione ---------- */

const SPECIALI = ["/", "/programmi/", "/racconti/", "/cronologia/", "/libri-e-dvd/", "/fonti/", "/quiz/", "/crediti-fotografici/"];
for (const p of pagine) if (!SPECIALI.includes(p.percorso)) renderPagina(p);
renderProgrammi();
renderRacconti();
renderCronologia();
renderLibri();
renderFonti();
renderQuiz();
renderHome();
const pCrediti = trovaPagina("/crediti-fotografici/"); // per ultima: raccoglie le foto di tutte le pagine
if (pCrediti) renderPagina(pCrediti);
renderServizio();

const daCompletare = [];
for (const [k, v] of Object.entries({ "editore.nome": config.editore.nome, "editore.indirizzo": config.editore.indirizzo, "editore.bio": config.editore.bio })) {
  if (/\[.*\]/.test(v)) daCompletare.push(`src/config.js → ${k}`);
}
for (const x of [...pagine, ...programmi, ...racconti]) if (/\[[^\]]+\](?!\()/.test(x.corpo)) daCompletare.push(`src/contenuti/${x.file}`);

console.log(`Sito generato in dist/ con ${pagineSitemap.length} pagine.`);
if (daCompletare.length) {
  console.log("\nSegnaposto da completare prima della pubblicazione:");
  for (const d of [...new Set(daCompletare)]) console.log("  - " + d);
}
