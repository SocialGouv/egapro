import type { ReactNode } from "react";
import { EmailBody } from "./EmailBody.js";
import { EmailFooter } from "./EmailFooter.js";
import { EmailHeader } from "./EmailHeader.js";
import { EmailIllustration } from "./EmailIllustration.js";
import { EmailLayout } from "./EmailLayout.js";

type EmailShellProps = {
	previewText: string;
	illustrationTitle?: string;
	children: ReactNode;
};

export function EmailShell({
	previewText,
	illustrationTitle,
	children,
}: EmailShellProps) {
	return (
		<EmailLayout previewText={previewText}>
			<EmailHeader />
			<EmailIllustration title={illustrationTitle} />
			<EmailBody>{children}</EmailBody>
			<EmailFooter />
		</EmailLayout>
	);
}
