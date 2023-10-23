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
} from "@design-system";

import { getAllAdminDeclarations } from "./actions";
import { SearchForm } from "./SearchForm";
import { SelectLimit } from "./SelectLimit";
import style from "./style.module.scss";
import { TableAdminHeadColClient } from "./TableAdminHeadColClient";

const DeclarationPage = withSearchParamsValidation(searchAdminDeclarationDTOSchema)(async ({
  searchParams,
  searchParamsError,
}: NextServerPageProps<"", typeof searchAdminDeclarationDTOSchema>) => {
  const data = await getAllAdminDeclarations({
    ...searchParams,
    offset: searchParams.page,
  });

  const orderBy = searchParams.orderBy;
  const orderDirection = searchParams.orderDirection;
  const limit = searchParams.limit;

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
          <Box>
            <SelectLimit currentLimit={limit} />
          </Box>
          <TableAdmin
            compact
            classes={{
              table: style.table,
              wrapper: style.tableWrapper,
            }}
          >
            <TableAdminHead>
              {Object.entries(columnMap).map(([columnValue, columnLabel]) => (
                <TableAdminHeadColClient
                  key={columnValue}
                  columnValue={columnValue}
                  columnLabel={columnLabel}
                  currentOrderBy={orderBy}
                  currentOrderDirection={orderDirection}
                />
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
                  <TableAdminBodyRowCol className={style.tableColumnName} title={declaration.name}>
                    {declaration.name}
                  </TableAdminBodyRowCol>
                  <TableAdminBodyRowCol>{formatDateToFr(declaration.createdAt)}</TableAdminBodyRowCol>
                  <TableAdminBodyRowCol title={declaration.declarantEmail}>
                    {declaration.declarantEmail}
                  </TableAdminBodyRowCol>
                  <TableAdminBodyRowCol>{declaration.declarantFirstName}</TableAdminBodyRowCol>
                  <TableAdminBodyRowCol>{declaration.declarantLastName}</TableAdminBodyRowCol>
                  <TableAdminBodyRowCol>
                    {declaration.type === "index" ? declaration.index ?? "N.C" : "N/A"}
                  </TableAdminBodyRowCol>
                  <TableAdminBodyRowCol
                    title={
                      declaration.type === "index" && declaration.ues
                        ? declaration.ues.companies?.map(company => `${company.siren} - ${company.name}`).join("\n")
                        : void 0
                    }
                  >
                    {declaration.type === "index" ? (
                      declaration.ues ? (
                        <span className="underline cursor-help">
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
