// Kontinuous' degit sometimes extracts its target and then never exits, which
// leaves the job stuck in Init until the deployment times out. Stop it once the
// extraction is over and the tree has stopped changing, and fail fast if it
// never gets there. In git mode, tiged clones into a hidden scratch directory
// inside the target, moves the files out, then deletes it (`.git` without a
// subdirectory): files in place with no scratch directory left is its own end
// of extraction.
const STABLE_SECONDS = 15;
const TIMEOUT_SECONDS = 300;

const watchdog = (degitLine, target) =>
	[
		`${degitLine} &`,
		"ks_degit_pid=$!",
		"ks_degit_elapsed=0",
		"ks_degit_stable=0",
		'ks_degit_previous=""',
		'while kill -0 "$ks_degit_pid" 2>/dev/null; do',
		`  ks_degit_current="$(find "${target}" -printf '%P %s %T@\\n' 2>/dev/null | sort)"`,
		`  if [ -n "$(find "${target}" -mindepth 1 -maxdepth 1 ! -name '.*' 2>/dev/null)" ] && [ ! -e "${target}/.tiged" ] && [ ! -e "${target}/.git" ] && [ "$ks_degit_current" = "$ks_degit_previous" ]; then`,
		"    ks_degit_stable=$((ks_degit_stable + 1))",
		"  else",
		"    ks_degit_stable=0",
		"  fi",
		`  if [ "$ks_degit_stable" -ge ${STABLE_SECONDS} ]; then`,
		`    echo "kontinuous: degit extracted ${target} but did not exit, stopping it" >&2`,
		'    kill "$ks_degit_pid" 2>/dev/null',
		"    exit 0",
		"  fi",
		`  if [ "$ks_degit_elapsed" -ge ${TIMEOUT_SECONDS} ]; then`,
		`    echo "kontinuous: degit did not finish within ${TIMEOUT_SECONDS}s" >&2`,
		'    kill "$ks_degit_pid" 2>/dev/null',
		"    exit 1",
		"  fi",
		'  ks_degit_previous="$ks_degit_current"',
		"  ks_degit_elapsed=$((ks_degit_elapsed + 1))",
		"  sleep 1",
		"done",
		'wait "$ks_degit_pid"',
	].join("\n");

const withWatchdog = (script) => {
	const lines = script.split("\n");
	const degitIndexes = lines
		.map((line, index) =>
			line.startsWith("degit ") && !line.trimEnd().endsWith("&") ? index : -1,
		)
		.filter((index) => index !== -1);

	if (degitIndexes.length !== 1) {
		return script;
	}

	const [index] = degitIndexes;
	const degitLine = lines[index].trim();
	const target = degitLine.split(/\s+/).at(-1);

	lines[index] = watchdog(degitLine, target);

	return lines.join("\n");
};

module.exports = (manifests) => {
	for (const manifest of manifests) {
		const initContainers = manifest.spec?.template?.spec?.initContainers;

		if (!Array.isArray(initContainers)) {
			continue;
		}

		for (const container of initContainers) {
			if (container.name !== "degit-action") {
				continue;
			}

			const { command } = container;

			if (
				!Array.isArray(command) ||
				command.length !== 3 ||
				command[0] !== "sh" ||
				command[1] !== "-c"
			) {
				continue;
			}

			command[2] = withWatchdog(command[2]);
		}
	}

	return manifests;
};
