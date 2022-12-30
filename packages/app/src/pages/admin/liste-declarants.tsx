import { OwnershipRequestStatus } from "@common/core-domain/domain/valueObjects/ownership_request/OwnershipRequestStatus";
import type {
  GetOwnershipRequestInputDTO,
  GetOwnershipRequestInputOrderBy,
} from "@common/core-domain/dtos/OwnershipRequestDTO";
import { formatIsoToFr } from "@common/utils/date";
import { Object } from "@common/utils/overload";
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
  FormGroup,
  FormInput,
  FormSelect,
  Grid,
  GridCol,
  TableAdmin,
  TableAdminBody,
  TableAdminBodyRow,
  TableAdminBodyRowCol,
  TableAdminHead,
  TableAdminHeadCol,
  Tag,
} from "@design-system";
import {
  OwnershipRequestListContextProvider,
  useOwnershipRequestListContext,
} from "@services/apiClient/useOwnershipRequestListContext";
import type { FormEvent, MouseEventHandler } from "react";
import { useMemo, useRef, useState } from "react";

import type { NextPageWithLayout } from "../_app";

const ITEMS_PER_LOAD = 3;

const tagVariantStatusMap: Record<OwnershipRequestStatus.Enum, TagProps["variant"]> = {
  [OwnershipRequestStatus.Enum.TO_PROCESS]: "info",
  [OwnershipRequestStatus.Enum.REFUSED]: "error",
  [OwnershipRequestStatus.Enum.ACCEPTED]: "success",
  [OwnershipRequestStatus.Enum.ERROR]: "warning",
};

const columnsMap: Map<GetOwnershipRequestInputOrderBy, string> = new Map([
  ["status", "Status"],
  ["askerEmail", "Demandeur"],
  ["createdAt", "Date de la demande"],
  ["modifiedAt", "Date de traitement"],
  ["siren", "Siren"],
  ["email", "Email"],
]);

const OwnershipRequestList = () => {
  const [state, setState, result] = useOwnershipRequestListContext();
  const { orderDirection, orderBy, checkedItems } = state;

  const { requests, isLoading, error } = result;

  const hasToProcessRequests = useMemo(
    () => requests?.data.some(r => r.status === OwnershipRequestStatus.Enum.TO_PROCESS) ?? false,
    [requests?.data],
  );

  const [globalCheck, setGlobalCheck] = useState(false);

  const toggleAll: NonNullable<FormCheckboxProps["onChange"]> = () => {
    setGlobalCheck(!globalCheck);
    if (globalCheck) {
      setState({ ...state, checkedItems: [] });
    } else {
      setState({ ...state, checkedItems: requests?.data.map(r => r.id) ?? [] });
    }
  };

  const toggleItem: NonNullable<FormCheckboxProps["onChange"]> = evt => {
    const { id, checked } = evt.target;

    if (!checked) {
      setState({ ...state, checkedItems: checkedItems.filter(item => item !== id) });
    } else {
      setState({ ...state, checkedItems: [...checkedItems, id] });
    }
  };

  const toggleOrderColumn = (columnValue: GetOwnershipRequestInputOrderBy) => {
    if (orderBy === columnValue) {
      setState({ ...state, orderDirection: state.orderDirection === "asc" ? "desc" : "asc" });
    } else {
      setState({ ...state, orderBy: columnValue, orderDirection: "desc" });
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
  if (!requests) return null;

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
          {requests.data.length} {requests.totalCount > ITEMS_PER_LOAD ? `sur ${requests.totalCount}` : ""} demande
          {requests.totalCount > 1 ? "s" : ""}
        </p>
      </Box>
      <TableAdmin>
        <TableAdminHead>
          <TableAdminHeadCol>
            <FormCheckboxGroup singleCheckbox size="sm" isDisabled={!hasToProcessRequests}>
              <FormCheckbox id="global-checkbox" onChange={toggleAll} />
            </FormCheckboxGroup>
          </TableAdminHeadCol>
          {Array.from(columnsMap).map(([columnValue, columnLabel]) => (
            <TableAdminHeadCol
              key={columnValue}
              orderDirection={orderBy === columnValue && orderDirection}
              onClick={() => toggleOrderColumn(columnValue)}
            >
              {columnLabel}
            </TableAdminHeadCol>
          ))}
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
                    checked={checkedItems.includes(item.id)}
                    onChange={toggleItem}
                  />
                </FormCheckboxGroup>
              </TableAdminBodyRowCol>
              <TableAdminBodyRowCol>
                <Tag variant={tagVariantStatusMap[item.status]}>{item.status}</Tag>
              </TableAdminBodyRowCol>
              <TableAdminBodyRowCol>
                <strong>{item.askerEmail}</strong>
              </TableAdminBodyRowCol>
              <TableAdminBodyRowCol>{formatIsoToFr(item.createdAt)}</TableAdminBodyRowCol>
              <TableAdminBodyRowCol>{formatIsoToFr(item.modifiedAt)}</TableAdminBodyRowCol>
              <TableAdminBodyRowCol>{item.siren}</TableAdminBodyRowCol>
              <TableAdminBodyRowCol>{item.email}</TableAdminBodyRowCol>
              {/* <TableAdminBodyRowCol>
                <FormButton title="Éditer" iconOnly="fr-icon-edit-fill" size="sm" variant="tertiary-no-border" />
              </TableAdminBodyRowCol> */}
            </TableAdminBodyRow>
          ))}
        </TableAdminBody>
      </TableAdmin>
    </>
  );
};

