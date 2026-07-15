import { redirect } from "next/navigation";

export const metadata = { title: "Avis du CSE" };

export default function CseOpinionPage() {
	redirect("/avis-cse/etape/1");
}
