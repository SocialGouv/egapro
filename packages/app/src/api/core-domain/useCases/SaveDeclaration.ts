import { Declaration, type DeclarationPK, type DeclarationProps } from "@common/core-domain/domain/Declaration";
import { DeclarationSpecification } from "@common/core-domain/domain/specification/DeclarationSpecification";
import { DeclarationSource } from "@common/core-domain/domain/valueObjects/declaration/DeclarationSource";
import { Siren } from "@common/core-domain/domain/valueObjects/Siren";
import { type CreateDeclarationDTO } from "@common/core-domain/dtos/DeclarationDTO";
import { companyMap } from "@common/core-domain/mappers/companyMap";
import { AppError, type EntityPropsToJson, type UseCase } from "@common/shared-domain";
import { PositiveNumber } from "@common/shared-domain/domain/valueObjects";
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
    const pk: DeclarationPK = [new Siren(dto.entreprise.siren), new PositiveNumber(dto.déclaration.année_indicateurs)];

    const company = companyMap.toDomain(await this.entrepriseService.siren(pk[0]));

    const partialDeclaration = {
      declarant: dto.déclarant.email,
      siren: dto.entreprise.siren,
      year: dto.déclaration.année_indicateurs,
      data: {
        // We always set the data to the latest version following API Recherche entreprise.
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
        },
        source: DeclarationSource.Enum.FORMULAIRE,
        declarant: {
          email: dto.déclarant.email,
          firstname: dto.déclarant.prénom,
          lastname: dto.déclarant.nom,
          phone: dto.déclarant.téléphone,
        },
        declaration: {
          indicatorsYear: dto.déclaration.année_indicateurs,
          sufficientPeriod: dto.déclaration.période_suffisante,
          correctiveMeasures: dto.déclaration.mesures_correctives,
          date: new Date(),
          publication: dto.déclaration.publication,
          endReferencePeriod: dto.déclaration.fin_période_référence,
          draft: false,
          // computablePoints, index and points will be computed by the backend.
        },
      },
    } satisfies Partial<EntityPropsToJson<DeclarationProps>>;

    let declaration: Declaration;

    try {
      const found = await this.declarationRepo.getOne(pk);

      if (found) {
        const olderThanOneYear = isAfter(new Date(), add(found.declaredAt, { years: 1 }));

        if (olderThanOneYear) {
          throw new SaveDeclarationOverOneYearError("Déclaration is older than one year.");
        }

        declaration = found.fromJson(partialDeclaration);
      } else {
        declaration = Declaration.fromJson({
          ...partialDeclaration,
          declaredAt: now,
          modifiedAt: now,
          siren: dto.entreprise.siren,
          year: dto.déclaration.année_indicateurs,
        });

        const specification = new DeclarationSpecification();

        if (declaration.data && specification.isSatisfiedBy(declaration.data)) {
          await this.declarationRepo.save(declaration);
        } else {
          throw specification.lastError;
        }
      }
    } catch (error: unknown) {
      throw new SaveDeclarationError("Cannot save representation equilibree", error as Error);
    }
  }
}

export class SaveDeclarationError extends AppError {}
export class SaveDeclarationOverOneYearError extends AppError {}
