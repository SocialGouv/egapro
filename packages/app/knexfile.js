require("ts-node").register();
require("tsconfig-paths").register();
require("dotenv").config({ path: ".env.development" });

module.exports = require("./src/api/core-domain/infra/db/knex").knexConfig;
