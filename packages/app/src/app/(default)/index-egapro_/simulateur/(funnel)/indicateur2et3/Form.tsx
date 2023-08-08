"use client";

import { fr } from "@codegouvfr/react-dsfr";
import Button from "@codegouvfr/react-dsfr/Button";
import Input from "@codegouvfr/react-dsfr/Input";
import { createModal } from "@codegouvfr/react-dsfr/Modal";
import RadioButtons from "@codegouvfr/react-dsfr/RadioButtons";
import { cx } from "@codegouvfr/react-dsfr/tools/cx";
import { IndicateurDeuxTroisComputer } from "@common/core-domain/computers/IndicateurDeuxTroisComputer";
import { ageRanges, categories } from "@common/core-domain/computers/utils";
import {
  type CreateSimulationWorkforceRangeLessThan250DTO,
  createSteps,
} from "@common/core-domain/dtos/CreateSimulationDTO";
import { type ClearObject } from "@common/utils/types";
import { storePicker } from "@common/utils/zustand";
import { AideSimulationIndicateurDeuxEtTrois } from "@components/aide-simulation/IndicateurDeuxEtTrois";
import { ClientBodyPortal } from "@components/utils/ClientBodyPortal";
import { SkeletonForm } from "@components/utils/skeleton/SkeletonForm";
import { BackNextButtonsGroup, Container, FormLayout, Grid, GridCol, Text } from "@design-system";
import { zodResolver } from "@hookform/resolvers/zod";
import { redirect, useRouter } from "next/navigation";
import { Controller, type FieldErrors, FormProvider, useForm } from "react-hook-form";
import { type z } from "zod";

import { NAVIGATION, simulateurPath } from "../navigation";
import { useSimuFunnelStore, useSimuFunnelStoreHasHydrated } from "../useSimuFunnelStore";
import style from "./Form.module.scss";

type Indic2and3FormType = ClearObject<z.infer<typeof createSteps.indicateur2and3>>;
type Indic2and3FormWhenCalculated = Extract<Indic2and3FormType, { calculable: true }>;

const indicateur2and3Computer = new IndicateurDeuxTroisComputer();
const indicateur2and3Nav = NAVIGATION.indicateur2et3;

const infoModal = createModal({
  id: "info-modal",
  isOpenedByDefault: false,
});

const useStore = storePicker(useSimuFunnelStore);
export const Indic2and3Form = () => {
  const router = useRouter();
  const [_funnel, saveFunnel] = useStore("funnel", "saveFunnel");
  const funnel = _funnel as Partial<CreateSimulationWorkforceRangeLessThan250DTO> | undefined;
  const hydrated = useSimuFunnelStoreHasHydrated();

  const methods = useForm<Indic2and3FormType>({
    mode: "onChange",
    resolver: zodResolver(createSteps.indicateur2and3),
    defaultValues: funnel?.indicateur2and3,
  });

  const {
    formState: { isValid, errors },
    handleSubmit,
    register,
    watch,
    getValues,
    reset,
    trigger,
    control,
  } = methods;

  if (!hydrated) {
    return <SkeletonForm fields={2} />;
  }

  if (!funnel?.effectifs) {
    redirect(simulateurPath("effectifs"));
  }

  if (!funnel.indicateur1) {
    redirect(simulateurPath("indicateur1"));
  }

  const computableCheck = watch("calculable");
  const csp = funnel.effectifs.csp;

  const [totalCspWomen, totalCspMen] = categories.reduce(
    (acc, category) =>
      ageRanges.reduce(
        (innerAcc, ageRange) => [
          innerAcc[0] + (csp[category].ageRanges[ageRange].women || 0),
          innerAcc[1] + (csp[category].ageRanges[ageRange].men || 0),
        ],
        acc,
      ),
    [0, 0],
  );

  const whenCalculableErrors = errors as FieldErrors<Indic2and3FormWhenCalculated>;

  const onSubmit = async (formData: Indic2and3FormType) => {
    console.log("SUBMIT", formData);
  };

  return (
    <FormProvider {...methods}>
      <form noValidate onSubmit={handleSubmit(onSubmit)}>
        <FormLayout>
          <Controller
            control={control}
            name="calculable"
            render={({ field, fieldState }) => (
              <RadioButtons
                orientation="horizontal"
                legend="Y a-t-il eu des augmentations individuelles durant la période de référence ?"
                state={fieldState.error && "error"}
                stateRelatedMessage={fieldState.error?.message}
                options={[
                  {
                    label: "Oui",
                    nativeInputProps: {
                      ...field,
                      value: 1,
                      defaultChecked: field.value === true,
                      onChange() {
                        field.onChange(true);
                      },
                    },
                  },
                  {
                    label: "Non",
                    nativeInputProps: {
                      ...field,
                      value: 0,
                      defaultChecked: field.value === false,
                      onChange() {
                        field.onChange(false);
                      },
                    },
                  },
                ]}
              />
            )}
          />

          <ClientBodyPortal>
            <infoModal.Component title="Information indicateur écart de taux d'augmentation">
              <AideSimulationIndicateurDeuxEtTrois.CommentEstCalculéLIndicateur />
            </infoModal.Component>
          </ClientBodyPortal>
          {computableCheck && (
            <Container className={cx(fr.cx("fr-px-md-3v", "fr-px-2v", "fr-mb-6w"), style["form-input-card"])}>
              <Grid haveGutters>
                <GridCol className={style["form-input-card-title"]}>
                  <Text text="Nombre de salaries augmentés" inline variant={["xl", "bold"]} mb="auto" />
                  <Button
                    title="Information indicateur écart de taux d'augmentation"
                    iconId="fr-icon-information-fill"
                    type="button"
                    size="small"
                    priority="tertiary no outline"
                    nativeButtonProps={infoModal.buttonProps}
                  />
                </GridCol>
                <GridCol sm={6}>
                  <Input
                    label="Femmes"
                    hintText={`(max ${totalCspWomen})`}
                    state={whenCalculableErrors.raisedCount?.women && "error"}
                    stateRelatedMessage={whenCalculableErrors.raisedCount?.women?.message}
                    nativeInputProps={{
                      ...register("raisedCount.women", {
                        setValueAs: value => (value === "" ? void 0 : +value),
                      }),
                      type: "number",
                      min: 1,
                      max: totalCspWomen,
                    }}
                  />
                </GridCol>
                <GridCol sm={6}>
                  <Input
                    label="Hommes"
                    hintText={`(max ${totalCspMen})`}
                    state={whenCalculableErrors.raisedCount?.men && "error"}
                    stateRelatedMessage={whenCalculableErrors.raisedCount?.men?.message}
                    nativeInputProps={{
                      ...register("raisedCount.men", {
                        setValueAs: value => (value === "" ? void 0 : +value),
                      }),
                      type: "number",
                      min: 1,
                      max: totalCspMen,
                    }}
                  />
                </GridCol>
              </Grid>
            </Container>
          )}
          <BackNextButtonsGroup
            backProps={{
              linkProps: {
                href: simulateurPath(indicateur2and3Nav.prev()),
              },
            }}
            nextDisabled={!isValid}
          />
        </FormLayout>
      </form>
    </FormProvider>
  );
};
