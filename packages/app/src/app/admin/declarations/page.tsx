import { fr } from "@codegouvfr/react-dsfr";
import Alert from "@codegouvfr/react-dsfr/Alert";
import Badge from "@codegouvfr/react-dsfr/Badge";
import { columnMap } from "@common/core-domain/dtos/AdminDeclarationDTO";
import { searchAdminDeclarationDTOSchema } from "@common/core-domain/dtos/SearchDeclarationDTO";
import { formatDateToFr } from "@common/utils/date";
import { type NextServerPageProps, withSearchParamsValidation } from "@common/utils/next";
import { Object } from "@common/utils/overload";
import { DebugButton } from "@components/utils/debug/DebugButton";
import {
  Box,
  Container,
  Grid,
  GridCol,
  Heading,
  TableAdmin,
  TableAdminBody,
  TableAdminBodyRow,
  TableAdminBodyRowCol,
  TableAdminHead,
  TableAdminHeadCol,
} from "@design-system";

import { getAllAdminDeclarations } from "./actions";
import { SearchForm } from "./SearchForm";

const DeclarationPage = withSearchParamsValidation(searchAdminDeclarationDTOSchema)(async ({
  searchParams,
  searchParamsError,
}: NextServerPageProps<"", typeof searchAdminDeclarationDTOSchema>) => {
  const data = await getAllAdminDeclarations({
    ...searchParams,
    offset: searchParams.page,
  });

  return (
    <>
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
            <DebugButton obj={data} infoText="data" />
          </GridCol>
        </Grid>
      </Container>
      {data.ok ? (
        <Box className={fr.cx("fr-p-3w")}>
          <TableAdmin>
            <TableAdminHead>
              {Object.entries(columnMap).map(([columnValue, columnLabel]) => (
                <TableAdminHeadCol
                  key={columnValue}
                  // orderDirection={orderBy === columnValue && orderDirection}
                  // onClick={() => {
                  //   togglerOrderColumn(columnValue);
                  // }}
                >
                  {columnLabel}
                </TableAdminHeadCol>
              ))}
            </TableAdminHead>
            <TableAdminBody>
              {data.data.map(declaration => (
                <TableAdminBodyRow key={`decla-${declaration.type}-${declaration.siren}-${declaration.year}`}>
                  <TableAdminBodyRowCol>
                    <Badge small severity={declaration.type === "index" ? "new" : "info"} noIcon>
                      {declaration.type}
                    </Badge>
                  </TableAdminBodyRowCol>
                  <TableAdminBodyRowCol>{declaration.siren}</TableAdminBodyRowCol>
                  <TableAdminBodyRowCol>{declaration.year}</TableAdminBodyRowCol>
                  <TableAdminBodyRowCol>{declaration.name}</TableAdminBodyRowCol>
                  <TableAdminBodyRowCol>{formatDateToFr(new Date(declaration.createdAt))}</TableAdminBodyRowCol>
                  <TableAdminBodyRowCol>{declaration.declarantEmail}</TableAdminBodyRowCol>
                  <TableAdminBodyRowCol>{declaration.declarantFirstName}</TableAdminBodyRowCol>
                  <TableAdminBodyRowCol>{declaration.declarantLastName}</TableAdminBodyRowCol>
                  <TableAdminBodyRowCol>
                    {declaration.type === "index" ? declaration.index ?? "N.C" : "N/A"}
                  </TableAdminBodyRowCol>
                  <TableAdminBodyRowCol>
                    {declaration.type === "index" ? (
                      declaration.ues ? (
                        <span
                          className="underline cursor-help"
                          title={declaration.ues.companies
                            ?.map(company => `${company.siren} - ${company.name}`)
                            .join("\n")}
                        >
                          {declaration.ues.name} ({declaration.ues.companies?.length ?? 0})
                        </span>
                      ) : (
                        "-"
                      )
                    ) : (
                      "N/A"
                    )}
                  </TableAdminBodyRowCol>
                </TableAdminBodyRow>
              ))}
            </TableAdminBody>
          </TableAdmin>
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
