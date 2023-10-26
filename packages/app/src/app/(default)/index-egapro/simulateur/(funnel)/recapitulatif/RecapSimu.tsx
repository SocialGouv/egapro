"use client";

import { fr } from "@codegouvfr/react-dsfr";
import Alert from "@codegouvfr/react-dsfr/Alert";
import ButtonsGroup from "@codegouvfr/react-dsfr/ButtonsGroup";
import { cx } from "@codegouvfr/react-dsfr/tools/cx";
import { ageRanges, buildRemunerationKey, categories } from "@common/core-domain/computers/utils";
import { CSP } from "@common/core-domain/domain/valueObjects/CSP";
import { AgeRange } from "@common/core-domain/domain/valueObjects/declaration/AgeRange";
import { CompanyWorkforceRange } from "@common/core-domain/domain/valueObjects/declaration/CompanyWorkforceRange";
import { RemunerationsMode } from "@common/core-domain/domain/valueObjects/declaration/indicators/RemunerationsMode";
import {
  type CreateSimulationDTO,
  createSimulationDTO,
  isCreateSimulationWorkforceRangeLessThan250DTO,
} from "@common/core-domain/dtos/CreateSimulationDTO";
import { percentFormat, precisePercentFormat } from "@common/utils/number";
import { DebugButton } from "@components/utils/debug/DebugButton";
import { SkeletonFlex } from "@components/utils/skeleton/SkeletonFlex";
import { AlternativeTable, type AlternativeTableProps, IndicatorNote, RecapCard, Stat } from "@design-system";
import { Skeleton } from "@design-system/utils/client/skeleton";
import { useDeclarationFormManager } from "@services/apiClient/useDeclarationFormManager";
import { times } from "lodash";
import { redirect, useRouter } from "next/navigation";
import { type ZodError } from "zod";

import { Indicateur2ou3Note } from "../(indicateurs2ou3)/Indicateur2ou3Note";
import { Indicateur1Note } from "../indicateur1/Indicateur1Note";
import { Indicateur2et3Note } from "../indicateur2et3/Indicateur2et3Note";
import { Indicateur4Note } from "../indicateur4/Indicateur4Note";
import { NAVIGATION, simulateurPath } from "../navigation";
import { useSimuFunnelStore, useSimuFunnelStoreHasHydrated } from "../useSimuFunnelStore";
import { computerHelper } from "./computerHelper";
import style from "./Recap.module.scss";

function assertSimu(simulation: Partial<CreateSimulationDTO> | undefined): asserts simulation is CreateSimulationDTO {
  createSimulationDTO.parse(simulation);
}

const IndicatorPercentResult = ({ result }: { result: number }) => (
  <IndicatorNote
    noBorder
    size="small"
    note={percentFormat.format(result)}
    text="Résultat final obtenu à l'indicateur en %"
  />
);

