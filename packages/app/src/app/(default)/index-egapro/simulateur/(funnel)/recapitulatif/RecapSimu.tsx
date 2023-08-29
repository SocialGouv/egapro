"use client";

import { fr } from "@codegouvfr/react-dsfr";
import Alert from "@codegouvfr/react-dsfr/Alert";
import ButtonsGroup from "@codegouvfr/react-dsfr/ButtonsGroup";
import { cx } from "@codegouvfr/react-dsfr/tools/cx";
import { IndexComputer } from "@common/core-domain/computers/IndexComputer";
import { IndicateurCinqComputer } from "@common/core-domain/computers/IndicateurCinqComputer";
import { IndicateurDeuxComputer, type Percentages } from "@common/core-domain/computers/IndicateurDeuxComputer";
import { IndicateurDeuxTroisComputer } from "@common/core-domain/computers/IndicateurDeuxTroisComputer";
import { IndicateurQuatreComputer } from "@common/core-domain/computers/IndicateurQuatreComputer";
import { IndicateurTroisComputer } from "@common/core-domain/computers/IndicateurTroisComputer";
import { IndicateurUnComputer } from "@common/core-domain/computers/IndicateurUnComputer";
import {
  ageRanges,
  buildRemunerationKey,
  categories,
  type ExternalRemunerations,
  flattenRemunerations,
} from "@common/core-domain/computers/utils";
import { CSP } from "@common/core-domain/domain/valueObjects/CSP";
import { CompanyWorkforceRange } from "@common/core-domain/domain/valueObjects/declaration/CompanyWorkforceRange";
import { RemunerationsMode } from "@common/core-domain/domain/valueObjects/declaration/indicators/RemunerationsMode";
import { CSPAgeRange } from "@common/core-domain/domain/valueObjects/declaration/simulation/CSPAgeRange";
import {
  type CreateSimulationDTO,
  createSimulationDTO,
  isCreateSimulationWorkforceRangeLessThan250DTO,
} from "@common/core-domain/dtos/CreateSimulationDTO";
import { percentFormat, precisePercentFormat } from "@common/utils/number";
import { DebugButton } from "@components/utils/debug/DebugButton";
import { SkeletonFlex } from "@components/utils/skeleton/SkeletonFlex";
import { AlternativeTable, type AlternativeTableProps, IndicatorNote, RecapCard, Stat } from "@design-system";
import { times } from "lodash";
import { redirect, useRouter } from "next/navigation";
import Skeleton from "react-loading-skeleton";
import { type ZodError } from "zod";

