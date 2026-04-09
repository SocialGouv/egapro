import { AdminDeclarationsPage } from "~/modules/admin/declarations";
import { HydrateClient } from "~/trpc/server";

export default function Page() {
	return (
		<HydrateClient>
			<AdminDeclarationsPage />
		</HydrateClient>
	);
}
