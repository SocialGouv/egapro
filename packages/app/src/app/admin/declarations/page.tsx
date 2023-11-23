import { fr } from "@codegouvfr/react-dsfr";
import Alert from "@codegouvfr/react-dsfr/Alert";
import { searchAdminDeclarationDTOSchema } from "@common/core-domain/dtos/SearchDeclarationDTO";
import { type NextServerPageProps, withSearchParamsValidation } from "@common/utils/next";
import { DebugButton } from "@components/utils/debug/DebugButton";
import { Box, Container, Grid, GridCol, Heading } from "@design-system";

import { getAllAdminDeclarations } from "./actions";
import { DeclarationsList } from "./DeclarationsList";
import { SearchForm } from "./SearchForm";

const DeclarationPage = withSearchParamsValidation(searchAdminDeclarationDTOSchema)(async ({
  searchParams,
  searchParamsError,
}: NextServerPageProps<"", typeof searchAdminDeclarationDTOSchema>) => {
  const result = await getAllAdminDeclarations({
    ...searchParams,
    offset: searchParams.page,
  });

  const orderBy = searchParams.orderBy;
  const orderDirection = searchParams.orderDirection;
  const limit = searchParams.limit;

  return (
    <>
      <Container as="section" pt="4w">
        <Grid haveGutters align="center">
          <GridCol sm={12} md={10} xl={8}>
            {searchParamsError && (
              <>
                <DebugButton obj={searchParamsError} infoText="searchParamsError" />
                <Alert
                  small
                  closable
                  severity="error"
                  description="Les paramètres d'url sont malformés."
                  className={fr.cx("fr-mb-2w")}
                />
              </>
            )}
            <Heading as="h1" variant="h5" text="Rechercher une déclaration d'index ou de représentation équilibrée" />
          </GridCol>
        </Grid>
        <SearchForm searchParams={searchParams} />
      </Container>
      {result.ok ? (
        <Box className={fr.cx("fr-px-3w")}>
          <DeclarationsList data={result.data} orderBy={orderBy} orderDirection={orderDirection} limit={limit} />
        </Box>
      ) : (
        <Alert
          severity="info"
          small
          description="Aucune déclaration d'index ou de représentation équilibrée trouvée."
        />
      )}
    </>
  );
});

export default DeclarationPage;
