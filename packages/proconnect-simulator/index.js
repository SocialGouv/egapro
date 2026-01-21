import express from 'express';
import bodyParser from 'body-parser';
import fetch from 'node-fetch';

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));

/**
 * CONFIG
 */
const PORT = 4000;

const KEYCLOAK_PUBLIC_BASE = process.env.KEYCLOAK_PUBLIC_BASE || 'http://localhost:8080';
const SIMULATOR_PUBLIC_BASE = process.env.SIMULATOR_PUBLIC_BASE || 'http://localhost:4000';
const APP_PUBLIC_REDIRECT_URI =
  process.env.APP_PUBLIC_REDIRECT_URI || 'http://localhost:3000/api/auth/callback/proconnect';

// (optionnel) pour l’admin API depuis le container
const KEYCLOAK_INTERNAL_BASE = process.env.KEYCLOAK_INTERNAL_BASE || 'http://keycloak:8080';
const KEYCLOAK_BASE = 'http://keycloak:8080';
const REALM = 'atlas';
const CLIENT_ID = 'egapro-dev';

// callback FINAL vers ton app métier
const APP_REDIRECT_URI =
  'http://app:3000/api/auth/callback/proconnect';

// callback INTERMÉDIAIRE vers le simulateur
const SIMULATOR_CALLBACK =
  'http://proconnect-simulator:4000/callback';

// credentials admin keycloak (DEV ONLY)
const KC_ADMIN_USER = 'admin';
const KC_ADMIN_PASSWORD = 'admin';

/**
 * Utils
 */
async function getAdminToken() {
  const res = await fetch(
    `${KEYCLOAK_BASE}/realms/master/protocol/openid-connect/token`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: 'admin-cli',
        username: KC_ADMIN_USER,
        password: KC_ADMIN_PASSWORD,
        grant_type: 'password'
      })
    }
  );

  const data = await res.json();
  return data.access_token;
}

async function getUserIdByUsername(token, username) {
  const res = await fetch(
    `${KEYCLOAK_BASE}/admin/realms/${REALM}/users?username=${username}`,
    {
      headers: { Authorization: `Bearer ${token}` }
    }
  );

  const users = await res.json();
  return users[0]?.id;
}

async function updateUserAttributes(token, userId, attributes) {
  await fetch(
    `${KEYCLOAK_BASE}/admin/realms/${REALM}/users/${userId}`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ attributes })
    }
  );
}

/**
 * 1️⃣ /authorize
 * Point d’entrée "comme ProConnect"
 */
app.get('/authorize', (req, res) => {
  const { state, login_hint } = req.query;

  const kcAuthorize = new URL(
    `${KEYCLOAK_PUBLIC_BASE}/realms/${REALM}/protocol/openid-connect/auth`
  );

  kcAuthorize.searchParams.set('client_id', CLIENT_ID);
  kcAuthorize.searchParams.set('response_type', 'code');
  kcAuthorize.searchParams.set('scope', 'openid');
  kcAuthorize.searchParams.set('redirect_uri', `${SIMULATOR_PUBLIC_BASE}/callback`);
  kcAuthorize.searchParams.set('state', state || '');
  kcAuthorize.searchParams.set('login_hint', login_hint || '');

  res.redirect(kcAuthorize.toString());
});

/**
 * 2️⃣ /callback
 * L'utilisateur est authentifié → affichage page ProConnect-like
 */
app.get('/callback', (req, res) => {
  const { state, login_hint } = req.query;

  res.send(`
    <html>
      <body>
        <h1>ProConnect – Choisissez votre entreprise</h1>

        <form method="POST" action="/select">
          <input type="hidden" name="state" value="${state || ''}">
          <input type="hidden" name="username" value="${login_hint || 'testuser'}">

          <button name="siret" value="83525644700011">
            Entreprise A – 83525644700011
          </button>

          <br/><br/>

          <button name="siret" value="12345678900022">
            Entreprise B – 12345678900022
          </button>
        </form>
      </body>
    </html>
  `);
});

/**
 * 3️⃣ /select
 * Sélection entreprise → MAJ Keycloak → nouvel authorize
 */
app.post('/select', async (req, res) => {
  const { siret, state, username } = req.body;

  const adminToken = await getAdminToken();
  const userId = await getUserIdByUsername(adminToken, username);

  if (!userId) {
    return res.status(400).send('Utilisateur introuvable');
  }

  // Mise à jour CONTEXTUELLE de l'entreprise
  await updateUserAttributes(adminToken, userId, {
    siret: [siret],
    organization: [`Entreprise ${siret}`]
  });

  // Nouvel authorize FINAL vers l'app métier
  const finalAuthorize = new URL(
    `${KEYCLOAK_PUBLIC_BASE}/realms/${REALM}/protocol/openid-connect/auth`
  );

  finalAuthorize.searchParams.set('client_id', CLIENT_ID);
  finalAuthorize.searchParams.set('response_type', 'code');
  finalAuthorize.searchParams.set('scope', 'openid');
  finalAuthorize.searchParams.set('redirect_uri', APP_PUBLIC_REDIRECT_URI);
  finalAuthorize.searchParams.set('state', state || '');


  res.redirect(finalAuthorize.toString());
});

/**
 * Start
 */
app.listen(PORT, () => {
  console.log(`🟨 ProConnect simulator running on http://localhost:${PORT}`);
});
