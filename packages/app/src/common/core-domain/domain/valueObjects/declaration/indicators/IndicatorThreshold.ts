// Thresholds are of form {threshold: note}

import { type DeclarationFormState, type IndicatorKey } from "@services/form/declaration/DeclarationFormBuilder";
import { max } from "lodash";

type THRESHOLD = Map<number, number>;

export const REMUNERATIONS_THRESHOLDS: THRESHOLD = new Map([
  [0.0, 40],
  [0.05, 39],
  [1.05, 38],
  [2.05, 37],
  [3.05, 36],
  [4.05, 35],
  [5.05, 34],
  [6.05, 33],
  [7.05, 31],
  [8.05, 29],
  [9.05, 27],
  [10.05, 25],
  [11.05, 23],
  [12.05, 21],
  [13.05, 19],
  [14.05, 17],
  [15.05, 14],
  [16.05, 11],
  [17.05, 8],
  [18.05, 5],
  [19.05, 2],
  [20.05, 0],
]);

export const AUGMENTATIONS_HP_THRESHOLDS: THRESHOLD = new Map([
  [0.0, 20],
  [2.05, 10],
  [5.05, 5],
  [10.05, 0],
]);

export const AUGMENTATIONS_PROMOTIONS_THRESHOLDS: THRESHOLD = new Map([
  [0.0, 35],
  [2.05, 25],
  [5.05, 15],
  [10.05, 0],
]);

export const PROMOTIONS_THRESHOLDS: THRESHOLD = new Map([
  [0.0, 15],
  [2.05, 10],
  [5.05, 5],
  [10.05, 0],
]);

export const CONGES_MATERNITE_THRESHOLDS: THRESHOLD = new Map([
  [0.0, 0],
  [100.0, 15],
]);

export const HAUTES_REMUNERATIONS_THRESHOLDS: THRESHOLD = new Map([
  [0, 0],
  [2, 5],
  [4, 10],
  [6, 0],
]);

export const computeGenericIndicatorNote = (result: number, thresholds: THRESHOLD) => {
  let previous = 0;

  thresholds.forEach((note, threshold) => {
    if (result >= threshold) previous = note;
  });

  return previous;
};

export const indicatorNoteMax: Record<IndicatorKey, number> = {
  remunerations: max([...REMUNERATIONS_THRESHOLDS].map(([, note]) => note)) as number,
  augmentations: max([...AUGMENTATIONS_HP_THRESHOLDS].map(([, note]) => note)) as number,
  promotions: max([...PROMOTIONS_THRESHOLDS].map(([, note]) => note)) as number,
  "augmentations-et-promotions": max([...AUGMENTATIONS_PROMOTIONS_THRESHOLDS].map(([, note]) => note)) as number,
  "conges-maternite": max([...CONGES_MATERNITE_THRESHOLDS].map(([, note]) => note)) as number,
  "hautes-remunerations": max([...HAUTES_REMUNERATIONS_THRESHOLDS].map(([, note]) => note)) as number,
};

export const computeIndicator1Note = (result: number) => computeGenericIndicatorNote(result, REMUNERATIONS_THRESHOLDS);
export const computeIndicator2Note = (result: number) =>
  computeGenericIndicatorNote(result, AUGMENTATIONS_HP_THRESHOLDS);
export const computeIndicator3Note = (result: number) => computeGenericIndicatorNote(result, PROMOTIONS_THRESHOLDS);
export const computeIndicator2And3Note = (result: number) =>
  computeGenericIndicatorNote(result, AUGMENTATIONS_PROMOTIONS_THRESHOLDS);
export const computeIndicator4Note = (result: number) =>
  computeGenericIndicatorNote(result, CONGES_MATERNITE_THRESHOLDS);
export const computeIndicator5Note = (result: number) =>
  computeGenericIndicatorNote(result, HAUTES_REMUNERATIONS_THRESHOLDS);

export const computeIndex = (formState: DeclarationFormState) => {
  let points = 0;
  let max = 0;

  if (formState["remunerations"]?.estCalculable === "oui") {
    points += formState["remunerations-resultat"]?.note || 0;
    max += indicatorNoteMax.remunerations;
  }

  if (formState.entreprise?.tranche === "50:250") {
    if (formState["augmentations-et-promotions"]?.estCalculable === "oui") {
      points += formState["augmentations-et-promotions"]?.note || 0;
      max += indicatorNoteMax["augmentations-et-promotions"];
    }
  } else {
    // TODO
  }

  if (formState["conges-maternite"]?.estCalculable === "oui") {
    points += formState["conges-maternite"].note;
    max += indicatorNoteMax["conges-maternite"];
  }

  points += formState["hautes-remunerations"]?.note || 0;
  max += indicatorNoteMax["hautes-remunerations"];

  return {
    points,
    pointsCalculables: max,
    index: Math.floor((points / max) * 100),
  };
};

