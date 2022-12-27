import { OwnershipRequestStatus } from "@common/core-domain/domain/valueObjects/ownership_request/OwnershipRequestStatus";
import type { GetOwnershipRequestDTO } from "@common/core-domain/dtos/OwnershipRequestDTO";
import { normalizeQueryParam } from "@common/utils/url";
import { AdminLayout } from "@components/layouts/AdminLayout";
import type { FormCheckboxProps, TagProps } from "@design-system";
import {
  Alert,
  Box,
  ButtonGroup,
  Container,
  FormButton,
  FormCheckbox,
  FormCheckboxGroup,
  TableAdmin,
  TableAdminBody,
  TableAdminBodyRow,
  TableAdminBodyRowCol,
  TableAdminHead,
  TableAdminHeadCol,
  Tag,
} from "@design-system";
import { useListeDeclarants } from "@services/apiClient/useListeDeclarants";
import { useRouter } from "next/router";
import { useMemo, useState } from "react";

import type { NextPageWithLayout } from "../_app";

const ITEMS_PER_LOAD = 1;

const tagVariantStatusMap: Record<OwnershipRequestStatus.Enum, TagProps["variant"]> = {
  [OwnershipRequestStatus.Enum.TO_PROCESS]: "info",
  [OwnershipRequestStatus.Enum.REFUSED]: "error",
  [OwnershipRequestStatus.Enum.ACCEPTED]: "success",
  [OwnershipRequestStatus.Enum.ERROR]: "warning",
};

