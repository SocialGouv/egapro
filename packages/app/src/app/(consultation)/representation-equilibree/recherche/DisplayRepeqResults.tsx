/* eslint-disable @typescript-eslint/ban-ts-comment -- server components */
import { fr } from "@codegouvfr/react-dsfr";
import Alert from "@codegouvfr/react-dsfr/Alert";
import { type SearchConsultationDTO } from "@common/core-domain/dtos/helpers/common";
import { Box, Container, Heading } from "@design-system";
import { ClientAnimate } from "@design-system/utils/client/ClientAnimate";
import { NextPageLink } from "@design-system/utils/client/NextPageLink";
import { ScrollTopButton } from "@design-system/utils/client/ScrollTopButton";
import { search } from "@services/server/searchRepresentationEquilibree";
import { times } from "lodash";
import { Suspense } from "react";

import { PageDisplay } from "./PageDisplay";

export const DisplayRepeqResults = async (inputDto: SearchConsultationDTO) => {
  const resultsPage0 = await search({ ...inputDto, page: 0 });
  const totalCount = resultsPage0.count;

  if (totalCount === 0) {
    return <Alert severity="info" title="Aucune entreprise trouvée" description="Veuillez modifier votre recherche." />;
  }

  let cumulLength = resultsPage0.data.length;
  const pages = await Promise.all(
    times(inputDto.page, async i => {
      const results = await search({
        ...inputDto,
        page: i + 1,
      });
      cumulLength += results.data.length;
      // @ts-ignore
      return <PageDisplay results={results} key={i + 1} />;
    }),
  );
  return (
    <>
      <Container fluid>
        <Heading
          as="h2"
          variant="h4"
          text={`${cumulLength} ${totalCount > inputDto.limit ? `sur ${totalCount}` : ""} résultat${
            totalCount > 1 ? "s" : ""
          }`}
        />
        <ClientAnimate className={fr.cx("fr-grid-row", "fr-grid-row--gutters")}>
          {/* @ts-ignore */}
          <PageDisplay results={resultsPage0} />
          {pages}
        </ClientAnimate>
      </Container>
      <Box mt="3w">
        <ul
          className={fr.cx(
            "fr-btns-group",
            "fr-btns-group--inline-sm",
            "fr-btns-group--left",
            "fr-btns-group--icon-left",
          )}
        >
          <li>
            <ScrollTopButton smooth skipHeader>
              Haut de page
            </ScrollTopButton>
          </li>
          {cumulLength < totalCount && (
            <li>
              <Suspense>
                <NextPageLink />
              </Suspense>
            </li>
          )}
        </ul>
      </Box>
    </>
  );
};