/*
def compute_notes(data):
    # Remove note from previous computation
    clean_readonly(data, schema.SCHEMA)

    if "indicateurs" not in data:
        return
    points = 0
    maximum = 0
    population_favorable = None

    # indicateurs 1
    if not data.path("indicateurs.rémunérations.non_calculable"):
        result = data.path("indicateurs.rémunérations.résultat")
        note = compute_note(result, REMUNERATIONS_THRESHOLDS)
        if note is not None:
            if note != 40:
                # note=40 would mean equality
                population_favorable = data.path(
                    "indicateurs.rémunérations.population_favorable"
                )
            maximum += 40
            data["indicateurs"]["rémunérations"]["note"] = note
            points += note

    # indicateurs 2
    if not data.path("indicateurs.augmentations.non_calculable"):
        note = compute_note(
            data.path("indicateurs.augmentations.résultat"),
            AUGMENTATIONS_HP_THRESHOLDS,
        )
        if note is not None:
            maximum += 20
            indic_favorable = data.path(
                "indicateurs.augmentations.population_favorable"
            )
            if population_favorable and population_favorable != indic_favorable:
                # Cf https://www.legifrance.gouv.fr/jorf/id/JORFTEXT000037964765/ Annexe 5.2
                note = 20
            data["indicateurs"]["augmentations"]["note"] = note
            points += note

    # indicateurs 2et3
    if not data.path("indicateurs.augmentations_et_promotions.non_calculable"):
        # in percent
        percent = compute_note(
            data.path("indicateurs.augmentations_et_promotions.résultat"),
            AUGMENTATIONS_PROMOTIONS_THRESHOLDS,
        )

        if percent is not None:
            data["indicateurs"]["augmentations_et_promotions"][
                "note_en_pourcentage"
            ] = percent
        # in absolute
        absolute = compute_note(
            data.path(
                "indicateurs.augmentations_et_promotions.résultat_nombre_salariés"
            ),
            AUGMENTATIONS_PROMOTIONS_THRESHOLDS,
        )
        if absolute is not None:
            data["indicateurs"]["augmentations_et_promotions"][
                "note_nombre_salariés"
            ] = absolute
        if absolute is not None or percent is not None:
            absolute = absolute or 0
            percent = percent or 0
            note = max(absolute, percent)
            maximum += 35
            indic_favorable = data.path(
                "indicateurs.augmentations_et_promotions.population_favorable"
            )
            if population_favorable and population_favorable != indic_favorable:
                # Cf https://www.legifrance.gouv.fr/jorf/id/JORFTEXT000037964765/ Annexe 5.2
                note = 35
            data["indicateurs"]["augmentations_et_promotions"]["note"] = note
            points += note

    # indicateurs 3
    if not data.path("indicateurs.promotions.non_calculable"):
        note = compute_note(
            data.path("indicateurs.promotions.résultat"), PROMOTIONS_THRESHOLDS
        )
        if note is not None:
            maximum += 15
            indic_favorable = data.path("indicateurs.promotions.population_favorable")
            if population_favorable and population_favorable != indic_favorable:
                # Cf https://www.legifrance.gouv.fr/jorf/id/JORFTEXT000037964765/ Annexe 5.2
                note = 15
            data["indicateurs"]["promotions"]["note"] = note
            points += note

    # indicateurs 4
    if not data.path("indicateurs.congés_maternité.non_calculable"):
        result = data.path("indicateurs.congés_maternité.résultat")
        if result is not None:
            note = 15 if result == 100 else 0
            maximum += 15
            data["indicateurs"]["congés_maternité"]["note"] = note
            points += note

    # indicateurs 5
    note = compute_note(
        data.path("indicateurs.hautes_rémunérations.résultat"),
        HAUTES_REMUNERATIONS_THRESHOLDS,
    )
    if note is not None:
        maximum += 10
        data["indicateurs"]["hautes_rémunérations"]["note"] = note
        points += note

    # Global counts
    data["déclaration"]["points"] = points
    data["déclaration"]["points_calculables"] = maximum
    if maximum >= 75:
        # Make sure to round up halway
        # cf https://stackoverflow.com/a/33019698/
        data["déclaration"]["index"] = math.floor((points / maximum * 100) + 0.5)

  */
