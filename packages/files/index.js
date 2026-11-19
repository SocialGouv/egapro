const express = require('express');
const basicAuth = require('basic-auth');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const { StorageError, resolveStorage } = require('./storage');
const port = 8080;

async function verifyPassword(providedPassword, storedHash) {
    try {
        const match = await bcrypt.compare(providedPassword, storedHash);
        return match;
    } catch (error) {
        console.error('Error verifying password:', error);
        return false;
    }
}


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


function setFileHeaders(res, name, metadata) {
  res.set('Content-Disposition', `attachment; filename=${name}`);
  res.set('Content-Type', metadata.contentType);
  res.set('Accept-Ranges', 'bytes');
  if (metadata.contentLength !== undefined) {
    res.set('Content-Length', String(metadata.contentLength));
  }
  if (metadata.contentRange) {
    res.set('Content-Range', metadata.contentRange);
  }
  if (metadata.lastModified) {
    res.set('Last-Modified', metadata.lastModified.toUTCString());
  }
  if (metadata.etag) {
    res.set('ETag', metadata.etag);
  }
}

// A storage failure is ours, not the caller's: it must never be answered with the
// 401/403 of the access control, nor with any storage detail.
function respondToStorageError(res, error) {
  if (res.headersSent) {
    res.destroy();
    return;
  }
  if (error instanceof StorageError) {
    if (error.kind === 'missing') {
      res.status(404).send();
      return;
    }
    if (error.kind === 'not-modified') {
      res.status(304).end();
      return;
    }
    if (error.kind === 'range') {
      res.status(416).send();
      return;
    }
    console.error('Storage error while serving a file:', error.cause || error);
  } else {
    console.error('Unexpected error while serving a file:', error);
  }
  res.status(502).send('File storage unavailable.');
}

function conditionalHeaders(req) {
  const conditions = {};
  if (req.headers['if-none-match']) {
    conditions.ifNoneMatch = req.headers['if-none-match'];
  }
  if (req.headers['if-modified-since']) {
    const since = new Date(req.headers['if-modified-since']);
    if (!Number.isNaN(since.getTime())) {
      conditions.ifModifiedSince = since;
    }
  }
  return conditions;
}

function createApp({ storage = resolveStorage(process.env) } = {}) {
  const app = express();

  app.disable('x-powered-by');

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

  // The exports live in the object storage only: no read path falls back to the
  // local volume, so that several instances serve the very same files.
  app.use(async (req, res) => {
    const name = req.path.slice(1);
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      res.set('Allow', 'GET, HEAD');
      res.status(405).send();
      return;
    }
    if (!storage) {
      res.status(502).send('File storage unavailable.');
      return;
    }
    const conditions = conditionalHeaders(req);
    try {
      if (req.method === 'HEAD') {
        setFileHeaders(res, name, await storage.head(name, conditions));
        res.status(200).end();
        return;
      }
      const object = await storage.get(name, { range: req.headers.range, ...conditions });
      setFileHeaders(res, name, object);
      res.status(object.status);
      // The client may hang up in the middle of a large export: stop reading the
      // storage instead of finishing a transfer nobody receives.
      res.on('close', () => object.body.destroy());
      object.body.on('error', () => res.destroy());
      object.body.pipe(res);
    } catch (error) {
      respondToStorageError(res, error);
    }
  });

  return app;
}

if (require.main === module) {
  createApp().listen(port, () => {
    console.log(`Server running at http://localhost:${port}/`);
  });
}

module.exports = { createApp };