const OwnershipRequestPage: NextPageWithLayout = () => {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, setState, result] = useOwnershipRequestListContext();
  const { checkedItems } = state;

  const { isLoading, size, setSize, requests } = result;

  const nextCount = Math.min(requests.totalCount - requests.data.length, ITEMS_PER_LOAD);

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.target as HTMLFormElement);
    const data = Object.fromEntries(formData) as unknown as GetOwnershipRequestInputDTO;
    setState({ ...state, ...data });
  };

  const resetForm: MouseEventHandler<HTMLButtonElement> = () => {
    formRef.current?.reset();
    // eslint-disable-next-line unused-imports/no-unused-vars
    const { siren, ...rest } = state;
    setState({ ...rest, status: OwnershipRequestStatus.Enum.TO_PROCESS });
  };

  const acceptRequests = () => {
    console.log("Acceptation des demandes", checkedItems.join(", "));
    // fetch POST
  };

  const refuseRequests = () => {
    console.log("Refus des demandes", checkedItems.join(", "));
  };

  return (
    <section>
      <Container py="8w">
        <h1>Liste des demandes d’ajout des nouveaux déclarants</h1>
        <form noValidate onSubmit={onSubmit} ref={formRef}>
          <ButtonGroup inline="mobile-up" className="fr-mb-4w">
            <FormButton disabled={checkedItems.length === 0} onClick={acceptRequests}>
              Valider les demandes
            </FormButton>
            <FormButton disabled={checkedItems.length === 0} variant="tertiary" onClick={refuseRequests}>
              Refuser les demandes
            </FormButton>
          </ButtonGroup>
          <Grid haveGutters>
            <GridCol sm={3}>
              <FormGroup>
                <FormInput id="siren-param" placeholder="Rechercher par Siren" name="siren" />
              </FormGroup>
            </GridCol>
            <GridCol sm={3}>
              <FormGroup>
                <FormSelect id="status-param" name="status" defaultValue={state.status}>
                  <option value="">Rechercher par Status</option>
                  {Object.entries(OwnershipRequestStatus.Enum).map(([key, value]) => (
                    <option key={key} value={value}>
                      {value}
                    </option>
                  ))}
                </FormSelect>
              </FormGroup>
            </GridCol>
            <GridCol sm={3}>
              <ButtonGroup inline="mobile-up">
                <FormButton isDisabled={isLoading} type="submit">
                  Rechercher
                </FormButton>
                <FormButton variant="secondary" type="reset" isDisabled={isLoading} onClick={resetForm}>
                  Réinitialiser
                </FormButton>
              </ButtonGroup>
            </GridCol>
          </Grid>
        </form>
        <br />
        <OwnershipRequestList />
        {requests.data.length < requests.totalCount && (
          <Grid justifyCenter>
            <FormButton variant="secondary" onClick={() => setSize(size + 1)}>
              Voir {nextCount > 1 ? `les ${nextCount}` : "la"} demande{nextCount > 1 ? "s" : ""} suivante
              {nextCount > 1 ? "s" : ""}
            </FormButton>
          </Grid>
        )}
      </Container>
    </section>
  );
};

OwnershipRequestPage.getLayout = ({ children }) => {
  return (
    <AdminLayout title="Liste déclarants">
      <OwnershipRequestListContextProvider>{children}</OwnershipRequestListContextProvider>
    </AdminLayout>
  );
};

export default OwnershipRequestPage;
