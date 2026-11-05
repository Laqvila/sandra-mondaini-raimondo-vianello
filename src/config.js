// Impostazioni generali del sito.
// I valori tra parentesi quadre sono segnaposto: la build li segnala finché non li completi.

export default {
  nome: "Sandra e Raimondo",
  sottotitolo: "L'archivio degli appassionati",
  descrizione:
    "Archivio non ufficiale degli appassionati sulla vita e la carriera di Sandra Mondaini e Raimondo Vianello, con biografie, schede dei programmi, cronologia e fonti.",
  url: "https://raimondovianello.it",
  urlSandra: "https://sandramondaini.it",
  lingua: "it-IT",

  // Contatti e dati di chi pubblica il sito (obbligatori per un sito che guadagna, d.lgs. 70/2003)
  email: "info@mirkorocci.it",
  editore: {
    nome: "Mirko Rocci",
    indirizzo: "", // obbligatorio quando si attiva la pubblicità (d.lgs. 70/2003)
    piva: "", // lascia vuoto se non hai partita IVA
    bio: "", // facoltativa: una o due righe su di te, compare in Chi siamo
  },

  // Fase 2: si attivano solo quando compili questi campi
  pubblicita: { attiva: false, adsenseClient: "" }, // es. "ca-pub-1234567890"
  donazioni: { url: "" }, // es. link Ko-fi o Buy Me a Coffee
  newsletter: { url: "" }, // es. pagina di iscrizione Substack, Buttondown o Brevo
  amazon: { tag: "" }, // codice affiliato Amazon, es. "nomesito-21"

  ultimoAggiornamentoLegale: "5 novembre 2026",

  nav: [
    { titolo: "Raimondo", url: "/raimondo-vianello/" },
    { titolo: "Sandra", url: "/sandra-mondaini/" },
    { titolo: "La coppia", url: "/la-coppia/" },
    { titolo: "Programmi", url: "/programmi/" },
    { titolo: "Cronologia", url: "/cronologia/" },
    { titolo: "Racconti", url: "/racconti/" },
    { titolo: "Libri e DVD", url: "/libri-e-dvd/" },
    { titolo: "Quiz", url: "/quiz/", classe: "voce-quiz" },
  ],

  footer: [
    { titolo: "Chi siamo", url: "/chi-siamo/" },
    { titolo: "Testimonianze", url: "/testimonianze/" },
    { titolo: "Fonti", url: "/fonti/" },
    { titolo: "Sostieni l'archivio", url: "/sostieni/" },
    { titolo: "Segnalazioni", url: "/segnalazioni/" },
    { titolo: "Note legali", url: "/note-legali/" },
    { titolo: "Crediti fotografici", url: "/crediti-fotografici/" },
    { titolo: "Privacy e cookie", url: "/privacy-e-cookie/" },
  ],
};
