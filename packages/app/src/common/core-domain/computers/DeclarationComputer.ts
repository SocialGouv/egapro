import { IndicateurCinqComputer } from "@common/core-domain/computers/IndicateurCinqComputer";
import { IndicateurDeuxComputer } from "@common/core-domain/computers/IndicateurDeuxComputer";
import { IndicateurDeuxTroisComputer } from "@common/core-domain/computers/IndicateurDeuxTroisComputer";
import { IndicateurQuatreComputer } from "@common/core-domain/computers/IndicateurQuatreComputer";
import { IndicateurTroisComputer } from "@common/core-domain/computers/IndicateurTroisComputer";
import { IndicateurUnComputer } from "@common/core-domain/computers/IndicateurUnComputer";
import { type Declaration } from "@common/core-domain/domain/Declaration";
import {
  type DeclarationDTO,
  type FavorablePopulationEnum,
  type IndicatorKey,
} from "@common/core-domain/dtos/DeclarationDTO";
import assert from "assert";

import { CompanyWorkforceRange } from "../domain/valueObjects/declaration/CompanyWorkforceRange";
import { FavorablePopulation } from "../domain/valueObjects/declaration/indicators/FavorablePopulation";

const indicateurUn = new IndicateurUnComputer();
const indicateurDeux = new IndicateurDeuxComputer(indicateurUn);
const indicateurTrois = new IndicateurTroisComputer(indicateurUn);
const indicateurDeuxTrois = new IndicateurDeuxTroisComputer(indicateurUn);
const indicateurQuatre = new IndicateurQuatreComputer();
const indicateurCinq = new IndicateurCinqComputer();

export const indicatorNoteMax: Record<IndicatorKey, number> = {
  remunerations: indicateurUn.getMaxNote(),
  augmentations: indicateurDeux.getMaxNote(),
  promotions: indicateurTrois.getMaxNote(),
  "augmentations-et-promotions": indicateurDeuxTrois.getMaxNote(),
  "conges-maternite": indicateurQuatre.getMaxNote(),
  "hautes-remunerations": indicateurCinq.getMaxNote(),
};

type IndicatorBase =
  | {
      isComputable: false;
    }
  | { favorablePopulation?: FavorablePopulationEnum; isComputable: true; result: number };

type DeclarationComputerInputBase = {
  highRemunerations: Omit<Extract<IndicatorBase, { isComputable: true }>, "isComputable">;
  maternityLeaves:
    | Extract<IndicatorBase, { isComputable: false }>
    | Omit<Extract<IndicatorBase, { isComputable: true }>, "favorablePopulation">;
  remunerations: IndicatorBase;
};

type DeclarationComputerInputFrom50To250 = DeclarationComputerInputBase & {
  range: CompanyWorkforceRange.Enum.FROM_50_TO_250;
  salaryRaisesAndPromotions:
    | Extract<IndicatorBase, { isComputable: false }>
    | (Extract<IndicatorBase, { isComputable: true }> & { employeesCountResult: number });
};

type DeclarationComputerInputFrom250ToInfinity = DeclarationComputerInputBase & {
  promotions: IndicatorBase;
  range: CompanyWorkforceRange.Enum.FROM_251_TO_999 | CompanyWorkforceRange.Enum.FROM_1000_TO_MORE;
  salaryRaises: IndicatorBase;
};

type DeclarationComputerInput = DeclarationComputerInputFrom50To250 | DeclarationComputerInputFrom250ToInfinity;

type DeclarationComputerOutput = {
  [K in
    | "maternityLeaves"
    | "promotions"
    | "remunerations"
    | "salaryRaises"
    | "salaryRaisesAndPromotions" as `${K}Score`]?: number;
} & {
  computablePoints: number;
  highRemunerationsScore: number;
  index?: number; // undefined means NC.
  points: number;
};

/** Helper to convert a 3 values favorable population in a 2 values with undefined */
export const toBinaryFavorablePopulation = (populationFavorable: FavorablePopulation.Enum) =>
  (populationFavorable === FavorablePopulation.Enum.EQUALITY
    ? undefined
    : populationFavorable) as FavorablePopulationEnum;

