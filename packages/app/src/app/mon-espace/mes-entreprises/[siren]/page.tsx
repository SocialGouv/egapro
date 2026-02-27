import { redirect } from "next/navigation";

import { CompanyDeclarationsPage } from "~/modules/my-space";
import { auth } from "~/server/auth";
import { api, HydrateClient } from "~/trpc/server";

type Props = {
	params: Promise<{ siren: string }>;
};

export default async function Page({ params }: Props) {
	const session = await auth();

	if (!session?.user) {
		redirect("/login");
	}

	const { siren } = await params;
	const data = await api.company.getWithDeclarations({ siren });

	return (
		<HydrateClient>
			<CompanyDeclarationsPage
				company={data.company}
				declarations={data.declarations}
				userPhone={session.user.phone ?? null}
			/>
		</HydrateClient>
	);
}
