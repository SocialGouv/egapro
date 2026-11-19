const { after, before, describe, it } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { Readable } = require('node:stream');
const bcrypt = require('bcryptjs');

const { StorageError } = require('./storage');

const root = fs.mkdtempSync(path.join(os.tmpdir(), 'egapro-files-'));
const passwdFile = path.join(root, 'passwd');
fs.writeFileSync(passwdFile, `admin:${bcrypt.hashSync('right-password', 4)}\n`);

Object.assign(process.env, {
  AUTH_PASSWD_FILE: passwdFile,
  WHITELIST_IP: '10.0.0.1',
  FILES_PUBLIC: 'index-egalite-fh.xlsx,missing-public.xlsx,broken-public.xlsx,slow-public.xlsx',
  FILES_RESTRICTED: 'dgt.xlsx',
});

const { createApp } = require('./index');

const LAST_MODIFIED = new Date('2026-01-01T00:00:00Z');

// Same contract as the object storage: absent objects and failed conditions are
// errors carrying the HTTP status the storage would answer.
class FakeStorage {
  constructor(objects) {
    this.objects = objects;
    this.streams = [];
  }

  lookup(name) {
    const object = this.objects[name];
    if (!object) throw new StorageError('missing');
    if (object.failure) throw new StorageError(object.failure);
    return object;
  }

  body(object, slice) {
    const stream = object.slow
      ? new Readable({
        read() {
          setTimeout(() => this.push(slice ? slice.slice(0, 1) : null), 5);
        },
      })
      : Readable.from([slice]);
    this.streams.push(stream);
    return stream;
  }

  async head(name, { ifModifiedSince, ifNoneMatch } = {}) {
    const object = this.lookup(name);
    if (isNotModified(object, { ifModifiedSince, ifNoneMatch })) {
      throw new StorageError('not-modified');
    }
    return this.metadata(object, object.content);
  }

  async get(name, { range, ifModifiedSince, ifNoneMatch } = {}) {
    const object = this.lookup(name);
    if (isNotModified(object, { ifModifiedSince, ifNoneMatch })) {
      throw new StorageError('not-modified');
    }
    if (!range) {
      return { ...this.metadata(object, object.content), body: this.body(object, object.content), status: 200 };
    }
    const match = /^bytes=(\d+)-(\d*)$/.exec(range);
    const start = match ? Number(match[1]) : Number.NaN;
    if (!match || start >= object.content.length) {
      throw new StorageError('range');
    }
    const end = match[2] ? Math.min(Number(match[2]), object.content.length - 1) : object.content.length - 1;
    const slice = object.content.slice(start, end + 1);
    return {
      ...this.metadata(object, slice),
      body: this.body(object, slice),
      status: 206,
      contentRange: `bytes ${start}-${end}/${object.content.length}`,
    };
  }

  metadata(object, content) {
    return {
      contentLength: content.length,
      contentType: object.contentType || 'application/octet-stream',
      lastModified: object.lastModified || LAST_MODIFIED,
      etag: object.etag || '"an-etag"',
    };
  }
}

function isNotModified(object, { ifModifiedSince, ifNoneMatch } = {}) {
  const etag = object.etag || '"an-etag"';
  if (ifNoneMatch && (ifNoneMatch === etag || ifNoneMatch === '*')) return true;
  if (ifModifiedSince && (object.lastModified || LAST_MODIFIED) <= ifModifiedSince) return true;
  return false;
}

const storage = new FakeStorage({
  'index-egalite-fh.xlsx': {
    content: 'public export',
    contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  },
  'dgt.xlsx': { content: 'restricted export' },
  'broken-public.xlsx': { failure: 'unavailable' },
  'slow-public.xlsx': { content: 'a slow export', slow: true },
});

let server;
let baseUrl;
let storagelessServer;
let storagelessUrl;

function start(app) {
  const started = app.listen(0);
  return new Promise(resolve => {
    started.once('listening', () => resolve({ server: started, url: `http://127.0.0.1:${started.address().port}` }));
  });
}

before(async () => {
  ({ server, url: baseUrl } = await start(createApp({ storage })));
  ({ server: storagelessServer, url: storagelessUrl } = await start(createApp({ storage: null })));
});

after(() => {
  server.close();
  storagelessServer.close();
  fs.rmSync(root, { recursive: true, force: true });
});

const get = (file, { ip, user, password, headers = {}, method = 'GET', base = baseUrl, signal } = {}) =>
  fetch(`${base}/${file}`, {
    method,
    signal,
    headers: {
      ...(ip ? { 'x-real-ip': ip } : {}),
      ...(user ? { authorization: `Basic ${Buffer.from(`${user}:${password}`).toString('base64')}` } : {}),
      ...headers,
    },
  });

