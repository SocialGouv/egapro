import { route } from "./routeContract";

export const LOGIN = route("/login");

export const MY_SPACE = route("/mon-espace");

export function mySpaceHistoryHref(siren: string, year: number) {
	return route(`/mon-espace/historique/${siren}/${year}` as const);
}
