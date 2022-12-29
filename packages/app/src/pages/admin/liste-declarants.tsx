import { OwnershipRequestStatus } from "@common/core-domain/domain/valueObjects/ownership_request/OwnershipRequestStatus";
import type {
  GetOwnershipRequestDTO,
  GetOwnershipRequestInputDTO,
  GetOwnershipRequestInputOrderBy,
} from "@common/core-domain/dtos/OwnershipRequestDTO";
import { getOwnershipRequestInputDTOSchema } from "@common/core-domain/dtos/OwnershipRequestDTO";
import { Object } from "@common/utils/overload";
import { buildUrlParams } from "@common/utils/url";
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
import { useListeDeclarants } from "@services/apiClient/useListeDeclarants";
import { useRouter } from "next/router";
import type { FormEvent } from "react";
import { useMemo, useState } from "react";

import type { NextPageWithLayout } from "../_app";

const ITEMS_PER_LOAD = 1;

const tagVariantStatusMap: Record<OwnershipRequestStatus.Enum, TagProps["variant"]> = {
  [OwnershipRequestStatus.Enum.TO_PROCESS]: "info",
  [OwnershipRequestStatus.Enum.REFUSED]: "error",
  [OwnershipRequestStatus.Enum.ACCEPTED]: "success",
  [OwnershipRequestStatus.Enum.ERROR]: "warning",
};

type ToStateProps<T> = T & {
  [K in keyof T as `set${Capitalize<K extends string ? K : never>}`]-?: (value: T[K]) => void;
};

const orderByNameMap: Record<GetOwnershipRequestInputOrderBy, string> = {
  status: "Status",
  askerEmail: "Demandeur",
  createdAt: "Date de la demande",
  modifiedAt: "Date de traitement",
  siren: "Siren",
  email: "Email",
};

interface DisplayListeProps extends ToStateProps<Omit<GetOwnershipRequestInputDTO, "limit" | "offset">> {
  error: unknown;
  isCheck: string[];
  isLoading: boolean;
  itemsPerLoad: number;
  requests: Omit<GetOwnershipRequestDTO, "params"> | undefined;
  setIsCheck: (isCheck: string[]) => void;
}
const DisplayListe = ({
  isLoading,
  error,
  requests,
  itemsPerLoad,
  isCheck,
  setIsCheck,
  order,
  setOrder,
  orderBy,
  setOrderBy,
  siren,
  setSiren,
  status,
  setStatus,
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

  // if (isLoading) return <Alert type="info">Récupération des données en cours</Alert>;

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
          {Object.entries(orderByNameMap).map(([orderByValue, orderByName]) => (
            <TableAdminHeadCol
              key={`orderByValue-${orderByValue}`}
              order={orderBy === orderByValue && order}
              onClick={() =>
                orderBy === orderByValue
                  ? setOrder(order === "asc" ? "desc" : "asc")
                  : (setOrderBy(orderByValue), setOrder("desc"))
              }
            >
              {orderByName}
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
  const parsed = getOwnershipRequestInputDTOSchema.safeParse(router.query);
  const params = useMemo(() => (parsed.success ? parsed.data : {}), [parsed]);

  const [isCheck, setIsCheck] = useState<string[]>([]);
  const [orderAsc, setOrder] = useState(params.order);
  const [orderBy, setOrderBy] = useState(params.orderBy);
  const [siren, setSiren] = useState(params.siren);
  const [status, setStatus] = useState(params.status);

  const { requests, error, isLoading, size, setSize } = useListeDeclarants(
    { orderAsc, orderBy, siren, status },
    ITEMS_PER_LOAD,
  );

  // useEffect(() => {
  //   if (!isLoading && !error) {
  //     setOrder(requests.params.order);
  //     setOrderBy(requests.params.orderBy);
  //     setSiren(requests.params.siren);
  //     setStatus(requests.params.status);

  //     !_.isEqual(params, requests.params) &&
  //       router.push({ pathname: window.location.pathname, query: requests.params });
  //   }
  // }, [
  //   error,
  //   isLoading,
  //   params,
  //   requests.params,
  //   requests.params.order,
  //   requests.params.orderBy,
  //   requests.params.siren,
  //   requests.params.status,
  //   router,
  // ]);

  const nextCount = Math.min(requests.totalCount - requests.data.length, ITEMS_PER_LOAD);

  // console.log({ size }, OwnershipRequestStatus.Enum);

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const formData = new FormData(event.target as HTMLFormElement);

    const data = Object.fromEntries(formData) as unknown as GetOwnershipRequestInputDTO;
    console.log("data", data);

    router.replace(`liste-declarants?${buildUrlParams(data)}`);
  };

  return (
    <section>
      <Container py="8w">
        <h1>Liste des demandes d’ajout des nouveaux déclarants</h1>
        <form noValidate onSubmit={onSubmit}>
          <ButtonGroup inline="mobile-up" className="fr-mb-4w">
            <FormButton disabled={isCheck.length === 0}>Valider les demandes</FormButton>
            <FormButton disabled={isCheck.length === 0} variant="tertiary">
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
                <FormSelect id="status-param" name="status">
                  <option value="">Rechercher par Status</option>
                  {Object.entries(OwnershipRequestStatus.Enum).map(([key, value]) => (
                    <option key={`status-${key}`} value={value}>
                      {value}
                    </option>
                  ))}
                </FormSelect>
              </FormGroup>
            </GridCol>
            <GridCol sm={3}>
              <ButtonGroup inline="mobile-up">
                <FormButton isDisabled={isLoading}>Rechercher</FormButton>
                <FormButton
                  variant="secondary"
                  type="reset"
                  isDisabled={isLoading}
                  // onClick={() => {
                  //   resetInputs({});
                  //   router.replace({ pathname: "/representation-equilibree/recherche", query: { q: "" } });
                  // }}
                >
                  Réinitialiser
                </FormButton>
              </ButtonGroup>
            </GridCol>
          </Grid>
        </form>
        <br />
        <DisplayListe
          requests={requests}
          error={error}
          isLoading={isLoading}
          itemsPerLoad={ITEMS_PER_LOAD}
          isCheck={isCheck}
          setIsCheck={setIsCheck}
          order={orderAsc}
          setOrder={setOrder}
          orderBy={orderBy}
          setOrderBy={setOrderBy}
          siren={siren}
          setSiren={setSiren}
          status={status}
          setStatus={setStatus}
        />
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

ListeDeclarantsPage.getLayout = ({ children }) => {
  return <AdminLayout title="Liste déclarants">{children}</AdminLayout>;
};

export default ListeDeclarantsPage;
