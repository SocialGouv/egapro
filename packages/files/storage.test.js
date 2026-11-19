const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { Readable } = require('node:stream');

const { StorageError, createClient, createStorage } = require('./storage');

const CONFIG = {
  endpoint: 'https://s3.example',
  region: 'gra',
  bucket: 'a-bucket',
  prefix: '',
  accessKeyId: 'an-access-key',
  secretAccessKey: 'a-secret-key',
};
const LAST_MODIFIED = new Date('2026-01-01T00:00:00Z');

function fakeClient(respond) {
  const sent = [];
  return {
    sent,
    async send(command) {
      sent.push(command);
      return respond(command);
    },
  };
}

function storageWith(response, config = CONFIG) {
  const client = fakeClient(() => response);
  return { client, storage: createStorage(config, { client }) };
}

function httpError(status) {
  return Object.assign(new Error(`HTTP ${status}`), { $metadata: { httpStatusCode: status } });
}

describe('object storage', () => {
  it('addresses the bucket in the path, the way a local object storage answers', () => {
    const client = createClient(CONFIG);

    assert.equal(client.config.forcePathStyle, true);
  });

  it('reads the object under the bucket and the configured prefix', async () => {
    const { client, storage } = storageWith({ ContentLength: 3 }, { ...CONFIG, prefix: 'exports' });

    await storage.head('indexes.csv');

    assert.equal(client.sent[0].input.Bucket, 'a-bucket');
    assert.equal(client.sent[0].input.Key, 'exports/indexes.csv');
  });

  it('derives the content type from the export name, which is what the generator does not provide', async () => {
    const { storage } = storageWith({ ContentLength: 3, ContentType: 'binary/octet-stream' });

    assert.equal(await storage.head('indexes.csv').then(m => m.contentType), 'text/csv; charset=utf-8');
    assert.equal(await storage.head('full.ndjson').then(m => m.contentType), 'application/x-ndjson');
    assert.equal(
      await storage.head('dgt.xlsx').then(m => m.contentType),
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
  });

  it('falls back to the stored type, then to a generic one', async () => {
    const { storage: withStored } = storageWith({ ContentLength: 3, ContentType: 'application/pdf' });
    assert.equal(await withStored.head('exotic.pdf').then(m => m.contentType), 'application/pdf');

    const { storage: withoutStored } = storageWith({ ContentLength: 3 });
    assert.equal(await withoutStored.head('exotic.pdf').then(m => m.contentType), 'application/octet-stream');
  });

  it('reports the metadata the pages depend on', async () => {
    const { storage } = storageWith({ ContentLength: 12, LastModified: LAST_MODIFIED, ETag: '"an-etag"' });

    const metadata = await storage.head('dgt.xlsx');

    assert.equal(metadata.contentLength, 12);
    assert.equal(metadata.lastModified, LAST_MODIFIED);
    assert.equal(metadata.etag, '"an-etag"');
  });

  it('forwards the range and the conditional headers to the storage', async () => {
    const { client, storage } = storageWith({ Body: Readable.from(['x']), ContentLength: 1 });

    await storage.get('dgt.xlsx', {
      range: 'bytes=4-',
      ifModifiedSince: LAST_MODIFIED,
      ifNoneMatch: '"an-etag"',
    });

    assert.equal(client.sent[0].input.Range, 'bytes=4-');
    assert.equal(client.sent[0].input.IfModifiedSince, LAST_MODIFIED);
    assert.equal(client.sent[0].input.IfNoneMatch, '"an-etag"');
  });

  it('reports a partial response as 206 and a full one as 200', async () => {
    const { storage: partial } = storageWith({
      Body: Readable.from(['x']),
      ContentLength: 1,
      ContentRange: 'bytes 4-4/5',
      $metadata: { httpStatusCode: 206 },
    });
    const object = await partial.get('dgt.xlsx', { range: 'bytes=4-' });
    assert.equal(object.status, 206);
    assert.equal(object.contentRange, 'bytes 4-4/5');

    const { storage: full } = storageWith({ Body: Readable.from(['abcde']), ContentLength: 5 });
    assert.equal((await full.get('dgt.xlsx')).status, 200);
  });

  it('names an absent export apart from a storage failure', async () => {
    const failing = createStorage(CONFIG, { client: fakeClient(() => { throw httpError(404); }) });

    await assert.rejects(failing.head('missing.csv'), (error) => {
      assert.ok(error instanceof StorageError);
      assert.equal(error.kind, 'missing');
      return true;
    });
  });

  it('maps the storage answers to outcomes the server can act on', async () => {
    const cases = [
      [304, 'not-modified'],
      [412, 'unavailable'],
      [416, 'range'],
      [403, 'unavailable'],
      [500, 'unavailable'],
    ];
    for (const [status, kind] of cases) {
      const failing = createStorage(CONFIG, { client: fakeClient(() => { throw httpError(status); }) });
      await assert.rejects(failing.get('dgt.xlsx'), error => {
        assert.equal(error.kind, kind, `HTTP ${status}`);
        return true;
      });
    }
  });
});
