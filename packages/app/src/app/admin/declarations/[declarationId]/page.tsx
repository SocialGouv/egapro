import { AdminDeclarationDetailPage } from "~/modules/admin/declarations";
import { HydrateClient } from "~/trpc/server";

type Props = {
	params: Promise<{ declarationId: string }>;
};

export default async function Page({ params }: Props) {
	const { declarationId } = await params;

	return (
		<HydrateClient>
			<AdminDeclarationDetailPage declarationId={declarationId} />
		</HydrateClient>
	);
}
