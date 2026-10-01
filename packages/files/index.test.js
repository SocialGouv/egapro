const { after, before, describe, it } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const bcrypt = require('bcryptjs');

const root = fs.mkdtempSync(path.join(os.tmpdir(), 'egapro-files-'));
const passwdFile = path.join(root, 'passwd');
fs.writeFileSync(passwdFile, `admin:${bcrypt.hashSync('right-password', 4)}\n`);
fs.writeFileSync(path.join(root, 'dgt.xlsx'), 'restricted');
fs.writeFileSync(path.join(root, 'index-egalite-fh.xlsx'), 'public');

Object.assign(process.env, {
  ROOT_PATH: root,
  AUTH_PASSWD_FILE: passwdFile,
  WHITELIST_IP: '10.0.0.1',
  FILES_PUBLIC: 'index-egalite-fh.xlsx,missing-public.xlsx',
  FILES_RESTRICTED: 'dgt.xlsx',
});

const { app } = require('./index');

let server;
let baseUrl;

before(async () => {
  server = app.listen(0);
  await new Promise(resolve => server.once('listening', resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(() => {
  server.close();
  fs.rmSync(root, { recursive: true, force: true });
});

const get = (file, { ip, user, password } = {}) =>
  fetch(`${baseUrl}/${file}`, {
    headers: {
      ...(ip ? { 'x-real-ip': ip } : {}),
      ...(user ? { authorization: `Basic ${Buffer.from(`${user}:${password}`).toString('base64')}` } : {}),
    },
  });

describe('files server', () => {
  it('serves a public file as an attachment', async () => {
    const res = await get('index-egalite-fh.xlsx');
    assert.equal(res.status, 200);
    assert.equal(res.headers.get('content-disposition'), 'attachment; filename=index-egalite-fh.xlsx');
    assert.equal(res.headers.get('x-powered-by'), null);
  });

  it('answers a missing export with a bare 404, without the server path nor the attachment header', async () => {
    const res = await get('missing-public.xlsx');
    assert.equal(res.status, 404);
    assert.equal(res.headers.get('content-disposition'), null);
    assert.doesNotMatch(await res.text(), /ENOENT|\/tmp|egapro-files/);
  });

  it('serves a restricted file to a whitelisted IP', async () => {
    const res = await get('dgt.xlsx', { ip: '10.0.0.1' });
    assert.equal(res.status, 200);
  });

  it('serves a restricted file with the right credentials', async () => {
    const res = await get('dgt.xlsx', { ip: '10.9.9.1', user: 'admin', password: 'right-password' });
    assert.equal(res.status, 200);
  });

  it('refuses an inherited object property used as a user name', async () => {
    const res = await get('dgt.xlsx', { ip: '10.9.9.2', user: 'constructor', password: 'x' });
    assert.equal(res.status, 401);
  });

  it('locks an IP out after 10 failed attempts, even with the right password afterwards', async () => {
    const ip = '10.9.9.3';
    for (let attempt = 0; attempt < 10; attempt++) {
      const res = await get('dgt.xlsx', { ip, user: 'admin', password: `wrong-${attempt}` });
      assert.equal(res.status, 401);
    }
    const locked = await get('dgt.xlsx', { ip, user: 'admin', password: 'right-password' });
    assert.equal(locked.status, 429);

    const otherIp = await get('dgt.xlsx', { ip: '10.9.9.4', user: 'admin', password: 'right-password' });
    assert.equal(otherIp.status, 200);
  });
});
