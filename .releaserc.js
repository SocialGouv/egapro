/** @type {import("semantic-release").Options} */
const config = {
    extends: "@socialgouv/releaserc",
    branches: ["master", "beta", "alpha", "next"]
};

module.exports = config;
