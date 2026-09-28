import { redirect } from "next/navigation";
import { HomePage } from "~/modules/home";
import { MY_SPACE } from "~/modules/routes";
import { auth } from "~/server/auth";
import { HydrateClient } from "~/trpc/server";

export const metadata = { title: "Accueil" };

export default async function Page() {
	const session = await auth();

	if (session?.user) {
		redirect(MY_SPACE);
	}

	return (
		<HydrateClient>
			<HomePage />
		</HydrateClient>
	);
}
