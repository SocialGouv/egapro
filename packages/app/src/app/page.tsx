import { HomePage } from "~/modules/home";
import { HydrateClient } from "~/trpc/server";

export default async function Page() {
	return (
		<HydrateClient>
			<HomePage />
		</HydrateClient>
	);
}
