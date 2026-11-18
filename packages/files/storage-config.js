const STORAGE_KEYS = [
  'S3_ENDPOINT',
  'S3_REGION',
  'S3_BUCKET_NAME',
  'S3_PREFIX',
  'S3_ACCESS_KEY_ID',
  'S3_SECRET_ACCESS_KEY',
];

const REQUIRED_KEYS = STORAGE_KEYS.filter(key => key !== 'S3_PREFIX');

// Shared with the api generator, which reads the very same variables: one
// contract for both runtimes. Returns null while no storage is configured, so
// the server keeps serving the local volume until the exports move (see #5241).
function readStorageConfig(env = process.env) {
  if (!STORAGE_KEYS.some(key => env[key])) {
    return null;
  }
  const missing = REQUIRED_KEYS.filter(key => !env[key]);
  if (missing.length > 0) {
    throw new Error(`Missing storage configuration: ${missing.join(', ')}`);
  }
  return {
    endpoint: env.S3_ENDPOINT,
    region: env.S3_REGION,
    bucket: env.S3_BUCKET_NAME,
    prefix: (env.S3_PREFIX || '').replace(/^\/+|\/+$/g, ''),
    accessKeyId: env.S3_ACCESS_KEY_ID,
    secretAccessKey: env.S3_SECRET_ACCESS_KEY,
  };
}

module.exports = { readStorageConfig };
