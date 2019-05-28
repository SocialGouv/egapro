global.fetch = require("node-fetch");
global.Headers = fetch.Headers;

const configs = require('./config');
const api = require('./kinto-api');

const bucketName = 'egapro';
const collectionName = 'indicators_datas';

api.createAdmin(configs.adminLogin, configs.adminPassword)
    .then((res) => {
        if (res.code && res.code === 401) {
            console.log("[admin creation] admin account already exists");
        } else {
            console.log("[admin creation] ", res);
        }
        return api.createBucket(bucketName);
    })
    .then((res) => {
        console.log("[bucket creation] ", res);
        return api.createCollection(bucketName, collectionName);
    })
    .then(res => console.log("[collection creation] ", res));