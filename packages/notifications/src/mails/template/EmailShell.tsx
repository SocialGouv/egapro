import type { ReactNode } from "react";
import { EmailBody } from "./EmailBody.js";
import { EmailFooter } from "./EmailFooter.js";
import { EmailHeader } from "./EmailHeader.js";
import { EmailLayout } from "./EmailLayout.js";
import { InfoBar } from "./InfoBar.js";

type EmailShellProps = {
	previewText: string;
	serviceTitle?: string;
	serviceBaseline?: string;
	directionName?: string;
	children: ReactNode;
};

export function EmailShell({
	previewText,
	serviceTitle,
	serviceBaseline,
	directionName,
	children,
}: EmailShellProps) {
	return (
		<EmailLayout previewText={previewText}>
			<EmailHeader directionName={directionName} />
			<InfoBar title={serviceTitle} baseline={serviceBaseline} />
			<EmailBody>{children}</EmailBody>
			<EmailFooter directionName={directionName} />
		</EmailLayout>
	);
}
