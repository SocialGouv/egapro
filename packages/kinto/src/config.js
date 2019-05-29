const dotenv = require('dotenv');

dotenv.config();

module.exports.kintoURL = process.env.KINTO_URL;
module.exports.adminLogin = process.env.KINTO_ADMIN_LOGIN;
module.exports.adminPassword = process.env.KINTO_ADMIN_PASSWORD;