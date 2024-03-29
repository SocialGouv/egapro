import { type ConsultationDTO } from "@common/core-domain/dtos/helpers/common";
import { type SearchDeclarationResultDTO } from "@common/core-domain/dtos/SearchDeclarationDTO";
import { GridCol } from "@design-system";
import { TileCompanyIndex } from "@design-system/client";
import { Suspense } from "react";

export const PageDisplay = async ({ results }: { results: ConsultationDTO<SearchDeclarationResultDTO> }) => {
  return (
    <Suspense>
      {results.data.map(dto => (
        <GridCol key={dto.siren}>
          <TileCompanyIndex {...dto} />
        </GridCol>
      ))}
    </Suspense>
  );
};
