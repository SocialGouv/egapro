import { Declaration, type DeclarationPK, type DeclarationProps } from "@common/core-domain/domain/Declaration";
import { type Categorie } from "@common/core-domain/domain/declaration/indicators/RemunerationsIndicator";
import { DeclarationSpecification } from "@common/core-domain/domain/specification/DeclarationSpecification";
import { DeclarationSource } from "@common/core-domain/domain/valueObjects/declaration/DeclarationSource";
import { Siren } from "@common/core-domain/domain/valueObjects/Siren";
import { type CreateDeclarationDTO } from "@common/core-domain/dtos/DeclarationDTO";
import { companyMap } from "@common/core-domain/mappers/companyMap";
import { AppError, type EntityPropsToJson, type UseCase } from "@common/shared-domain";
import { PositiveNumber } from "@common/shared-domain/domain/valueObjects";
import { removeEntryBy } from "@common/utils/object";
import { add, isAfter } from "date-fns";

import { type IEntrepriseService } from "../infra/services/IEntrepriseService";
import { type IDeclarationRepo } from "../repo/IDeclarationRepo";

interface Input {
  declaration: CreateDeclarationDTO;
}

// TODO: finir le use case
export class SaveDeclaration implements UseCase<Input, void> {
  constructor(
    private readonly declarationRepo: IDeclarationRepo,
    private readonly entrepriseService: IEntrepriseService,
  ) {}

  public async execute({ declaration: dto }: Input): Promise<void> {
    const now = new Date();

    const siren = dto.entreprise?.entrepriseDéclarante.siren;
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
        hasRecoveryPlan:
          dto["publication"]?.planRelance === "oui"
            ? true
            : dto["publication"]?.planRelance === "non"
            ? false
            : undefined,
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
      publication: {
        date: dto["publication"]?.date,
        url: dto["publication"]?.choixSiteWeb === "oui" ? dto["publication"].url : undefined,
        modalities: dto["publication"]?.choixSiteWeb === "non" ? dto["publication"].modalités : undefined,
      },
      correctiveMeasures: dto["resultat-global"]?.mesures,
      // Indicators.
      remunerations: {
        cseConsultationDate:
          dto.remunerations?.estCalculable === "oui" ? dto.remunerations.dateConsultationCSE : undefined,
        favorablePopulation: dto["remunerations-resultat"]?.populationFavorable,
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
                  ranges: removeEntryBy(tranches, val => val === null),
                }))
              : []
            : remunerationsMode === "niveau_autre"
            ? dto["remunerations-coefficient-autre"]?.catégories.length
              ? dto["remunerations-coefficient-autre"].catégories.map(({ nom, tranches }) => ({
                  name: nom,
                  ranges: removeEntryBy(tranches, val => val === null),
                }))
              : []
            : remunerationsMode === "niveau_branche"
            ? dto["remunerations-coefficient-branche"]?.catégories.length
              ? dto["remunerations-coefficient-branche"].catégories.map(({ nom, tranches }) => ({
                  name: nom,
                  ranges: removeEntryBy(tranches, val => val === null),
                }))
              : []
            : ([] satisfies Categorie[]),
      },
      salaryRaises: {
        categories:
          dto.augmentations?.estCalculable === "oui"
            ? dto.augmentations.catégories.map(category => category.écarts)
            : [null, null, null, null],
        favorablePopulation:
          dto.augmentations?.estCalculable === "oui" ? dto.augmentations.populationFavorable : undefined,
        notComputableReason:
          dto.augmentations?.estCalculable == "non" ? dto.augmentations.motifNonCalculabilité : undefined,
        result: dto.augmentations?.estCalculable === "oui" ? dto.augmentations.résultat : undefined,
        score: dto.augmentations?.estCalculable === "oui" ? dto.augmentations.note : undefined,
      },
      promotions: {
        notComputableReason: dto.promotions?.estCalculable === "non" ? dto.promotions.motifNonCalculabilité : undefined,
        favorablePopulation: dto.promotions?.estCalculable === "oui" ? dto.promotions.populationFavorable : undefined,
        result: dto.promotions?.estCalculable === "oui" ? dto.promotions.résultat : undefined,
        score: dto.promotions?.estCalculable === "oui" ? dto.promotions.note : undefined,
        categories:
          dto.promotions?.estCalculable === "oui"
            ? dto.promotions.catégories.map(category => category.écarts)
            : [null, null, null, null],
      },
      salaryRaisesAndPromotions: {
        notComputableReason:
          dto["augmentations-et-promotions"]?.estCalculable === "non"
            ? dto["augmentations-et-promotions"].motifNonCalculabilité
            : undefined,
        favorablePopulation:
          dto["augmentations-et-promotions"]?.estCalculable === "oui"
            ? dto["augmentations-et-promotions"].populationFavorable
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
      maternityLeaves: {
        notComputableReason:
          dto["conges-maternite"]?.estCalculable === "non" ? dto["conges-maternite"].motifNonCalculabilité : undefined,
        result: dto["conges-maternite"]?.estCalculable === "oui" ? dto["conges-maternite"].résultat : undefined,
        score: dto["conges-maternite"]?.estCalculable === "oui" ? dto["conges-maternite"].note : undefined,
      },
      highRemunerations: !dto["hautes-remunerations"]
        ? undefined
        : {
            result: dto["hautes-remunerations"].résultat,
            favorablePopulation: dto["hautes-remunerations"].populationFavorable,
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

      // TODO: calculer ou recalculer les points des indicateurs et l'index

      const specification = new DeclarationSpecification();

      if (specification.isSatisfiedBy(declaration)) {
        await this.declarationRepo.save(declaration);
      } else {
        throw specification.lastError;
      }
    } catch (error: unknown) {
      throw new SaveDeclarationError("Cannot save representation equilibree", error as Error);
    }
  }
}

export class SaveDeclarationError extends AppError {}
export class SaveDeclarationOverOneYearError extends AppError {}