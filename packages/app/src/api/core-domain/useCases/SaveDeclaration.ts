import {
  computeDeclarationIndex,
  DeclarationComputerInputBuilder,
} from "@common/core-domain/computers/DeclarationComputer";
import { Declaration, type DeclarationPK, type DeclarationProps } from "@common/core-domain/domain/Declaration";
import { type Categorie } from "@common/core-domain/domain/declaration/indicators/RemunerationsIndicator";
import {
  DeclarationSpecification,
  DeclarationSpecificationError,
} from "@common/core-domain/domain/specification/DeclarationSpecification";
import { CompanyWorkforceRange } from "@common/core-domain/domain/valueObjects/declaration/CompanyWorkforceRange";
import { DeclarationSource } from "@common/core-domain/domain/valueObjects/declaration/DeclarationSource";
import { Siren } from "@common/core-domain/domain/valueObjects/Siren";
import { type CreateDeclarationDTO } from "@common/core-domain/dtos/DeclarationDTO";
import { companyMap } from "@common/core-domain/mappers/companyMap";
import { AppError, type EntityPropsToJson, type UseCase, ValidationError } from "@common/shared-domain";
import { PositiveInteger, PositiveNumber } from "@common/shared-domain/domain/valueObjects";
import { keepEntryBy } from "@common/utils/object";
import { add, isAfter } from "date-fns";

import { type IEntrepriseService } from "../infra/services/IEntrepriseService";
import { type IDeclarationRepo } from "../repo/IDeclarationRepo";

interface Input {
  declaration: CreateDeclarationDTO;
}

export class SaveDeclaration implements UseCase<Input, void> {
  constructor(
    private readonly declarationRepo: IDeclarationRepo,
    private readonly entrepriseService: IEntrepriseService,
  ) {}