/** Helper to convert a 2 values favorable population with undefined in a 3 values */
export const toTernaryFavorablePopulation = (populationFavorable?: FavorablePopulationEnum) =>
  (!populationFavorable ? FavorablePopulation.Enum.EQUALITY : populationFavorable) as FavorablePopulation.Enum;

export const DeclarationComputerInputBuilder = {
  fromDeclaration(domain: Declaration) {
    // When périodeSuffisante is not "oui", we can't compute the index.
    assert(domain.sufficientPeriod, "sufficientPeriod must be true to compute the index");
    assert(domain.company.range, "entreprise.range must be set");
    assert(
      domain.remunerations && domain.maternityLeaves && domain.highRemunerations,
      "indicators must be set when sufficientPeriod is true",
    );

    // Handle indicator 2, 3 and 2&3.
    if (domain.company.range.getValue() === CompanyWorkforceRange.Enum.FROM_50_TO_250) {
      assert(domain.salaryRaisesAndPromotions, "indicators must be set when sufficientPeriod is true");
      if (domain.salaryRaisesAndPromotions?.notComputableReason === undefined) {
        assert(
          domain.salaryRaisesAndPromotions.favorablePopulation,
          "salaryRaisesAndPromotions.favorablePopulation must be set when computable",
        );
        assert(
          domain.salaryRaisesAndPromotions.result !== undefined,
          "salaryRaisesAndPromotions.result must be set when computable",
        );
        assert(
          domain.salaryRaisesAndPromotions.employeesCountResult !== undefined,
          "salaryRaisesAndPromotions.employeesCountResult must be set when computable",
        );
      }
    } else {
      assert(domain.salaryRaises && domain.promotions, "indicators must be set when sufficientPeriod is true");
      if (domain.salaryRaises?.notComputableReason === undefined) {
        assert(domain.salaryRaises.favorablePopulation, "salaryRaises.favorablePopulation must be set when computable");
        assert(domain.salaryRaises.result !== undefined, "salaryRaises.result must be set when computable");
      }
      if (domain.promotions?.notComputableReason === undefined) {
        assert(domain.promotions.favorablePopulation, "promotions.favorablePopulation must be set when computable");
        assert(domain.promotions.result !== undefined, "promotions.result must be set when computable");
      }
    }

    if (domain.remunerations.notComputableReason === undefined) {
      assert(domain.remunerations.favorablePopulation, "remunerations.favorablePopulation must be set when computable");
      assert(domain.remunerations.result !== undefined, "remunerations.result must be set when computable");
    }

    if (domain.maternityLeaves.notComputableReason === undefined) {
      assert(domain.maternityLeaves.result !== undefined, "maternityLeaves.result must be set when computable");
    }

    const input: DeclarationComputerInput = {
      remunerations:
        domain.remunerations.notComputableReason === undefined
          ? {
              favorablePopulation: toBinaryFavorablePopulation(domain.remunerations.favorablePopulation!.getValue()),
              isComputable: true,
              result: domain.remunerations.result!.getValue() || 0,
            }
          : {
              isComputable: false,
            },

      maternityLeaves:
        domain.maternityLeaves.notComputableReason === undefined
          ? {
              isComputable: true,
              result: domain.maternityLeaves.result!.getValue(),
            }
          : {
              isComputable: false,
            },
      highRemunerations: {
        favorablePopulation: toBinaryFavorablePopulation(domain.highRemunerations.favorablePopulation.getValue()),
        result: domain.highRemunerations.result.getValue(),
      },
      ...(domain.company.range.getValue() === CompanyWorkforceRange.Enum.FROM_50_TO_250
        ? {
            range: CompanyWorkforceRange.Enum.FROM_50_TO_250,
            salaryRaisesAndPromotions:
              domain.salaryRaisesAndPromotions!.notComputableReason === undefined // Unfortunately, previous assert is ignored by TS.
                ? {
                    isComputable: true,
                    favorablePopulation: toBinaryFavorablePopulation(
                      domain.salaryRaisesAndPromotions!.favorablePopulation!.getValue(),
                    ),
                    result: domain.salaryRaisesAndPromotions!.result!.getValue(),
                    employeesCountResult: domain.salaryRaisesAndPromotions!.employeesCountResult!.getValue(),
                  }
                : {
                    isComputable: false,
                  },
          }
        : {
            range: domain.company.range.getValue() as
              | CompanyWorkforceRange.Enum.FROM_251_TO_999
              | CompanyWorkforceRange.Enum.FROM_1000_TO_MORE,
            salaryRaises:
              domain.salaryRaises!.notComputableReason === undefined
                ? {
                    isComputable: true,
                    favorablePopulation: toBinaryFavorablePopulation(
                      domain.salaryRaises!.favorablePopulation!.getValue(),
                    ),
                    result: domain.salaryRaises!.result!.getValue(),
                  }
                : {
                    isComputable: false,
                  },
            promotions:
              domain.promotions!.notComputableReason === undefined
                ? {
                    isComputable: true,
                    favorablePopulation: toBinaryFavorablePopulation(
                      domain.promotions!.favorablePopulation!.getValue(),
                    ),
                    result: domain.promotions!.result!.getValue(),
                  }
                : {
                    isComputable: false,
                  },
          }),
    };

    return input;
  },

  fromDeclarationDTO(dto: DeclarationDTO): DeclarationComputerInput {
    // When périodeSuffisante is not "oui", we can't compute the index.
    assert(dto["periode-reference"]?.périodeSuffisante === "oui", "periode-reference.périodeSuffisante must be set");

    assert(dto.entreprise?.tranche, "entreprise.tranche must be set");
    assert(dto.remunerations?.estCalculable !== undefined, "remunerations.estCalculable must be set");
    assert(dto["conges-maternite"]?.estCalculable !== undefined, "conges-maternite.estCalculable must be set");

    if (dto.remunerations.estCalculable === "oui") {
      assert(dto["remunerations-resultat"]?.résultat !== undefined, "résultat must be set if indicator is computable");
    }

    if (dto.entreprise.tranche === CompanyWorkforceRange.Enum.FROM_50_TO_250) {
      assert(
        dto["augmentations-et-promotions"]?.estCalculable !== undefined,
        "augmentations-et-promotions.estCalculable must be set",
      );

      if (dto["augmentations-et-promotions"].estCalculable === "oui") {
        assert(
          dto["augmentations-et-promotions"].résultat !== undefined,
          "résultat must be set if indicator is computable",
        );
        assert(
          dto["augmentations-et-promotions"].résultatEquivalentSalarié !== undefined,
          "résultatEquivalentSalarié must be set if indicator is computable",
        );
      }
    } else {
      assert(dto.augmentations?.estCalculable !== undefined, "augmentations.estCalculable must be set");
      assert(dto.promotions?.estCalculable !== undefined, "promotions.estCalculable must be set");

      if (dto.augmentations.estCalculable === "oui") {
        assert(dto.augmentations.résultat !== undefined, "résultat must be set if indicator is computable");
      }
      if (dto.promotions.estCalculable === "oui") {
        assert(dto.promotions.résultat !== undefined, "résultat must be set if indicator is computable");
      }
    }

    if (dto["conges-maternite"].estCalculable === "oui") {
      assert(dto["conges-maternite"].résultat !== undefined, "résultat must be set if indicator is computable");
    }

    assert(dto["hautes-remunerations"]?.résultat !== undefined, "result must be set");

    const input: DeclarationComputerInput = {
      remunerations:
        dto.remunerations.estCalculable === "oui"
          ? {
              favorablePopulation: dto["remunerations-resultat"]!.populationFavorable,
              isComputable: true,
              result: dto["remunerations-resultat"]!.résultat,
            }
          : {
              isComputable: false,
            },
      maternityLeaves:
        dto["conges-maternite"].estCalculable === "oui"
          ? {
              isComputable: true,
              result: dto["conges-maternite"].résultat,
            }
          : {
              isComputable: false,
            },
      highRemunerations: {
        favorablePopulation: dto["hautes-remunerations"].populationFavorable,
        result: dto["hautes-remunerations"].résultat,
      },

      ...(dto.entreprise.tranche === CompanyWorkforceRange.Enum.FROM_50_TO_250
        ? {
            range: CompanyWorkforceRange.Enum.FROM_50_TO_250,
            salaryRaisesAndPromotions:
              dto["augmentations-et-promotions"]!.estCalculable === "oui"
                ? {
                    isComputable: true,
                    favorablePopulation: dto["augmentations-et-promotions"]!.populationFavorable,
                    result: dto["augmentations-et-promotions"]!.résultat,
                    employeesCountResult: dto["augmentations-et-promotions"]!.résultatEquivalentSalarié,
                  }
                : {
                    isComputable: false,
                  },
          }
        : {
            range: dto.entreprise.tranche as
              | CompanyWorkforceRange.Enum.FROM_251_TO_999
              | CompanyWorkforceRange.Enum.FROM_1000_TO_MORE,
            salaryRaises:
              dto.augmentations!.estCalculable === "oui"
                ? {
                    isComputable: true,
                    favorablePopulation: dto.augmentations!.populationFavorable,
                    result: dto.augmentations!.résultat,
                  }
                : {
                    isComputable: false,
                  },
            promotions:
              dto.promotions!.estCalculable === "oui"
                ? {
                    isComputable: true,
                    favorablePopulation: dto.promotions!.populationFavorable,
                    result: dto.promotions!.résultat,
                  }
                : {
                    isComputable: false,
                  },
          }),
    };

    return input;
  },
};

