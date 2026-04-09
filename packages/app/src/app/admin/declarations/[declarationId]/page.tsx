import { AdminDeclarationDetailPage } from "~/modules/admin/declarations";

type Props = {
	params: Promise<{ declarationId: string }>;
};

export default async function Page({ params }: Props) {
	const { declarationId } = await params;

	return <AdminDeclarationDetailPage declarationId={declarationId} />;
}
