import { redirect } from "next/navigation";
import { HomePage } from "~/modules/home";
import { auth } from "~/server/auth";
import { HydrateClient } from "~/trpc/server";

export default async function Page() {
	const session = await auth();

	if (session?.user) {
		redirect("/mon-espace");
	}

	return (
		<HydrateClient>
			<HomePage />
		</HydrateClient>
	);
}
