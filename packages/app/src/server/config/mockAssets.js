const MOCK_GIP_TRACING_INCLUDES = {
	"/api/gip-mds/mock": ["./data/mock-gip-mds.csv"],
};

/**
 * @param {string | undefined} deployEnv
 * @returns {boolean}
 */
export function isDevEnvironment(deployEnv) {
	return deployEnv === undefined || deployEnv === "" || deployEnv === "dev";
}

/**
 * @param {string | undefined} deployEnv
 * @returns {Record<string, string[]>}
 */
export function getMockFileTracingIncludes(deployEnv) {
	return isDevEnvironment(deployEnv) ? MOCK_GIP_TRACING_INCLUDES : {};
}
