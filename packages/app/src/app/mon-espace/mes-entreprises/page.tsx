import { redirect } from "next/navigation";

import { MyCompaniesPage } from "~/modules/my-space";
import { auth } from "~/server/auth";
import { HydrateClient } from "~/trpc/server";

export default async function Page() {
	const session = await auth();

	if (!session?.user) {
		redirect("/login");
	}

	return (
		<HydrateClient>
			<MyCompaniesPage />
		</HydrateClient>
	);
}
