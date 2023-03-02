import type { ErrorDetailTuple } from "@common/core-domain/domain/valueObjects/ownership_request/ErrorDetail";
import { errorDetailLabel } from "@common/core-domain/domain/valueObjects/ownership_request/ErrorDetail";
import { OwnershipRequestStatus } from "@common/core-domain/domain/valueObjects/ownership_request/OwnershipRequestStatus";
import type { OwnershipRequestAction } from "@common/core-domain/dtos/OwnershipRequestActionDTO";
import type { GetOwnershipRequestInputOrderBy } from "@common/core-domain/dtos/OwnershipRequestDTO";
import { formatIsoToFr } from "@common/utils/date";
import { Object } from "@common/utils/overload";
import { AlertFeatureStatus, FeatureStatusProvider, useFeatureStatus } from "@components/FeatureStatusProvider";
import { AdminLayout } from "@components/layouts/AdminLayout";
import { Pagination } from "@components/Pagination";
import type { TagProps } from "@design-system";
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
import { useAutoAnimate } from "@formkit/auto-animate/react";
import { acceptOwnershipRequest } from "@services/apiClient/ownershipRequest";
import { useListeDeclarants } from "@services/apiClient/useListeDeclarants";
import type { OwnershipRequestSearchParam } from "@services/apiClient/useOwnershipRequestListStore";
import { useOwnershipRequestListStore } from "@services/apiClient/useOwnershipRequestListStore";
import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";

import type { NextPageWithLayout } from "../_app";

const tagVariantStatusMap: Record<OwnershipRequestStatus.Enum, TagProps["variant"]> = {
  [OwnershipRequestStatus.Enum.TO_PROCESS]: "info",
  [OwnershipRequestStatus.Enum.REFUSED]: "error",
  [OwnershipRequestStatus.Enum.ACCEPTED]: "success",
  [OwnershipRequestStatus.Enum.ERROR]: "warning",
};

const columnsMap: Map<GetOwnershipRequestInputOrderBy | "name", string> = new Map([
  ["status", "Status"],
  ["askerEmail", "Demandeur"],
  ["createdAt", "Date de la demande"],
  ["modifiedAt", "Date de traitement"],
  ["siren", "Siren"],
  ["name", "Raison Sociale"],
  ["email", "Email"],
]);

const buildErrorDetailMesage = (errorDetail: string) => {
  if (errorDetail) {
    const [errorCode, errorInfo] = errorDetail.split(":") as ErrorDetailTuple;
    return `${errorDetailLabel[errorCode] || ""}${errorInfo.split(" | ").map(info => `\n- ${info}`)}`;
  }
};

const OwnershipRequestList = () => {
  const formState = useOwnershipRequestListStore(state => state.formState);
  const toggleAll = useOwnershipRequestListStore(state => state.toggleAll);
  const toggleItem = useOwnershipRequestListStore(state => state.toggleItem);
  const toggleOrderColumn = useOwnershipRequestListStore(state => state.togglerOrderColumn);

  const { isLoading, fetchedItems, error } = useListeDeclarants(formState);
  const { orderDirection, orderBy, checkedItems, globalCheck } = formState;

  const hasToProcessRequests = useMemo(
    () => fetchedItems?.data.some(r => r.status === OwnershipRequestStatus.Enum.TO_PROCESS) ?? false,
    [fetchedItems?.data],
  );

  if (isLoading) return <Alert type="info">Récupération des données en cours</Alert>;

  if (error) {
    return (
      <Alert size="sm" type="error" mt="3w">
        <p>Il y a eu une erreur lors de la récupération des données.</p>
      </Alert>
    );
  }
  if (!fetchedItems) return null;

  if (fetchedItems.totalCount === 0) {
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
              <FormCheckbox id="global-checkbox" onChange={() => toggleAll(fetchedItems)} checked={globalCheck} />
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
          <TableAdminHeadCol>{/* errorDetail */}</TableAdminHeadCol>
        </TableAdminHead>
        <TableAdminBody>
          {fetchedItems.data.map(item => (
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
                    onChange={event => toggleItem({ id: item.id, checked: event.target.checked })}
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
              <TableAdminBodyRowCol>{item.name}</TableAdminBodyRowCol>
              <TableAdminBodyRowCol>{item.email}</TableAdminBodyRowCol>
              <TableAdminBodyRowCol>
                {item.errorDetail && (
                  <Box className="fr-fi-information-line" title={buildErrorDetailMesage(item.errorDetail)}></Box>
                )}
              </TableAdminBodyRowCol>
            </TableAdminBodyRow>
          ))}
        </TableAdminBody>
      </TableAdmin>
      <Pagination className="fr-mt-4w" />
    </>
  );
};

