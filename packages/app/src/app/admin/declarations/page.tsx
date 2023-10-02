import { fr } from "@codegouvfr/react-dsfr";
import Alert from "@codegouvfr/react-dsfr/Alert";
import { searchAdminDeclarationDTOSchema } from "@common/core-domain/dtos/SearchDeclarationDTO";
import { type NextServerPageProps, withSearchParamsValidation } from "@common/utils/next";
import { DebugButton } from "@components/utils/debug/DebugButton";
import { Container, Grid, GridCol, Heading } from "@design-system";

import { SearchForm } from "./SearchForm";

const DeclarationPage = withSearchParamsValidation(searchAdminDeclarationDTOSchema)(async ({
  searchParams,
  searchParamsError,
}: NextServerPageProps<"", typeof searchAdminDeclarationDTOSchema>) => {
  return (
    <Container as="section" py="4w">
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
          <SearchForm searchParams={searchParams} />
        </GridCol>
      </Grid>
    </Container>
  );
});

export default DeclarationPage;
