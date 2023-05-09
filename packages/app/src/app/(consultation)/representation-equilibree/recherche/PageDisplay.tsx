import { type ConsultationDTO } from "@common/core-domain/dtos/helpers/common";
import { type SearchRepresentationEquilibreeResultDTO } from "@common/core-domain/dtos/SearchRepresentationEquilibreeDTO";
import { GridCol } from "@design-system";
import { TileCompanyRepeqs } from "@design-system/client";
import { Suspense } from "react";

export const PageDisplay = async ({
  results,
}: {
  results: ConsultationDTO<SearchRepresentationEquilibreeResultDTO>;
}) => {
  return (
    <Suspense>
      {results.data.map(dto => (
        <GridCol key={dto.company.siren}>
          <TileCompanyRepeqs {...dto} />
        </GridCol>
      ))}
    </Suspense>
  );
};
