const express = require('express');
const basicAuth = require('basic-auth');
const fs = require('fs');
const path = require('path');
const app = express();
const port = 8080;
const bcrypt = require('bcryptjs');

app.disable('x-powered-by');


async function verifyPassword(providedPassword, storedHash) {
    try {
        const match = await bcrypt.compare(providedPassword, storedHash);
        return match;
    } catch (error) {
        console.error('Error verifying password:', error);
        return false;
    }
}


const rootPath = process.env.ROOT_PATH || process.cwd();
const trustedProxyIP = process.env.TRUSTED_PROXY_IP;
// Basic-auth credentials (htpasswd format, bcrypt hashes) are never baked in the
// image: they are mounted at runtime from the `basic-auth` Kubernetes Secret
// (see .kontinuous/values.yaml) or generated locally by `scripts/files-htpasswd`.
const authPasswdFile = process.env.AUTH_PASSWD_FILE || '/secrets/basic-auth.passwd';
const whiteListIP = process.env.WHITELIST_IP.split(",");
const filesPublic = process.env.FILES_PUBLIC.split(",").map(f=>`/${f}`);
const filesRestricted = process.env.FILES_RESTRICTED.split(",").map(f=>`/${f}`);

function readAuthFile(filePath) {
  const credentials = {};
  if (!fs.existsSync(filePath)) {
    // Fail closed: without credentials nobody can pass basic auth.
    console.error(`Auth file ${filePath} not found: basic authentication is disabled for restricted files.`);
    return credentials;
  }
  const content = fs.readFileSync(filePath, { encoding: 'utf-8' });
  content.split('\n').forEach(line => {
    const [username, password] = line.split(':');
    if (username && password) {
      credentials[username.trim()] = password.trim();
    }
  });
  return credentials;
}

const users = readAuthFile(authPasswdFile);

// Compared against when the user name is unknown, so that a wrong name costs the
// same bcrypt time as a wrong password (no user enumeration by timing).
const unknownUserHash = bcrypt.hashSync('unknown-user', 10);

// Basic auth is reachable from the internet: lock an IP out after repeated failures.
const MAX_FAILED_ATTEMPTS = 10;
const FAILED_ATTEMPTS_WINDOW_MS = 15 * 60 * 1000;
const MAX_TRACKED_IPS = 10000;
const failedAttempts = new Map();

function isLockedOut(ip, now = Date.now()) {
  const entry = failedAttempts.get(ip);
  if (!entry) return false;
  if (entry.resetAt <= now) {
    failedAttempts.delete(ip);
    return false;
  }
  return entry.count >= MAX_FAILED_ATTEMPTS;
}

function recordFailedAttempt(ip, now = Date.now()) {
  if (failedAttempts.size >= MAX_TRACKED_IPS) {
    for (const [trackedIp, entry] of failedAttempts) {
      if (entry.resetAt <= now) failedAttempts.delete(trackedIp);
    }
  }
  const entry = failedAttempts.get(ip);
  if (entry && entry.resetAt > now) {
    entry.count += 1;
  } else if (failedAttempts.size < MAX_TRACKED_IPS) {
    failedAttempts.set(ip, { count: 1, resetAt: now + FAILED_ATTEMPTS_WINDOW_MS });
  }
}

// Returns the last (right-most) entry of a comma separated forwarded-for list:
// it is the one appended by the closest proxy, the only one a client cannot forge.
function lastForwardedIp(header) {
  if (!header) return undefined;
  const ips = String(header).split(',').map(ip => ip.trim()).filter(Boolean);
  return ips[ips.length - 1];
}

function getClientIp(req) {
  // X-Real-IP is overwritten by the ingress controller with the TCP peer address
  // ($remote_addr): client supplied values are never trusted.
  const peerIp = req.headers['x-real-ip'];
  if (trustedProxyIP && peerIp === trustedProxyIP) {
    // Request relayed by our trusted upstream proxy: ingress-nginx copies the
    // X-Forwarded-For it received into X-Original-Forwarded-For. The client IP is
    // the entry appended by that proxy (the last one); earlier entries are
    // client controlled and must be ignored.
    return lastForwardedIp(req.headers['x-original-forwarded-for']);
  }
  return peerIp;
}


async function basicAuthentication(req, res, next, clientIp) {
  const ipKey = clientIp || 'unknown';
  if (isLockedOut(ipKey)) {
    res.status(429).send('Too many failed attempts, try again later.');
    return;
  }
  const user = basicAuth(req);
  if (user) {
    const knownUser = Object.hasOwn(users, user.name);
    const passwordMatches = await verifyPassword(user.pass, knownUser ? users[user.name] : unknownUserHash);
    if (knownUser && passwordMatches) {
      next();
      return;
    }
    recordFailedAttempt(ipKey);
  }
  res.set('WWW-Authenticate', 'Basic realm="401"');
  res.status(401).send('Authentication required.');
}

app.use((req, res, next) => {
  const filePath = req.path
  if(filesPublic.includes(filePath)){
    next();
    return
  } else if (filesRestricted.includes(filePath)){
    const clientIp = getClientIp(req);
    if (clientIp && whiteListIP.includes(clientIp)) {
      next();
    } else {
      basicAuthentication(req, res, next, clientIp);
    }
  } else {
    res.status(404).send()
    return
  }
});

const resolvedRootPath = path.resolve(rootPath);

app.use((req, res) => {
  const filePath = req.path
  // Defense in depth: only whitelisted names reach this handler, but make sure the
  // resolved path can never escape the served directory.
  const absolutePath = path.resolve(resolvedRootPath, '.' + filePath);
  if (!absolutePath.startsWith(resolvedRootPath + path.sep)) {
    res.status(404).send()
    return
  }
  // The attachment header only goes with the file itself: a missing export is a plain 404,
  // without the server path that Express puts in its default error page.
  res.sendFile(
    absolutePath,
    { headers: { 'Content-Disposition': 'attachment; filename=' + path.basename(absolutePath) } },
    err => {
      if (err && !res.headersSent) res.status(404).send();
    },
  );
})

if (require.main === module) {
  app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}/`);
  });
}

module.exports = { app };
