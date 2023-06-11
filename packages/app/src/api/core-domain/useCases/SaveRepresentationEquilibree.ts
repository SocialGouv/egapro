import {
  RepresentationEquilibree,
  type RepresentationEquilibreePK,
} from "@common/core-domain/domain/RepresentationEquilibree";
import { RepresentationEquilibreeSpecification } from "@common/core-domain/domain/specification/RepresentationEquilibreeSpecification";
import { Siren } from "@common/core-domain/domain/valueObjects/Siren";
import { type CreateRepresentationEquilibreeDTO } from "@common/core-domain/dtos/CreateRepresentationEquilibreeDTO";
import { companyMap } from "@common/core-domain/mappers/companyMap";
import { type UseCase } from "@common/shared-domain";
import { AppError } from "@common/shared-domain";
import { PositiveNumber } from "@common/shared-domain/domain/valueObjects";

import { type IEntrepriseService } from "../infra/services/IEntrepriseService";
import { type IRepresentationEquilibreeRepo } from "../repo/IRepresentationEquilibreeRepo";

export class SaveRepresentationEquilibree implements UseCase<CreateRepresentationEquilibreeDTO, void> {
  constructor(
    private readonly reprensentationEquilibreeRepo: IRepresentationEquilibreeRepo,
    private readonly entrepriseService: IEntrepriseService,
  ) {}

  public async execute(repEq: CreateRepresentationEquilibreeDTO): Promise<void> {
    const now = new Date();
    const pk: RepresentationEquilibreePK = [new Siren(repEq.siren), new PositiveNumber(repEq.year)];
    try {
      const found = await this.reprensentationEquilibreeRepo.getOne(pk);

      if (found) {
        // TODO edit mode
      } else {
        const company = companyMap.toDomain(await this.entrepriseService.siren(pk[0]));
        const representationEquilibree = RepresentationEquilibree.fromJson({
          source: "repeqV2",
          declaredAt: now,
          modifiedAt: now,
          siren: repEq.siren,
          year: repEq.year,
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
        });

        const specification = new RepresentationEquilibreeSpecification();
        if (specification.isSatisfiedBy(representationEquilibree)) {
          await this.reprensentationEquilibreeRepo.save(representationEquilibree);
        } else {
          throw specification.lastError;
        }
      }
    } catch (error: unknown) {
      throw new SaveRepresentationEquilibreeError("Cannot save representation equilibree", error as Error);
    }
  }
}

export class SaveRepresentationEquilibreeError extends AppError {}
