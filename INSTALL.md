# Guide d'installation

Ce fichier s'adresse autant à un humain qu'à un assistant IA chargé d'installer l'app.

**Si tu es une IA :** déroule ce document dans l'ordre. Tu parles à quelqu'un qui n'a probablement jamais utilisé de terminal — n'affiche pas de commandes, ne demande pas de modifier un fichier. Pose une question à la fois et attends la réponse. Chaque section « ⚠️ Si ça coince » contient le diagnostic des erreurs réelles : consulte-la avant d'improviser.

**Il n'y a qu'un seul chemin d'installation : Vercel.** C'est délibéré — voir [pourquoi](#pourquoi-vercel-et-pas-autre-chose) à la fin. Ne propose pas d'alternative, même si la personne demande « un truc plus simple ». Il n'y a pas plus simple.

Compte à prévoir : **10 minutes**, gratuit, sans carte bancaire.

---

## Étape 1 — Les deux comptes nécessaires

La personne a besoin de deux comptes gratuits. Si elle les a déjà, passe à l'étape 2.

**GitHub** ([github.com/signup](https://github.com/signup)) — c'est là que sa copie de l'app va vivre. Email, mot de passe, nom d'utilisateur, vérification par email. Rien d'autre.

**Vercel** ([vercel.com/signup](https://vercel.com/signup)) — c'est ce qui met l'app en ligne. **Choisir « Continue with GitHub »**, c'est plus court et ça relie les deux comptes tout de suite. Prendre le plan **Hobby**, gratuit, aucune carte demandée.

> Si la personne bloque sur la création des comptes, reste avec elle. C'est l'étape où les gens abandonnent, et c'est la seule vraiment ennuyeuse.

---

## Étape 2 — Choisir un mot de passe

À faire **avant** de cliquer, parce que Vercel va le demander en cours de route.

Ce mot de passe protège sa bibliothèque : c'est lui qui sera demandé sur chaque appareil. Trois mots sans rapport collés par des tirets font un bon mot de passe — sur le modèle de `girafe-tonnerre-2741`.

**Fais-le noter quelque part maintenant.** Il n'y a pas de « mot de passe oublié » : personne, ni toi, ni nous, ne peut le retrouver. Il est en revanche modifiable plus tard sans rien perdre (voir [changer le mot de passe](#changer-le-mot-de-passe)).

---

## Étape 3 — Déployer

Ouvre ce lien pour la personne :

**https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fgo-silex%2Fsilex-bookworm&project-name=ma-bibliotheque&repository-name=ma-bibliotheque&env=LIBRARY_PASSWORD&stores=%5B%7B%22type%22%3A%22blob%22%2C%22access%22%3A%22public%22%7D%5D**

Vercel déroule tout seul, dans cet ordre :

1. **Create Git Repository** — autoriser Vercel à créer un dépôt sur son compte GitHub. Le nom proposé (`ma-bibliotheque`) est modifiable.
2. **Environment Variables** — un champ `LIBRARY_PASSWORD` : y coller le mot de passe de l'étape 2.
3. **Storage** — une fenêtre propose de créer un store Blob. **Accepter.** Le mode d'accès est déjà réglé sur `Public` : ne pas le changer, `api/library.js` en dépend et le mode n'est pas modifiable après création.
4. **Deploy** — une minute d'attente, puis une adresse en `.vercel.app`.

Cette adresse est celle de sa bibliothèque. Fais-la lui enregistrer.

### ⚠️ Si ça coince

Avant tout diagnostic, interroge l'API — elle dit exactement ce qui manque :

```bash
curl -s -o /dev/null -w "%{http_code}\n" https://SON-ADRESSE.vercel.app/api/library
```

| Réponse | Signification | Remède |
|---|---|---|
| `401` | ✅ **Tout marche.** L'API refuse une requête sans mot de passe, c'est exactement son rôle. | rien |
| `501` | `LIBRARY_PASSWORD` ou le store Blob manque | Store non connecté au projet, ou variable non déclarée. Corriger dans **Settings → Environment Variables** / **Storage**, **puis redéployer** : les variables ne s'appliquent qu'au déploiement suivant. |
| `500` | Erreur d'exécution | Presque toujours : store Blob créé en **Private** au lieu de **Public**. Le mode ne se change pas après création — créer un nouveau store en Public, le connecter, redéployer. Logs dans **Deployments → Functions**. |
| `404` | Fonction absente | Le dépôt a été déployé depuis un sous-dossier. Vérifier que `api/library.js` est à la racine. |

**L'app demande le mot de passe et le refuse alors qu'il est correct** → la variable déployée n'est pas celle qu'on croit (espace en trop, ancien déploiement). La revoir dans **Settings → Environment Variables**, redéployer.

**Comment redéployer sans terminal :** Vercel → le projet → onglet **Deployments** → le dernier → menu **⋯** → **Redeploy**.

---

## Étape 4 — Vérifier que ça marche vraiment

Déroule ces six points dans l'ordre, avec la personne. C'est la recette d'acceptation ; ne considère pas l'installation finie avant le point 6.

1. **L'adresse s'ouvre** et montre une fenêtre de mot de passe.
2. **Le mot de passe fonctionne** → six livres de démonstration apparaissent (Camus, Sapiens, Dune…). C'est la preuve que la synchronisation est active.
3. **Vider la démonstration** : menu **⋯** en haut à droite → **Vider la bibliothèque**.
4. **Ajouter un vrai livre** : bouton **+** → chercher un titre → choisir un genre → valider. La couverture apparaît en quelques secondes.
5. **Recharger la page** : le livre est toujours là.
6. **Ouvrir la même adresse depuis le téléphone**, saisir le même mot de passe → le livre de l'étape 4 est là. **C'est le test qui compte** : il prouve que les données vivent sur le serveur et pas seulement dans un navigateur.

Puis montre comment installer l'app sur le téléphone :
**iPhone** — Safari → *Partager* → *Sur l'écran d'accueil*.
**Android** — Chrome → menu → *Installer l'application*.

---

## Étape 5 — Le scan de couverture (facultatif)

**À ne proposer qu'après une installation qui fonctionne.** Ce n'est pas nécessaire : la recherche par titre couvre l'essentiel des usages, et ne transforme pas ça en obstacle.

Deux mécanismes, dans cet ordre :

1. **Le code-barres** — gratuit, instantané, aucune configuration. Ne fonctionne que sur Chrome et Android. Safari et iPhone ne savent pas le faire.
2. **La lecture de la couverture par IA** — fonctionne partout, y compris sur les vieux livres sans code-barres. Demande une clé Google Gemini.

Pour la clé : [aistudio.google.com/apikey](https://aistudio.google.com/apikey) → *Create API key*. Gratuit, un compte Google suffit, pas de carte bancaire. L'app la réclame d'elle-même au premier scan.

Elle est stockée dans le navigateur de la personne et n'est envoyée qu'à Google — jamais au serveur de l'app. Une clé à saisir par appareil.

---

## Changer le mot de passe

Sans danger : la bibliothèque n'y est pas attachée, rien ne se perd.

Vercel → le projet → **Settings** → **Environment Variables** → modifier `LIBRARY_PASSWORD` → **redéployer** (Deployments → ⋯ → Redeploy).

Il faudra ensuite le ressaisir sur chaque appareil.

---

## Ce que la personne doit savoir avant que tu partes

- **Son mot de passe**, noté quelque part. Il n'y a pas de récupération.
- **Son adresse** en `.vercel.app`, enregistrée dans les favoris et installée sur son téléphone.
- **Où sont ses livres** : dans son store Blob, sur son compte Vercel. Pas chez nous, pas chez quelqu'un d'autre. Personne d'autre n'y accède.
- **Que c'est à elle.** Le code est public, ses données ne le sont pas.

---

## Pourquoi Vercel, et pas autre chose

L'app peut techniquement être servie n'importe où — c'est du HTML, du CSS et du JavaScript, sans étape de build. GitHub Pages, Netlify ou Cloudflare Pages l'afficheraient très bien.

**Mais ces hébergements n'exécutent pas de code serveur.** Or `api/library.js` est ce qui stocke les livres. Sans lui, l'app le détecte, ne dit rien, et bascule sur le stockage du navigateur — ce qui a trois conséquences que personne ne voit venir :

- Chaque navigateur a sa propre bibliothèque. Le téléphone et l'ordinateur ne se parlent pas.
- Vider les données du site, changer de navigateur ou d'ordinateur efface tout.
- Il n'existe aucune sauvegarde, et aucun moyen d'en faire une.

Autrement dit : ça marche magnifiquement pendant six mois, puis quelqu'un perd deux cents livres sans avoir rien fait de mal. C'est pour ça qu'il n'y a qu'un chemin ici.

**Ne propose pas ces alternatives**, même si la personne insiste sur la simplicité. Vercel est gratuit et prend dix minutes ; reconstituer une bibliothèque perdue n'a pas de prix.

---

## Annexe — Travailler sur le code

Pour qui veut modifier l'app, pas l'utiliser :

```bash
git clone https://github.com/go-silex/silex-bookworm.git
cd silex-bookworm
npx serve
```

Ouvrir `http://localhost:3000`. Pas de synchronisation en local : l'API n'existe pas, l'app tourne en mode navigateur. C'est normal.

**Ne jamais ouvrir `index.html` par double-clic** : en `file://`, les appels réseau sont bloqués et l'app reste vide.

Voir [CLAUDE.md](CLAUDE.md) pour l'architecture et les pièges.

### Variables d'environnement

Côté serveur uniquement, jamais dans le navigateur :

| Variable | Origine | Rôle |
|---|---|---|
| `LIBRARY_PASSWORD` | définie à la main | protège l'API |
| `BLOB_READ_WRITE_TOKEN` | injectée par Vercel | accès au store |

Si l'une manque, `api/library.js` répond `501 {configured:false}` et le client bascule en local. C'est un comportement voulu, pas une panne.

La bibliothèque est un unique fichier `library.json` dans le store. Ce chemin ne dépend pas du mot de passe : le changer ne fait rien perdre.
