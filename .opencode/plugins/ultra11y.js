// ultra11y for OpenCode: the commit / push / PR gate and the `review-a11y` + `ultra11y` skills.
//
// Loaded from the app's devDependency (packages/app/package.json) rather than copied or pinned
// to `ultra11y@latest`: OpenCode then runs the very engine version the CI and the git hooks run,
// and `scripts/a11y/check-ultra11y-version.sh` keeps that single version coherent.
// A missing install degrades to a no-op plugin — it must never break a session.
const target = new URL(
	"../../packages/app/node_modules/ultra11y/.opencode/plugins/ultra11y.js",
	import.meta.url,
);

let plugin = { id: "ultra11y", setup() {}, server: async () => ({}) };
try {
	plugin = (await import(target.href)).default;
} catch {
	console.error(
		"ultra11y: plugin not found — run `pnpm install` at the repository root.",
	);
}

export default plugin;
