import type { ReferentDTO } from "@common/core-domain/dtos/ReferentDTO";
import { COUNTIES, REGIONS } from "@common/dict";
import { AdminLayout } from "@components/layouts/AdminLayout";
import {
  Box,
  Container,
  FormGroup,
  FormInput,
  Icon,
  Link,
  Modale,
  ModaleButton,
  ModaleContent,
  ModaleTitle,
  TableAdmin,
  TableAdminBody,
  TableAdminBodyRow,
  TableAdminBodyRowCol,
  TableAdminHead,
  TableAdminHeadCol,
} from "@design-system";
import { fetcherV2 } from "@services/apiClient";
import _ from "lodash";
import { useState } from "react";
import { useForm } from "react-hook-form";
import useSWR from "swr";

import type { NextPageWithLayout } from "../_app";

const columnMap = [
  ["region", "Région"],
  ["county", "Département"],
  ["name", "Nom"],
  ["value", "Valeur"],
  ["principal", "Principal"],
] as const;

const ReferentListPage: NextPageWithLayout = () => {
  const { data, error, mutate } = useSWR<ReferentDTO[]>("/admin/referent", fetcherV2);
  const [orderBy, setOrderBy] = useState<typeof columnMap[number][0]>("region");
  const [orderDirection, setOrderDirection] = useState<"asc" | "desc">("asc");
  const [editLine, setEditLine] = useState<ReferentDTO["id"]>();

  const currentEditedReferent = data?.find(referent => referent.id === editLine);

  const closeModale = () => {
    setEditLine(void 0);
  };

  const { handleSubmit, register, watch } = useForm<{ query: string }>();
  const searchString = watch("query");

  if (!data) return null;

  const referents = _.orderBy(data, orderBy, orderDirection).filter(referent => {
    if (!searchString) return true;
    const str = searchString.toLowerCase();
    if (referent.county && COUNTIES[referent.county].toLowerCase().includes(str)) return true;
    if (REGIONS[referent.region].toLowerCase().includes(str)) return true;
    if (referent.name.toLowerCase().includes(str)) return true;
    if (referent.value.toLowerCase().includes(str)) return true;
  });

  return (
    <>
      <Modale isOpen={!!editLine && !!currentEditedReferent} onClose={closeModale}>
        <ModaleTitle>Éditer - {currentEditedReferent?.name}</ModaleTitle>
        <ModaleContent>Coucou</ModaleContent>
        <ModaleButton>Sauvegarder</ModaleButton>
        <ModaleButton onClick={closeModale}>Fermer</ModaleButton>
      </Modale>
      <Box as="section">
        <Container py="8w">
          <h1>Liste des des référents Egapro</h1>

          <form noValidate onSubmit={handleSubmit(_.noop)}>
            <FormGroup>
              <FormInput id="query-param" placeholder="Rechercher" autoComplete="off" {...register("query")} />
            </FormGroup>
          </form>
          <Box mt={"3w"}>
            <TableAdmin>
              <TableAdminHead>
                {columnMap.map(([columnValue, columnLabel]) => (
                  <TableAdminHeadCol
                    key={columnValue}
                    orderDirection={orderBy === columnValue && orderDirection}
                    onClick={() => {
                      if (orderBy === columnValue) {
                        setOrderDirection(orderDirection === "asc" ? "desc" : "asc");
                      } else {
                        setOrderBy(columnValue);
                        setOrderDirection("desc");
                      }
                    }}
                  >
                    {columnLabel}
                  </TableAdminHeadCol>
                ))}
                <TableAdminHeadCol>Actions</TableAdminHeadCol>
              </TableAdminHead>
              <TableAdminBody>
                {referents.map(referent => (
                  <TableAdminBodyRow key={`referent-${referent.id}`}>
                    <TableAdminBodyRowCol>
                      {REGIONS[referent.region]} ({referent.region})
                    </TableAdminBodyRowCol>
                    <TableAdminBodyRowCol>
                      {referent.county ? `${COUNTIES[referent.county]} (${referent.county})` : "-"}
                    </TableAdminBodyRowCol>
                    <TableAdminBodyRowCol>{referent.name}</TableAdminBodyRowCol>
                    <TableAdminBodyRowCol>
                      <Link
                        size="sm"
                        iconLeft={referent.type === "email" ? "fr-icon-mail-fill" : "fr-icon-link"}
                        href={(referent.type === "email" ? "mailto:" : "") + referent.value}
                      >
                        {_.truncate(referent.value, { length: 40 })}
                      </Link>
                    </TableAdminBodyRowCol>
                    <TableAdminBodyRowCol>
                      <Icon
                        icon={referent.principal ? "fr-icon-checkbox-fill" : "fr-icon-close-circle-fill"}
                        color={referent.principal ? "text-default-success" : "text-default-error"}
                      />
                    </TableAdminBodyRowCol>
                    <TableAdminBodyRowCol>
                      <Icon icon="fr-icon-edit-fill" onClick={() => setEditLine(referent.id)} />
                      <Icon icon="fr-icon-delete-fill" />
                    </TableAdminBodyRowCol>
                  </TableAdminBodyRow>
                ))}
              </TableAdminBody>
            </TableAdmin>
          </Box>
        </Container>
      </Box>
    </>
  );
};

ReferentListPage.getLayout = ({ children }) => {
  return <AdminLayout title="Liste référents">{children}</AdminLayout>;
};

export default ReferentListPage;