const ActionButtons = () => {
  const formState = useOwnershipRequestListStore(state => state.formState);
  const { fetchedItems, mutate } = useListeDeclarants(formState);
  const { checkedItems } = formState;
  const { featureStatus, setFeatureStatus } = useFeatureStatus({ reset: true });

  const actionOnSelection = (action: OwnershipRequestAction) => async () => {
    // TODO real logger
    console.debug(`${action} des demandes`, checkedItems.join(", "));

    try {
      setFeatureStatus({ type: "loading" });
      await acceptOwnershipRequest({ uuids: checkedItems, action });
      setFeatureStatus({
        type: "success",
        message: `Les demandes ont bien été ${action === "accept" ? "acceptées" : "refusées"}.`,
      });
      if (fetchedItems)
        mutate({ ...fetchedItems, data: fetchedItems.data.filter(request => !checkedItems.includes(request.id)) });
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
    <>
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
    </>
  );
};

type SearchFormType = OwnershipRequestSearchParam;

const OwnershipRequestPage: NextPageWithLayout = () => {
  const formState = useOwnershipRequestListStore(state => state.formState);
  const submit = useOwnershipRequestListStore(state => state.submit);
  const reset = useOwnershipRequestListStore(state => state.reset);
  const { isLoading } = useListeDeclarants(formState);
  const { query, status } = formState;
  const [animationParent] = useAutoAnimate<HTMLDivElement>();

  const {
    handleSubmit,
    register,
    formState: { isSubmitting },
    setValue,
  } = useForm<SearchFormType>({
    defaultValues: {
      status,
      query,
    },
  });

  // Synchronizing form inputs with store. May look unnecessary at first, but mandatory for correct behaviour of the reset button.
  useEffect(() => {
    if (query !== undefined) setValue("query", query);
    if (status !== undefined) setValue("status", status);
  }, [query, status, setValue]);

  return (
    <Box as="section">
      <Container py="8w">
        <h1>Liste des demandes d’ajout des nouveaux déclarants</h1>

        <ActionButtons />

        <form noValidate onSubmit={handleSubmit(submit)}>
          <Grid haveGutters>
            <GridCol sm={3}>
              <FormGroup>
                <FormInput
                  id="query-param"
                  placeholder="Rechercher par Siren ou email"
                  autoComplete="off"
                  {...register("query")}
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
                {/* Don't use a reset type here, it will conflict with RHF in not using the set default values but instead, use empty siren and status. */}
                <FormButton variant="secondary" type="button" isDisabled={isLoading} onClick={reset}>
                  Réinitialiser
                </FormButton>
              </ButtonGroup>
            </GridCol>
          </Grid>
        </form>
        <br />
        <div ref={animationParent}>
          <OwnershipRequestList />
        </div>
      </Container>
    </Box>
  );
};

OwnershipRequestPage.getLayout = ({ children }) => {
  return (
    <AdminLayout title="Liste déclarants">
      <FeatureStatusProvider>{children}</FeatureStatusProvider>
    </AdminLayout>
  );
};

export default OwnershipRequestPage;
