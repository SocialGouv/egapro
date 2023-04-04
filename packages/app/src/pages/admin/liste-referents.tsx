import { config } from "@common/config";
import type { ReferentDTO } from "@common/core-domain/dtos/ReferentDTO";
import { createReferentDTOSchema, referentDTOSchema } from "@common/core-domain/dtos/ReferentDTO";
import { COUNTIES, REGIONS, REGIONS_TO_COUNTIES } from "@common/dict";
import { Object } from "@common/utils/overload";
import type { pvoid } from "@common/utils/types";
import { storePicker } from "@common/utils/zustand";
import { AdminLayout } from "@components/layouts/AdminLayout";
import {
  Alert,
  Box,
  ButtonAsLink,
  ButtonGroup,
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
import type { ModalInstance } from "@gouvfr/dsfr";
import { zodResolver } from "@hookform/resolvers/zod";
import { fetcherV2 } from "@services/apiClient";
import { useReferentListStore } from "@services/apiClient/useReferentListStore";
import _ from "lodash";
import { Suspense, useCallback, useEffect, useId, useState } from "react";
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
  doDelete: (referent: ReferentDTO) => pvoid;
  editModalId: string;
  referents: ReferentDTO[];
}

const ReferentList = ({ referents, editModalId, doDelete }: ReferentListProps) => {
  const [orderBy, orderDirection, setCurrentEdited, togglerOrderColumn] = useStorePicker(
    "orderBy",
    "orderDirection",
    "setCurrentEdited",
    "togglerOrderColumn",
  );
  const [animationParent] = useAutoAnimate<HTMLTableSectionElement>();

  const doEditLine = (referent: ReferentDTO) => {
    setCurrentEdited(referent);
  };

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
                    variant="tertiary-no-outline"
                    size="sm"
                    onClick={() => doEditLine(referent)}
                    aria-controls={editModalId}
                    data-fr-opened="false"
                  />{" "}
                  <FormButton
                    iconOnly="fr-icon-delete-fill"
                    variant="tertiary-no-outline"
                    size="sm"
                    onClick={() => doDelete(referent)}
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
  mode: "create" | "edit";
}
const ReferentModal = ({ id, mode = "edit" }: EditReferentModalProps) => {
  const [currentEdited] = useStorePicker("currentEdited");
  const { mutate, data } = useReferentList();
  const {
    handleSubmit,
    register,
    formState: { errors, isValid, isDirty },
    reset,
    watch,
    trigger,
  } = useForm<ReferentDTO>({
    resolver: zodResolver(mode === "edit" ? referentDTOSchema : createReferentDTOSchema),
    mode: "onChange",
  });

  const cleanForm = useCallback(() => {
    reset({
      type: "email",
      principal: true,
      region: void 0,
    });
  }, [reset]);

  useEffect(() => {
    if (mode === "edit") {
      reset({
        ...currentEdited,
        county: currentEdited?.county,
        substitute: {
          email: currentEdited?.substitute?.email ?? "",
          name: currentEdited?.substitute?.name ?? "",
        },
      });
    } else cleanForm();
  }, [reset, currentEdited, mode, cleanForm]);

  const writtenName = watch("name");
  const selectedRegion = watch("region");
  const selectedType = watch("type");
  const fieldMap = new Map(columnMap);

  const updateReferentList = (list: ReferentDTO[] | undefined, formData: ReferentDTO) => [
    ...(list?.filter(item => item.id !== formData.id) ?? []),
    formData,
  ];
  const doSave = async (modal?: ModalInstance) => {
    const go = await trigger();
    if (go) {
      handleSubmit(async formData => {
        if (mode === "edit") {
          await mutate(
            async current => {
              await fetcherV2(`/admin/referent/${formData.id}`, { method: "POST", body: JSON.stringify(formData) });
              return updateReferentList(current, formData);
            },
            {
              optimisticData: updateReferentList(data, formData),
              rollbackOnError: true,
            },
          );
        } else {
          await mutate(async current => {
            const { id } = await fetcherV2<{ id: string }>(`/admin/referent`, {
              method: "PUT",
              body: JSON.stringify(formData),
            });
            return [...(current ?? []), { ...formData, id }];
          });
        }
        modal?.conceal();
      })();
    }
  };

  return (
    <Modal
      onClose={cleanForm}
      title={`${mode === "edit" ? "Éditer" : "Créer"} - ${writtenName || "👻"}`}
      icon="fr-icon-arrow-right-line"
      id={id}
      content={
        <form onSubmit={handleSubmit(_.noop)}>
          <input type="hidden" id={`${mode}-form-referent-id`} {...register("id")} />
          <FormGroup isError={!!errors.principal}>
            <FormCheckbox
              id={`${mode}-form-referent-principal`}
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
              id={`${mode}-form-referent-name`}
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
              id={`${mode}-form-referent-region`}
              aria-describedby={errors.region && "form-referent-region-error"}
              defaultValue={mode === "edit" ? currentEdited?.region ?? "" : ""}
              {...register("region")}
            >
              <option value="">Régions</option>
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
              id={`${mode}-form-referent-county`}
              aria-describedby={errors.county && "form-referent-county-error"}
              defaultValue={mode === "edit" ? currentEdited?.county ?? "" : ""}
              {...register("county", {
                disabled: !selectedRegion,
                setValueAs: value => (value === "" ? void 0 : value),
              })}
            >
              <option value="">{selectedRegion ? "Département" : "Choisir une région d'abord"}</option>
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
              id={`${mode}-form-referent-value`}
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
            <FormRadioGroupLegend id={`${mode}-form-referent-type`}>Type de la valeur</FormRadioGroupLegend>
            <FormRadioGroupContent>
              <FormRadioGroupInput
                id={`${mode}-form-referent-type-email`}
                value="email"
                {...register("type", { deps: "value" })}
              >
                Email
              </FormRadioGroupInput>
              <FormRadioGroupInput
                id={`${mode}-form-referent-type-url`}
                value="url"
                {...register("type", { deps: "value" })}
              >
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
                  id={`${mode}-form-referent-substitute-name`}
                  placeholder="Jean DUPONT"
                  autoComplete="off"
                  {...register("substitute.name", { setValueAs: value => (value === "" ? void 0 : value) })}
                />
              </FormGroup>,
              <FormGroup key="form-referent-substitute-email">
                <FormGroupLabel htmlFor="form-referent-substitute-email">Email</FormGroupLabel>
                <FormInput
                  id={`${mode}-form-referent-substitute-email`}
                  placeholder="email@gouv.fr"
                  type="email"
                  autoComplete="off"
                  {...register("substitute.email", { setValueAs: value => (value === "" ? void 0 : value) })}
                />
              </FormGroup>,
            ]}
          />
        </form>
      }
      buttons={({ instance }) => [
        <FormButton
          disabled={!isValid || !isDirty}
          key={`form-referent-modal-save-button-${id}`}
          onClick={() => doSave(instance)}
        >
          Sauvegarder
        </FormButton>,
      ]}
    />
  );
};

