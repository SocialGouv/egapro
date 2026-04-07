import { notFound } from "next/navigation";

import { env } from "~/env.js";
import { PanelPlayground } from "~/modules/my-space";

export default function TestPanelPage() {
	if (env.NODE_ENV === "production") {
		notFound();
	}
	return <PanelPlayground />;
}
