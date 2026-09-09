import { redirect } from "next/navigation";
import { cseOpinionStepHref } from "~/modules/routes";

export const metadata = { title: "Avis du CSE" };

export default function CseOpinionPage() {
	redirect(cseOpinionStepHref(1));
}
