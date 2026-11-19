const path = require('path');
const { GetObjectCommand, HeadObjectCommand, S3Client } = require('@aws-sdk/client-s3');

const { readStorageConfig } = require('./storage-config');

const CONTENT_TYPES = {
  '.csv': 'text/csv; charset=utf-8',
  '.ndjson': 'application/x-ndjson',
  '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
};

// The api generator publishes without a Content-Type: the type is derived from the
// file name, which is the only thing both runtimes agree on. Keeps what the files
// server used to answer when it served the volume.
function contentTypeFor(name, stored) {
  return CONTENT_TYPES[path.extname(name)] || stored || 'application/octet-stream';
}

function objectKey(name, prefix) {
  return prefix ? `${prefix}/${name}` : name;
}

class StorageError extends Error {
  constructor(kind, cause) {
    super(`Storage ${kind}`);
    this.name = 'StorageError';
    this.kind = kind;
    this.cause = cause;
  }
}

// The storage answers the same codes as HTTP: map them to outcomes the server acts
// on, so that no SDK detail leaks into the request handling.
function kindOf(error) {
  const status = error && error.$metadata && error.$metadata.httpStatusCode;
  if (status === 404) return 'missing';
  if (status === 304) return 'not-modified';
  if (status === 416) return 'range';
  return 'unavailable';
}

function createStorage(config, { client } = {}) {
  const s3 = client || new S3Client({
    endpoint: config.endpoint,
    region: config.region,
    credentials: { accessKeyId: config.accessKeyId, secretAccessKey: config.secretAccessKey },
  });
  const key = name => objectKey(name, config.prefix);

  async function send(command) {
    try {
      return await s3.send(command);
    } catch (error) {
      throw new StorageError(kindOf(error), error);
    }
  }

  async function head(name, { ifModifiedSince, ifNoneMatch } = {}) {
    const object = await send(new HeadObjectCommand({
      Bucket: config.bucket,
      Key: key(name),
      IfModifiedSince: ifModifiedSince,
      IfNoneMatch: ifNoneMatch,
    }));
    return {
      contentLength: object.ContentLength,
      contentType: contentTypeFor(name, object.ContentType),
      lastModified: object.LastModified,
      etag: object.ETag,
    };
  }

  async function get(name, { range, ifModifiedSince, ifNoneMatch } = {}) {
    const object = await send(new GetObjectCommand({
      Bucket: config.bucket,
      Key: key(name),
      Range: range,
      IfModifiedSince: ifModifiedSince,
      IfNoneMatch: ifNoneMatch,
    }));
    return {
      body: object.Body,
      status: object.$metadata?.httpStatusCode === 206 ? 206 : 200,
      contentLength: object.ContentLength,
      contentRange: object.ContentRange,
      contentType: contentTypeFor(name, object.ContentType),
      lastModified: object.LastModified,
      etag: object.ETag,
    };
  }

  return { get, head };
}

// A missing or half-sealed configuration must not crash the pod: the server keeps
// answering, and the export requests fail with a neutral storage error until the
// credentials are provided.
function resolveStorage(env) {
  let config;
  try {
    config = readStorageConfig(env);
  } catch (error) {
    console.error(`Invalid storage configuration: ${error.message}`);
    return null;
  }
  if (!config) {
    console.error('Storage is not configured: the exports cannot be served.');
    return null;
  }
  return createStorage(config);
}

module.exports = { StorageError, createStorage, resolveStorage };
