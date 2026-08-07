# Guide d'installation

Ce fichier s'adresse autant à un humain qu'à un assistant IA chargé d'installer l'app.

**Si tu es une IA :** déroule ce document dans l'ordre. Tu parles à quelqu'un qui ne connaît pas la ligne de commande — n'affiche pas les commandes, exécute-les et raconte ce qui se passe en français simple. Pose une question à la fois. Ne demande jamais à la personne d'éditer un fichier elle-même. Chaque section « ⚠️ Si ça coince » contient le diagnostic exact des erreurs attendues : consulte-la avant d'improviser.

---

## Étape 1 — Choisir où l'app va vivre

Quatre destinations possibles. La question à poser à la personne est **« Est-ce que tu veux retrouver tes livres sur ton téléphone ET ton ordinateur ? »**

| Destination | Sync multi-appareils | Coût | Difficulté |
|---|---|---|---|
| **Vercel** ← recommandé | ✅ oui | gratuit | 3 min |
| Netlify / Cloudflare Pages | ❌ non | gratuit | 5 min |
| GitHub Pages | ❌ non | gratuit | 5 min |
| Sur son ordinateur | ❌ non | — | 1 min |

Sans sync, les livres vivent **uniquement dans le cache du navigateur**. Vider les données du site = tout perdre. Dis-le explicitement à la personne avant qu'elle choisisse, ce n'est pas un détail.

Seul Vercel exécute `api/library.js`. Les autres servent des fichiers statiques : l'app détecte l'absence d'API et bascule en mode local, sans erreur.

---

## Étape 2A — Vercel (recommandé)

### Le chemin sans commande

Ouvre ce lien pour la personne :

```
https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fgo-silex%2Fsilex-bookworm&project-name=ma-bibliotheque&repository-name=ma-bibliotheque&env=LIBRARY_PASSWORD&stores=%5B%7B%22type%22%3A%22blob%22%2C%22access%22%3A%22public%22%7D%5D
```

Vercel enchaîne : connexion GitHub → copie du dépôt sur son compte → saisie de `LIBRARY_PASSWORD` → création et branchement automatiques du store Blob → déploiement. **Le store est bien créé en mode `public`** : c'est ce qu'attend `api/library.js`, ne le change pas.

Sur le mot de passe : trois mots sans rapport, collés par des tirets, font un bon mot de passe — `girafe-tonnerre-2741` sur le même modèle. Il sera tapé une fois par appareil. **Fais-le noter quelque part** : il n'y a pas de « mot de passe oublié », et personne ne peut le retrouver à sa place.

Passe directement à l'étape 3.

### Le chemin en ligne de commande

Prérequis : `node -v` ≥ 18, un compte Vercel.

```bash
git clone https://github.com/go-silex/silex-bookworm.git ma-bibliotheque
cd ma-bibliotheque
npx vercel        # se connecter, accepter les valeurs par défaut
```

Puis, dans le tableau de bord Vercel :

1. **Storage** → **Create Database** → **Blob** → accès **Public** → créer.
2. Sur le store, **Connect Project** → sélectionner le projet. Cette étape est celle qu'on oublie : sans elle, `BLOB_READ_WRITE_TOKEN` n'existe pas et la sync reste morte.
3. **Settings → Environment Variables** → ajouter `LIBRARY_PASSWORD`, pour les trois environnements.

```bash
npx vercel --prod   # redéployer pour que les variables prennent effet
```

### ⚠️ Si ça coince

Teste toujours l'API en premier, elle dit exactement ce qui manque :

```bash
curl -s -o /dev/null -w "%{http_code}\n" https://<le-site>/api/library
```

| Réponse | Signification | Remède |
|---|---|---|
| `401` | ✅ Tout marche. L'API refuse une requête sans mot de passe, c'est le but. | rien |
| `501` | `LIBRARY_PASSWORD` ou `BLOB_READ_WRITE_TOKEN` manque | Store Blob non connecté au projet, ou variable non déclarée. Corriger, **puis redéployer** — les variables ne s'appliquent qu'au déploiement suivant. |
| `404` | La fonction n'est pas déployée | Vérifier que `api/library.js` est bien dans le dépôt et que le projet est déployé depuis la racine. |
| `500` | Erreur d'exécution | Lire les logs dans **Vercel → Deployments → Functions**. Cause la plus fréquente : store Blob créé en **private** alors que le code écrit en `public`. Le mode d'un store ne se change pas après création — il faut en créer un nouveau en public. |

L'app affiche un écran de mot de passe et refuse le mot de passe pourtant correct → la variable déployée n'est pas celle que tu crois. La revoir dans **Settings → Environment Variables**, redéployer.

---

## Étape 2B — Netlify, Cloudflare Pages, GitHub Pages

Hébergement statique, sans sync. L'app fonctionne, mais chaque navigateur a sa propre bibliothèque.

