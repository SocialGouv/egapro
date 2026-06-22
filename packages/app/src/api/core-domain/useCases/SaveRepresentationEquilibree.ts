import {
  RepresentationEquilibree,
  type RepresentationEquilibreePK,
  type RepresentationEquilibreeProps,
} from "@common/core-domain/domain/RepresentationEquilibree";
import { RepresentationEquilibreeSpecification } from "@common/core-domain/domain/specification/RepresentationEquilibreeSpecification";
import { Siren } from "@common/core-domain/domain/valueObjects/Siren";
import { type CreateRepresentationEquilibreeDTO } from "@common/core-domain/dtos/CreateRepresentationEquilibreeDTO";
import { isCompanyClosed } from "@common/core-domain/helpers/entreprise";
import { companyMap } from "@common/core-domain/mappers/companyMap";
import { AppError, type EntityPropsToJson, type UseCase, ValidationError } from "@common/shared-domain";
import { PositiveNumber } from "@common/shared-domain/domain/valueObjects";
import { add, isAfter } from "date-fns";

import { type IEntrepriseService } from "../infra/services/IEntrepriseService";
import { type IRepresentationEquilibreeRepo } from "../repo/IRepresentationEquilibreeRepo";

interface Input {
  /**
   * Usually for staff
   */
  override?: boolean;
  repEq: CreateRepresentationEquilibreeDTO;
}

export class SaveRepresentationEquilibree implements UseCase<Input, void> {
  constructor(
    private readonly representationEquilibreeRepo: IRepresentationEquilibreeRepo,
    private readonly entrepriseService: IEntrepriseService,
  ) {}

  public async execute({ repEq, override }: Input): Promise<void> {
    const now = new Date();
    const pk: RepresentationEquilibreePK = [new Siren(repEq.siren), new PositiveNumber(repEq.year)];

    const partialProps = {
      source: "repeqV2",
      modifiedAt: now,
      endReferencePeriod: repEq.endOfPeriod,
      indicator: {
        ...("notComputableReasonExecutives" in repEq
          ? {
              notComputableReasonExecutives: repEq.notComputableReasonExecutives,
            }
          : {
              executiveMenPercent: repEq.executiveMenPercent,
              executiveWomenPercent: repEq.executiveWomenPercent,
            }),
        ...("notComputableReasonMembers" in repEq
          ? {
              notComputableReasonMembers: repEq.notComputableReasonMembers,
            }
          : {
              memberMenPercent: repEq.memberMenPercent,
              memberWomenPercent: repEq.memberWomenPercent,
            }),
      },
      declarant: {
        email: repEq.email,
        firstname: repEq.firstname,
        lastname: repEq.lastname,
        phone: repEq.phoneNumber,
      },
      ...(repEq.publishDate
        ? {
            publication: {
              date: repEq.publishDate,
              ...("publishUrl" in repEq
                ? {
                    url: repEq.publishUrl,
                  }
                : {
                    modalities: repEq.publishModalities,
                  }),
            },
          }
        : {}),
    } satisfies Partial<EntityPropsToJson<RepresentationEquilibreeProps>>;

    let representationEquilibree: RepresentationEquilibree;
    try {
      const found = await this.representationEquilibreeRepo.getOne(pk);

      if (found) {
        const olderThanOneYear = isAfter(new Date(), add(found.declaredAt, { years: 1 }));

        if (olderThanOneYear && !override) {
          throw new SaveRepresentationEquilibreeOverOneYearError("Représentation équilibrée is older than one year.");
        }

        representationEquilibree = found.fromJson(partialProps);
      } else {
        // Server-side guard: block the creation of a representation for an already-closed company. The
        // client checks this at "commencer", but that check is bypassed on non-funnel paths. The API is
        // only fetched here on creation; staff (override) and non-diffusible companies (no dateCessation,
        // so isCompanyClosed returns false) stay allowed, mirroring the declaration funnel.
        const rawEntreprise = await this.entrepriseService.siren(pk[0]);
        if (!override && isCompanyClosed(rawEntreprise, repEq.year)) {
          throw new SaveRepresentationEquilibreeClosedCompanyError(
            "Ce Siren correspond a une entreprise fermée. Veuillez vérifier votre saisie",
          );
        }
        const company = companyMap.toDomain(rawEntreprise);
        representationEquilibree = RepresentationEquilibree.fromJson({
          ...partialProps,
          declaredAt: now,
          siren: repEq.siren,
          year: repEq.year,
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
        });
      }

      const specification = new RepresentationEquilibreeSpecification();
      if (specification.isSatisfiedBy(representationEquilibree)) {
        await this.representationEquilibreeRepo.saveWithIndex(representationEquilibree);
      } else {
        throw specification.lastError;
      }
    } catch (error: unknown) {
      // Surface the closed-company guard as itself instead of collapsing it into the generic error.
      if (error instanceof SaveRepresentationEquilibreeClosedCompanyError) {
        throw error;
      }
      throw new SaveRepresentationEquilibreeError("Cannot save representation equilibree", error as Error);
    }
  }
}

export class SaveRepresentationEquilibreeError extends AppError {}
export class SaveRepresentationEquilibreeOverOneYearError extends AppError {}
export class SaveRepresentationEquilibreeClosedCompanyError extends ValidationError {}