import { Indicateur2ou3Note } from "../(indicateurs2ou3)/Indicateur2ou3Note";
import { Indicateur1Note } from "../indicateur1/Indicateur1Note";
import { Indicateur2et3Note } from "../indicateur2et3/Indicateur2et3Note";
import { Indicateur4Note } from "../indicateur4/Indicateur4Note";
import { NAVIGATION, simulateurPath } from "../navigation";
import { useSimuFunnelStore, useSimuFunnelStoreHasHydrated } from "../useSimuFunnelStore";
import { getCspRemuWithCount, getPourcentagesAugmentationPromotionsWithCount, getTotalsCsp } from "../utils";
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

  // init computers
  const computerIndicateurUn = new IndicateurUnComputer();
  computerIndicateurUn.setMode(funnel.indicateur1.mode);
  const computerIndicateurDeuxTrois = new IndicateurDeuxTroisComputer(computerIndicateurUn);
  const computerIndicateurDeux = new IndicateurDeuxComputer(computerIndicateurUn);
  const computerIndicateurTrois = new IndicateurTroisComputer(computerIndicateurUn);
  const computerIndicateurQuatre = new IndicateurQuatreComputer();
  const computerIndicateurCinq = new IndicateurCinqComputer();

  // prepare inputs
  const [totalWomen, totalMen] = getTotalsCsp(funnel);
  const isLessThan250 = isCreateSimulationWorkforceRangeLessThan250DTO(funnel);
  const remuWithCount =
    funnel.indicateur1.mode === RemunerationsMode.Enum.CSP
      ? getCspRemuWithCount(funnel.effectifs.csp, funnel.indicateur1.remunerations as ExternalRemunerations)
      : (funnel.indicateur1.remunerations as ExternalRemunerations);

  // set inputs
  computerIndicateurUn.setInput(flattenRemunerations(remuWithCount));
  if (isLessThan250) {
    if (funnel.indicateur2and3.calculable) {
      computerIndicateurDeuxTrois.setInput({
        ...funnel.indicateur2and3.raisedCount,
        menCount: totalMen,
        womenCount: totalWomen,
      });
    }
  } else {
    if (funnel.indicateur2.calculable) {
      computerIndicateurDeux.setInput(
        getPourcentagesAugmentationPromotionsWithCount(
          funnel.effectifs.csp,
          funnel.indicateur2.pourcentages as Percentages,
        ),
      );
    }

    if (funnel.indicateur3.calculable) {
      computerIndicateurTrois.setInput(
        getPourcentagesAugmentationPromotionsWithCount(
          funnel.effectifs.csp,
          funnel.indicateur3.pourcentages as Percentages,
        ),
      );
    }
  }
  if (funnel.indicateur4.calculable) {
    computerIndicateurQuatre.setInput(funnel.indicateur4.count);
  }
  computerIndicateurCinq.setInput(funnel.indicateur5);

  // compute results
  const resultIndicateurUn = computerIndicateurUn.compute();
  const resultIndicateurDeuxTrois =
    isLessThan250 && funnel.indicateur2and3.calculable && computerIndicateurDeuxTrois.compute();
  const resultIndicateurDeux = !isLessThan250 && funnel.indicateur2.calculable && computerIndicateurDeux.compute();
  const resultIndicateurTrois = !isLessThan250 && funnel.indicateur3.calculable && computerIndicateurTrois.compute();
  const resultIndicateurQuatre = funnel.indicateur4.calculable && computerIndicateurQuatre.compute();
  const resultIndicateurCinq = computerIndicateurCinq.compute();

  // total index
  const indexComputer = new IndexComputer(
    funnel.effectifs.workforceRange,
    isLessThan250
      ? [
          computerIndicateurUn,
          funnel.indicateur2and3.calculable ? computerIndicateurDeuxTrois : null,
          funnel.indicateur4.calculable ? computerIndicateurQuatre : null,
          computerIndicateurCinq,
        ]
      : [
          computerIndicateurUn,
          funnel.indicateur2.calculable ? computerIndicateurDeux : null,
          funnel.indicateur3.calculable ? computerIndicateurTrois : null,
          funnel.indicateur4.calculable ? computerIndicateurQuatre : null,
          computerIndicateurCinq,
        ],
  );
  const resultIndex = indexComputer.compute();

  // actions
  const sendToDeclaration = () => {
    console.log("send !", funnel);
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
                      label: CSPAgeRange.Label[ageRange],
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
                <Indicateur1Note computer={computerIndicateurUn} isValid simple noBorder />
                <IndicatorPercentResult result={resultIndicateurUn.result / 100} />
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
                <Indicateur2et3Note computer={computerIndicateurDeuxTrois} isValid simple noBorder />
                <IndicatorPercentResult result={resultIndicateurDeuxTrois.result / 100} />
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
                      <Indicateur2ou3Note
                        computer={computerIndicateurDeuxOuTrois}
                        indicateur={indicateur}
                        isValid
                        simple
                        noBorder
                      />
                      <IndicatorPercentResult result={result.result / 100} />
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
              <Indicateur4Note noBorder computer={computerIndicateurQuatre} count={count} isValid />
              <IndicatorPercentResult result={resultIndicateurQuatre.result} />
            </>
          );
        })()}
      />
      <RecapCard
        title={NAVIGATION.indicateur5.title}
        editLink={simulateurPath("indicateur5")}
        content={
          <>
            <AlternativeTable
              classeName="fr-mb-1w"
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
                  categoryLabel: "Nombre parmi les 10 plus hauts salaires",
                  alignCols: "center",
                  cols: [funnel.indicateur5.women, funnel.indicateur5.men],
                },
              ]}
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
              <p style={{ textAlign: "center" }} className={fr.cx("fr-mt-2w")}>
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
