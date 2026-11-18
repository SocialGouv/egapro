const { describe, it } = require('node:test');
const assert = require('node:assert/strict');

const { readStorageConfig } = require('./storage-config');

const complete = {
  S3_ENDPOINT: 'https://s3.example',
  S3_REGION: 'gra',
  S3_BUCKET_NAME: 'a-bucket',
  S3_ACCESS_KEY_ID: 'an-access-key',
  S3_SECRET_ACCESS_KEY: 'a-secret-key',
};

describe('storage configuration', () => {
  it('is not configured when no storage variable is set', () => {
    assert.equal(readStorageConfig({}), null);
  });

  it('reads the values shared with the api generator', () => {
    assert.deepEqual(readStorageConfig({ ...complete, S3_PREFIX: '/exports/' }), {
      endpoint: 'https://s3.example',
      region: 'gra',
      bucket: 'a-bucket',
      prefix: 'exports',
      accessKeyId: 'an-access-key',
      secretAccessKey: 'a-secret-key',
    });
  });

  it('defaults an absent prefix to the bucket root', () => {
    assert.equal(readStorageConfig(complete).prefix, '');
  });

  it('names every missing key instead of failing later on a network error', () => {
    assert.throws(
      () => readStorageConfig({ S3_ENDPOINT: 'https://s3.example', S3_REGION: 'gra' }),
      /Missing storage configuration: S3_BUCKET_NAME, S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY/,
    );
  });
});