describe('files server', () => {
  it('serves a public file as an attachment', async () => {
    const res = await get('index-egalite-fh.xlsx');
    assert.equal(res.status, 200);
    assert.equal(res.headers.get('content-disposition'), 'attachment; filename=index-egalite-fh.xlsx');
    assert.equal(res.headers.get('content-length'), '13');
    assert.equal(res.headers.get('content-type'), 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    assert.equal(res.headers.get('accept-ranges'), 'bytes');
    assert.equal(res.headers.get('x-powered-by'), null);
    assert.equal(await res.text(), 'public export');
  });

  it('answers a missing export with a bare 404, without the server path nor the attachment header', async () => {
    const res = await get('missing-public.xlsx');
    assert.equal(res.status, 404);
    assert.equal(res.headers.get('content-disposition'), null);
    const body = await res.text();
    assert.doesNotMatch(body, /a-bucket|s3|egapro-files|NoSuchKey/i);
  });

  it('answers a HEAD request with the size, the date, the type and the attachment name', async () => {
    const res = await get('index-egalite-fh.xlsx', { method: 'HEAD' });
    assert.equal(res.status, 200);
    assert.equal(res.headers.get('content-length'), '13');
    assert.equal(res.headers.get('last-modified'), LAST_MODIFIED.toUTCString());
    assert.equal(res.headers.get('content-type'), 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    assert.equal(res.headers.get('content-disposition'), 'attachment; filename=index-egalite-fh.xlsx');
    assert.equal(await res.text(), '');
  });

  it('answers a HEAD request on a missing export with a bare 404', async () => {
    const res = await get('missing-public.xlsx', { method: 'HEAD' });
    assert.equal(res.status, 404);
    assert.equal(res.headers.get('content-disposition'), null);
  });

  it('serves a restricted file to a whitelisted IP', async () => {
    const res = await get('dgt.xlsx', { ip: '10.0.0.1' });
    assert.equal(res.status, 200);
    assert.equal(await res.text(), 'restricted export');
  });

  it('asks for credentials on a restricted file from another IP', async () => {
    const res = await get('dgt.xlsx', { ip: '10.9.9.9' });
    assert.equal(res.status, 401);
    assert.equal(res.headers.get('www-authenticate'), 'Basic realm="401"');
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

  it('answers a range request with a 206 whose parts rebuild the whole export', async () => {
    const first = await get('index-egalite-fh.xlsx', { headers: { range: 'bytes=0-5' } });
    assert.equal(first.status, 206);
    assert.equal(first.headers.get('content-range'), 'bytes 0-5/13');

    const resume = await get('index-egalite-fh.xlsx', { headers: { range: 'bytes=6-' } });
    assert.equal(resume.status, 206);
    assert.equal(resume.headers.get('content-range'), 'bytes 6-12/13');

    assert.equal(await first.text() + await resume.text(), 'public export');
  });

  it('answers 304 when the client already has the export', async () => {
    const res = await get('index-egalite-fh.xlsx', { headers: { 'if-none-match': '"an-etag"' } });
    assert.equal(res.status, 304);
  });

  it('answers 304 when the export was not modified since the client copy', async () => {
    const res = await get('index-egalite-fh.xlsx', {
      headers: { 'if-modified-since': new Date('2026-02-01T00:00:00Z').toUTCString() },
    });
    assert.equal(res.status, 304);
  });

  it('answers a storage failure with a neutral 5xx, not a denied access', async () => {
    const res = await get('broken-public.xlsx');
    assert.equal(res.status, 502);
    assert.notEqual(res.status, 401);
    assert.notEqual(res.status, 403);
    assert.equal(await res.text(), 'File storage unavailable.');
  });

  it('answers a neutral 5xx when the storage is not configured', async () => {
    const res = await get('index-egalite-fh.xlsx', { base: storagelessUrl });
    assert.equal(res.status, 502);
    assert.equal(await res.text(), 'File storage unavailable.');
  });

  it('stops reading the storage when the client disconnects', async () => {
    const controller = new AbortController();
    const res = await get('slow-public.xlsx', { signal: controller.signal });
    const reader = res.body.getReader();
    await reader.read();
    const stream = storage.streams.at(-1);
    assert.equal(stream.destroyed, false);

    controller.abort();
    await new Promise(resolve => setTimeout(resolve, 100));

    assert.equal(stream.destroyed, true);
  });

  it('refuses a path that is not one of the exports', async () => {
    const res = await get('docker-compose.yml');
    assert.equal(res.status, 404);
  });

  it('refuses a method other than GET and HEAD', async () => {
    const res = await get('index-egalite-fh.xlsx', { method: 'POST' });
    assert.equal(res.status, 405);
    assert.equal(res.headers.get('allow'), 'GET, HEAD');
  });
});