const ActionButtons = () => {
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const { mutate } = useReferentList();

  const doImport = async (modal?: ModalInstance) => {
    if (!uploadFile) return;
    setErrorMessage("");

    const body = new FormData();
    body.append("file", uploadFile);
    setUploading(true);
    try {
      await fetcherV2("/admin/referent/import", {
        headers: {},
        method: "PUT",
        body,
      });

      modal?.conceal();
      setUploadFile(null);
      mutate();
    } catch (error: unknown) {
      console.log(error);
      setErrorMessage((error as Error).message);
    } finally {
      setUploading(false);
    }
  };

  const uploadToClient: JSX.IntrinsicElements["input"]["onChange"] = event => {
    const file = event.target.files?.[0];
    if (file) {
      setUploadFile(file);
    } else {
      setUploadFile(null);
    }
  };

  return (
    <>
      <ReferentModal id="create-modal" mode="create" />
      <Modal
        id="import-modal"
        title="Importer des référents"
        icon="fr-icon-download-fill"
        backdropCanClose={!uploading}
        content={
          <>
            <Box>
              Importer depuis un fichier JSON une liste de référents.
              <br />
              Attention, cette opération remplacera les données existantes !
            </Box>
            <br />
            <input disabled={uploading} type="file" accept=".json" name="import-file" onChange={uploadToClient} />
            {uploading && <Alert mt="2w">Uploading...</Alert>}
            {errorMessage && (
              <Alert mt="2w" type="error">
                {errorMessage}
              </Alert>
            )}
          </>
        }
        buttons={({ instance }) => [
          <FormButton disabled={!uploadFile || uploading} key="import-modal-button" onClick={() => doImport(instance)}>
            Importer
          </FormButton>,
        ]}
      />
      <Modal
        id="export-modal"
        title="Exporter les référents"
        content={
          <>
            <Box>
              <ButtonAsLink
                variant="tertiary-no-outline"
                href={`${config.apiv2_url}/public/referents_egalite_professionnelle.xlsx`}
                target="_blank"
              >
                XLSX
              </ButtonAsLink>
              <ButtonAsLink
                variant="tertiary-no-outline"
                href={`${config.apiv2_url}/public/referents_egalite_professionnelle.csv`}
                target="_blank"
              >
                CSV
              </ButtonAsLink>
              <ButtonAsLink
                variant="tertiary-no-outline"
                href={`${config.apiv2_url}/public/referents_egalite_professionnelle.json`}
                target="_blank"
              >
                JSON
              </ButtonAsLink>
            </Box>
            <br />
          </>
        }
        buttons={({ closableProps }) => [
          <FormButton key="export-modal-button-close" {...closableProps}>
            Fermer
          </FormButton>,
        ]}
      />
      <ButtonGroup inline="mobile-up" className="fr-mb-4w">
        <FormButton aria-controls="create-modal" data-fr-opened="false">
          Ajouter
        </FormButton>
        <FormButton variant="secondary" aria-controls="export-modal" data-fr-opened="false">
          Exporter
        </FormButton>
        <FormButton variant="tertiary" aria-controls="import-modal" data-fr-opened="false">
          Importer
        </FormButton>
      </ButtonGroup>
    </>
  );
};

