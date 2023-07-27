"use client";

import RadioButtons from "@codegouvfr/react-dsfr/RadioButtons";
import {
  ageRanges,
  categories,
  IndicateurUnComputer,
  type RemunerationsCSP,
  type RemunerationsOther,
} from "@common/core-domain/computers/IndicateurUnComputer";
import { RemunerationsMode } from "@common/core-domain/domain/valueObjects/declaration/indicators/RemunerationsMode";
import { createSteps } from "@common/core-domain/dtos/CreateSimulationDTO";
import { Object } from "@common/utils/overload";
import { type Any } from "@common/utils/types";
import { storePicker } from "@common/utils/zustand";
import { SkeletonForm } from "@components/utils/skeleton/SkeletonForm";
import { BackNextButtonsGroup, CenteredContainer, Container } from "@design-system";
import { ClientAnimate } from "@design-system/utils/client/ClientAnimate";
import { zodResolver } from "@hookform/resolvers/zod";
import { redirect } from "next/navigation";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { Controller, FormProvider, useForm } from "react-hook-form";
import { z } from "zod";

import { useSimuFunnelStore, useSimuFunnelStoreHasHydrated } from "../useSimuFunnelStore";
import { CSPModeTable } from "./CSPModeTable";
import { Indicateur1Note } from "./Indicateur1Note";
import { OtherModesTable } from "./OtherModesTable";

const formSchema = createSteps.indicateur1
  .and(createSteps.effectifs)
  .superRefine(({ mode, remunerations, csp }, ctx) => {
    if (mode !== RemunerationsMode.Enum.CSP) {
      // test if there is the same amount of CSP in effectifs and remunerations
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
      const [totalRemunerationsWomen, totalRemunerationsMen] = remunerations.reduce(
        (acc, remuneration) =>
          ageRanges.reduce(
            (innerAcc, ageRange) => [
              innerAcc[0] + (remuneration.category[ageRange]?.womenCount || 0),
              innerAcc[1] + (remuneration.category[ageRange]?.menCount || 0),
            ],
            acc,
          ),
        [0, 0],
      );
      const enoughWomen = totalRemunerationsWomen === totalCspWomen;
      const enoughMen = totalRemunerationsMen === totalCspMen;

      if (!enoughWomen || !enoughMen) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Le nombre de femmes et d'hommes dans les données saisies ne correspond pas au nombre de femmes et d'hommes dans les données de la page précédente`,
          path: ["remunerations"],
        });
      }
    }
  });
type Indic1FormType = z.infer<typeof formSchema>;

const cspComputer = new IndicateurUnComputer(RemunerationsMode.Enum.CSP);
const otherComputer = new IndicateurUnComputer(RemunerationsMode.Enum.OTHER_LEVEL);

const useStore = storePicker(useSimuFunnelStore);
export const Indic1Form = () => {
  const { data: session } = useSession();
  const [funnel, saveFunnel] = useStore("funnel", "saveFunnel");
  const hydrated = useSimuFunnelStoreHasHydrated();
  const [lastCspRemunerations, setLastCspRemunerations] = useState<RemunerationsCSP | null>(null);
  const [lastOtherRemunerations, setLastOtherRemunerations] = useState<RemunerationsOther | null>(null);
  const [lastMode, setLastMode] = useState<RemunerationsMode.Enum | null>(null);

  useEffect(() => {
    if (funnel?.indicateur1?.mode) {
      setLastMode(funnel.indicateur1.mode);
    }
  }, []);

  const methods = useForm<Indic1FormType>({
    mode: "onChange",
    resolver: zodResolver(formSchema),
    defaultValues: {
      ...funnel?.indicateur1,
      ...funnel?.effectifs,
    },
    criteriaMode: "all",
  });

  const {
    formState: { isValid },
    handleSubmit,
    getValues,
    watch,
    resetField,
    control,
  } = methods;

  if (!hydrated) {
    return (
      <CenteredContainer pb="6w">
        <SkeletonForm fields={1} />
      </CenteredContainer>
    );
  }

  if (!funnel?.effectifs) {
    redirect("/index-egapro_/simulateur/effectifs");
  }

  const currentMode = watch("mode");

  // default values for CSP mode, set category to empty if no data only if count is >= 3
  const defaultCspModeRemunerations = Object.keys(funnel.effectifs.csp).map<RemunerationsCSP[number]>(categoryName => ({
    name: categoryName,
    categoryId: categoryName,
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

  const onSubmit = ({ mode, remunerations }: Indic1FormType) => {
    saveFunnel({ indicateur1: { mode, remunerations } as Any });
    redirect("/index-egapro_/simulateur/indicateur2");
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
                          if (
                            mode !== RemunerationsMode.Enum.CSP &&
                            lastMode &&
                            lastMode !== RemunerationsMode.Enum.CSP
                          ) {
                            setLastMode(mode);
                            return field.onChange(mode);
                          }
                          const defaultValue =
                            mode === RemunerationsMode.Enum.CSP
                              ? lastCspRemunerations ?? defaultCspModeRemunerations
                              : lastOtherRemunerations ?? defaultOtherModesRemunerations;
                          const currentRemunerations = getValues("remunerations");
                          if (lastMode && currentRemunerations?.length) {
                            if (lastMode === RemunerationsMode.Enum.CSP) {
                              setLastCspRemunerations(currentRemunerations as RemunerationsCSP);
                            } else {
                              setLastOtherRemunerations(currentRemunerations as RemunerationsOther);
                            }
                          }
                          resetField("remunerations", { defaultValue });
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
        <Container mb="4w">
          <ClientAnimate>
            {currentMode && (
              <div>
                {currentMode === RemunerationsMode.Enum.CSP ? (
                  <CSPModeTable computer={cspComputer} staff={session?.user.staff} />
                ) : (
                  <OtherModesTable computer={otherComputer} staff={session?.user.staff} />
                )}
                <CenteredContainer fluid py="1w">
                  <Indicateur1Note
                    computer={currentMode === RemunerationsMode.Enum.CSP ? cspComputer : otherComputer}
                  />
                </CenteredContainer>
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
