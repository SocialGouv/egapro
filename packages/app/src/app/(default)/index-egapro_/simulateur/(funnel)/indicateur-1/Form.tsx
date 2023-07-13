"use client";

import RadioButtons from "@codegouvfr/react-dsfr/RadioButtons";
import { ageRanges, IndicateurUnComputer, type RemunerationsCSP } from "@common/core-domain/computers/indicateurUn";
import { RemunerationsMode } from "@common/core-domain/domain/valueObjects/declaration/indicators/RemunerationsMode";
import { createSteps } from "@common/core-domain/dtos/CreateSimulationDTO";
import { Object } from "@common/utils/overload";
import { storePicker } from "@common/utils/zustand";
import { BackNextButtonsGroup, CenteredContainer, Container } from "@design-system";
import { ClientAnimate } from "@design-system/utils/client/ClientAnimate";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, FormProvider, useForm } from "react-hook-form";
import { type z } from "zod";

import { useSimuFunnelStore } from "../useSimuFunnelStore";
import { CSPModeTable } from "./CSPModeTable";

type Indic1FormType = z.infer<typeof createSteps.indicateur1>;
type EffectifsType = z.infer<typeof createSteps.effectifs>;

const cspComputer = new IndicateurUnComputer(RemunerationsMode.Enum.CSP);

const useStore = storePicker(useSimuFunnelStore);
export const Indic1Form = () => {
  const [funnel, saveFunnel] = useStore("funnel", "saveFunnel");

  const methods = useForm<Indic1FormType>({
    mode: "onChange",
    resolver: zodResolver(createSteps.indicateur1),
    defaultValues: funnel?.indicateur1,
  });

  const {
    formState: { isValid, errors, dirtyFields, isValidating, touchedFields },
    handleSubmit,
    register,
    getValues,
    setValue,
    watch,
    trigger,
    control,
  } = methods;

  if (!funnel?.effectifs) {
    return null;
  }

  const currentMode = watch("mode");

  const defaultRemunerations = Object.keys(funnel.effectifs.csp).reduce(
    (newEmployees, category) => ({
      ...newEmployees,
      [category]: ageRanges.reduce(
        (newAgeGroups, ageRange) => ({
          ...newAgeGroups,
          [ageRange]: {
            womenSalary: 0,
            menSalary: 0,
            womenCount: funnel.effectifs!.csp[category].ageRanges[ageRange].women,
            menCount: funnel.effectifs!.csp[category].ageRanges[ageRange].men,
          },
        }),
        {},
      ),
    }),
    {} as RemunerationsCSP,
  );

  cspComputer.setRemunerations(defaultRemunerations);

  const cspCanCompute = cspComputer.canCompute();

  console.log({ cspCanCompute, errors });

  const onSubmit = (data: Indic1FormType) => {
    console.log("data", data, isValid, errors);
  };

  return (
    <FormProvider {...methods}>
      <form noValidate onSubmit={handleSubmit(onSubmit)}>
        <CenteredContainer>
          <Controller
            control={control}
            name="mode"
            render={({ field }) => {
              return (
                <RadioButtons
                  legend="Modalité de calcul choisie pour cet indicateur"
                  options={[
                    ...[
                      RemunerationsMode.Enum.CSP,
                      RemunerationsMode.Enum.BRANCH_LEVEL,
                      RemunerationsMode.Enum.OTHER_LEVEL,
                    ].map(mode => ({
                      label: RemunerationsMode.Label[mode],
                      nativeInputProps: {
                        ...field,
                        value: mode,
                        defaultChecked: field.value === mode,
                      },
                    })),
                  ]}
                />
              );
            }}
          />
        </CenteredContainer>

        <Container>
          <ClientAnimate>
            {currentMode === RemunerationsMode.Enum.CSP ? <CSPModeTable computer={cspComputer} /> : <>{currentMode}</>}
          </ClientAnimate>
        </Container>
        <CenteredContainer pb="6w">
          <BackNextButtonsGroup
            backProps={{
              linkProps: {
                href: "/index-egapro_/simulateur/effectifs",
              },
            }}
            // nextDisabled={!isValid}
          />
        </CenteredContainer>
      </form>
    </FormProvider>
  );
};
