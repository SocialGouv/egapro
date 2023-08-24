import { fr } from "@codegouvfr/react-dsfr";
import { type CompanyWorkforceRange } from "@common/core-domain/domain/valueObjects/declaration/CompanyWorkforceRange";
import { RemunerationsMode } from "@common/core-domain/domain/valueObjects/declaration/indicators/RemunerationsMode";
import { type CompanyDTO } from "@common/core-domain/dtos/CompanyDTO";
import { type DeclarationDTO } from "@common/models/generated";
import { formatIsoToFr } from "@common/utils/date";
import { BigNote, RecapCard, RecapCardCompany } from "@design-system";

import { funnelStaticConfig } from "../declarationFunnelConfiguration";
import { RecapCardIndicator } from "./RecapCardIndicator";
import { RecapCardPublication } from "./RecapCardPublication";

type Props = { déclaration: DeclarationDTO; edit?: boolean };

export const RecapDeclaration = ({ déclaration, edit }: Props) => {
  const { déclarant, déclaration: meta, entreprise, indicateurs } = déclaration;

  const company: CompanyDTO = {
    name: entreprise.raison_sociale,
    address: entreprise.adresse || "",
    postalCode: entreprise.code_postal || "",
    city: entreprise.commune || "",
    countryIsoCode: entreprise.code_pays,
    siren: entreprise.siren,
    nafCode: entreprise.code_naf,
    workforce: {
      range: entreprise.effectif?.tranche as CompanyWorkforceRange.Enum,
    },
    ues: {
      name: entreprise.ues?.nom || "",
      companies: [],
    },
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
        editLink={(edit || void 0) && funnelStaticConfig["declarant"].url}
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

      <RecapCardCompany company={company} title="Informations Entreprise / UES" />

      {entreprise.ues?.nom && (
        <RecapCard
          title="Informations UES"
          editLink={(edit || void 0) && funnelStaticConfig["ues"].url}
          content={
            <>
              <p>
                <strong>{entreprise.ues.nom}</strong>
              </p>
              <p>{entreprise.ues.entreprises!.length + 1} entreprises composent l'UES</p>
            </>
          }
        />
      )}

      <RecapCard
        title="Informations calcul et période de référence"
        editLink={(edit || void 0) && funnelStaticConfig["periode-reference"].url}
        content={
          <>
            <p>
              Les indicateurs sont calculés au titre de l’année <strong>{meta.année_indicateurs}</strong>
            </p>

            {meta.période_suffisante && (
              <>
                <p>
                  La date de fin de la période de référence choisie pour le calcul des indicateurs est le&nbsp;
                  <strong>{meta?.fin_période_référence && formatIsoToFr(meta.fin_période_référence)}</strong>
                </p>
                <p>
                  {entreprise.effectif?.total && (
                    <>
                      <strong>{entreprise.effectif?.total}</strong> salariés pris en compte pour le calcul des
                      indicateurs sur la période de référence (en effectif physique)
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
            name="rémunérations"
            indicateurs={indicateurs}
            edit={edit}
            customContent={
              <>
                {indicateurs?.rémunérations?.mode && (
                  <p>
                    La modalité choisie pour le calcul de l'indicateur est{" "}
                    {new RemunerationsMode(indicateurs?.rémunérations?.mode).getLabel().toLowerCase()}
                  </p>
                )}

                {indicateurs?.rémunérations?.mode !== "csp" && (
                  <>
                    {!indicateurs?.rémunérations?.date_consultation_cse ? (
                      <p> Aucun CSE n’est mis en place </p>
                    ) : (
                      <p>Le CSE a été consulté le {formatIsoToFr(indicateurs.rémunérations.date_consultation_cse)}</p>
                    )}
                  </>
                )}
              </>
            }
          />

          {entreprise.effectif?.tranche === "50:250" ? (
            <RecapCardIndicator edit={edit} name="augmentations_et_promotions" indicateurs={indicateurs} />
          ) : (
            <>
              <RecapCardIndicator edit={edit} name="augmentations" indicateurs={indicateurs} />
              <RecapCardIndicator edit={edit} name="promotions" indicateurs={indicateurs} />
            </>
          )}
          <RecapCardIndicator edit={edit} name="congés_maternité" indicateurs={indicateurs} />
          <RecapCardIndicator edit={edit} name="hautes_rémunérations" indicateurs={indicateurs} />
        </>
      )}

      <hr />

      <BigNote
        className={fr.cx("fr-mb-4w")}
        note={meta.index}
        max={100}
        legend="Niveau de résultat global"
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

      <RecapCardPublication edit={edit} publication={meta.publication} />

      {meta.période_suffisante && (
        <RecapCard
          title="Plan de relance"
          editLink={(edit || void 0) && funnelStaticConfig["publication"].url}
          content={
            <p>
              {entreprise.ues?.nom
                ? "Une ou plusieurs entreprises comprenant au moins 50 salariés au sein de l'UES "
                : "Votre entreprise "}
              {entreprise.plan_relance ? "a" : "n'a pas"} bénéficié depuis 2021, d'une aide prévue par la loi du 29
              décembre 2020 de finances pour 2021 au titre de la mission « Plan de relance »
            </p>
          }
        />
      )}
    </>
  );
};
