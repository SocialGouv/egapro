"use client";

import { formatFileMeta } from "./uploadConfig";
import { useFileSize } from "./useFileSize";

type Props = {
	href: string;
	format?: string;
};

export function FileFormatDetail({ href, format = "PDF" }: Props) {
	const sizeBytes = useFileSize(href);

	return <>{formatFileMeta(format, sizeBytes)}</>;
}
