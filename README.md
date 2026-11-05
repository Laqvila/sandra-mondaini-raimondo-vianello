# Sandra e Raimondo

Archivio non ufficiale degli appassionati sulla vita e la carriera di Sandra Mondaini e Raimondo Vianello, pubblicato su [raimondovianello.it](https://raimondovianello.it). Il dominio sandramondaini.it rimanda alla pagina di Sandra.

## Come si aggiorna

I testi sono in `src/contenuti`, uno per pagina, scritti in Markdown. Le impostazioni generali, come contatti ed editore, sono in `src/config.js`.

```bash
npm install
npm run dev
```

Il secondo comando genera il sito in `dist/` e lo apre in anteprima su http://localhost:4321.

Ogni push sul ramo `main` ricostruisce il sito e lo pubblica su GitHub Pages in un paio di minuti.

## Fotografie

Gli originali scaricati da Wikimedia Commons sono in `src/originali/commons`. Il comando `npm run foto` ne ricava le versioni per il web in `src/risorse/img/foto`. Autori e licenze sono nella pagina Crediti fotografici del sito.
