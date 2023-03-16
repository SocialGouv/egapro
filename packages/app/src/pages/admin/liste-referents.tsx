import type { ReferentDTO } from "@common/core-domain/dtos/ReferentDTO";
import { referentDTOSchema } from "@common/core-domain/dtos/ReferentDTO";
import { COUNTIES, REGIONS, REGIONS_TO_COUNTIES } from "@common/dict";
import { Object } from "@common/utils/overload";
import { storePicker } from "@common/utils/zustand";
import { AdminLayout } from "@components/layouts/AdminLayout";
import type { ModalProps } from "@design-system";
import {
  Box,
  Container,
  FormButton,
  FormCheckbox,
  FormGroup,
  FormGroupLabel,
  FormGroupMessage,
  FormInput,
  FormRadioGroup,
  FormRadioGroupContent,
  FormRadioGroupInput,
  FormRadioGroupLegend,
  FormSelect,
  Icon,
  Link,
  Modal,
  TableAdmin,
  TableAdminBody,
  TableAdminBodyRow,
  TableAdminBodyRowCol,
  TableAdminHead,
  TableAdminHeadCol,
} from "@design-system";
import { useAutoAnimate } from "@formkit/auto-animate/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { fetcherV2 } from "@services/apiClient";
import { useReferentListStore } from "@services/apiClient/useReferentListStore";
import _ from "lodash";
import { Suspense, useCallback, useEffect, useId } from "react";
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

const useReferentList = () =>
  useSWR<ReferentDTO[]>("/admin/referent", fetcherV2, { suspense: true, shouldRetryOnError: false });
const useStorePicker = storePicker(useReferentListStore);

interface ReferentListProps {
  editModalId: string;
  referents: ReferentDTO[];
}

const ReferentList = ({ referents, editModalId }: ReferentListProps) => {
  const [orderBy, orderDirection, setCurrentEdited, togglerOrderColumn] = useStorePicker(
    "orderBy",
    "orderDirection",
    "setCurrentEdited",
    "togglerOrderColumn",
  );
  const [animationParent] = useAutoAnimate<HTMLTableSectionElement>();

  const { mutate, error } = useReferentList();

  const doEditLine = useCallback(
    (referent: ReferentDTO) => {
      setCurrentEdited(referent);
    },
    [setCurrentEdited],
  );

  const doDeleteLine = useCallback(
    async (referent: ReferentDTO) => {
      const yes = confirm(`Supprimer "${referent.name}" ?`);
      if (yes) {
        await mutate();
      }
    },
    [mutate],
  );

  return (
    <>
      <TableAdmin>
        <TableAdminHead>
          {columnMap.map(([columnValue, columnLabel]) => (
            <TableAdminHeadCol
              key={columnValue}
              orderDirection={orderBy === columnValue && orderDirection}
              onClick={() => {
                togglerOrderColumn(columnValue);
              }}
            >
              {columnLabel}
            </TableAdminHeadCol>
          ))}
          <TableAdminHeadCol>Actions</TableAdminHeadCol>
        </TableAdminHead>
        <TableAdminBody ref={animationParent}>
          <Suspense
            fallback={new Array(4).fill(null).map((_, index) => (
              <TableAdminBodyRow key={`fallback-referent-${index}`}>
                <TableAdminBodyRowCol>---</TableAdminBodyRowCol>
              </TableAdminBodyRow>
            ))}
          >
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
                  <FormButton
                    iconOnly="fr-icon-edit-fill"
                    variant="tertiary"
                    size="sm"
                    onClick={() => doEditLine(referent)}
                    aria-controls={editModalId}
                    data-fr-opened="false"
                  />{" "}
                  <FormButton
                    iconOnly="fr-icon-delete-fill"
                    variant="tertiary"
                    size="sm"
                    onClick={() => doDeleteLine(referent)}
                    // aria-controls={editModalId}
                    data-fr-opened="false"
                  />
                </TableAdminBodyRowCol>
              </TableAdminBodyRow>
            ))}
          </Suspense>
        </TableAdminBody>
      </TableAdmin>
    </>
  );
};

