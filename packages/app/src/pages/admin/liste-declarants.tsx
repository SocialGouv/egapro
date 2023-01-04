import { OwnershipRequestStatus } from "@common/core-domain/domain/valueObjects/ownership_request/OwnershipRequestStatus";
import type { OwnershipRequestAction } from "@common/core-domain/dtos/OwnershipRequestActionDTO";
import type { GetOwnershipRequestInputOrderBy } from "@common/core-domain/dtos/OwnershipRequestDTO";
import { formatIsoToFr } from "@common/utils/date";
import { Object } from "@common/utils/overload";
import { AlertFeatureStatus, FeatureStatusProvider, useFeatureStatus } from "@components/FeatureStatusProvider";
import { AdminLayout } from "@components/layouts/AdminLayout";
import { Pagination } from "@components/Pagination";
import type { FormCheckboxProps, TagProps } from "@design-system";
import {
  Alert,
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
import { acceptOwnershipRequest } from "@services/apiClient/ownershipRequest";
import { useListeDeclarants } from "@services/apiClient/useListeDeclarants";
import {
  OwnershipRequestListContextProvider,
  useOwnershipRequestListContext,
} from "@services/apiClient/useOwnershipRequestListContext";
import type { MouseEventHandler } from "react";
import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";

import type { NextPageWithLayout } from "../_app";

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
  const { formState, setFormState } = useOwnershipRequestListContext();
  const { isLoading, requests, error } = useListeDeclarants(formState);
  const { orderDirection, orderBy, checkedItems, globalCheck } = formState;

  const hasToProcessRequests = useMemo(
    () => requests?.data.some(r => r.status === OwnershipRequestStatus.Enum.TO_PROCESS) ?? false,
    [requests?.data],
  );

  const toggleAll: NonNullable<FormCheckboxProps["onChange"]> = () => {
    if (globalCheck) {
      setFormState({ ...formState, checkedItems: [], globalCheck: false });
    } else {
      setFormState({
        ...formState,
        checkedItems:
          requests?.data.filter(r => r.status === OwnershipRequestStatus.Enum.TO_PROCESS).map(r => r.id) ?? [],
        globalCheck: true,
      });
    }
  };

  const toggleItem: NonNullable<FormCheckboxProps["onChange"]> = evt => {
    const { id, checked } = evt.target;

    if (!checked) {
      setFormState({ ...formState, checkedItems: checkedItems.filter(item => item !== id) });
    } else {
      setFormState({ ...formState, checkedItems: [...checkedItems, id] });
    }
  };

  const toggleOrderColumn = (columnValue: GetOwnershipRequestInputOrderBy) => {
    if (orderBy === columnValue) {
      setFormState({ ...formState, orderDirection: formState.orderDirection === "asc" ? "desc" : "asc" });
    } else {
      setFormState({ ...formState, orderBy: columnValue, orderDirection: "desc" });
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
      <TableAdmin>
        <TableAdminHead>
          <TableAdminHeadCol>
            <FormCheckboxGroup singleCheckbox size="sm" isDisabled={!hasToProcessRequests}>
              <FormCheckbox id="global-checkbox" onChange={toggleAll} checked={globalCheck} />
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
      <Pagination className="fr-mt-4w" />
    </>
  );
};

type SearchFormType = { siren: string; status: OwnershipRequestStatus.Enum };

const OwnershipRequestPage: NextPageWithLayout = () => {
  const { formState, setFormState } = useOwnershipRequestListContext();
  const { isLoading, requests, mutate } = useListeDeclarants(formState);
  const { checkedItems, siren, status } = formState;

  const { featureStatus, setFeatureStatus } = useFeatureStatus({ reset: true });

  const {
    handleSubmit,
    register,
    setValue,
    formState: { isSubmitting },
  } = useForm<SearchFormType>({
    defaultValues: {
      siren: "",
      status: formState.status,
    },
  });

  const onSubmit = (data: SearchFormType) => {
    setFormState({ ...formState, ...data });
  };
  useEffect(() => {
    setValue("siren", siren || "");
    if (status) setValue("status", status);
  }, [siren, status, setValue]);

  const resetForm: MouseEventHandler<HTMLButtonElement> = () => {
    setFormState({ ...formState, siren: "", status: OwnershipRequestStatus.Enum.TO_PROCESS });
  };

  const actionOnSelection = (action: OwnershipRequestAction) => async () => {
    console.debug(`${action} des demandes`, checkedItems.join(", "));

    try {
      setFeatureStatus({ type: "loading" });
      await acceptOwnershipRequest({ uuids: checkedItems, action });
      setFeatureStatus({
        type: "success",
        message: `Les demandes ont bien été ${action === "accept" ? "acceptées" : "refusées"}.`,
      });
      if (requests) mutate({ ...requests, data: requests.data.filter(request => !checkedItems.includes(request.id)) });
    } catch (error: unknown) {
      console.error("Error in liste-declarants", error);
      setFeatureStatus({
        type: "error",
        message:
          error instanceof Error && error.message
            ? error.message
            : `Une erreur a été détectée par le serveur lors de la demande.`,
      });
    }
  };

  return (
    <section>
      <Container py="8w">
        <h1>Liste des demandes d’ajout des nouveaux déclarants</h1>
        <form noValidate onSubmit={handleSubmit(onSubmit)}>
          <ButtonGroup inline="mobile-up" className="fr-mb-4w">
            <FormButton
              disabled={checkedItems.length === 0 || featureStatus.type === "loading"}
              onClick={actionOnSelection("accept")}
            >
              Valider les demandes
            </FormButton>
            <FormButton
              disabled={checkedItems.length === 0 || featureStatus.type === "loading"}
              variant="tertiary"
              onClick={actionOnSelection("refuse")}
            >
              Refuser les demandes
            </FormButton>
          </ButtonGroup>

          <AlertFeatureStatus type="error" title="Erreur" />
          <AlertFeatureStatus type="success" title="Succès" />

          <Grid haveGutters>
            <GridCol sm={3}>
              <FormGroup>
                <FormInput
                  id="siren-param"
                  placeholder="Rechercher par Siren"
                  autoComplete="off"
                  {...register("siren")}
                />
              </FormGroup>
            </GridCol>
            <GridCol sm={3}>
              <FormGroup>
                <FormSelect id="status-param" {...register("status")}>
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
                <FormButton isDisabled={isLoading || isSubmitting} type="submit">
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
        {/* {requests && requests.data.length < requests.totalCount && (
          <Grid justifyCenter>
            <FormButton variant="secondary" onClick={() => setSize(size + 1)}>
              Voir {nextCount > 1 ? `les ${nextCount}` : "la"} demande{nextCount > 1 ? "s" : ""} suivante
              {nextCount > 1 ? "s" : ""}
            </FormButton>
          </Grid>
        )} */}
      </Container>
    </section>
  );
};

OwnershipRequestPage.getLayout = ({ children }) => {
  return (
    <AdminLayout title="Liste déclarants">
      <FeatureStatusProvider>
        <OwnershipRequestListContextProvider>{children}</OwnershipRequestListContextProvider>
      </FeatureStatusProvider>
    </AdminLayout>
  );
};

export default OwnershipRequestPage;
