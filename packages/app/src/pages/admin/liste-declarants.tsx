import { OwnershipRequestStatus } from "@common/core-domain/domain/valueObjects/ownership_request/OwnershipRequestStatus";
import type {
  GetOwnershipRequestDTO,
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
  OwnershipRequestsSearchContextProvider,
  useOwnershipRequestsSearchContext,
} from "@services/apiClient/useOwnershipRequestsSearchContext";
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

interface DisplayListProps extends Omit<GetOwnershipRequestInputDTO, "limit" | "offset"> {
  error: unknown;
  isCheck: string[];
  isLoading: boolean;
  itemsPerLoad: number;
  requests: Omit<GetOwnershipRequestDTO, "params"> | undefined;
  setIsCheck: (isCheck: string[]) => void;
}
const DisplayList = ({ isLoading, error, requests, itemsPerLoad, isCheck, setIsCheck }: DisplayListProps) => {
  const [state, setState] = useOwnershipRequestsSearchContext();
  const { orderDirection, orderBy } = state;

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
    if (!checked) {
      setIsCheck(isCheck.filter(item => item !== id));
    } else {
      setIsCheck([...isCheck, id]);
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

  if (!requests) {
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
              <TableAdminBodyRowCol>{formatIsoToFr(item.createdAt)}</TableAdminBodyRowCol>
              <TableAdminBodyRowCol>{formatIsoToFr(item.modifiedAt)}</TableAdminBodyRowCol>
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
  const formRef = useRef<HTMLFormElement>(null);
  const [state, setState, result] = useOwnershipRequestsSearchContext();

  const { error, isLoading, isError, size, setSize, requests } = result;

  const [isCheck, setIsCheck] = useState<string[]>([]);

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

  return (
    <section>
      <Container py="8w">
        <h1>Liste des demandes d’ajout des nouveaux déclarants</h1>
        <form noValidate onSubmit={onSubmit} ref={formRef}>
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
        <DisplayList
          requests={requests}
          error={error}
          isLoading={isLoading}
          itemsPerLoad={ITEMS_PER_LOAD}
          isCheck={isCheck}
          setIsCheck={setIsCheck}
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
  return (
    <AdminLayout title="Liste déclarants">
      <OwnershipRequestsSearchContextProvider>{children}</OwnershipRequestsSearchContextProvider>
    </AdminLayout>
  );
};

export default ListeDeclarantsPage;
