import dynamic from "next/dynamic";
import { notFound } from "next/navigation";

import { env } from "~/env.js";

const PanelPlayground = dynamic(() =>
	import("~/modules/my-space/PanelPlayground").then((m) => m.PanelPlayground),
);

export default function TestPanelPage() {
	if (env.NODE_ENV === "production") {
		notFound();
	}
	return <PanelPlayground />;
}
