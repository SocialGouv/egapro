import { redirect } from "next/navigation";

import { MonEspacePage } from "~/modules/my-space";
import { auth } from "~/server/auth";
import { HydrateClient } from "~/trpc/server";

export default async function Page() {
	const session = await auth();

	if (!session?.user) {
		redirect("/login");
	}

	return (
		<HydrateClient>
			<MonEspacePage
				siret={session.user.siret ?? null}
				userPhone={session.user.phone ?? null}
			/>
		</HydrateClient>
	);
}
