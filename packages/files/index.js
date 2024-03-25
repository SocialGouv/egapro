const express = require('express');
const basicAuth = require('basic-auth');
const fs = require('fs');
const path = require('path');
const app = express();
const port = 8080;

const rootPath = process.env.ROOT_PATH || process.cwd();
const trustedProxyIP = process.env.TRUSTED_PROXY_IP;
const authPasswdFile = process.env.AUTH_PASSWD_FILE;
const whiteListIP = process.env.WHITELIST_IP.split(",");
const filesPublic = process.env.FILES_PUBLIC.split(",");
const filesRestricted = process.env.FILES_RESTRICTED.split(",");

function readAuthFile(filePath) {
  const credentials = {};
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

function getClientIp(req) {
  if (req.headers['x-forwarded-for'] === trustedProxyIP) {
    const xForwardedFor = req.headers['x-original-forwarded-for'];
    return xForwardedFor.split(',')[0]; // Assuming the client IP is the first one in the list
  }
  return null; // Client IP could not be validated
}

function basicAuthentication(req, res, next) {
  const user = basicAuth(req);
  if (!user || !users[user.name] || users[user.name] !== user.pass) {
    res.set('WWW-Authenticate', 'Basic realm="401"');
    res.status(401).send('Authentication required.');
    return;
  }
  next();
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
      basicAuthentication(req, res, next);
    }
  } else {
    res.status(404).send()
    return
  }
});
app.use((req, res) => {
  const filePath = req.path
  res.setHeader('Content-Disposition', 'attachment; filename=' + path.basename(filePath));
  res.sendFile(filePath, { root: rootPath });
})

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}/`);
});