export const computeDeclarationIndex = (input: DeclarationComputerInput): DeclarationComputerOutput => {
  let points = 0,
    computablePoints = 0,
    salaryRaisesAndPromotionsScore,
    salaryRaisesScore,
    promotionsScore,
    maternityLeavesScore,
    remunerationsScore;

  if (input.remunerations.isComputable) {
    remunerationsScore = indicateurUn.computeNote(input.remunerations.result) || 0;
    points += remunerationsScore;
    computablePoints += indicateurUn.getMaxNote();
  }

  if (input.range === CompanyWorkforceRange.Enum.FROM_50_TO_250) {
    if (input.salaryRaisesAndPromotions.isComputable) {
      if (
        input.remunerations.isComputable &&
        input.remunerations.favorablePopulation !== input.salaryRaisesAndPromotions.favorablePopulation
      ) {
        salaryRaisesAndPromotionsScore = indicateurDeuxTrois.getMaxNote();
      } else {
        const percentScore = indicateurDeuxTrois.computeNote(input.salaryRaisesAndPromotions.result) || 0;
        const absoluteScore =
          indicateurDeuxTrois.computeNote(input.salaryRaisesAndPromotions.employeesCountResult) || 0;

        salaryRaisesAndPromotionsScore = Math.max(percentScore, absoluteScore);
      }
      points += salaryRaisesAndPromotionsScore;
      computablePoints += indicateurDeuxTrois.getMaxNote();
    }
  } else {
    if (input.salaryRaises.isComputable) {
      if (
        input.remunerations.isComputable &&
        input.remunerations.favorablePopulation !== input.salaryRaises.favorablePopulation
      ) {
        salaryRaisesScore = indicateurDeux.getMaxNote();
      } else {
        salaryRaisesScore = indicateurDeux.computeNote(input.salaryRaises.result) || 0;
      }
      points += salaryRaisesScore;
      computablePoints += indicateurDeux.getMaxNote();
    }
    if (input.promotions.isComputable) {
      if (
        input.remunerations.isComputable &&
        input.remunerations.favorablePopulation !== input.promotions.favorablePopulation
      ) {
        promotionsScore = indicateurTrois.getMaxNote();
      } else {
        promotionsScore = indicateurTrois.computeNote(input.promotions.result) || 0;
      }
      points += promotionsScore;
      computablePoints += indicateurTrois.getMaxNote();
    }
  }

  if (input.maternityLeaves.isComputable) {
    maternityLeavesScore = indicateurQuatre.computeNote(input.maternityLeaves.result) || 0;
    points += maternityLeavesScore;
    computablePoints += indicateurQuatre.getMaxNote();
  }

  const highRemunerationsScore = indicateurCinq.computeNote(input.highRemunerations.result) || 0;
  points += highRemunerationsScore;
  computablePoints += indicateurCinq.getMaxNote();

  return {
    highRemunerationsScore,
    maternityLeavesScore,
    promotionsScore,
    remunerationsScore,
    salaryRaisesAndPromotionsScore,
    salaryRaisesScore,
    points,
    computablePoints,
    index: computablePoints >= 75 ? Math.round((points / computablePoints) * 100) : undefined,
  };
};
