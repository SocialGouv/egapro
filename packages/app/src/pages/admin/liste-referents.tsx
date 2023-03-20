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
  FormFieldset,
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

  // TODO:
  const doEditLine = useCallback(
    (referent: ReferentDTO) => {
      setCurrentEdited(referent);
    },
    [setCurrentEdited],
  );

  // TODO:
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
                <TableAdminBodyRowCol>
                  {referent.name}
                  {referent.type === "email" && referent.substitute?.name ? (
                    <>
                      <br />
                      <i className="fr-text--xs">{referent.substitute.name}</i>
                    </>
                  ) : (
                    ""
                  )}
                </TableAdminBodyRowCol>
                <TableAdminBodyRowCol>
                  <Link
                    size="sm"
                    iconLeft={referent.type === "email" ? "fr-icon-mail-fill" : "fr-icon-link"}
                    href={(referent.type === "email" ? "mailto:" : "") + referent.value}
                  >
                    {_.truncate(referent.value, { length: 40 })}
                  </Link>
                  {referent.type === "email" && referent.substitute?.email ? (
                    <>
                      <br />
                      <Link size="sm" href={`mailto:${referent.substitute.email}`}>
                        <i className="fr-text--xs">{_.truncate(referent.substitute.email, { length: 40 })}</i>
                      </Link>
                    </>
                  ) : (
                    ""
                  )}
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
    formState: { errors, isValid, isDirty },
    reset,
    watch,
    trigger,
  } = useForm<ReferentDTO>({
    resolver: zodResolver(referentDTOSchema),
    mode: "onChange",
  });

  useEffect(() => {
    reset({
      ...currentEdited,
      county: currentEdited?.county,
      substitute: {
        email: currentEdited?.substitute?.email ?? "",
        name: currentEdited?.substitute?.name ?? "",
      },
    });
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
  const doEdit = async () => {
    console.log("trigger edit");
    const go = await trigger();
    if (go) {
      handleSubmit(data => console.log(data));
    }
  };

  return (
    <Modal
      onClose={onClose}
      title={`Éditer - ${writtenName || "👻"}`}
      icon="fr-icon-arrow-right-line"
      id={id}
      content={
        <form onSubmit={handleSubmit(_.noop)}>
          <input type="hidden" id="form-referent-id" {...register("id")} />
          <FormGroup isError={!!errors.principal}>
            <FormCheckbox
              id="form-referent-principal"
              aria-describedby={errors.principal && "form-referent-principal-error"}
              {...register("principal")}
            >
              {fieldMap.get("principal")}
            </FormCheckbox>
            {errors.principal && (
              <FormGroupMessage id="form-referent-principal-error">{errors.principal.message}</FormGroupMessage>
            )}
          </FormGroup>

          <FormGroup isError={!!errors.name}>
            <FormGroupLabel htmlFor="form-referent-name" hint='Format : "Prénom NOM" ou "Nom du service"'>
              {fieldMap.get("name")}
            </FormGroupLabel>
            <FormInput
              id="form-referent-name"
              aria-describedby={errors.name && "form-referent-name-error"}
              placeholder="Jean DUPONT"
              autoComplete="off"
              {...register("name")}
            />
            {errors.name && <FormGroupMessage id="form-referent-name-error">{errors.name.message}</FormGroupMessage>}
          </FormGroup>

          <FormGroup isError={!!errors.region}>
            <FormGroupLabel htmlFor="form-referent-region">{fieldMap.get("region")}</FormGroupLabel>
            <FormSelect
              id="form-referent-region"
              aria-describedby={errors.region && "form-referent-region-error"}
              defaultValue={currentEdited?.region ?? ""}
              {...register("region")}
            >
              {_.sortBy(Object.entries(REGIONS), "0").map(([code, name]) => (
                <option value={code} key={`form-referent-region-option-${code}`}>
                  {name} ({code})
                </option>
              ))}
            </FormSelect>
            {errors.region && (
              <FormGroupMessage id="form-referent-region-error">{errors.region.message}</FormGroupMessage>
            )}
          </FormGroup>

          <FormGroup isError={!!errors.county}>
            <FormGroupLabel htmlFor="form-referent-county" hint="Non obligatoire (ex: coordination régionale)">
              {fieldMap.get("county")}
            </FormGroupLabel>
            <FormSelect
              id="form-referent-county"
              aria-describedby={errors.county && "form-referent-county-error"}
              defaultValue={currentEdited?.county ?? ""}
              {...register("county", { setValueAs: value => (value === "" ? void 0 : value) })}
            >
              <option value="">Départements</option>
              {REGIONS_TO_COUNTIES[selectedRegion]?.map(code => (
                <option value={code} key={`form-referent-county-option-${code}`}>
                  {COUNTIES[code]} ({code})
                </option>
              ))}
            </FormSelect>
            {errors.county && (
              <FormGroupMessage id="form-referent-county-error">{errors.county.message}</FormGroupMessage>
            )}
          </FormGroup>

          <FormGroup isError={!!errors.value}>
            <FormGroupLabel htmlFor="form-referent-substitute-name" hint={`Format : ${selectedType}`}>
              {fieldMap.get("value")}
            </FormGroupLabel>
            <FormInput
              id="form-referent-value"
              aria-describedby={errors.value && "form-referent-value-error"}
              placeholder={selectedType === "url" ? "https://site.gouv.fr" : "email@gouv.fr"}
              autoComplete={selectedType === "url" ? "off" : "email"}
              type={selectedType}
              spellCheck="false"
              {...register("value")}
            />
            {errors.value && <FormGroupMessage id="form-referent-value-error">{errors.value.message}</FormGroupMessage>}
          </FormGroup>

          <FormRadioGroup inline>
            <FormRadioGroupLegend id="form-referent-type">Type de la valeur</FormRadioGroupLegend>
            <FormRadioGroupContent>
              <FormRadioGroupInput id="form-referent-type-email" value="email" {...register("type", { deps: "value" })}>
                Email
              </FormRadioGroupInput>
              <FormRadioGroupInput id="form-referent-type-url" value="url" {...register("type", { deps: "value" })}>
                URL
              </FormRadioGroupInput>
            </FormRadioGroupContent>
          </FormRadioGroup>

          <FormFieldset
            legend="Suppléant"
            hint="Non obligatoire. Peut-être représenté uniquement par le nom ou l'email."
            error={errors.substitute?.name?.message || errors.substitute?.email?.message}
            elements={[
              <FormGroup key="form-referent-substitute-name">
                <FormGroupLabel htmlFor="form-referent-substitute-name">Nom</FormGroupLabel>
                <FormInput
                  id="form-referent-substitute-name"
                  placeholder="Jean DUPONT"
                  autoComplete="off"
                  {...register("substitute.name")}
                />
              </FormGroup>,
              <FormGroup key="form-referent-substitute-email">
                <FormGroupLabel htmlFor="form-referent-substitute-email">Email</FormGroupLabel>
                <FormInput
                  id="form-referent-substitute-email"
                  placeholder="email@gouv.fr"
                  type="email"
                  autoComplete="off"
                  {...register("substitute.email")}
                />
              </FormGroup>,
            ]}
          />
        </form>
      }
      buttons={({ closableProps, instance }) => [
        <FormButton
          variant="tertiary"
          key={`form-referent-modal-delete-button-${id}`}
          onClick={() => {
            console.log(instance);
            doDelete();
            instance?.conceal();
          }}
          // {...closableProps}
        >
          Supprimer
        </FormButton>,
        <FormButton
          disabled={!isValid || !isDirty}
          key={`form-referent-modal-save-button-${id}`}
          onClick={() => doEdit()}
          {...closableProps}
        >
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
    if (referent.type === "email") {
      if (referent.substitute?.email?.toLowerCase().includes(str)) return true;
      if (referent.substitute?.name?.toLowerCase().includes(str)) return true;
    }
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
