import { redirect } from "next/navigation";

import { MyCompaniesPage } from "~/modules/my-space";
import { LOGIN } from "~/modules/routes";
import { auth } from "~/server/auth";
import { HydrateClient } from "~/trpc/server";

export const metadata = { title: "Mes entreprises" };

export default async function Page() {
	const session = await auth();

	if (!session?.user) {
		redirect(LOGIN);
	}

	return (
		<HydrateClient>
			<MyCompaniesPage />
		</HydrateClient>
	);
}
