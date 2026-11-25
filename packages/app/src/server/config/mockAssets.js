const MOCK_GIP_TRACING_INCLUDES = {
	"/api/gip-mds/mock": ["./data/mock-gip-mds.csv"],
};

/**
 * @param {string | undefined} deployEnv
 * @returns {boolean}
 */
function isMockEnvironment(deployEnv) {
	return deployEnv === undefined || deployEnv === "" || deployEnv === "dev";
}

/**
 * @param {string | undefined} deployEnv
 * @returns {Record<string, string[]>}
 */
export function getMockFileTracingIncludes(deployEnv) {
	return isMockEnvironment(deployEnv) ? MOCK_GIP_TRACING_INCLUDES : {};
}
