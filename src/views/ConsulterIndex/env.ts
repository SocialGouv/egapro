const envSuffix = process.env.REACT_APP_ENV_SUFFIX || "";
export const CSV_DOWNLOAD_URL = `https://egaproprod.blob.core.windows.net/public/index-egalite-hf${envSuffix}.csv`;
