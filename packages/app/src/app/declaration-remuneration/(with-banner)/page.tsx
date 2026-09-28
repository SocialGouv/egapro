import type { Metadata } from "next";
import { redirect } from "next/navigation";
import {
	FIRST_REMUNERATION_STEP,
	remunerationStepHref,
} from "~/modules/routes";

export const metadata: Metadata = {
	title: "Déclaration des écarts de rémunération",
};

export default function DeclarationPage() {
	redirect(remunerationStepHref(FIRST_REMUNERATION_STEP));
}