interface DisplayListeProps {
  error: unknown;
  // Must be set, but can be undefined
  isCheck: string[];
  isLoading: boolean;
  itemsPerLoad: number;
  orderAsc?: string;
  orderBy?: string;
  requests: Omit<GetOwnershipRequestDTO, "params"> | undefined;
  setIsCheck: (isCheck: string[]) => void;
  setOrderAscParam: (value: string) => void;
  setOrderByParam: (value: string) => void;
  setSirenParam: (value: string) => void;
  setStatusParam: (value: string) => void;
  siren?: string;
  status?: string;
}
const DisplayListe = ({
  isLoading,
  error,
  requests,
  itemsPerLoad,
  isCheck,
  setIsCheck,
  orderAsc,
  setOrderAscParam,
  orderBy,
  setOrderByParam,
  siren,
  setSirenParam,
  status,
  setStatusParam,
}: DisplayListeProps) => {
  const hasToProcessRequests = useMemo(
    () => requests?.data.some(r => r.status === OwnershipRequestStatus.Enum.TO_PROCESS) ?? false,
    [requests?.data],
  );

  const [globalCheck, setGlobalCheck] = useState(false);

  const handleCheckAll: NonNullable<FormCheckboxProps["onChange"]> = () => {
    setGlobalCheck(!globalCheck);
    if (globalCheck) {
      setIsCheck([]);
    } else {
      setIsCheck(requests?.data.map(r => r.id) ?? []);
    }
  };

  const handleCheck: NonNullable<FormCheckboxProps["onChange"]> = evt => {
    const { id, checked } = evt.target;
    setIsCheck([...isCheck, id]);
    if (!checked) {
      setIsCheck(isCheck.filter(item => item !== id));
    }
  };

  if (isLoading) return <Alert type="info">Récupération des données en cours</Alert>;

  if (error) {
    return (
      <Alert size="sm" type="error" mt="3w">
        <p>Il y a eu une erreur lors de la récupération des données.</p>
      </Alert>
    );
  }

  if (!requests || isLoading) {
    return null;
  }

  if (requests.totalCount === 0) {
    return (
      <Alert type="info" mt="3w">
        <p>Aucune demande d'ajout de déclarants.</p>
      </Alert>
    );
  }

  return (
    <>
      <Box>
        <p>
          {requests.data.length} {requests.totalCount > itemsPerLoad ? `sur ${requests.totalCount}` : ""} demande
          {requests.totalCount > 1 ? "s" : ""}
        </p>
      </Box>
      <TableAdmin>
        <TableAdminHead>
          <TableAdminHeadCol>
            <FormCheckboxGroup singleCheckbox size="sm" isDisabled={!hasToProcessRequests}>
              <FormCheckbox id="global-checkbox" onChange={handleCheckAll} />
            </FormCheckboxGroup>
          </TableAdminHeadCol>
          <TableAdminHeadCol order={orderBy === "status" ? orderAsc! : undefined}>Status</TableAdminHeadCol>
          <TableAdminHeadCol>Demandeur</TableAdminHeadCol>
          <TableAdminHeadCol>Date de la demande</TableAdminHeadCol>
          <TableAdminHeadCol>Date de traitement</TableAdminHeadCol>
          <TableAdminHeadCol>Siren</TableAdminHeadCol>
          <TableAdminHeadCol>Email</TableAdminHeadCol>
        </TableAdminHead>
        <TableAdminBody>
          {requests.data.map(item => (
            <TableAdminBodyRow key={item.id}>
              <TableAdminBodyRowCol>
                <FormCheckboxGroup
                  singleCheckbox
                  size="sm"
                  isDisabled={item.status !== OwnershipRequestStatus.Enum.TO_PROCESS}
                >
                  <FormCheckbox
                    id={item.id}
                    className="request-checkbox"
                    checked={isCheck.includes(item.id)}
                    onChange={handleCheck}
                  />
                </FormCheckboxGroup>
              </TableAdminBodyRowCol>
              <TableAdminBodyRowCol>
                <Tag variant={tagVariantStatusMap[item.status]}>{item.status}</Tag>
              </TableAdminBodyRowCol>
              <TableAdminBodyRowCol>
                <strong>{item.askerEmail}</strong>
              </TableAdminBodyRowCol>
              <TableAdminBodyRowCol>{new Date(item.createdAt).toLocaleString()}</TableAdminBodyRowCol>
              <TableAdminBodyRowCol>{new Date(item.modifiedAt).toLocaleString()}</TableAdminBodyRowCol>
              <TableAdminBodyRowCol>{item.siren}</TableAdminBodyRowCol>
              <TableAdminBodyRowCol>{item.email}</TableAdminBodyRowCol>
              {/* <TableAdminBodyRowCol>
                <FormButton title="Éditer" iconOnly="fr-icon-edit-fill" size="sm" variant="tertiary-no-border" />
              </TableAdminBodyRowCol> */}
            </TableAdminBodyRow>
          ))}
          {/* <TableAdminBodyRow>
            <TableAdminBodyRowCol>
              <input type="checkbox" />
            </TableAdminBodyRowCol>
            <TableAdminBodyRowCol>
              <Tag variant="info">À traiter</Tag>
            </TableAdminBodyRowCol>
            <TableAdminBodyRowCol>
              <strong>jean-michel-superlong@beta.gouv.fr</strong>
            </TableAdminBodyRowCol>
            <TableAdminBodyRowCol>12/10/2022</TableAdminBodyRowCol>
            <TableAdminBodyRowCol>-</TableAdminBodyRowCol>
            <TableAdminBodyRowCol>800 168 767</TableAdminBodyRowCol>
            <TableAdminBodyRowCol>laurent.sutterlity@beta.gouv.fr</TableAdminBodyRowCol>
            <TableAdminBodyRowCol />
          </TableAdminBodyRow>
          <TableAdminBodyRow>
            <TableAdminBodyRowCol>
              <input type="checkbox" disabled />
            </TableAdminBodyRowCol>
            <TableAdminBodyRowCol>
              <Tag variant="success">Traité</Tag>
            </TableAdminBodyRowCol>
            <TableAdminBodyRowCol>
              <strong>jean-michel-superlong@beta.gouv.fr</strong>
            </TableAdminBodyRowCol>
            <TableAdminBodyRowCol>12/10/2022</TableAdminBodyRowCol>
            <TableAdminBodyRowCol>12/10/2022</TableAdminBodyRowCol>
            <TableAdminBodyRowCol>800 168 767</TableAdminBodyRowCol>
            <TableAdminBodyRowCol>laurent.sutterlity@beta.gouv.fr</TableAdminBodyRowCol>
            <TableAdminBodyRowCol>
              <FormButton title="Éditer" iconOnly="fr-icon-edit-fill" size="sm" variant="tertiary-no-border" />
            </TableAdminBodyRowCol>
          </TableAdminBodyRow>
          <TableAdminBodyRow>
            <TableAdminBodyRowCol>
              <input type="checkbox" disabled />
            </TableAdminBodyRowCol>
            <TableAdminBodyRowCol>
              <Tag variant="error">Refusé</Tag>
            </TableAdminBodyRowCol>
            <TableAdminBodyRowCol>
              <strong>jean-michel-superlong@beta.gouv.fr</strong>
            </TableAdminBodyRowCol>
            <TableAdminBodyRowCol>12/10/2022</TableAdminBodyRowCol>
            <TableAdminBodyRowCol>12/10/2022</TableAdminBodyRowCol>
            <TableAdminBodyRowCol>800 168 767</TableAdminBodyRowCol>
            <TableAdminBodyRowCol>laurent.sutterlity@beta.gouv.fr</TableAdminBodyRowCol>
            <TableAdminBodyRowCol>
              <FormButton title="Éditer" iconOnly="fr-icon-edit-fill" size="sm" variant="tertiary-no-border" />
            </TableAdminBodyRowCol>
          </TableAdminBodyRow>
          <TableAdminBodyRow>
            <TableAdminBodyRowCol>
              <input type="checkbox" disabled />
            </TableAdminBodyRowCol>
            <TableAdminBodyRowCol>
              <Tag variant="warning">En erreur</Tag>
            </TableAdminBodyRowCol>
            <TableAdminBodyRowCol>
              <strong>jean-michel-superlong@beta.gouv.fr</strong>
            </TableAdminBodyRowCol>
            <TableAdminBodyRowCol>12/10/2022</TableAdminBodyRowCol>
            <TableAdminBodyRowCol>12/10/2022</TableAdminBodyRowCol>
            <TableAdminBodyRowCol>800 168 767</TableAdminBodyRowCol>
            <TableAdminBodyRowCol>laurent.sutterlity@beta.gouv.fr</TableAdminBodyRowCol>
            <TableAdminBodyRowCol>
              <FormButton
                title="Voir le détail"
                iconOnly="fr-icon-information-fill"
                size="sm"
                variant="tertiary-no-border"
              />
            </TableAdminBodyRowCol>
          </TableAdminBodyRow> */}
        </TableAdminBody>
      </TableAdmin>
    </>
  );
};

