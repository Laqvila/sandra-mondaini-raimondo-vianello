// Modelli HTML del sito, tema «Prima serata». Tutto viene generato in fase di build come HTML statico.
import config from "./config.js";

export const esc = (s = "") =>
  String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const assoluto = (percorso) => config.url + percorso;
const ANNO = new Date().getFullYear();
const CHI = { R: "Raimondo", S: "Sandra", SR: "Sandra e Raimondo" };
export const nomeChi = (c) => CHI[c] || "";

/* ---------- Testata e piede ---------- */

export function testata(percorso) {
  const voci = config.nav
    .map((v) => {
      const attivo = v.url !== "/" && percorso.startsWith(v.url);
      return `<li${v.classe ? ` class="${v.classe}"` : ""}><a href="${v.url}"${attivo ? ' aria-current="page"' : ""}>${esc(v.titolo)}</a></li>`;
    })
    .join("");
  return `<header class="testata">
    <div class="testata-interna">
      <a class="marchio" href="/" aria-label="${esc(config.nome)}, torna alla home">
        <span class="marchio-nome">Sandra <em>e</em> Raimondo</span>
        <span class="marchio-sotto">${esc(config.sottotitolo)} · sito non ufficiale</span>
      </a>
      <nav class="menu" aria-label="Sezioni del sito">
        <button class="menu-bottone" type="button" aria-expanded="false" aria-controls="menu-voci"><span class="menu-icona" aria-hidden="true"></span>Menu</button>
        <ul id="menu-voci">${voci}</ul>
      </nav>
    </div>
  </header>`;
}

export function piede() {
  const link = config.footer.map((v) => `<li><a href="${v.url}">${esc(v.titolo)}</a></li>`).join("");
  return `<footer class="piede">
    <div class="contenitore piede-griglia">
      <div>
        <p class="piede-marchio">Sandra <em>e</em> Raimondo</p>
        <p class="piede-avviso">${esc(config.nome)} è un sito non ufficiale curato da appassionati. Non ha legami con gli eredi o i familiari di Sandra Mondaini e Raimondo Vianello, con Mediaset o con la RAI. I titoli dei programmi e le immagini appartengono ai rispettivi titolari.</p>
      </div>
      <ul class="piede-link">${link}</ul>
    </div>
    <div class="contenitore piede-fondo">
      <p>© ${ANNO} ${esc(config.nome)} · Testi originali protetti dal diritto d'autore</p>
      <p><a href="mailto:${esc(config.email)}">${esc(config.email)}</a> · <a href="#contenuto">Torna su</a></p>
    </div>
  </footer>`;
}

/* ---------- Pezzi comuni ---------- */

export function briciole(voci) {
  if (!voci || !voci.length) return "";
  const li = voci
    .map((v, i) => (i === voci.length - 1 ? `<li aria-current="page">${esc(v.titolo)}</li>` : `<li><a href="${v.url}">${esc(v.titolo)}</a></li>`))
    .join("");
  return `<nav class="briciole" aria-label="Percorso"><ol>${li}</ol></nav>`;
}

export function jsonBriciole(voci) {
  return {
    "@type": "BreadcrumbList",
    itemListElement: voci.map((v, i) => ({ "@type": "ListItem", position: i + 1, name: v.titolo, item: assoluto(v.url) })),
  };
}

export function fonti(lista) {
  if (!lista || !lista.length) return "";
  const li = lista
    .map((f) => (f.url ? `<li><a href="${esc(f.url)}" rel="noopener" target="_blank">${esc(f.titolo)}</a></li>` : `<li>${esc(f.titolo)}</li>`))
    .join("");
  return `<section class="fonti" aria-labelledby="fonti-titolo">
    <h2 id="fonti-titolo">Fonti</h2>
    <ol>${li}</ol>
    <p class="fonti-nota">Hai trovato un errore? <a href="/segnalazioni/">Segnalacelo</a> e lo correggiamo.</p>
  </section>`;
}

// Spazio pubblicitario: compare solo se attivato in config.js e mai accanto alle fotografie.
export function pubblicita(p) {
  if (!config.pubblicita.attiva || !config.pubblicita.adsenseClient || !p.pubblicita) return "";
  return `<aside class="pubblicita" aria-label="Pubblicità">
    <span class="pubblicita-etichetta">Pubblicità</span>
    <ins class="adsbygoogle" style="display:block" data-ad-client="${esc(config.pubblicita.adsenseClient)}" data-ad-format="auto" data-full-width-responsive="true"></ins>
    <script>(adsbygoogle = window.adsbygoogle || []).push({});</script>
  </aside>`;
}

