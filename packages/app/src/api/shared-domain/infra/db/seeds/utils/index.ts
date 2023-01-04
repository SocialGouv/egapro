/* eslint-disable @typescript-eslint/no-non-null-assertion */

import { Declaration } from "@common/core-domain/domain/Declaration";
import { DeclarationData } from "@common/core-domain/domain/DeclarationData";
import { Siren } from "@common/core-domain/domain/valueObjects/Siren";
import { COUNTIES, NAF, REGIONS, REGIONS_TO_COUNTIES, YEARS } from "@common/dict";
import { Email, PositiveNumber } from "@common/shared-domain/domain/valueObjects";
import { generateLuhnNumber } from "@common/utils/luhn";
import { Object } from "@common/utils/overload";
import { faker } from "@faker-js/faker/locale/fr";
import _ from "lodash";

// export const seedDeclarationIndex = async () => {
//   const declarantFirstname = faker.name.firstName();
//   const declarantLastname = faker.name.lastName();
//   const declarantEmail = new Email(faker.internet.email(declarantFirstname, declarantLastname));
//   const declaredAt = faker.date.recent(30);
//   const declaration = new Declaration({
//     declarant: declarantEmail,
//     declaredAt,
//     modifiedAt: declaredAt,
//     siren: new Siren(generateLuhnNumber(faker.random.numeric(8))),
//     year: new PositiveNumber(new Date().getFullYear()),
//     data: DeclarationData.fromJson({
//       company: {
//         hasRecoveryPlan,
//       },
//     }),
//   });
// };

export const getRandomDeclarationRepEq = () => {
  const declarantFirstname = faker.name.firstName();
  const declarantLastname = faker.name.lastName();
  const declarantEmail = new Email(faker.internet.email(declarantFirstname, declarantLastname));
  const declaredAt = faker.date.recent(30);
  const siren = new Siren(generateLuhnNumber(faker.random.numeric(8)));
  const region = getRandomRegion();
  const executiveMenPercent = _.random(100);
  const memberMenPercent = _.random(100);

  return new Declaration({
    declarant: declarantEmail,
    declaredAt,
    modifiedAt: declaredAt,
    siren,
    year: new PositiveNumber(new Date().getFullYear()),
    data: DeclarationData.fromJson({
      company: {
        hasRecoveryPlan: false,
        siren: siren.getValue(),
        address: faker.address.streetAddress(),
        city: faker.address.city(),
        nafCode: getRandomNafCode(),
        region,
        county: getRandomCounty(region),
        name: faker.company.name(),
        postalCode: faker.address.zipCode(),
        countryCode: "", // FR
      },
      declarant: {
        email: declarantEmail.getValue(),
        firstname: declarantFirstname,
        lastname: declarantLastname,
        phone: faker.phone.number(),
      },
      declaration: {
        draft: false,
        indicatorsYear: _.sample(YEARS)!,
        sufficientPeriod: false,
        endReferencePeriod: new Date(declaredAt.getFullYear(), 12).toISOString(),
      },
      indicators: {
        balancedRepresentation: {
          executiveMenPercent,
          executiveWomenPercent: 100 - executiveMenPercent,
          memberMenPercent,
          memberWomenPercent: 100 - memberMenPercent,
        },
      },
      id: "",
    }),
  });
};

const getRandomNafCode = () => _.sample(Object.keys(NAF))!;
const getRandomRegion = () => _.sample(Object.keys(REGIONS))!;
const getRandomCounty = (region?: keyof typeof REGIONS) =>
  region ? _.sample(REGIONS_TO_COUNTIES[region]) : _.sample(Object.keys(COUNTIES))!;