const ListeDeclarantsPage: NextPageWithLayout = () => {
  const router = useRouter();
  const [isCheck, setIsCheck] = useState<string[]>([]);
  const [orderAsc, setOrderAscParam] = useState(normalizeQueryParam(router.query.orderAsc) || undefined);
  const [orderBy, setOrderByParam] = useState(normalizeQueryParam(router.query.orderBy) || undefined);
  const [siren, setSirenParam] = useState(normalizeQueryParam(router.query.siren) || undefined);
  const [status, setStatusParam] = useState(normalizeQueryParam(router.query.status) || undefined);
  const { requests, error, isLoading, size, setSize } = useListeDeclarants(
    { orderAsc, orderBy, siren, status },
    ITEMS_PER_LOAD,
  );

  return (
    <section>
      <Container py="8w">
        <h1>Liste des demandes d’ajout des nouveaux déclarants</h1>
        <ButtonGroup inline="mobile-up" className="fr-mb-4w">
          <FormButton disabled={isCheck.length === 0}>Valider les demandes</FormButton>
          <FormButton disabled={isCheck.length === 0} variant="tertiary">
            Refuser les demandes
          </FormButton>
        </ButtonGroup>
        <DisplayListe
          requests={requests}
          error={error}
          isLoading={isLoading}
          itemsPerLoad={ITEMS_PER_LOAD}
          isCheck={isCheck}
          setIsCheck={setIsCheck}
          orderAsc={orderAsc}
          setOrderAscParam={setOrderAscParam}
          orderBy={orderBy}
          setOrderByParam={setOrderByParam}
          siren={siren}
          setSirenParam={setSirenParam}
          status={status}
          setStatusParam={setStatusParam}
        />
        {requests.data.length < requests.totalCount && (
          <Box>
            <FormButton variant="secondary" onClick={() => setSize(size + 1)}>
              Voir les {ITEMS_PER_LOAD} demandes suivantes
            </FormButton>
          </Box>
        )}
      </Container>
    </section>
  );
};

ListeDeclarantsPage.getLayout = ({ children }) => {
  return <AdminLayout title="Liste déclarants">{children}</AdminLayout>;
};

export default ListeDeclarantsPage;