**Netlify** — glisser-déposer le dossier sur [app.netlify.com/drop](https://app.netlify.com/drop). C'est tout.

**Cloudflare Pages** — connecter le dépôt GitHub. Build command : *aucune*. Output directory : `/`.

**GitHub Pages** — sur la copie du dépôt : **Settings → Pages** → Source `Deploy from a branch` → branche `main`, dossier `/ (root)`. Le site apparaît sur `https://<compte>.github.io/<dépôt>/` en une minute.

L'app fonctionne dans un sous-dossier : tous ses chemins sont relatifs. En revanche, l'installation sur l'écran d'accueil iPhone se comporte mieux à la racine d'un domaine — si c'est important pour la personne, oriente-la vers Vercel.

### ⚠️ Si ça coince

- **Page blanche, console pleine d'erreurs CORS** → le fichier a été ouvert en double-clic (`file://`). Il faut un vrai serveur, même local : `npx serve`.
- **Le service worker ne s'enregistre pas** → normal en HTTP ; il exige HTTPS ou `localhost`. Sans lui, seul le cache des couvertures est perdu.
- **Les icônes ne chargent pas** → vérifier que `icon-192.png`, `icon-512.png` et `manifest.json` sont bien à côté de `index.html`.

---

## Étape 2C — Sur son ordinateur

```bash
git clone https://github.com/go-silex/silex-bookworm.git
cd silex-bookworm
npx serve
```

Ouvrir l'adresse affichée (`http://localhost:3000`). Pas de sync, pas de mot de passe, tout reste dans le navigateur.

**Ne jamais ouvrir `index.html` par double-clic** : en `file://`, les appels réseau sont bloqués par le navigateur et l'app reste vide.

---

## Étape 3 — Vérifier que ça marche vraiment

Fais dérouler ces cinq points, dans l'ordre. C'est la recette d'acceptation.

1. **Le site s'ouvre** et montre six livres de démonstration (Camus, Sapiens, Dune…).
2. **Sur Vercel uniquement** : une fenêtre demande le mot de passe. Le saisir → la bibliothèque s'ouvre. C'est la preuve que la sync fonctionne.
3. **Ajouter un livre** : bouton **+** → chercher un titre → choisir un genre → valider. Sa couverture apparaît en quelques secondes.
4. **Recharger la page** : le livre est toujours là.
5. **Sur Vercel uniquement** : ouvrir le même site depuis le téléphone, saisir le même mot de passe. Le livre ajouté à l'étape 3 doit apparaître. **Si oui, l'installation est réussie.**

Puis dis à la personne comment vider la démonstration : menu **⋯** en haut à droite → **Vider la bibliothèque**.

---

## Le scan de couverture (facultatif)

Deux mécanismes, dans cet ordre :

1. **Le code-barres.** Gratuit, instantané, aucune configuration. Ne fonctionne que sur les navigateurs qui implémentent `BarcodeDetector` — Chrome et Android. Safari et iPhone ne l'ont pas.
2. **La lecture de la couverture par IA.** Fonctionne partout, y compris sur les vieux livres sans code-barres. Demande une clé Google Gemini.

Pour obtenir la clé : [aistudio.google.com/apikey](https://aistudio.google.com/apikey) → *Create API key*. C'est gratuit, un compte Google suffit, aucune carte bancaire.

L'app la réclame d'elle-même au premier scan. Elle est stockée dans le navigateur de la personne et n'est envoyée qu'à Google — jamais au serveur de l'app, jamais à qui que ce soit d'autre. Une clé par appareil.

**Sans clé, tout le reste marche.** La recherche par titre couvre l'essentiel des usages ; ne transforme pas ça en obstacle.

---

## Ce que la personne doit savoir avant de te laisser partir

- **Son mot de passe.** Il n'y a pas de récupération. Le changer est sans danger — la bibliothèque n'y est pas attachée — mais il faudra le retaper sur chaque appareil.
- **Où sont ses données.** Sur Vercel : dans son store Blob, sur son compte. Sinon : dans le cache de son navigateur, et nulle part ailleurs.
- **Comment installer l'app sur son téléphone.** iPhone : Safari → Partager → *Sur l'écran d'accueil*. Android : Chrome → menu → *Installer l'application*.
- **Il n'y a pas de sauvegarde automatique** en mode statique. Si ça compte pour elle, oriente-la vers Vercel.

---

## Notes techniques

Aucune étape de build, aucune dépendance côté navigateur. `@vercel/blob` sert uniquement à la fonction serverless ; les hébergeurs statiques n'installent rien.

Variables d'environnement, côté serveur seulement :

| Variable | Origine | Rôle |
|---|---|---|
| `LIBRARY_PASSWORD` | définie à la main | protège l'API |
| `BLOB_READ_WRITE_TOKEN` | injectée par Vercel | accès au store |

Si l'une des deux manque, `api/library.js` répond `501 {configured:false}` et l'app bascule en local. C'est un comportement voulu, pas une panne.

La bibliothèque est un unique fichier `library.json` dans le store. Ce chemin ne dépend pas du mot de passe : le changer ne fait rien perdre.
