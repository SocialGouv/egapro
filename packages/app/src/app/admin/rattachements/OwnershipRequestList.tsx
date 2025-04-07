"use client";

import Badge, { type BadgeProps } from "@codegouvfr/react-dsfr/Badge";
import Button from "@codegouvfr/react-dsfr/Button";
import Checkbox from "@codegouvfr/react-dsfr/Checkbox";
import { Input } from "@codegouvfr/react-dsfr/Input";
import { Select } from "@codegouvfr/react-dsfr/Select";
import {
  errorDetailLabel,
  type ErrorDetailTuple,
} from "@common/core-domain/domain/valueObjects/ownership_request/ErrorDetail";
import { OwnershipRequestStatus } from "@common/core-domain/domain/valueObjects/ownership_request/OwnershipRequestStatus";
import { type OwnershipRequestAction } from "@common/core-domain/dtos/OwnershipRequestActionDTO";
import {
  type GetOwnershipRequestDTO,
  type GetOwnershipRequestInputOrderBy,
} from "@common/core-domain/dtos/OwnershipRequestDTO";
import { formatIsoToFr } from "@common/utils/date";
import { AlertFeatureStatus, useFeatureStatus } from "@components/utils/FeatureStatusProvider";
import {
  Box,
  Container,
  Grid,
  GridCol,
  TableAdmin,
  TableAdminBody,
  TableAdminBodyRow,
  TableAdminBodyRowCol,
  TableAdminHead,
  TableAdminHeadCol,
} from "@design-system";
import { useAutoAnimate } from "@formkit/auto-animate/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";

import { acceptOwnershipRequest } from "../../(default)/rattachement/actions";
import { buildKey, Pagination } from "./Pagination";
import { type OwnershipRequestSearchParam, useOwnershipRequestListStore } from "./useOwnershipRequestListStore";

const tagVariantStatusMap: Record<OwnershipRequestStatus.Enum, BadgeProps["severity"]> = {
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

export const OwnershipRequestList = ({ fetchedItems }: { fetchedItems: GetOwnershipRequestDTO }) => {
  const formState = useOwnershipRequestListStore(state => state.formState);
  const toggleAll = useOwnershipRequestListStore(state => state.toggleAll);
  const toggleItem = useOwnershipRequestListStore(state => state.toggleItem);
  const toggleOrderColumn = useOwnershipRequestListStore(state => state.togglerOrderColumn);

  const { orderDirection, orderBy, checkedItems, globalCheck } = formState;

  if (!fetchedItems) return null;

  if (fetchedItems.totalCount === 0) {
    return <p>Aucune demande d'ajout de déclarants.</p>;
  }
  return (
    <>
      <TableAdmin>
        <TableAdminHead>
          <TableAdminHeadCol>
            <Checkbox
              id="global-checkbox"
              className="request-checkbox"
              options={[
                {
                  label: "",
                  nativeInputProps: {
                    name: "checkboxes-1",
                    value: "value1",
                    checked: globalCheck,
                    onChange: () => toggleAll(fetchedItems),
                  },
                },
              ]}
            />
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
                <Checkbox
                  id={item.id}
                  className="request-checkbox"
                  options={[
                    {
                      label: "",
                      nativeInputProps: {
                        checked: checkedItems.includes(item.id),
                        onChange: event => toggleItem({ id: item.id, checked: event.target.checked }),
                      },
                    },
                  ]}
                />
              </TableAdminBodyRowCol>
              <TableAdminBodyRowCol>
                <Badge severity={tagVariantStatusMap[item.status]}>{item.status}</Badge>
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
      <Pagination className="fr-mt-4w" fetchedItems={fetchedItems} />
    </>
  );
};

const ActionButtons = () => {
  const formState = useOwnershipRequestListStore(state => state.formState);
  const { checkedItems } = formState;
  const { featureStatus, setFeatureStatus } = useFeatureStatus({ reset: true });
  const router = useRouter();

  const actionOnSelection = (action: OwnershipRequestAction) => async () => {
    console.debug(`${action} des demandes`, checkedItems.join(", "));

    try {
      setFeatureStatus({ type: "loading" });
      await acceptOwnershipRequest({ uuids: checkedItems, action });
      setFeatureStatus({
        type: "success",
        message: `Les demandes ont bien été ${action === "accept" ? "acceptées" : "refusées"}.`,
      });
      router.refresh();
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
      <Button
        disabled={checkedItems.length === 0 || featureStatus.type === "loading"}
        onClick={actionOnSelection("accept")}
      >
        Valider les demandes
      </Button>
      <Button
        disabled={checkedItems.length === 0 || featureStatus.type === "loading"}
        priority="tertiary"
        onClick={actionOnSelection("refuse")}
      >
        Refuser les demandes
      </Button>

      <AlertFeatureStatus type="error" title="Erreur" />
      <AlertFeatureStatus type="success" title="Succès" />
    </>
  );
};

type SearchFormType = OwnershipRequestSearchParam;

export const OwnershipRequestPage = ({ fetchedItems }: { fetchedItems: GetOwnershipRequestDTO }) => {
  const formState = useOwnershipRequestListStore(state => state.formState);
  const submit = useOwnershipRequestListStore(state => state.submit);
  const reset = useOwnershipRequestListStore(state => state.reset);
  const { query, status } = formState;
  const [animationParent] = useAutoAnimate<HTMLDivElement>();
  const [firstLoaded, setFirstLoaded] = useState<boolean>(true);
  const router = useRouter();

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

  useEffect(() => {
    if (query !== undefined) setValue("query", query);
    if (status !== undefined) setValue("status", status);
  }, [query, status, setValue]);

  useEffect(() => {
    if (!firstLoaded) {
      router.push(`/admin/rattachements?${buildKey(formState)}`);
    }
    setFirstLoaded(false);
    return () => setFirstLoaded(true);
  }, [
    fetchedItems,
    formState.pageNumber,
    formState.pageSize,
    formState.orderBy,
    formState.orderDirection,
    formState.query,
    formState.status,
  ]);

  return (
    <Box as="section">
      <Container py="8w">
        <h1>Liste des demandes d’ajout des nouveaux déclarants</h1>

        <ActionButtons />

        <form noValidate onSubmit={handleSubmit(submit)}>
          <Grid haveGutters>
            <GridCol base={3}>
              <Input
                id="query-param"
                label=""
                nativeInputProps={{
                  ...register("query"),
                  placeholder: "Rechercher par Siren ou email",
                  autoComplete: "off",
                }}
              />
            </GridCol>
            <GridCol base={3}>
              <Select label="" nativeSelectProps={{ ...register("status") }}>
                <option value="">Rechercher par Status</option>
                {Object.entries(OwnershipRequestStatus.Enum).map(([key, value]) => (
                  <option key={key} value={value}>
                    {value}
                  </option>
                ))}
              </Select>
            </GridCol>
            <GridCol base={3}>
              <Button type="submit" nativeButtonProps={{ disabled: isSubmitting }}>
                Rechercher
              </Button>
              <Button type="button" priority="secondary" onClick={reset}>
                Réinitialiser
              </Button>
            </GridCol>
          </Grid>
        </form>
        <br />
        <div ref={animationParent}>
          <OwnershipRequestList fetchedItems={fetchedItems} />
        </div>
      </Container>
    </Box>
  );
};
