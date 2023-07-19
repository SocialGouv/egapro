"use client";

import RadioButtons from "@codegouvfr/react-dsfr/RadioButtons";
import {
  ageRanges,
  IndicateurUnComputer,
  type RemunerationsCSP,
  type RemunerationsOther,
} from "@common/core-domain/computers/indicateurUn";
import { RemunerationsMode } from "@common/core-domain/domain/valueObjects/declaration/indicators/RemunerationsMode";
import { createSteps } from "@common/core-domain/dtos/CreateSimulationDTO";
import { Object } from "@common/utils/overload";
import { storePicker } from "@common/utils/zustand";
import { BackNextButtonsGroup, CenteredContainer, Container } from "@design-system";
import { ClientAnimate } from "@design-system/utils/client/ClientAnimate";
import { zodResolver } from "@hookform/resolvers/zod";
import { useSession } from "next-auth/react";
import { useState } from "react";
import { Controller, FormProvider, useForm } from "react-hook-form";
import { type z } from "zod";

import { useSimuFunnelStore } from "../useSimuFunnelStore";
import { CSPModeTable } from "./CSPModeTable";
import { OtherModesTable } from "./OtherModesTable";

type Indic1FormType = z.infer<typeof createSteps.indicateur1>;
type EffectifsType = z.infer<typeof createSteps.effectifs>;

const cspComputer = new IndicateurUnComputer(RemunerationsMode.Enum.CSP);
const branchComputer = new IndicateurUnComputer(RemunerationsMode.Enum.BRANCH_LEVEL);
const otherComputer = new IndicateurUnComputer(RemunerationsMode.Enum.OTHER_LEVEL);

const useStore = storePicker(useSimuFunnelStore);
export const Indic1Form = () => {
  const { data: session } = useSession();
  const [funnel, saveFunnel] = useStore("funnel", "saveFunnel");
  const [lastCspRemunerations, setLastCspRemunerations] = useState<RemunerationsCSP | null>(null);
  const [lastBranchRemunerations, setLastBranchRemunerations] = useState<RemunerationsOther | null>(null);
  const [lastOtherRemunerations, setLastOtherRemunerations] = useState<RemunerationsOther | null>(null);
  const [lastMode, setLastMode] = useState<RemunerationsMode.Enum | null>(null);

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
    reset,
    resetField,
    control,
  } = methods;

  if (!funnel?.effectifs) {
    return null;
  }

  const currentMode = watch("mode");

  // default values for CSP mode, set category to empty if no data only if count is >= 3
  const defaultCspModeRemunerations = Object.keys(funnel.effectifs.csp).map<RemunerationsCSP[number]>(categoryName => ({
    name: categoryName,
    id: categoryName,
    category: ageRanges.reduce(
      (newAgeGroups, ageRange) => ({
        ...newAgeGroups,
        ...(funnel.effectifs!.csp[categoryName].ageRanges[ageRange].women >= 3 &&
        funnel.effectifs!.csp[categoryName].ageRanges[ageRange].men >= 3
          ? {
              [ageRange]: {
                womenCount: funnel.effectifs!.csp[categoryName].ageRanges[ageRange].women,
                menCount: funnel.effectifs!.csp[categoryName].ageRanges[ageRange].men,
              },
            }
          : {}),
      }),
      {} as RemunerationsCSP[number]["category"],
    ),
  }));

  const defaultOtherModesRemunerations = [
    {
      name: "",
      category: ageRanges.reduce(
        (newAgeGroups, ageRange) => ({
          ...newAgeGroups,
          [ageRange]: {},
        }),
        {},
      ),
    } as RemunerationsOther[number],
  ];

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
                        onChange() {
                          const defaultValue =
                            funnel.indicateur1?.mode === mode
                              ? funnel.indicateur1.remunerations
                              : mode === RemunerationsMode.Enum.CSP
                              ? lastCspRemunerations ?? defaultCspModeRemunerations
                              : mode === RemunerationsMode.Enum.BRANCH_LEVEL
                              ? lastBranchRemunerations ?? defaultOtherModesRemunerations
                              : lastOtherRemunerations ?? defaultOtherModesRemunerations;
                          const currentRemunerations = getValues("remunerations");
                          if (currentRemunerations?.length) {
                            if (lastMode === RemunerationsMode.Enum.CSP) {
                              setLastCspRemunerations(getValues("remunerations") as RemunerationsCSP);
                            } else if (lastMode === RemunerationsMode.Enum.BRANCH_LEVEL) {
                              setLastBranchRemunerations(getValues("remunerations") as RemunerationsOther);
                            } else if (lastMode === RemunerationsMode.Enum.OTHER_LEVEL) {
                              setLastOtherRemunerations(getValues("remunerations") as RemunerationsOther);
                            }
                          }
                          setValue("remunerations", defaultValue, {
                            shouldValidate: !!lastMode,
                            shouldDirty: !!lastMode,
                            shouldTouch: !!lastMode,
                          });
                          setLastMode(mode);
                          field.onChange(mode);
                        },
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
            {currentMode && (
              <div>
                {currentMode === RemunerationsMode.Enum.CSP ? (
                  <CSPModeTable computer={cspComputer} staff={session?.user.staff} />
                ) : (
                  <OtherModesTable
                    computer={currentMode === RemunerationsMode.Enum.BRANCH_LEVEL ? branchComputer : otherComputer}
                    staff={session?.user.staff}
                  />
                )}
              </div>
            )}
          </ClientAnimate>
        </Container>
        <CenteredContainer pb="6w">
          <BackNextButtonsGroup
            backProps={{
              linkProps: {
                href: "/index-egapro_/simulateur/effectifs",
              },
            }}
            nextDisabled={!isValid}
          />
        </CenteredContainer>
      </form>
    </FormProvider>
  );
};
