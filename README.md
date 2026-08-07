# Bibliothèque

Une app pour suivre ce qu'on lit. Sur papier.

Pas de note sur 5, pas de fil d'actualité, pas de compte à créer. Tu photographies la couverture, le livre entre dans ta bibliothèque, et tu retrouves des années plus tard la trace de ce que tu lisais cet été-là.

**Ta bibliothèque t'appartient.** Tu l'installes chez toi, sur ton hébergement, avec ton mot de passe. Personne d'autre n'y accède — pas même nous.

<p align="center">
  <img src="docs/lecture.png" width="240" alt="Écran Lecture">
  <img src="docs/bibliotheque.png" width="240" alt="Écran Bibliothèque">
  <img src="docs/historique.png" width="240" alt="Écran Historique">
</p>

---

## Installer

### La façon la plus simple : un clic

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fgo-silex%2Fsilex-bookworm&project-name=ma-bibliotheque&repository-name=ma-bibliotheque&env=LIBRARY_PASSWORD&envDescription=Choisis%20un%20mot%20de%20passe%20—%20c%27est%20lui%20qui%20protège%20ta%20bibliothèque&stores=%5B%7B%22type%22%3A%22blob%22%2C%22access%22%3A%22public%22%7D%5D)

Vercel te demande de te connecter avec GitHub, de choisir un mot de passe, et fabrique tout le reste. Compte gratuit, environ trois minutes. Tu repars avec ta propre adresse et ta bibliothèque synchronisée entre ton téléphone et ton ordinateur.

### La façon la plus confortable : demander à ton IA

Si tu utilises Claude, ChatGPT ou équivalent, copie-lui ce message :

> Installe cette application pour moi : https://github.com/go-silex/silex-bookworm
> Suis les instructions du fichier INSTALL.md, et pose-moi les questions au fur et à mesure.

Le dépôt contient un guide écrit spécialement pour être lu par une IA : commandes exactes, erreurs possibles et leur remède. Tu n'as rien à comprendre, juste à répondre.

### La façon manuelle

Tout est dans **[INSTALL.md](INSTALL.md)** — Vercel, Netlify, Cloudflare Pages, GitHub Pages ou simplement sur ton ordinateur.

---

## Ce que ça fait

**Quatre écrans**, qui glissent horizontalement.

- **Lecture** — ce que tu lis en ce moment, et la pile de ce qui t'attend.
- **Bibliothèque** — tes livres rangés par genre, un chapitre par genre.
- **Favoris** — ceux qui comptent.
- **Historique** — une page par année. C'est là que l'app devient intéressante avec le temps.

**Ajouter un livre.** Tu cherches par titre, ou tu photographies la couverture. L'app lit le code-barres s'il y en a un, sinon elle déchiffre la couverture. Les couvertures arrivent toutes seules, depuis Open Library et Google Books.

**Les relectures comptent.** Un livre lu trois fois apparaît trois fois dans l'historique, aux trois bonnes dates. C'était le point de départ du projet.

**Ça s'installe comme une app.** Sur iPhone : Partager → *Sur l'écran d'accueil*. Ça s'ouvre en plein écran, sans barre de navigateur.

---

## Bien démarrer

**Vider la bibliothèque de démonstration.** L'app arrive avec six livres d'exemple pour que tu voies à quoi ça ressemble. Menu **⋯** en haut à droite → **Vider la bibliothèque**.

**Le scan de couverture** (facultatif) demande une clé Google Gemini, gratuite, à créer sur [aistudio.google.com](https://aistudio.google.com/apikey). L'app te la demandera au premier scan. Elle reste dans ton navigateur et n'est envoyée qu'à Google. Sans elle, la recherche par titre fonctionne très bien.

> **⚠️ Si tu déploies en statique** (GitHub Pages, Netlify, Cloudflare Pages, ou en local), il n'y a pas de serveur : tes livres vivent **uniquement dans le cache de ton navigateur**. Vider les données du site, changer de navigateur ou d'appareil, et tu repars de zéro. Pour une bibliothèque que tu comptes garder, prends le chemin Vercel.

---

## Sous le capot

Trois fichiers, aucun framework, aucune étape de build.

| | |
|---|---|
| `index.html` | 30 lignes de squelette |
| `app.js` | toute l'application |
| `style.css` | tout le style |
| `glass.js` | l'effet de verre liquide (Chromium uniquement, dégradé ailleurs) |
| `api/library.js` | la synchronisation — la seule partie serveur, 55 lignes |

**Le modèle de données.** Un livre a un titre, un auteur, un genre, et une liste de *sessions* de lecture (`startedAt` / `finishedAt`). Tout le reste en découle : le statut se déduit de la dernière session, l'historique est la liste de toutes les sessions terminées.

**La synchronisation.** Le navigateur garde tout en `localStorage` et pousse vers `/api/library`, protégé par un mot de passe unique. Sans serveur configuré, l'API répond `501` et l'app continue en local sans rien dire. Les bibliothèques de deux appareils fusionnent au lieu de s'écraser : les livres se réunissent par titre, les sessions par date de fin. Rien n'est perdu, rien n'est doublé.

---

## English

A reading tracker for paper books. No ratings, no feed, no account — you deploy your own copy and it's yours.

**Install:** click the Vercel button above (free account, ~3 min), or hand the repo to your AI assistant with *"install this for me, follow INSTALL.md"*. Manual instructions for Vercel, Netlify, Cloudflare Pages, GitHub Pages and local use live in **[INSTALL.md](INSTALL.md)**.

**Note:** the interface is in French. The code is plain vanilla JS with no build step, so translating it means editing string literals in `app.js` — contributions welcome.

**How it works:** four swipeable views (reading, library by genre, favourites, history by year). Books are added by title search or by photographing the cover — barcode first, then a Gemini vision fallback if you supply a free API key. Covers are fetched from Open Library and Google Books. Re-reads are first-class: each reading session is stored separately, so a book read three times shows up three times in your history.

**Data:** stored in `localStorage`, optionally synced to a Vercel Blob store behind a single shared password. Static deployments have no server — your data lives in the browser cache only.

---

## Contribuer

Les issues et les pull requests sont bienvenues. Le projet est volontairement minimal : pas de dépendance côté navigateur, pas de build, pas de framework. Une contribution qui ajoute un `node_modules` au client sera probablement refusée avec le sourire.

Quelques pistes ouvertes : export / import JSON, traduction de l'interface, thème sombre.

## Licence

MIT — voir [LICENSE](LICENSE).

Construit par [GOSILEX](https://gosilex.com).
