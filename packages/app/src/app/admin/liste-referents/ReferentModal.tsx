"use client";

import Checkbox from "@codegouvfr/react-dsfr/Checkbox";
import Input from "@codegouvfr/react-dsfr/Input";
import { type createModal } from "@codegouvfr/react-dsfr/Modal";
import RadioButtons from "@codegouvfr/react-dsfr/RadioButtons";
import Select from "@codegouvfr/react-dsfr/Select";
import { createReferentDTOSchema, type ReferentDTO, referentDTOSchema } from "@common/core-domain/dtos/ReferentDTO";
import { COUNTIES, REGIONS, REGIONS_TO_COUNTIES } from "@common/dict";
import { Object } from "@common/utils/overload";
import { storePicker } from "@common/utils/zustand";
import { FormFieldset, FormLayout } from "@design-system";
import { zodResolver } from "@hookform/resolvers/zod";
import { noop, sortBy } from "lodash";
import { useRouter } from "next/navigation";
import { useCallback, useEffect } from "react";
import { useForm } from "react-hook-form";

import { createReferent, saveReferent } from "./actions";
import { columnMap, useReferentListStore } from "./useReferentListStore";

interface ReferentModalProps {
  modal: ReturnType<typeof createModal>;
  mode: "create" | "edit";
}

const useStore = storePicker(useReferentListStore);

export const ReferentModal = ({ mode = "edit", modal }: ReferentModalProps) => {
  const router = useRouter();
  const [currentEdited] = useStore("currentEdited");

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

  const doSave = async () => {
    const go = await trigger();
    if (go) {
      handleSubmit(async formData => {
        if (mode === "edit") {
          saveReferent(formData);
        } else {
          createReferent(formData);
        }
        modal.close();
        router.refresh();
      })();
    }
  };

  return (
    <modal.Component
      onClose={cleanForm}
      title={`${mode === "edit" ? "Éditer" : "Créer"} - ${writtenName || "👻"}`}
      iconId="fr-icon-arrow-right-line"
      buttons={[
        {
          children: "Sauvegarder",
          disabled: !isValid || !isDirty,
          doClosesModal: false,
          onClick() {
            doSave();
          },
        },
      ]}
    >
      <form onSubmit={handleSubmit(noop)}>
        <FormLayout>
          <input type="hidden" {...register("id")} />
          <Checkbox
            state={errors.principal && "error"}
            stateRelatedMessage={errors.principal?.message}
            options={[
              {
                label: fieldMap.get("principal"),
                nativeInputProps: register("principal"),
              },
            ]}
          />
          <Input
            label={fieldMap.get("name")}
            hintText='Format : "Prénom NOM" ou "Nom du service"'
            state={errors.name && "error"}
            stateRelatedMessage={errors.name?.message}
            nativeInputProps={{
              placeholder: "Jean DUPONT",
              autoComplete: "off",
              ...register("name"),
            }}
          />
          <Select
            label={fieldMap.get("region")}
            state={errors.region && "error"}
            stateRelatedMessage={errors.region?.message}
            nativeSelectProps={register("region")}
          >
            <option value="">Régions</option>
            {sortBy(Object.entries(REGIONS), "0").map(([code, name]) => (
              <option value={code} key={`form-referent-region-option-${code}`}>
                {name} ({code})
              </option>
            ))}
          </Select>
          <Select
            label={fieldMap.get("county")}
            hint="Non obligatoire (ex: coordination régionale)"
            state={errors.county && "error"}
            stateRelatedMessage={errors.county?.message}
            nativeSelectProps={{
              defaultValue: mode === "edit" ? currentEdited?.county ?? "" : "",
              ...register("county", {
                disabled: !selectedRegion,
                setValueAs: value => (value === "" ? void 0 : value),
              }),
            }}
          >
            <option value="">{selectedRegion ? "Département" : "Choisir une région d'abord"}</option>
            {REGIONS_TO_COUNTIES[selectedRegion]?.map(code => (
              <option value={code} key={`form-referent-county-option-${code}`}>
                {COUNTIES[code]} ({code})
              </option>
            ))}
          </Select>
          <Input
            label={fieldMap.get("value")}
            hintText={`Format : ${selectedType}`}
            state={errors.value && "error"}
            stateRelatedMessage={errors.value?.message}
            nativeInputProps={{
              placeholder: selectedType === "url" ? "https://site.gouv.fr" : "email@gouv.fr",
              autoComplete: selectedType === "url" ? "off" : "email",
              type: selectedType,
              spellCheck: false,
              ...register("value"),
            }}
          />
          <RadioButtons
            orientation="horizontal"
            state={errors.type && "error"}
            stateRelatedMessage={errors.type?.message}
            legend="Type de la valeur"
            options={[
              {
                label: "Email",
                nativeInputProps: {
                  value: "email",
                  ...register("type", { deps: "value" }),
                },
              },
              {
                label: "URL",
                nativeInputProps: { value: "url", ...register("type", { deps: "value" }) },
              },
            ]}
          />
          <FormFieldset
            legend="Suppléant"
            hint="Non obligatoire. Peut-être représenté uniquement par le nom ou l'email."
            error={errors.substitute?.name?.message || errors.substitute?.email?.message}
            elements={[
              <Input
                key="form-referent-substitute-name"
                label="Nom"
                nativeInputProps={{
                  placeholder: "Jean DUPONT",
                  autoComplete: "off",
                  ...register("substitute.name", { setValueAs: value => (value === "" ? void 0 : value) }),
                }}
              />,
              <Input
                key="form-referent-substitute-email"
                label="Email"
                nativeInputProps={{
                  placeholder: "email@gouv.fr",
                  type: "email",
                  autoComplete: "off",
                  ...register("substitute.email", { setValueAs: value => (value === "" ? void 0 : value) }),
                }}
              />,
            ]}
          />
        </FormLayout>
      </form>
    </modal.Component>
  );
};