export function avvisoNonUfficiale() {
  return `<aside class="avviso" aria-label="Avviso">
    <p><strong>Sito non ufficiale.</strong> Questo archivio è un progetto indipendente scritto da appassionati a partire da fonti pubbliche, che citiamo in ogni pagina. Non parliamo a nome di Sandra e Raimondo né della loro famiglia.</p>
  </aside>`;
}

/* ---------- Ritratto ovale con lampadine ---------- */

// Riga dei crediti di una foto: autore · fonte · licenza. Senza link quando sta dentro un altro link.
export function credito(f, { link = true } = {}) {
  const fonte = link && f.url ? `<a href="${esc(f.url)}" rel="noopener">${esc(f.fonte)}</a>` : esc(f.fonte);
  return `${esc(f.autore)} · ${fonte} · ${esc(f.licenza)}`;
}

export function ritratto(p, { compatta = false } = {}) {
  const n = 26;
  const lampadine = Array.from({ length: n }, (_, i) => {
    const a = (i / n) * Math.PI * 2;
    return `<circle class="lampadina" cx="${(100 + 101 * Math.cos(a)).toFixed(1)}" cy="${(125 + 126 * Math.sin(a)).toFixed(1)}" r="4.2"/>`;
  }).join("");
  if (p.foto && p.foto.src) {
    const f = p.foto;
    return `<figure class="cornice-luci ritratto-foto">
      <div class="ritratto-cornice">
        <svg viewBox="0 0 200 250" aria-hidden="true"><ellipse class="c-esterno" cx="100" cy="125" rx="94" ry="119"/><g>${lampadine}</g></svg>
        <span class="ritratto-ovale"><img src="${esc(f.src)}" alt="${esc(f.alt)}" width="480" height="600" loading="${compatta ? "lazy" : "eager"}" decoding="async"></span>
      </div>
      <figcaption>${compatta ? "" : `${esc(f.didascalia || "")} `}<span class="credito">${credito(f, { link: !compatta })}</span></figcaption>
    </figure>`;
  }
  return `<div class="cornice-luci" aria-hidden="true"><svg viewBox="0 0 200 250">
    <ellipse class="c-esterno" cx="100" cy="125" rx="94" ry="119"/>
    <ellipse class="c-fondo" cx="100" cy="125" rx="80" ry="105"/>
    <ellipse class="c-filo" cx="100" cy="125" rx="72" ry="97"/>
    <text class="c-lettera" x="100" y="163" text-anchor="middle">${esc(p.iniziale || "S")}</text>
    <g>${lampadine}</g>
  </svg></div>`;
}

/* ---------- Locandine, storie, biglietti ---------- */

export function locandina(p) {
  const anno = String(p.inizio).slice(0, 4);
  return `<a class="locandina tono-${p.tono}" href="/programmi/${p.slug}/" data-chi="${p.chi}" data-rivela>
    <span class="locandina-testa"><span class="rete">${esc(p.reteBreve || p.rete)}</span><span>${esc(p.anni)}</span></span>
    <span class="locandina-anno" aria-hidden="true">${esc(anno)}</span>
    <span class="locandina-titolo">${esc(p.titolo)}</span>
    <span class="locandina-genere">${esc(p.genere || "")}</span>
    <span class="locandina-chi">${esc(nomeChi(p.chi))}</span>
  </a>`;
}

export function storia(r) {
  const img = r.immagine ? ` style="--img:url('${esc(r.immagine)}')"` : "";
  return `<a class="storia" href="/racconti/${r.slug}/"${img} data-rivela>
    <span class="storia-testo">
      <span class="rubrica">${esc(r.rubrica || "Racconti")}</span>
      <h3>${esc(r.titolo)}</h3>
      <p>${esc(r.descrizione || "")}</p>
    </span>
  </a>`;
}

