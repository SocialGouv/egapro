import type { Metadata } from "next";

import { AdminDeclarationDetailPage } from "~/modules/admin/declarations";

export const metadata: Metadata = { title: "Détail de la déclaration" };

type Props = {
	params: Promise<{ declarationId: string }>;
};

export default async function Page({ params }: Props) {
	const { declarationId } = await params;

	return <AdminDeclarationDetailPage declarationId={declarationId} />;
}
