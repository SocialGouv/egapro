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

// In CI, GITHUB_REF_NAME is always set; the git fallback only serves local
// dry-runs and must fail with an explicit message (detached HEAD, no git…).
const branch =
  process.env.GITHUB_REF_NAME ||
  (() => {
    try {
      return execSync("git rev-parse --abbrev-ref HEAD", {
        encoding: "utf8",
      }).trim()
    } catch (error) {
      throw new Error(
        "[.releaserc.cjs] Cannot determine current branch: GITHUB_REF_NAME is unset and `git rev-parse --abbrev-ref HEAD` failed.",
        { cause: error },
      )
    }
  })()

// Explicit allowlist: only branches the release bot is allowed to push to get
// the version-bump commit plugins. Any other release branch (current or
// future) defaults to the safe tag-only flow.
const COMMIT_PLUGIN_BRANCHES = ["master", "beta"]

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
    ...(COMMIT_PLUGIN_BRANCHES.includes(branch) ? commitPlugins : []),
    "@semantic-release/github",
  ],
}
