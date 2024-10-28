"use client";

import { fr } from "@codegouvfr/react-dsfr";
import Alert from "@codegouvfr/react-dsfr/Alert";
import Button from "@codegouvfr/react-dsfr/Button";
import Input from "@codegouvfr/react-dsfr/Input";
import { createModal } from "@codegouvfr/react-dsfr/Modal";
import RadioButtons from "@codegouvfr/react-dsfr/RadioButtons";
import { cx } from "@codegouvfr/react-dsfr/tools/cx";
import { IndicateurQuatreComputer } from "@common/core-domain/computers/IndicateurQuatreComputer";
import { createSteps } from "@common/core-domain/dtos/CreateSimulationDTO";
import { percentFormat } from "@common/utils/number";
import { storePicker } from "@common/utils/zustand";
import { AideSimulationIndicateurQuatre } from "@components/aide-simulation/IndicateurQuatre";
import { ClientBodyPortal } from "@components/utils/ClientBodyPortal";
import { SkeletonForm } from "@components/utils/skeleton/SkeletonForm";
import { BackNextButtonsGroup, Container, FormLayout, Grid, GridCol, Text } from "@design-system";
import { ClientAnimate } from "@design-system/utils/client/ClientAnimate";
import { zodResolver } from "@hookform/resolvers/zod";
import { redirect, useRouter } from "next/navigation";
import { useState } from "react";
import { Controller, type FieldErrors, FormProvider, useForm } from "react-hook-form";
import { type z } from "zod";

import { NAVIGATION, simulateurPath } from "../navigation";
import { useSimuFunnelStore, useSimuFunnelStoreHasHydrated } from "../useSimuFunnelStore";
import style from "./Form.module.scss";
import { Indicateur4Note } from "./Indicateur4Note";

type Indic4FormType = z.infer<typeof createSteps.indicateur4>;
type Indic4FormTypeWhenCalculable = Extract<Indic4FormType, { calculable: true }>;

const indicateur4Computer = new IndicateurQuatreComputer();
const indicateur4Nav = NAVIGATION.indicateur4;

const infoModal = createModal({
  id: "info-modal",
  isOpenedByDefault: false,
});

const useStore = storePicker(useSimuFunnelStore);
export const Indic4Form = () => {
  const router = useRouter();
  const [funnel, saveFunnel] = useStore("funnel", "saveFunnel");
  const hydrated = useSimuFunnelStoreHasHydrated();
  const [lastCount, setLastCount] = useState<Indic4FormTypeWhenCalculable["count"]>();

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
    setValue,
    control,
  } = methods;

  if (!hydrated) {
    return <SkeletonForm fields={2} />;
  }

  if (!funnel?.effectifs) {
    redirect(simulateurPath("effectifs"));
  }

  const computableCheck = watch("calculable");
  const count = watch("count");

  indicateur4Computer.setInput(
    {
      total: count?.total || 0,
      raised: count?.raised || 0,
    } ?? { total: 0, raised: 0 },
  );

  const canCompute = indicateur4Computer.canCompute();
  const computed = indicateur4Computer.compute();

  const hasTotal = typeof count?.total === "number";

  const onSubmit = (indicateur4: Indic4FormType) => {
    saveFunnel({ indicateur4 });
    router.push(simulateurPath(indicateur4Nav.next()));
  };

  const whenCalculableErrors = errors as FieldErrors<Indic4FormTypeWhenCalculable>;
  return (
    <FormProvider {...methods}>
      <form noValidate onSubmit={handleSubmit(onSubmit)}>
        <p className="fr-text--xs">Les champs suivis d'une * sont obligatoires</p>
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
                legend="Y a-t-il eu des retours de congé maternité pendant la période de référence? *"
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
                        label="Total des salariées de retour de congé maternité *"
                        hintText="Indiquez le nombre total de salariées revenues de congé maternité pendant la période de référence. Doivent être retenues les salariées qui sont revenues de congé maternité pendant la période de référence, si au moins une augmentation salariale a été faite pendant leur congé."
                        state={whenCalculableErrors.count?.total && "error"}
                        stateRelatedMessage={whenCalculableErrors.count?.total?.message}
                        nativeInputProps={{
                          ...register("count.total", {
                            setValueAs: value => (value === "" ? void 0 : +value),
                            deps: "count.raised",
                            onChange: () => {
                              if (count?.total === 0) {
                                setValue("count.raised", 0);
                                trigger("count.raised");
                              }
                            },
                          }),
                          type: "number",
                          min: 0,
                          step: 1,
                        }}
                      />
                    </GridCol>
                    <GridCol sm={12}>
                      <Input
                        label="Nombre de salariées augmentées à leur retour *"
                        hintText={
                          hasTotal ? (
                            count.total === 0 ? (
                              <>
                                Il n'y a pas d'augmentation obligatoire s'il n'y a pas eu de congé maternité pendant
                                lequel des périodes d'augmentation ont eu lieu.
                              </>
                            ) : (
                              <>
                                Parmi les <strong>{count?.total}</strong> salariées revenues de congé maternité,
                                indiquez le nombre de salariées ayant bénéficié, à leur retour de congé maternité ou
                                pendant celui-ci, d'une augmentation correspondant à la majoration de leur rémunération
                                liée à l'obligation de rattrapage salarial au retour de congé maternité.
                              </>
                            )
                          ) : (
                            "Saisir d'abord le nombre de salariées de retour de congé maternité."
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
                      Pourcentage de salariées augmentées :{" "}
                      <strong>
                        {isValid && canCompute && count && count.total && count.total > 0
                          ? percentFormat.format(computed.resultRaw)
                          : "-"}
                      </strong>
                    </GridCol>
                  </Grid>
                </Container>
                <Indicateur4Note
                  computer={indicateur4Computer}
                  count={{ total: count?.total || 0, raised: count?.raised || 0 }}
                  isValid={isValid}
                />
              </>
            ) : (
              computableCheck === false && (
                <Alert
                  className="fr-mb-3w"
                  severity="info"
                  title="L'indicateur n'est pas calculable"
                  description="Il n'y a pas eu de retours de congé maternité (ou d'adoption) au cours de la période de référence."
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
