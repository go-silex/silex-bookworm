/* ── Reconnaissance de couverture ────────────────────────────────
   Le navigateur envoie la photo, le serveur interroge Gemini avec
   SA clé. Personne n'a de clé à coller sur son téléphone, et la clé
   ne se promène jamais côté client.

   Facultatif : sans GEMINI_API_KEY, on répond 501 et l'app propose
   la saisie manuelle. Le reste de l'application est intact. */

import { createHash, timingSafeEqual } from 'node:crypto';

const MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
const PROMPT = "Cette photo montre la couverture d'un livre papier. Donne le titre exact et l'auteur tels qu'imprimés, puis classe le livre dans l'un des genres proposés. Si aucun livre n'est identifiable, mets found à false et laisse les autres champs vides.";

const sha = s => createHash('sha256').update(s).digest();

/* Même mot de passe que la bibliothèque : sans ça, n'importe qui
   pourrait épuiser le quota Gemini du propriétaire. */
function authorized(req) {
  const want = process.env.LIBRARY_PASSWORD || '';
  if (!want) return true; // installation sans verrou : rien à protéger
  const got = (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  if (!got) return false;
  return timingSafeEqual(sha(got), sha(want));
}

export default async function handler(req, res) {
  res.setHeader('cache-control', 'no-store');

  if (req.method !== 'POST') {
    res.setHeader('allow', 'POST');
    return res.status(405).json({ error: 'method not allowed' });
  }
  if (!process.env.GEMINI_API_KEY) return res.status(501).json({ configured: false });
  if (!authorized(req)) return res.status(401).json({ error: 'unauthorized' });

  const { image, genres } = req.body || {};
  if (typeof image !== 'string' || !image) return res.status(400).json({ error: 'bad payload' });
  const enum_ = Array.isArray(genres) && genres.length ? genres : ['roman'];

  const r = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=` +
      encodeURIComponent(process.env.GEMINI_API_KEY),
    {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ inline_data: { mime_type: 'image/jpeg', data: image } }, { text: PROMPT }] }],
        generationConfig: {
          response_mime_type: 'application/json',
          response_schema: {
            type: 'OBJECT',
            properties: {
              found: { type: 'BOOLEAN' },
              title: { type: 'STRING' },
              author: { type: 'STRING' },
              genre: { type: 'STRING', enum: enum_ },
            },
            required: ['found', 'title', 'author', 'genre'],
          },
        },
      }),
    },
  );

  if (!r.ok) {
    const msg = (await r.json().catch(() => ({})))?.error?.message || `Erreur ${r.status}`;
    // La clé du serveur ne doit jamais transparaître dans un message d'erreur.
    return res.status(502).json({ error: msg.replace(/AIza[\w-]+/g, '…') });
  }

  const data = await r.json();
  const text = (data.candidates?.[0]?.content?.parts || []).map(p => p.text || '').join('');
  if (!text) return res.status(200).json({ found: false });

  try {
    return res.status(200).json(JSON.parse(text));
  } catch {
    return res.status(502).json({ error: 'réponse illisible' });
  }
}