  public async execute({ declaration: dto }: Input): Promise<void> {
    const now = new Date();

    const siren = dto.entreprise?.entrepriseDéclarante?.siren;
    const year = dto.commencer?.annéeIndicateurs;

    const remunerationsMode = dto.remunerations?.estCalculable === "oui" ? dto.remunerations.mode : undefined;

    if (!siren || !year) throw new Error("Missing data");

    const pk: DeclarationPK = [new Siren(siren), new PositiveNumber(year)];

    const company = companyMap.toDomain(await this.entrepriseService.siren(pk[0]));

    const partialDeclaration = {
      siren,
      year,
      declaredAt: dto["declaration-existante"].date ? new Date(dto["declaration-existante"].date) : now,
      modifiedAt: now,
      declarant: {
        email: dto.declarant?.email || "",
        firstname: dto.declarant?.prénom,
        lastname: dto.declarant?.nom,
        phone: dto.declarant?.téléphone,
      },
      company: {
        address: company.address,
        city: company.city,
        countryCode: company.countryCode?.getValue(),
        county: company.county?.getValue(),
        nafCode: company.nafCode?.getValue(),
        name: company.name,
        postalCode: company.postalCode?.getValue(),
        region: company.region?.getValue(),
        siren: company.siren?.getValue(),
        range: dto.entreprise?.tranche,
        total:
          dto["periode-reference"]?.périodeSuffisante === "oui" ? dto["periode-reference"].effectifTotal : undefined,
        hasRecoveryPlan:
          dto["publication"]?.planRelance === "oui"
            ? true
            : dto["publication"]?.planRelance === "non"
              ? false
              : undefined,
        ...(dto.entreprise?.type === "ues" && {
          ues: {
            name: dto.ues!.nom,
            companies: dto.ues!.entreprises.map(({ siren, raisonSociale }) => ({ siren, name: raisonSociale })),
          },
        }),
      },
      index: dto["resultat-global"]?.index,
      points: dto["resultat-global"]?.points,
      computablePoints: dto["resultat-global"]?.pointsCalculables,
      endReferencePeriod:
        dto["periode-reference"]?.périodeSuffisante === "oui"
          ? new Date(dto["periode-reference"].finPériodeRéférence)
          : undefined,
      sufficientPeriod: dto["periode-reference"]?.périodeSuffisante === "non" ? false : true,
      source: DeclarationSource.Enum.FORMULAIRE,
      publication: !dto["publication"]
        ? undefined
        : {
            date: dto["publication"]?.date,
            url: dto["publication"]?.choixSiteWeb === "oui" ? dto["publication"].url : undefined,
            modalities: dto["publication"]?.choixSiteWeb === "non" ? dto["publication"].modalités : undefined,
          },
      correctiveMeasures: dto["resultat-global"]?.mesures,

      // Indicators.
      remunerations: !dto["remunerations"]
        ? undefined
        : {
            cseConsultationDate:
              dto.remunerations?.estCalculable === "oui" ? dto.remunerations.dateConsultationCSE : undefined,
            favorablePopulation:
              dto["remunerations"]?.estCalculable === "oui"
                ? dto["remunerations-resultat"]?.populationFavorable ?? "egalite"
                : undefined,
            mode: remunerationsMode,
            notComputableReason:
              dto.remunerations?.estCalculable === "non" ? dto.remunerations.motifNonCalculabilité : undefined,
            result: dto["remunerations-resultat"]?.résultat,
            score: dto["remunerations-resultat"]?.note,
            categories:
              remunerationsMode === "csp"
                ? dto["remunerations-csp"]?.catégories.length
                  ? dto["remunerations-csp"].catégories.map(({ nom, tranches }) => ({
                      name: nom,
                      ranges: keepEntryBy(tranches, val => val !== ""),
                    }))
                  : []
                : remunerationsMode === "niveau_autre"
                  ? dto["remunerations-coefficient-autre"]?.catégories.length
                    ? dto["remunerations-coefficient-autre"].catégories.map(({ nom, tranches }) => ({
                        name: nom,
                        ranges: keepEntryBy(tranches, val => val !== ""),
                      }))
                    : []
                  : remunerationsMode === "niveau_branche"
                    ? dto["remunerations-coefficient-branche"]?.catégories.length
                      ? dto["remunerations-coefficient-branche"].catégories.map(({ nom, tranches }) => ({
                          name: nom,
                          ranges: keepEntryBy(tranches, val => val !== ""),
                        }))
                      : []
                    : ([] satisfies Categorie[]),
          },
      ...(dto.entreprise?.tranche !== CompanyWorkforceRange.Enum.FROM_50_TO_250 && {
        salaryRaises: !dto["augmentations"]
          ? undefined
          : {
              categories:
                dto.augmentations?.estCalculable === "oui"
                  ? [
                      dto.augmentations.catégories.ouv === "" ? null : dto.augmentations.catégories.ouv,
                      dto.augmentations.catégories.emp === "" ? null : dto.augmentations.catégories.emp,
                      dto.augmentations.catégories.tam === "" ? null : dto.augmentations.catégories.tam,
                      dto.augmentations.catégories.ic === "" ? null : dto.augmentations.catégories.ic,
                    ]
                  : [null, null, null, null],
              favorablePopulation:
                dto.augmentations?.estCalculable === "oui"
                  ? dto.augmentations.populationFavorable ?? "egalite"
                  : undefined,
              notComputableReason:
                dto.augmentations?.estCalculable == "non" ? dto.augmentations.motifNonCalculabilité : undefined,
              result: dto.augmentations?.estCalculable === "oui" ? dto.augmentations.résultat : undefined,
              score: dto.augmentations?.estCalculable === "oui" ? dto.augmentations.note : undefined,
            },
        promotions: !dto["promotions"]
          ? undefined
          : {
              notComputableReason:
                dto.promotions?.estCalculable === "non" ? dto.promotions.motifNonCalculabilité : undefined,
              favorablePopulation:
                dto.promotions?.estCalculable === "oui" ? dto.promotions.populationFavorable ?? "egalite" : undefined,
              result: dto.promotions?.estCalculable === "oui" ? dto.promotions.résultat : undefined,
              score: dto.promotions?.estCalculable === "oui" ? dto.promotions.note : undefined,
              categories:
                dto.promotions?.estCalculable === "oui"
                  ? [
                      dto.promotions.catégories.ouv === "" ? null : dto.promotions.catégories.ouv,
                      dto.promotions.catégories.emp === "" ? null : dto.promotions.catégories.emp,
                      dto.promotions.catégories.tam === "" ? null : dto.promotions.catégories.tam,
                      dto.promotions.catégories.ic === "" ? null : dto.promotions.catégories.ic,
                    ]
                  : [null, null, null, null],
            },
      }),
      ...(dto.entreprise?.tranche === CompanyWorkforceRange.Enum.FROM_50_TO_250 && {
        salaryRaisesAndPromotions: !dto["augmentations-et-promotions"]
          ? undefined
          : {
              notComputableReason:
                dto["augmentations-et-promotions"]?.estCalculable === "non"
                  ? dto["augmentations-et-promotions"].motifNonCalculabilité
                  : undefined,
              favorablePopulation:
                dto["augmentations-et-promotions"]?.estCalculable === "oui"
                  ? dto["augmentations-et-promotions"].populationFavorable ?? "egalite"
                  : undefined,
              employeesCountResult:
                dto["augmentations-et-promotions"]?.estCalculable === "oui"
                  ? dto["augmentations-et-promotions"].résultatEquivalentSalarié
                  : undefined,
              employeesCountScore:
                dto["augmentations-et-promotions"]?.estCalculable === "oui"
                  ? dto["augmentations-et-promotions"].noteNombreSalaries
                  : undefined,
              result:
                dto["augmentations-et-promotions"]?.estCalculable === "oui"
                  ? dto["augmentations-et-promotions"].résultat
                  : undefined,
              percentScore:
                dto["augmentations-et-promotions"]?.estCalculable === "oui"
                  ? dto["augmentations-et-promotions"].notePourcentage
                  : undefined,
              score:
                dto["augmentations-et-promotions"]?.estCalculable === "oui"
                  ? dto["augmentations-et-promotions"].note
                  : undefined,
            },
      }),
      maternityLeaves: !dto["conges-maternite"]
        ? undefined
        : {
            notComputableReason:
              dto["conges-maternite"]?.estCalculable === "non"
                ? dto["conges-maternite"].motifNonCalculabilité
                : undefined,
            result: dto["conges-maternite"]?.estCalculable === "oui" ? dto["conges-maternite"].résultat : undefined,
            score: dto["conges-maternite"]?.estCalculable === "oui" ? dto["conges-maternite"].note : undefined,
          },
      highRemunerations: !dto["hautes-remunerations"]
        ? undefined
        : {
            result: dto["hautes-remunerations"].résultat,
            favorablePopulation: dto["hautes-remunerations"].populationFavorable ?? "egalite",
            score: dto["hautes-remunerations"].note,
          },
    } satisfies EntityPropsToJson<DeclarationProps>;

    let declaration: Declaration;

    try {
      const found = await this.declarationRepo.getOne(pk);

      if (found) {
        const olderThanOneYear = isAfter(new Date(), add(found.declaredAt, { years: 1 }));

        if (olderThanOneYear) {
          throw new SaveDeclarationOverOneYearError("Déclaration is older than one year.");
        }

        declaration = found.fromJson({ ...partialDeclaration, modifiedAt: now });
      } else {
        declaration = Declaration.fromJson({
          ...partialDeclaration,
          declaredAt: now,
          modifiedAt: now,
          siren,
          year,
        });
      }

      if (declaration.sufficientPeriod) {
        // We recompute the score to be sure of its correctness.
        const {
          highRemunerationsScore,
          maternityLeavesScore,
          promotionsScore,
          remunerationsScore,
          salaryRaisesAndPromotionsScore,
          salaryRaisesScore,
          points,
          computablePoints,
          index,
        } = computeDeclarationIndex(DeclarationComputerInputBuilder.fromDeclaration(declaration));

        declaration = declaration.fromJson({
          index,
          points,
          computablePoints,
        });

        if (remunerationsScore !== undefined) {
          declaration.setRemunerationsScore(new PositiveInteger(remunerationsScore));
        }
        if (salaryRaisesScore !== undefined) {
          declaration.setSalaryRaisesScore(new PositiveInteger(salaryRaisesScore));
        }
        if (promotionsScore !== undefined) {
          declaration.setPromotionsScore(new PositiveInteger(promotionsScore));
        }

        if (salaryRaisesAndPromotionsScore !== undefined) {
          declaration.setSalaryRaisesAndPromotionsScore(new PositiveInteger(salaryRaisesAndPromotionsScore));
        }
        if (maternityLeavesScore !== undefined) {
          declaration.setMaternityLeavesScore(new PositiveInteger(maternityLeavesScore));
        }
        declaration.setHighRemunerationsScore(new PositiveInteger(highRemunerationsScore));
      }

      const specification = new DeclarationSpecification();

      if (specification.isSatisfiedBy(declaration)) {
        await this.declarationRepo.saveWithIndex(declaration);
      } else {
        throw specification.lastError;
      }
    } catch (error: unknown) {
      console.error(error);

      if (error instanceof DeclarationSpecificationError || error instanceof ValidationError) {
        throw error;
      }

      throw new SaveDeclarationError("Cannot save declaration", error as Error);
    }
  }
}

export class SaveDeclarationError extends AppError {}
export class SaveDeclarationOverOneYearError extends AppError {}