const ReferentListPage: NextPageWithLayout = () => {
  const { data, mutate } = useReferentList();
  const [orderBy, orderDirection] = useStorePicker("orderBy", "orderDirection");
  const editModalId = `edit-modal-${useId()}`;

  const { register, watch } = useForm<{ query: string }>();

  const removeFromData = (list: ReferentDTO[] | undefined, id: string) => list?.filter(item => item.id !== id);
  const doDelete = async (referent: ReferentDTO) => {
    if (!referent.id) {
      console.warn("Cannot delete referent without id.", referent);
      return;
    }

    const yes = confirm(`Supprimer "${referent.name}" ?`);
    if (yes) {
      await mutate(
        async currentData => {
          await fetcherV2(`/admin/referent/${referent.id}`, {
            method: "DELETE",
          });
          return removeFromData(currentData, referent.id);
        },
        {
          optimisticData: removeFromData(data, referent.id),
          rollbackOnError: true,
        },
      );
    }
  };

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
      <ReferentModal id={editModalId} mode="edit" />
      <Box as="section">
        <Container py="8w">
          <h1>Liste des des référents Egapro</h1>

          <ActionButtons />

          {data?.length ? (
            <>
              <form noValidate onSubmit={_.noop}>
                <FormGroup>
                  <FormInput id="query-param" placeholder="Rechercher" autoComplete="off" {...register("query")} />
                </FormGroup>
              </form>
              <br />
              <ReferentList referents={referents} editModalId={editModalId} doDelete={doDelete} />
            </>
          ) : (
            <Alert>Pas de référents d'enregistré.</Alert>
          )}
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
          style={{ background: "var(--background-alt-grey)", width: "100%", height: "20rem", borderRadius: 4 }}
        ></Box>
      </Container>
    </Box>
  );
};

ReferentListPage.getLayout = ({ children }) => {
  return (
    <AdminLayout title="Liste référents" placeholder={<PlaceholderPage />}>
      <Suspense fallback={<PlaceholderPage />}>{children}</Suspense>
    </AdminLayout>
  );
};

export default ReferentListPage;