interface EditReferentModalProps {
  id: string;
}
const EditReferentModal = ({ id }: EditReferentModalProps) => {
  const [currentEdited, setCurrentEdited] = useStorePicker("currentEdited", "setCurrentEdited");
  const {
    handleSubmit,
    register,
    formState: { errors },
    reset,
    watch,
  } = useForm<ReferentDTO>({
    resolver: zodResolver(referentDTOSchema),
    mode: "onChange",
  });

  useEffect(() => {
    reset(currentEdited);
  }, [reset, currentEdited]);

  const writtenName = watch("name");
  const selectedRegion = watch("region");
  const selectedType = watch("type");

  const fieldMap = new Map(columnMap);

  const onClose: ModalProps["onClose"] = () => {
    console.log("modal closed");
    setCurrentEdited();
  };

  // TODO
  const doDelete = () => {
    console.log("trigger delete");
  };

  // TODO
  const doEdit = () => {
    console.log("trigger edit");
  };

  return (
    <Modal
      onClose={onClose}
      title={`Éditer - ${writtenName || "👻"}`}
      icon="fr-icon-arrow-right-line"
      id={id}
      content={
        <form noValidate onSubmit={handleSubmit(_.noop)}>
          <FormGroup isError={!!errors.principal}>
            <FormCheckbox
              id="edit-referent-principal"
              aria-describedby={errors.principal && "edit-referent-principal-error"}
              {...register("principal")}
            >
              {fieldMap.get("principal")}
            </FormCheckbox>
            {errors.principal && (
              <FormGroupMessage id="edit-referent-principal-error">{errors.principal.message}</FormGroupMessage>
            )}
          </FormGroup>

          <FormGroup isError={!!errors.name}>
            <FormGroupLabel htmlFor="edit-referent-name" hint='Format : "Prénom NOM" ou "Nom du service"'>
              {fieldMap.get("name")}
            </FormGroupLabel>
            <FormInput
              id="edit-referent-name"
              aria-describedby={errors.name && "edit-referent-name-error"}
              placeholder="Jean DUPONT"
              autoComplete="off"
              {...register("name")}
            />
            {errors.name && <FormGroupMessage id="edit-referent-name-error">{errors.name.message}</FormGroupMessage>}
          </FormGroup>

          <FormGroup isError={!!errors.region}>
            <FormGroupLabel htmlFor="edit-referent-region">{fieldMap.get("region")}</FormGroupLabel>
            <FormSelect
              id="edit-referent-region"
              aria-describedby={errors.region && "edit-referent-region-error"}
              defaultValue={currentEdited?.region ?? ""}
              {...register("region")}
            >
              {_.sortBy(Object.entries(REGIONS), "0").map(([code, name]) => (
                <option value={code} key={`edit-referent-region-option-${code}`}>
                  {name} ({code})
                </option>
              ))}
            </FormSelect>
            {errors.region && (
              <FormGroupMessage id="edit-referent-region-error">{errors.region.message}</FormGroupMessage>
            )}
          </FormGroup>

          <FormGroup isError={!!errors.county}>
            <FormGroupLabel htmlFor="edit-referent-county" hint="Non obligatoire (ex: coordination régionale)">
              {fieldMap.get("county")}
            </FormGroupLabel>
            <FormSelect
              id="edit-referent-county"
              aria-describedby={errors.county && "edit-referent-county-error"}
              defaultValue={currentEdited?.county ?? ""}
              {...register("county")}
            >
              <option value="">Départements</option>
              {REGIONS_TO_COUNTIES[selectedRegion]?.map(code => (
                <option value={code} key={`edit-referent-county-option-${code}`}>
                  {COUNTIES[code]} ({code})
                </option>
              ))}
            </FormSelect>
            {errors.county && (
              <FormGroupMessage id="edit-referent-county-error">{errors.county.message}</FormGroupMessage>
            )}
          </FormGroup>

          <FormGroup isError={!!errors.value}>
            <FormGroupLabel htmlFor="edit-referent-value" hint={`Format : ${selectedType}`}>
              {fieldMap.get("value")}
            </FormGroupLabel>
            <FormInput
              id="edit-referent-value"
              aria-describedby={errors.name && "edit-referent-value-error"}
              placeholder={selectedType === "url" ? "https://site.gouv.fr" : "email@gouv.fr"}
              autoComplete="off"
              {...register("value")}
            />
            {errors.value && <FormGroupMessage id="edit-referent-value-error">{errors.value.message}</FormGroupMessage>}
          </FormGroup>
          <FormRadioGroup inline>
            <FormRadioGroupLegend id="edit-referent-type">Type de la valeur</FormRadioGroupLegend>
            <FormRadioGroupContent>
              <FormRadioGroupInput id="edit-referent-type-email" value="email" {...register("type")}>
                Email
              </FormRadioGroupInput>
              <FormRadioGroupInput id="edit-referent-type-url" value="url" {...register("type")}>
                URL
              </FormRadioGroupInput>
            </FormRadioGroupContent>
          </FormRadioGroup>
        </form>
      }
      buttons={({ closableProps, instance }) => [
        <FormButton
          variant="tertiary"
          key={`edit-referent-modal-delete-button-${id}`}
          onClick={() => {
            console.log(instance);
            doDelete();
            instance?.conceal();
          }}
          // {...closableProps}
        >
          Supprimer
        </FormButton>,
        <FormButton key={`edit-referent-modal-save-button-${id}`} onClick={() => doEdit()} {...closableProps}>
          Sauvegarder
        </FormButton>,
      ]}
    />
  );
};

const ReferentListPage: NextPageWithLayout = () => {
  const { data } = useReferentList();
  const [orderBy, orderDirection] = useStorePicker("orderBy", "orderDirection");
  const editModalId = `edit-modal-${useId()}`;

  const { handleSubmit, register, watch } = useForm<{ query: string }>();

  const searchString = watch("query");
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
      <EditReferentModal id={editModalId} />
      <Box as="section">
        <Container py="8w">
          <h1>Liste des des référents Egapro</h1>

          <form noValidate onSubmit={handleSubmit(_.noop)}>
            <FormGroup>
              <FormInput id="query-param" placeholder="Rechercher" autoComplete="off" {...register("query")} />
            </FormGroup>
          </form>
          <br />
          <ReferentList referents={referents} editModalId={editModalId} />
        </Container>
      </Box>
    </>
  );
};

const PlaceholderPage = () => {
  return (
    <Box as="section">
      <Container py="8w">
        <h1>Liste des des référents Egapro</h1>

        <Box
          style={{ background: "var(--background-alt-grey)", width: "100%", height: "20rem", borderRadius: 20 }}
        ></Box>
      </Container>
    </Box>
  );
};

ReferentListPage.getLayout = ({ children }) => {
  return (
    <AdminLayout title="Liste référents" placeholder={<PlaceholderPage />}>
      {children}
    </AdminLayout>
  );
};

export default ReferentListPage;