export function biglietto(righe, { titolo = "Scheda tecnica", etichetta = "Ingresso libero" } = {}) {
  const r = righe
    .filter(([, v]) => v && String(v).trim())
    .map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`)
    .join("");
  if (!r) return "";
  return `<div class="biglietto"><p class="biglietto-testa">${esc(titolo)} <span>${esc(etichetta)}</span></p><dl>${r}</dl></div>`;
}

export function doveVederlo(lista) {
  if (!lista || !lista.length) return "";
  const li = lista.map((d) => `<li><a class="bottone" href="${esc(d.url)}" rel="noopener" target="_blank">${esc(d.nome)}</a></li>`).join("");
  return `<section class="dove">
    <h2>Dove vederlo oggi</h2>
    <p>I link portano alle piattaforme ufficiali dei titolari dei diritti. La disponibilità degli episodi cambia nel tempo e può dipendere da un abbonamento.</p>
    <ul class="lista-bottoni">${li}</ul>
  </section>`;
}

export function filtri(etichetta) {
  return `<div class="filtri" role="group" aria-label="${esc(etichetta)}" hidden>
    <button type="button" data-filtro="tutti" aria-pressed="true">Tutti</button>
    <button type="button" data-filtro="R" aria-pressed="false">Raimondo</button>
    <button type="button" data-filtro="S" aria-pressed="false">Sandra</button>
    <button type="button" data-filtro="SR" aria-pressed="false">Insieme</button>
  </div>`;
}

/* ---------- Cronologia ---------- */

export function cronologia(eventi, { conFiltri = true, livello = "h2" } = {}) {
  const perDecennio = new Map();
  for (const e of eventi) {
    const d = Math.floor(e.anno / 10) * 10;
    if (!perDecennio.has(d)) perDecennio.set(d, []);
    perDecennio.get(d).push(e);
  }
  const blocchi = [...perDecennio.entries()]
    .map(([d, lista]) => {
      const li = lista
        .map((e) => {
          const data = [e.data, e.anno].filter(Boolean).join(" ");
          const testo = e.link ? `${esc(e.testo)} <a href="${e.link}">Approfondisci</a>` : esc(e.testo);
          return `<li class="evento chi-${e.chi}" data-chi="${e.chi}" data-rivela><span class="ev-data">${esc(data)}</span><span class="ev-chi">${esc(nomeChi(e.chi))}</span><p>${testo}</p></li>`;
        })
        .join("");
      return `<section class="decennio"><${livello} class="decennio-titolo">Anni ${d}</${livello}><ol class="eventi">${li}</ol></section>`;
    })
    .join("");
  return `<div class="cronologia">${conFiltri ? filtri("Filtra la cronologia") : ""}${blocchi}</div>`;
}

/* ---------- Testa delle pagine interne ---------- */

export function testaPagina({ voci, occhiello, titolo, sommario, img, tono, lato, occhielloHtml }) {
  const classi = ["testa-pagina", "grana"];
  if (tono !== undefined) classi.push("tono", `tono-${tono}`);
  const stile = img ? ` style="--img:url('${esc(img)}')"` : "";
  const testo = `
      ${occhielloHtml || (occhiello ? `<p class="occhiello">${esc(occhiello)}</p>` : "")}
      <h1>${esc(titolo)}</h1>
      ${sommario ? `<p class="sommario">${esc(sommario)}</p>` : ""}`;
  return `<header class="${classi.join(" ")}"${stile}>
    <div class="contenitore">
      ${briciole(voci)}
      ${lato ? `<div class="testa-griglia"><div>${lato}</div><div>${testo}</div></div>` : testo}
    </div>
  </header>`;
}

/* ---------- La TV d'epoca con gli anniversari ---------- */

export function tv(anniversari) {
  return `<div class="tv" id="tv" data-rivela>
    <div class="tv-antenne" aria-hidden="true"></div>
    <div class="tv-mobile">
      <div class="tv-schermo">
        <div class="tv-contenuto" id="tv-contenuto" aria-live="polite">
          <span class="tv-etichetta">Accadde oggi</span>
          <span class="tv-data">Ogni giorno un anniversario</span>
          <p class="tv-evento">Le date più importanti della loro carriera, una alla volta. <a href="/cronologia/">Sfoglia la cronologia</a>.</p>
        </div>
        <div class="tv-rumore" aria-hidden="true"></div>
      </div>
      <div class="tv-comandi">
        <button class="tv-manopola" type="button" data-dir="-1" aria-label="Anniversario precedente"></button>
        <span class="tv-manopola-etichetta" aria-hidden="true">Indietro</span>
        <button class="tv-manopola" type="button" data-dir="1" aria-label="Anniversario successivo"></button>
        <span class="tv-manopola-etichetta" aria-hidden="true">Avanti</span>
        <span class="tv-cassa" aria-hidden="true"></span>
      </div>
    </div>
    <div class="tv-gambe" aria-hidden="true"><span></span><span></span></div>
    <script type="application/json" id="anniversari">${JSON.stringify(anniversari)}</script>
  </div>`;
}

/* ---------- Quiz ---------- */

export function quiz(domande, { titolo = "Quanto ne sai di Sandra e Raimondo?", id = "quiz" } = {}) {
  const statico = domande
    .map((d) => `<li><p>${esc(d.domanda)}</p><details><summary>Mostra la risposta</summary><p>${esc(d.opzioni[d.giusta])}. ${esc(d.spiegazione)}</p></details></li>`)
    .join("");
  return `<div class="quiz" id="${id}" data-rivela>
    <div class="quiz-gioco">
      <p class="occhiello">Il gioco a premi</p>
      <h2>${esc(titolo)}</h2>
      <div class="quiz-statico"><ol>${statico}</ol></div>
    </div>
    <script type="application/json" class="quiz-dati">${JSON.stringify(domande)}</script>
  </div>`;
}

/* ---------- Nastro con i programmi ---------- */

export function nastro(programmi) {
  const voci = programmi.map((p) => `<a href="/programmi/${p.slug}/"><b>${esc(p.titolo)}</b> ${esc(String(p.inizio).slice(0, 4))}</a>`).join("");
  return `<div class="nastro" aria-label="I programmi in ordine di tempo">
    <div class="nastro-scorre"><div>${voci}</div><div aria-hidden="true">${voci.replace(/<a /g, '<a tabindex="-1" ')}</div></div>
  </div>`;
}

/* ---------- Pagina completa ---------- */

export function pagina({ titolo, titoloCompleto, descrizione = config.descrizione, percorso, contenuto, jsonld = [], tipoOg = "website", classe = "", indicizza = true, lettura = false, immagineOg }) {
  const t = titoloCompleto || (titolo ? `${titolo} · ${config.nome}` : config.nome);
  const canonico = assoluto(percorso);
  const ld = jsonld.length ? `<script type="application/ld+json">${JSON.stringify({ "@context": "https://schema.org", "@graph": jsonld })}</script>` : "";
  const adsense =
    config.pubblicita.attiva && config.pubblicita.adsenseClient
      ? `<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${esc(config.pubblicita.adsenseClient)}" crossorigin="anonymous"></script>`
      : "";
  const v = config.versione || "1";
  return `<!doctype html>
<html lang="it">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(t)}</title>
<meta name="description" content="${esc(descrizione)}">
<link rel="canonical" href="${canonico}">
${indicizza ? "" : '<meta name="robots" content="noindex">'}
<meta name="color-scheme" content="light dark">
<meta name="theme-color" content="#120a09">
<meta property="og:site_name" content="${esc(config.nome)}">
<meta property="og:locale" content="it_IT">
<meta property="og:type" content="${tipoOg}">
<meta property="og:title" content="${esc(titolo || config.nome)}">
<meta property="og:description" content="${esc(descrizione)}">
<meta property="og:url" content="${canonico}">
<meta property="og:image" content="${config.url}${immagineOg || "/assets/img/og.jpg"}">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="/assets/img/favicon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="/assets/img/apple-touch-icon.png">
<link rel="preload" href="/assets/fonts/fraunces-full-normal.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="/assets/fonts/source-serif-4-wght-normal.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="/assets/css/stile.css?v=${v}">
<script>(function(d){d.classList.add("js");if(!matchMedia("(prefers-reduced-motion: reduce)").matches&&scrollY<50){d.classList.add("sipario-chiuso");addEventListener("DOMContentLoaded",function(){setTimeout(function(){d.classList.remove("sipario-chiuso")},350)})}})(document.documentElement)</script>
${adsense}
${ld}
</head>
<body class="${classe}">
<a class="salta" href="#contenuto">Vai al contenuto</a>
${lettura ? '<div class="avanzamento" aria-hidden="true"></div>' : ""}
${testata(percorso)}
<main id="contenuto">
${contenuto}
</main>
${piede()}
<script src="/assets/js/sito.js?v=${v}" defer></script>
</body>
</html>`;
}
