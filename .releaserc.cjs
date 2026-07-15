// semantic-release configuration.
//
// master / beta keep the full flow: changelog + version-bump commit pushed
// back to the branch by @semantic-release/git.
//
// alpha only produces a tag + a GitHub (pre)release: the branch is protected
// ("changes must be made through a pull request"), so the version-bump commit
// would be rejected by the remote — and a prerelease does not need a
// CHANGELOG entry. Consumers of the alpha channel (promote-test-env.yaml)
// only rely on the tag and the published GitHub release.
const { execSync } = require("node:child_process")

const branch =
  process.env.GITHUB_REF_NAME ||
  execSync("git rev-parse --abbrev-ref HEAD", { encoding: "utf8" }).trim()

const commitPlugins = [
  "@semantic-release/changelog",
  "@semantic-release/npm",
  [
    "@semantic-release/git",
    {
      assets: ["CHANGELOG.md", "package.json"],
      message: "chore(release): ${nextRelease.version} [skip ci]",
    },
  ],
]

module.exports = {
  branches: [
    "master",
    { name: "beta", prerelease: true },
    { name: "alpha", prerelease: true },
  ],
  plugins: [
    "@semantic-release/commit-analyzer",
    "@semantic-release/release-notes-generator",
    ...(branch === "alpha" ? [] : commitPlugins),
    "@semantic-release/github",
  ],
}
