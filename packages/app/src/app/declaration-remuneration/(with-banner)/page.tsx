import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
	title: "Déclaration des écarts de rémunération",
};

export default function DeclarationPage() {
	redirect("/declaration-remuneration/etape/1");
}
