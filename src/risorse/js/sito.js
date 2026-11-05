// Interazioni del sito. Senza JavaScript tutti i contenuti restano leggibili.
(() => {
  const mesi = ["gennaio", "febbraio", "marzo", "aprile", "maggio", "giugno", "luglio", "agosto", "settembre", "ottobre", "novembre", "dicembre"];
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
  const fermo = matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* Menu su schermi piccoli */
  const menu = document.querySelector(".menu");
  const bottone = menu && menu.querySelector(".menu-bottone");
  if (bottone) {
    const chiudi = () => { menu.classList.remove("aperto"); bottone.setAttribute("aria-expanded", "false"); };
    bottone.addEventListener("click", (e) => {
      e.stopPropagation();
      const aperto = menu.classList.toggle("aperto");
      bottone.setAttribute("aria-expanded", String(aperto));
    });
    document.addEventListener("click", (e) => { if (!menu.contains(e.target)) chiudi(); });
    document.addEventListener("keydown", (e) => { if (e.key === "Escape") chiudi(); });
  }

  /* Comparsa allo scorrimento (il sipario della home si apre con lo script inline nella testata) */
  const daRivelare = document.querySelectorAll("[data-rivela]");
  if ("IntersectionObserver" in window && !fermo) {
    const io = new IntersectionObserver((voci) => {
      for (const v of voci) if (v.isIntersecting) { v.target.classList.add("visto"); io.unobserve(v.target); }
    }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
    daRivelare.forEach((el) => io.observe(el));
  } else daRivelare.forEach((el) => el.classList.add("visto"));

  /* Numeri che contano */
  const numeri = document.querySelectorAll("[data-conta]");
  if (numeri.length && "IntersectionObserver" in window && !fermo) {
    const conta = (el) => {
      const fine = parseInt(el.dataset.conta, 10);
      if (isNaN(fine) || fine > 1000) return; // gli anni restano fermi
      const inizio = 0;
      const t0 = performance.now();
      const passo = (t) => {
        const k = Math.min(1, (t - t0) / 1400);
        el.textContent = String(Math.round(inizio + (fine - inizio) * (1 - Math.pow(1 - k, 3))));
        if (k < 1) requestAnimationFrame(passo);
      };
      requestAnimationFrame(passo);
    };
    const io = new IntersectionObserver((voci) => {
      for (const v of voci) if (v.isIntersecting) { conta(v.target); io.unobserve(v.target); }
    }, { threshold: 0.6 });
    numeri.forEach((n) => io.observe(n));
  }

  /* Barra di lettura */
  const barra = document.querySelector(".avanzamento");
  if (barra) {
    const aggiorna = () => {
      const h = document.documentElement.scrollHeight - innerHeight;
      barra.style.width = (h > 0 ? (scrollY / h) * 100 : 0) + "%";
    };
    addEventListener("scroll", aggiorna, { passive: true });
    aggiorna();
  }

  /* Filtri per cronologia e programmi */
  document.querySelectorAll(".filtri").forEach((filtri) => {
    filtri.hidden = false;
    const ambito = filtri.closest(".foglio, main") || document;
    filtri.addEventListener("click", (e) => {
      const b = e.target.closest("button[data-filtro]");
      if (!b) return;
      const f = b.dataset.filtro;
      filtri.querySelectorAll("button").forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
      ambito.querySelectorAll(".evento, .locandina").forEach((el) => {
        const chi = el.dataset.chi;
        const mostra = f === "tutti" || chi === f || (f !== "SR" && chi === "SR");
        el.classList.toggle(el.classList.contains("evento") ? "nascosto" : "nascosta", !mostra);
        if (mostra) el.classList.add("visto");
      });
      ambito.querySelectorAll(".decennio, .gruppo").forEach((g) => {
        if (!g.querySelector(".evento, .locandina")) return;
        g.classList.toggle("vuoto", !g.querySelector(".evento:not(.nascosto), .locandina:not(.nascosta)"));
        g.style.display = g.classList.contains("vuoto") ? "none" : "";
      });
    });
  });

  /* La TV degli anniversari */
  const tv = document.getElementById("tv");
  const datiTv = document.getElementById("anniversari");
  if (tv && datiTv) {
    const oggi = new Date();
    oggi.setHours(0, 0, 0, 0);
    const traGiorni = (x) => {
      let d = new Date(oggi.getFullYear(), x.m - 1, x.g);
      if (d < oggi) d = new Date(oggi.getFullYear() + 1, x.m - 1, x.g);
      return Math.round((d - oggi) / 86400000);
    };
    const lista = JSON.parse(datiTv.textContent || "[]").map((x) => ({ ...x, tra: traGiorni(x) })).sort((a, b) => a.tra - b.tra);
    const schermo = document.getElementById("tv-contenuto");
    let i = 0;
    const mostra = () => {
      const x = lista[i];
      const etichetta = x.tra === 0 ? "Accadde oggi" : x.tra === 1 ? "Domani è l'anniversario" : i === 0 ? `Tra ${x.tra} giorni` : `Canale ${i + 1}`;
      const anni = oggi.getFullYear() - x.a + (x.tra > 0 && i === 0 ? 0 : 0);
      schermo.innerHTML = `
        <span class="tv-etichetta">${esc(etichetta)}</span>
        <span class="tv-data">${x.g} ${mesi[x.m - 1]} ${x.a}</span>
        <p class="tv-evento">${esc(x.t)}${x.l ? ` <a href="${esc(x.l)}">Approfondisci</a>` : ""}</p>
        <span class="tv-nota">${anni} anni fa · canale ${i + 1} di ${lista.length}</span>`;
    };
    if (lista.length) {
      mostra();
      tv.querySelectorAll(".tv-manopola").forEach((m) =>
        m.addEventListener("click", () => {
          i = (i + Number(m.dataset.dir) + lista.length) % lista.length;
          if (fermo) return mostra();
          tv.classList.remove("zapping");
          void tv.offsetWidth;
          tv.classList.add("zapping");
          setTimeout(mostra, 220);
        })
      );
    }
  }

  /* Quiz */
  document.querySelectorAll(".quiz").forEach((box) => {
    const gioco = box.querySelector(".quiz-gioco");
    const domande = JSON.parse(box.querySelector(".quiz-dati").textContent || "[]");
    if (!gioco || !domande.length) return;
    let ordine, i, punti;
    const mescola = (a) => a.map((x) => [Math.random(), x]).sort((p, q) => p[0] - q[0]).map((p) => p[1]);
    const inizia = () => { ordine = mescola(domande); i = 0; punti = 0; domanda(); };
    const testa = () => `<div class="quiz-testa"><span>Domanda ${i + 1} di ${ordine.length}</span><span class="quiz-punti">${punti} ${punti === 1 ? "punto" : "punti"}</span></div>
      <div class="quiz-barra"><span style="width:${(i / ordine.length) * 100}%"></span></div>`;
    const domanda = (focus) => {
      const d = ordine[i];
      gioco.innerHTML = `${testa()}<h3 class="quiz-domanda" tabindex="-1">${esc(d.domanda)}</h3>
        <div class="quiz-opzioni">${d.opzioni.map((o, k) => `<button type="button" data-k="${k}"><b>${"ABCD"[k]}</b>${esc(o)}</button>`).join("")}</div>
        <div class="quiz-dopo" aria-live="polite"></div>`;
      if (focus) gioco.querySelector(".quiz-domanda").focus();
      gioco.querySelectorAll(".quiz-opzioni button").forEach((b) =>
        b.addEventListener("click", () => {
          const k = Number(b.dataset.k);
          const giusta = k === d.giusta;
          if (giusta) punti++;
          gioco.querySelectorAll(".quiz-opzioni button").forEach((x) => {
            x.disabled = true;
            if (Number(x.dataset.k) === d.giusta) x.classList.add("giusta");
          });
          if (!giusta) b.classList.add("sbagliata");
          gioco.querySelector(".quiz-punti").textContent = `${punti} ${punti === 1 ? "punto" : "punti"}`;
          const ultima = i === ordine.length - 1;
          gioco.querySelector(".quiz-dopo").innerHTML = `
            <div class="quiz-spiegazione"><strong>${giusta ? "Esatto!" : "Peccato."}</strong> ${esc(d.spiegazione)}${d.link ? ` <a href="${esc(d.link)}">Scopri di più</a>` : ""}</div>
            <div class="quiz-azioni"><button type="button" class="bottone bottone-oro quiz-avanti">${ultima ? "Vedi il risultato" : "Prossima domanda"}</button></div>`;
          gioco.querySelector(".quiz-avanti").addEventListener("click", () => {
            if (ultima) return risultato();
            i++;
            domanda(true);
          });
        })
      );
    };
    const risultato = () => {
      const n = ordine.length;
      const giudizio =
        punti >= n - 1 ? "Applausi a scena aperta! Sei un vero intenditore." :
        punti >= Math.ceil(n * 0.6) ? "Ottimo, da prima serata. Ancora un ripasso e sei in finale." :
        punti >= Math.ceil(n * 0.3) ? "Niente male. Sfoglia la cronologia e riprova." :
        "Che barba, che noia? Le biografie ti aspettano.";
      gioco.innerHTML = `<div class="quiz-risultato">
        <p class="occhiello">Risultato finale</p>
        <p class="quiz-voto">${punti}/${n}</p>
        <h3 tabindex="-1">${esc(giudizio)}</h3>
        <div class="quiz-azioni">
          <button type="button" class="bottone bottone-oro quiz-rigioca">Gioca di nuovo</button>
          <button type="button" class="bottone bottone-vetro quiz-condividi">Sfida un amico</button>
          <a class="bottone bottone-vetro" href="/cronologia/">Ripassa la cronologia</a>
        </div></div>`;
      gioco.querySelector("h3").focus();
      gioco.querySelector(".quiz-rigioca").addEventListener("click", inizia);
      gioco.querySelector(".quiz-condividi").addEventListener("click", async (e) => {
        const testo = `Ho fatto ${punti} su ${n} al quiz su Sandra e Raimondo. Tu quanto ne sai?`;
        const url = location.origin + "/quiz/";
        try {
          if (navigator.share) await navigator.share({ title: "Il quiz su Sandra e Raimondo", text: testo, url });
          else { await navigator.clipboard.writeText(`${testo} ${url}`); e.target.textContent = "Link copiato!"; }
        } catch (_) { /* condivisione annullata */ }
      });
      if (punti >= n - 2 && !fermo) coriandoli(box);
    };
    inizia();
  });

  function coriandoli(box) {
    const c = document.createElement("div");
    c.className = "coriandoli";
    const colori = ["#e7b75a", "#cf2d42", "#fbf4e6", "#7fe0a8", "#f6dc9c"];
    for (let k = 0; k < 80; k++) {
      const p = document.createElement("i");
      p.style.left = Math.random() * 100 + "%";
      p.style.background = colori[k % colori.length];
      p.style.animationDelay = Math.random() * 0.8 + "s";
      p.style.animationDuration = 2 + Math.random() * 1.6 + "s";
      c.appendChild(p);
    }
    box.appendChild(c);
    setTimeout(() => c.remove(), 4500);
  }

  /* Video: si carica da YouTube solo quando lo avvii */
  document.querySelectorAll(".video[data-youtube]").forEach((fig) => {
    const b = fig.querySelector(".video-avvia");
    b.addEventListener("click", () => {
      const f = document.createElement("iframe");
      f.src = `https://www.youtube-nocookie.com/embed/${encodeURIComponent(fig.dataset.youtube)}?autoplay=1`;
      f.title = b.textContent.trim();
      f.allow = "autoplay; encrypted-media; picture-in-picture";
      f.allowFullscreen = true;
      b.replaceWith(f);
    });
  });
})();
