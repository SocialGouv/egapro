import dynamic from "next/dynamic";
import { notFound } from "next/navigation";

import { env } from "~/env.js";

const RepresentationPlayground = dynamic(() =>
	import("~/modules/declaration-representation").then(
		(m) => m.RepresentationPlayground,
	),
);

const RepresentationPanelPlayground = dynamic(() =>
	import("~/modules/my-space/RepresentationPanelPlayground").then(
		(m) => m.RepresentationPanelPlayground,
	),
);

export default function RepresentationTestPanelPage() {
	if (env.NODE_ENV === "production") {
		notFound();
	}
	return (
		<>
			<RepresentationPlayground />
			<RepresentationPanelPlayground />
		</>
	);
}