export const RecapSimu = () => {
  const router = useRouter();
  const funnel = useSimuFunnelStore(store => store.funnel);
  const hydrated = useSimuFunnelStoreHasHydrated();
  const saveFormData = useDeclarationFormManager(state => state.saveFormData);

  if (hydrated && !funnel?.effectifs?.workforceRange) {
    redirect(simulateurPath("effectifs"));
  }

  if (!hydrated) {
    return times(7).map(idx => (
      <RecapCard key={`recap-simulation-loading-${idx}`} title={<SkeletonFlex />} content={<Skeleton count={3} />} />
    ));
  }

  try {
    assertSimu(funnel);
  } catch (e: unknown) {
    return (
      <Alert
        severity="error"
        title="Données invalides"
        description={
          <>
            <DebugButton obj={{ funnel, error: e }} />
            {(e as ZodError).message}
          </>
        }
      />
    );
  }

  const {
    computerIndicateurUn,
    computerIndicateurDeuxTrois,
    computerIndicateurDeux,
    computerIndicateurTrois,
    computerIndicateurQuatre,
    computerIndicateurCinq,
    totalWomen,
    totalMen,
    remuWithCount,
    resultIndicateurUn,
    resultIndicateurDeuxTrois,
    resultIndicateurDeux,
    resultIndicateurTrois,
    resultIndicateurQuatre,
    resultIndicateurCinq,
    indexComputer,
    resultIndex,
  } = computerHelper(funnel);

  // actions
  const sendToDeclaration = () => {
    console.log("send !", funnel);
    saveFormData({});
  };

  return (
    <>
      <RecapCard
        title={NAVIGATION.effectifs.title}
        editLink={simulateurPath("effectifs")}
        content={
          <>
            <p className="fr-mb-0">
              Tranche d'effectifs assujettis de l'entreprise ou de l'UES :{" "}
              <strong>{CompanyWorkforceRange.Label[funnel.effectifs.workforceRange]}</strong>.
              <br />
              <strong>{totalWomen + totalMen}</strong> salariés pris en compte pour le calcul des indicateurs et de
              l'index.
            </p>
            <AlternativeTable
              bordered
              header={[
                {
                  label: "",
                },
                {
                  label: "Femmes",
                },
                {
                  label: "Hommes",
                },
              ]}
              body={[
                {
                  categoryLabel: "Salariés",
                  alignCols: "center",
                  cols: [totalWomen, totalMen],
                },
              ]}
            />
          </>
        }
      />
      <RecapCard
        title={NAVIGATION.indicateur1.title}
        editLink={simulateurPath("indicateur1")}
        content={
          <>
            <p className="fr-mb-1w">
              <strong>{RemunerationsMode.Label[funnel.indicateur1.mode]}</strong> (avant seuil de pertinence)
            </p>
            {computerIndicateurUn.canCompute() ? (
              <>
                <AlternativeTable
                  bordered
                  classeName="fr-mb-1w"
                  header={[
                    { label: "" },
                    ...ageRanges.map<AlternativeTableProps.Columns>(ageRange => ({
                      label: AgeRange.Label[ageRange],
                    })),
                  ]}
                  body={remuWithCount.map(category => ({
                    categoryLabel:
                      funnel.indicateur1.mode === RemunerationsMode.Enum.CSP
                        ? CSP.Label[category.categoryId as CSP.Enum]
                        : category.name,
                    alignCols: "center",
                    cols: ageRanges.map(ageRange => {
                      const groupKey = buildRemunerationKey(category.categoryId, ageRange);
                      const canComputeGroup = computerIndicateurUn.canComputeGroup(groupKey);
                      const groupResult = computerIndicateurUn.computeGroup(groupKey);
                      return canComputeGroup ? precisePercentFormat.format(groupResult.resultRaw / 100) : "NC";
                    }) as [AlternativeTableProps.ColType, ...AlternativeTableProps.ColType[]],
                  }))}
                />
                <Indicateur1Note computer={computerIndicateurUn} isValid noBorder />
              </>
            ) : (
              <IndicatorNote
                noBorder
                note="NC"
                size="small"
                text="L'indicateur écart de rémunération est non calculable"
                legend="L’ensemble des groupes valides (c’est-à-dire comptant au moins 3 femmes et 3 hommes), représentent moins de 40% des effectifs"
              />
            )}
          </>
        }
      />
      {isCreateSimulationWorkforceRangeLessThan250DTO(funnel) ? (
        <RecapCard
          title={NAVIGATION.indicateur2et3.title}
          editLink={simulateurPath("indicateur2et3")}
          content={(() => {
            if (!resultIndicateurDeuxTrois) return;
            if (!funnel.indicateur2and3.calculable) {
              return (
                <IndicatorNote
                  noBorder
                  note="NC"
                  size="small"
                  text="L'indicateur écart de taux d'augmentations est non calculable"
                  legend="Il n'y a pas eu d'augmentations durant la période de référence"
                />
              );
            }

            if (!computerIndicateurDeuxTrois.canCompute()) {
              return (
                <IndicatorNote
                  noBorder
                  note="NC"
                  size="small"
                  text="L'indicateur écart de taux d'augmentations est non calculable"
                  legend="Les effectifs comprennent moins de 5 femmes ou moins de 5 hommes"
                />
              );
            }

            return (
              <>
                <Indicateur2et3Note computer={computerIndicateurDeuxTrois} isValid noBorder detailed />
              </>
            );
          })()}
        />
      ) : (
        <>
          {([2, 3] as const).map(indicateur => {
            const indicateurKey = `indicateur${indicateur}` as const;
            return (
              <RecapCard
                key={`recap-simulation-${indicateur}`}
                title={NAVIGATION[indicateurKey].title}
                editLink={simulateurPath(indicateurKey)}
                content={(() => {
                  const indic = funnel[indicateurKey];
                  if (!indic.calculable) {
                    return (
                      <IndicatorNote
                        noBorder
                        note="NC"
                        size="small"
                        text={`L'indicateur écart de taux ${
                          indicateur === 2 ? "d'augmentations" : "de promotions"
                        } est non calculable`}
                        legend={`Il n'y a pas eu ${
                          indicateur === 2 ? "d'augmentations" : "de promotions"
                        } durant la période de référence`}
                      />
                    );
                  }
                  const computerIndicateurDeuxOuTrois =
                    indicateur === 2 ? computerIndicateurDeux : computerIndicateurTrois;
                  const canCompute = computerIndicateurDeuxOuTrois.canCompute();
                  const result = indicateur === 2 ? resultIndicateurDeux : resultIndicateurTrois;

                  if (!result) return;

                  if (!canCompute) {
                    return (
                      <IndicatorNote
                        noBorder
                        note="NC"
                        size="small"
                        text={`L'indicateur écart de taux ${
                          indicateur === 2 ? "d'augmentations" : "de promotions"
                        } est non calculable`}
                        legend="Les catégories valides (c’est-à-dire comptant au moins 10 femmes et 10 hommes), représentent moins de 40% des effectifs"
                      />
                    );
                  }

                  return (
                    <>
                      <AlternativeTable
                        bordered
                        classeName="fr-mb-1w"
                        header={[
                          {
                            label: "",
                          },
                          {
                            label: "Écart pondéré",
                          },
                        ]}
                        body={categories.map(category => ({
                          categoryLabel: CSP.Label[category],
                          alignCols: "center",
                          ...(() => {
                            const canComputeGroup = computerIndicateurDeuxOuTrois.canComputeGroup(category);
                            if (!canComputeGroup) {
                              return {
                                mergedLabel: "NC",
                              } satisfies Partial<AlternativeTableProps.BodyContent>;
                            }
                            const groupResult = computerIndicateurDeuxOuTrois.computeGroup(category);
                            return {
                              cols: [precisePercentFormat.format(groupResult.resultRaw / 100)],
                            } satisfies Partial<AlternativeTableProps.BodyContent>;
                          })(),
                        }))}
                      />
                      <IndicatorNote
                        noBorder
                        size="small"
                        note={percentFormat.format((result?.result ?? 0) / 100)}
                        text="Résultat final obtenu à l'indicateur en %"
                      />
                      <Indicateur2ou3Note
                        computer={computerIndicateurDeuxOuTrois}
                        indicateur={indicateur}
                        isValid
                        noBorder
                        simple
                      />
                    </>
                  );
                })()}
              />
            );
          })}
        </>
      )}
      <RecapCard
        title={NAVIGATION.indicateur4.title}
        editLink={simulateurPath("indicateur4")}
        content={(() => {
          if (!funnel.indicateur4.calculable) {
            return (
              <IndicatorNote
                noBorder
                note="NC"
                size="small"
                text="L'indicateur retour de congé maternité est non calculable"
                legend="Il n'y a pas eu de retour de congé maternité durant la période de référence"
              />
            );
          }

          if (!resultIndicateurQuatre) return;

          const count = funnel.indicateur4.count;

          return (
            <>
              <IndicatorPercentResult result={resultIndicateurQuatre.result} />
              <Indicateur4Note noBorder computer={computerIndicateurQuatre} count={count} isValid />
            </>
          );
        })()}
      />
      <RecapCard
        title={NAVIGATION.indicateur5.title}
        editLink={simulateurPath("indicateur5")}
        content={
          <>
            <IndicatorNote
              noBorder
              note={resultIndicateurCinq.result}
              size="small"
              text="Résultat final obtenu à l'indicateur en nombre de salariés du sexe sous-représenté"
            />
            <IndicatorNote
              noBorder
              note={resultIndicateurCinq.note}
              max={10}
              text="Nombre de points obtenus à l'indicateur hautes rémunérations"
              legend={
                resultIndicateurCinq.genderAdvantage === "equality"
                  ? "Les hommes et les femmes sont à parité parmi les salariés les mieux rémunérés."
                  : resultIndicateurCinq.genderAdvantage === "men"
                  ? "Les femmes sont sous-représentées parmi les salariés les mieux rémunérés."
                  : "Les hommes sont sous-représentés parmi les salariés les mieux rémunérés."
              }
            />
          </>
        }
      />

      <RecapCard
        title="Index égalité professionnelle"
        content={(() => {
          const canCompute = indexComputer.canCompute();

          return (
            <>
              {canCompute ? (
                <div className={cx(style["tile-note"], "fr-mt-2w")}>
                  <span className={style.note}>{resultIndex.note}</span>
                  <span className={style.max}>&nbsp;/&nbsp;100</span>
                </div>
              ) : (
                <Stat
                  text="NC"
                  display={{
                    asTitle: "xs",
                  }}
                  helpText={`Nombre de points maximum pouvant être obtenus est inferieur à 75, votre index ne peut être calculé.`}
                  helpTextVariant={["light", "alt"]}
                />
              )}
              <p className={cx(fr.cx("fr-mt-2w"), "text-center")}>
                Total des points obtenus aux indicateurs calculables : <strong>{resultIndex.resultRaw}</strong>
                <br />
                Nombre de points maximum pouvant être obtenus aux indicateurs calculables :{" "}
                <strong>{indexComputer.getMaxPossibleNote()}</strong>
              </p>
            </>
          );
        })()}
      />

      <Alert
        className="fr-mt-4w"
        severity="info"
        title="Attention, le calcul de vos indicateurs et de votre index n'est pas conservé."
        description="Si vous poursuivez vers la déclaration, seuls les informations de calcul nécessaires à la déclaration seront conservées et préremplies."
      />
      <ButtonsGroup
        className="fr-mt-4w"
        inlineLayoutWhen="sm and up"
        buttons={[
          {
            children: "Prédédent",
            priority: "secondary",
            iconId: "fr-icon-arrow-left-line",
            linkProps: {
              href: simulateurPath("indicateur5"),
            },
          },
          {
            children: "Poursuivre vers la déclaration",
            priority: "primary",
            nativeButtonProps: {
              onClick() {
                sendToDeclaration();
              },
            },
          },
        ]}
      />
    </>
  );
};
