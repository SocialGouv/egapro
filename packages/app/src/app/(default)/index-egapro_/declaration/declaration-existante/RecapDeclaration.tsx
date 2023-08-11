import { fr } from "@codegouvfr/react-dsfr";
import { RemunerationsMode } from "@common/core-domain/domain/valueObjects/declaration/indicators/RemunerationsMode";
import { type CompanyDTO } from "@common/core-domain/dtos/CompanyDTO";
import { type DeclarationDTO } from "@common/models/generated";
import { formatIsoToFr } from "@common/utils/date";
import { BigNote, RecapCard, RecapCardCompany, RecapCardPublication } from "@design-system";
import { type PropsWithChildren } from "react";

import { RecapCardIndicator } from "./RecapCardIndicator";

type Props = { déclaration: DeclarationDTO };

export const RecapDeclaration = ({ déclaration }: PropsWithChildren<Props>) => {
  const { déclarant, déclaration: meta, entreprise, indicateurs } = déclaration;

  const company: CompanyDTO = {
    name: entreprise.raison_sociale,
    address: entreprise.adresse || "",
    postalCode: entreprise.code_postal || "",
    city: entreprise.commune || "",
    countryIsoCode: entreprise.code_pays,
    siren: entreprise.siren,
    nafCode: entreprise.code_naf,
  };

  return (
    <>
      <h1 className={fr.cx("fr-mt-4w")}>Récapitulatif</h1>

      <p>
        Déclaration de l'index de l'égalité professionnelle Femmes/Hommes pour l'année{" "}
        <strong>{meta.année_indicateurs + 1}</strong> au titre des données <strong>{meta.année_indicateurs}</strong>.
      </p>
      {/* {meta?.date && <RecapCard title="Date de déclaration" content={meta?.date && formatIsoToFr(meta?.date)} />}  */}

      <RecapCard
        title="Informations déclarant"
        content={
          <>
            <strong>
              {déclarant?.nom}&nbsp;{déclarant?.prénom}
            </strong>
            <br />
            {déclarant?.email}
            <br />
            {déclarant.téléphone}
          </>
        }
      />

      <RecapCardCompany company={company} />

      {entreprise.ues?.nom && (
        <RecapCard
          title="Informations de l'UES"
          content={
            <>
              <p>
                <strong>{entreprise.ues.nom}</strong>
              </p>
              <p>{entreprise.ues.entreprises?.length} entreprises composent l'UES</p>
            </>
          }
        />
      )}

      <RecapCard
        title="Informations calcul et période de référence"
        content={
          <>
            <p>
              Les indicateurs sont calculés au titre de l’année <strong>{meta.année_indicateurs}</strong>.
            </p>

            {meta.période_suffisante && (
              <>
                <p>
                  La date de fin de la période de référence choisie pour le calcul des indicateurs est le&nbsp;
                  <strong>{meta?.fin_période_référence && formatIsoToFr(meta.fin_période_référence)}</strong>.
                </p>
                <p>
                  {entreprise.effectif?.total && (
                    <>
                      <strong>{entreprise.effectif?.total}</strong> salariés pris en compte pour le calcul des
                      indicateurs sur la période de référence (en effectif physique).
                    </>
                  )}
                </p>
              </>
            )}
          </>
        }
      />

      {meta.période_suffisante !== false && (
        <>
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

                {indicateurs?.rémunérations?.mode !== "csp" && (
                  <>
                    {!entreprise.ues && !indicateurs?.rémunérations?.date_consultation_cse ? (
                      <p> Aucun CSE n’est mis en place. </p>
                    ) : (
                      <p>Le CSE a été consulté le {indicateurs?.rémunérations?.date_consultation_cse}</p>
                    )}
                  </>
                )}
              </>
            }
          />

          {entreprise.effectif?.tranche === "50:250" ? (
            <RecapCardIndicator nom="augmentations_et_promotions" indicateurs={indicateurs} />
          ) : (
            <>
              <RecapCardIndicator nom="augmentations" indicateurs={indicateurs} />
              <RecapCardIndicator nom="promotions" indicateurs={indicateurs} />
            </>
          )}
          <RecapCardIndicator nom="congés_maternité" indicateurs={indicateurs} />
          <RecapCardIndicator nom="hautes_rémunérations" indicateurs={indicateurs} />
        </>
      )}

      <BigNote
        className={fr.cx("fr-mb-4w")}
        note={meta.index}
        max={100}
        legend={meta.index !== undefined ? "Index de" : "Index non calculable"}
        text={
          <>
            <p>
              Total des points obtenus aux indicateurs calculables&nbsp;: <strong>{meta.points}</strong>
            </p>
            <p>
              Nombre de points maximum pouvant être obtenus aux indicateurs calculables&nbsp;:{" "}
              <strong>{meta.points_calculables}</strong>
            </p>
          </>
        }
      />

      <RecapCardPublication publication={meta.publication} />

      {meta.période_suffisante && (
        <RecapCard
          title="Plan de relance"
          // editLink={funnelStaticConfig["publication"].url}
          content={
            <>
              <p>
                Votre entreprise {entreprise.plan_relance ? "a" : "n'a pas"} bénéficié depuis 2021, d'une aide prévue
                par la loi du 29 décembre 2020 de finances pour 2021 au titre de la mission « Plan de relance ».
              </p>
            </>
          }
        />
      )}
    </>
  );
};