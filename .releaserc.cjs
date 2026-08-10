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

// Conventional-commits preset shared by the analyzer and the notes generator.
// The default `angular` preset hardcodes its type→section map in
// conventional-changelog-angular/src/writer.js: every type other than
// feat/fix/perf/revert (and breaking changes) is `return undefined` — hidden.
// That silently drops ~1 commit in 5 from the release notes. The
// `conventionalcommits` preset honours `presetConfig.types`, so we control
// which types render and under which (French) section heading.
//
// `releaseRules` is intentionally NOT set: @semantic-release/commit-analyzer
// derives the bump level from its own default-release-rules.js
// (breaking→major, feat→minor, fix|perf|revert→patch), independent of the
// preset, so the preset only supplies parserOpts and does not change WHEN a
// release is cut.
const conventionalPreset = {
  preset: "conventionalcommits",
  presetConfig: {
    types: [
      { type: "feat", section: "Nouveautés" },
      { type: "fix", section: "Corrections" },
      { type: "perf", section: "Performances" },
      { type: "revert", section: "Retours-arrière" },
      { type: "refactor", section: "Refactorisation" },
      { type: "docs", section: "Documentation" },
      { type: "chore", hidden: true },
      { type: "ci", hidden: true },
      { type: "build", hidden: true },
      { type: "style", hidden: true },
      { type: "test", hidden: true },
    ],
  },
}

module.exports = {
  branches: [
    "master",
    { name: "beta", prerelease: true },
    { name: "alpha", prerelease: true },
  ],
  plugins: [
    ["@semantic-release/commit-analyzer", conventionalPreset],
    ["@semantic-release/release-notes-generator", conventionalPreset],
    ...(COMMIT_PLUGIN_BRANCHES.includes(branch) ? commitPlugins : []),
    [
      "@semantic-release/github",
      {
        // The default only carries the channel (`released on @alpha`), which
        // never says which prerelease an issue shipped in. Labels are lodash
        // templates rendered with the semantic-release context.
        releasedLabels: ["released <%= nextRelease.gitTag %>"],
      },
    ],
  ],
}
