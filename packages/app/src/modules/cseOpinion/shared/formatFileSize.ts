export function formatFileSize(bytes: number): string {
	if (bytes < 1024) return `${bytes} o`;
	if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} Ko`;
	return `${(bytes / (1024 * 1024)).toFixed(2)} Mo`;
}
