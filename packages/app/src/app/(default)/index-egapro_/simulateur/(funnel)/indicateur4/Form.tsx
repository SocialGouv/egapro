"use client";

import { fr } from "@codegouvfr/react-dsfr";
import Alert from "@codegouvfr/react-dsfr/Alert";
import Button from "@codegouvfr/react-dsfr/Button";
import Input from "@codegouvfr/react-dsfr/Input";
import { createModal } from "@codegouvfr/react-dsfr/Modal";
import RadioButtons from "@codegouvfr/react-dsfr/RadioButtons";
import { cx } from "@codegouvfr/react-dsfr/tools/cx";
import { createSteps } from "@common/core-domain/dtos/CreateSimulationDTO";
import { percentFormat } from "@common/utils/number";
import { storePicker } from "@common/utils/zustand";
import { AideSimulationIndicateurQuatre } from "@components/aide-simulation/IndicateurQuatre";
import { ClientBodyPortal } from "@components/utils/ClientBodyPortal";
import { SkeletonForm } from "@components/utils/skeleton/SkeletonForm";
import { BackNextButtonsGroup, Container, FormLayout, Grid, GridCol, IndicatorNote, Text } from "@design-system";
import { ClientAnimate } from "@design-system/utils/client/ClientAnimate";
import { useAutoAnimate } from "@formkit/auto-animate/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Controller, type FieldErrors, FormProvider, useForm } from "react-hook-form";
import { type z } from "zod";

import { NAVIGATION, simulateurPath } from "../navigation";
import { useSimuFunnelStore, useSimuFunnelStoreHasHydrated } from "../useSimuFunnelStore";
import style from "./Form.module.scss";

type Indic4FormType = z.infer<typeof createSteps.indicateur4>;
type Indic4FormTypeWhenCalculable = Extract<Indic4FormType, { calculable: true }>;
const indicateur4Nav = NAVIGATION.indicateur4;

const infoModal = createModal({
  id: "info-modal",
  isOpenedByDefault: false,
});

