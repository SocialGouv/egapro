import { RemunerationsMode } from "@common/core-domain/domain/valueObjects/declaration/indicators/RemunerationsMode";
import { type DeclarationDTO } from "@common/models/generated";
import { formatIsoToFr } from "@common/utils/date";
import { IndicatorNote, RecapCard } from "@design-system";
import { RecapCardCompany } from "packages/app/src/design-system/base/RecapCardCompany";
import { RecapCardPublication } from "packages/app/src/design-system/base/RecapCardPublication";
import { type PropsWithChildren } from "react";

import { funnelStaticConfig } from "../declarationFunnelConfiguration";
import { RecapCardIndicator } from "./RecapCardIndicator";

type Props = { déclaration: DeclarationDTO };

export const DeclarationRecap = ({ déclaration }: PropsWithChildren<Props>) => {
  const { déclarant, déclaration: meta, entreprise, indicateurs } = déclaration;

  return (
    <>
      <h1>Récapitulatif</h1>

      {/* <p>
        Déclaration pour l’année {meta.année_indicateurs + 1} au titre des données {meta.année_indicateurs}.
      </p>
      {meta?.date && <RecapCard title="Date de déclaration" content={meta?.date && formatIsoToFr(meta?.date)} />} */}

      <RecapCard
        title="Informations déclarant"
        content={
          <>
            <p>
              {déclarant?.nom}&nbsp;{déclarant?.prénom}
            </p>
            <p>{déclarant?.email}</p>
            <p>{déclarant.téléphone}</p>
          </>
        }
      />

      <RecapCardCompany company={entreprise} />

      {entreprise.ues?.nom && (
        <RecapCard
          title="Informations de l'UES"
          content={
            <>
              <p>{entreprise.raison_sociale}</p>
            </>
          }
        />
      )}

      <RecapCard
        title="Informations calcul et période de référence"
        content={
          <>
            <p>Les indicateurs sont calculés au titre de l’année {meta.année_indicateurs}.</p>

            <p>
              La date de fin de la période de référence choisie pour le calcul des indicateurs est :{" "}
              {meta?.fin_période_référence && formatIsoToFr(meta.fin_période_référence)}.
            </p>
            <p>
              {entreprise.effectif?.total && (
                <>
                  {entreprise.effectif?.total} salariés pris en compte pour le calcul des indicateurs sur la période de
                  référence (en effectif physique).
                </>
              )}
            </p>
          </>
        }
      />

      <RecapCardIndicator
        nom="rémunérations"
        indicateurs={indicateurs}
        customContent={
          <>
            {indicateurs?.rémunérations?.mode && (
              <p>
                La modalité choisie pour le calcul de l'indicateur est{" "}
                {new RemunerationsMode(indicateurs?.rémunérations?.mode).getLabel().toLowerCase()}.
              </p>
            )}

            {indicateurs?.rémunérations?.date_consultation_cse ? (
              <p> Aucun CSE n’est mis en place. </p>
            ) : (
              <p>Le CSE a été consulté le {indicateurs?.rémunérations?.date_consultation_cse}</p>
            )}
          </>
        }
      />

      <RecapCardIndicator nom="augmentations" indicateurs={indicateurs} />
      <RecapCardIndicator nom="augmentations_et_promotions" indicateurs={indicateurs} />
      <RecapCardIndicator nom="promotions" indicateurs={indicateurs} />
      <RecapCardIndicator nom="congés_maternité" indicateurs={indicateurs} />
      <RecapCardIndicator nom="hautes_rémunérations" indicateurs={indicateurs} />

      <RecapCard
        title="Niveau de résultat global"
        content={
          <>
            {meta.index && (
              <IndicatorNote
                size="large"
                note={meta.index}
                text="Index de"
                max={100}
                legend={
                  <>
                    <p>Total des points obtenus aux indicateurs calculables : {meta.points}</p>
                    <p>
                      Nombre de points maximum pouvant être obtenus aux indicateurs calculables :{" "}
                      {meta.points_calculables}
                    </p>
                  </>
                }
              />
            )}
          </>
        }
      />

      <RecapCardPublication publication={meta.publication} />

      <RecapCard
        title="Plan de relance"
        editLink={funnelStaticConfig["publication"].url}
        content={
          <>
            <p>
              Votre entreprise {entreprise.plan_relance ? "a" : "n'a pas"} bénéficié depuis 2021, d'une aide prévue par
              la loi du 29 décembre 2020 de finances pour 2021 au titre de la mission « Plan de relance ».
            </p>
          </>
        }
      />
    </>
  );
};
