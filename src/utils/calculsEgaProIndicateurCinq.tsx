function clamp(num: number, min: number, max: number) {
  return Math.min(max, Math.max(min, num));
}

//////////////////
// INDICATEUR 5 //
//////////////////

const baremeEcartRemuneration = [0, 0, 5, 5, 10, 10];

export const calculIndicateurSexeSousRepresente = (
  nombreSalariesHommes: number | undefined,
  nombreSalariesFemmes: number | undefined
): "hommes" | "femmes" | "egalite" | undefined =>
  nombreSalariesHommes !== undefined && nombreSalariesFemmes !== undefined
    ? nombreSalariesHommes > nombreSalariesFemmes
      ? "hommes"
      : nombreSalariesHommes < nombreSalariesFemmes
      ? "femmes"
      : "egalite"
    : undefined;

export const calculIndicateurNombreSalariesSexeSousRepresente = (
  nombreSalariesHommes: number | undefined,
  nombreSalariesFemmes: number | undefined
): number | undefined =>
  nombreSalariesHommes !== undefined && nombreSalariesFemmes !== undefined
    ? Math.min(nombreSalariesHommes, nombreSalariesFemmes)
    : undefined;

// NOTE
export const calculNote = (
  indicateurNombreSalariesSexeSousRepresente: number | undefined
): number | undefined =>
  indicateurNombreSalariesSexeSousRepresente !== undefined
    ? baremeEcartRemuneration[
        clamp(
          indicateurNombreSalariesSexeSousRepresente,
          0,
          baremeEcartRemuneration.length - 1
        )
      ]
    : undefined;