const NOTE_MAX = 15;
const useStore = storePicker(useSimuFunnelStore);
export const Indic4Form = () => {
  const router = useRouter();
  const [funnel, saveFunnel] = useStore("funnel", "saveFunnel");
  const hydrated = useSimuFunnelStoreHasHydrated();
  const [lastCount, setLastCount] = useState<Indic4FormTypeWhenCalculable["count"]>();
  const [gridCardAnimate] = useAutoAnimate();
  const [formLayoutAnimate] = useAutoAnimate();

  const methods = useForm<Indic4FormType>({
    mode: "onChange",
    resolver: zodResolver(createSteps.indicateur4),
    defaultValues: funnel?.indicateur4,
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

  const computableCheck = watch("calculable");
  const count = watch("count");

  const countPercent =
    count?.raised && count.total ? percentFormat.format(count.raised / count.total) : percentFormat.format(0);
  const note = count?.raised && count.total ? (count.raised / count.total === 1 ? NOTE_MAX : 0) : "-";

  const hasTotal = !!count?.total;

  const onSubmit = async (formData: Indic4FormType) => {
    console.log("formData", formData);
  };

  const whenCalculableErrors = errors as FieldErrors<Indic4FormTypeWhenCalculable>;
  return (
    <FormProvider {...methods}>
      <form noValidate onSubmit={handleSubmit(onSubmit)}>
        <FormLayout>
          <ClientBodyPortal>
            <infoModal.Component title="Information indicateur retour de congé maternité">
              <AideSimulationIndicateurQuatre.CommentEstCalculéLIndicateur />
            </infoModal.Component>
          </ClientBodyPortal>
          <Controller
            control={control}
            name="calculable"
            render={({ field, fieldState }) => (
              <RadioButtons
                orientation="horizontal"
                legend="Y a-t-il eu des retours de congé maternité pendant la période de référence ?"
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
                        reset({
                          calculable: true,
                          count: lastCount,
                        });
                        trigger("count");
                        setLastCount(void 0);
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
                        setLastCount(getValues("count"));
                        reset({
                          calculable: false,
                        });
                        field.onChange(false);
                      },
                    },
                  },
                ]}
              />
            )}
          />
          <ClientAnimate>
            {computableCheck ? (
              <>
                <Container className={cx(fr.cx("fr-px-md-3v", "fr-px-2v", "fr-mb-6w"), style["form-input-card"])}>
                  <Grid haveGutters>
                    <GridCol className={style["form-input-card-title"]}>
                      <Text
                        text="Salariées augmentées à leur retour de congé maternité"
                        inline
                        variant={["xl", "bold"]}
                        mb="auto"
                      />
                      <Button
                        title="Information indicateur retour de congé maternité"
                        iconId="fr-icon-information-fill"
                        type="button"
                        size="small"
                        priority="tertiary no outline"
                        nativeButtonProps={infoModal.buttonProps}
                      />
                    </GridCol>
                    <GridCol sm={12}>
                      <Input
                        label="Total des salariées de retour de congé maternité"
                        hintText="Indiquez le nombre de salariées pour lesquelles des augmentations ont été accordées en entreprise pendant leur congé maternité, sans qu'elles n'y soient incluses."
                        state={whenCalculableErrors.count?.total && "error"}
                        stateRelatedMessage={whenCalculableErrors.count?.total?.message}
                        nativeInputProps={{
                          ...register("count.total", {
                            setValueAs: value => (value === "" ? void 0 : +value),
                            deps: "count.raised",
                          }),
                          type: "number",
                          min: 1,
                          step: 1,
                        }}
                      />
                    </GridCol>
                    <GridCol sm={12}>
                      <Input
                        label="Nombre de salariées augmentées à leur retour"
                        hintText={
                          hasTotal ? (
                            <>
                              Combien, parmi les <strong>{count?.total}</strong> retours, ont ensuite reçu une
                              augmentation dans l'année suivant leur retour de congé maternité ?
                            </>
                          ) : (
                            "Saisir d'abord le nombre de salariées augmentées"
                          )
                        }
                        state={whenCalculableErrors.count?.raised && "error"}
                        stateRelatedMessage={whenCalculableErrors.count?.raised?.message}
                        disabled={!hasTotal}
                        nativeInputProps={{
                          ...register("count.raised", {
                            setValueAs: value => (value === "" ? void 0 : +value),
                            disabled: !hasTotal,
                          }),
                          type: "number",
                          min: 0,
                          step: 1,
                          max: count?.total,
                        }}
                      />
                    </GridCol>
                    <GridCol sm={12}>
                      Pourcentage de salariées augmentées : <strong>{countPercent}</strong>
                    </GridCol>
                  </Grid>
                </Container>
                <IndicatorNote
                  note={note}
                  max={NOTE_MAX}
                  text="Nombre de point obtenus à l'indicateur retour de congé maternité"
                  legend={
                    isValid
                      ? note === NOTE_MAX
                        ? "La loi sur les augmentations au retour de congé maternité a été appliquée à tous les salariés. Tous les points sont accordés."
                        : "La loi sur les augmentations au retour de congé maternité n'a pas été appliquée à tous les salariés. Aucun point n'est accordé."
                      : "Veuillez remplir les champs obligatoires pour obtenir une note."
                  }
                />
              </>
            ) : (
              computableCheck === false && (
                <Alert
                  className="fr-mb-3w"
                  severity="info"
                  title="L'indicateur n'est pas calculable"
                  description={`Il n'y a pas eu de retour de congé maternité durant la période de référence.`}
                />
              )
            )}
          </ClientAnimate>

          <BackNextButtonsGroup
            className={fr.cx("fr-mt-4w")}
            backProps={{
              linkProps: {
                href: simulateurPath(indicateur4Nav.prev(funnel)),
              },
            }}
            nextDisabled={!isValid}
          />
        </FormLayout>
      </form>
    </FormProvider>
  );
};
