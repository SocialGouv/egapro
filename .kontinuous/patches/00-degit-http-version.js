// The Git 2.34 bundled in Kontinuous' degit image fails its GitHub HTTP/2
// upload-pack exchange. Force HTTP/1.1 only for these init containers.
const gitHttpConfig = [
	{ name: "GIT_CONFIG_COUNT", value: "1" },
	{ name: "GIT_CONFIG_KEY_0", value: "http.version" },
	{ name: "GIT_CONFIG_VALUE_0", value: "HTTP/1.1" },
];

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

			container.env ??= [];

			for (const variable of gitHttpConfig) {
				const existing = container.env.find(
					({ name }) => name === variable.name,
				);

				if (existing) {
					existing.value = variable.value;
				} else {
					container.env.push({ ...variable });
				}
			}
		}
	}

	return manifests;
};
