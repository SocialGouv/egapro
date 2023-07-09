"use client";

import RadioButtons from "@codegouvfr/react-dsfr/RadioButtons";
import { RemunerationsMode } from "@common/core-domain/domain/valueObjects/declaration/indicators/RemunerationsMode";
import { createSteps } from "@common/core-domain/dtos/CreateSimulationDTO";
import { type ClearObject } from "@common/utils/types";
import { storePicker } from "@common/utils/zustand";
import { CommentEstCalculéLIndicateur } from "@components/aide-simulation/Indic1";
import { AlternativeTable, CenteredContainer, Container } from "@design-system";
import { zodResolver } from "@hookform/resolvers/zod";
import { noop } from "lodash";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { type z } from "zod";

import { useSimuFunnelStore } from "../useSimuFunnelStore";

type Indic1FormType = ClearObject<z.infer<typeof createSteps.indicateur1>>;

const useStore = storePicker(useSimuFunnelStore);
export const Indic1Form = () => {
  const [funnel, saveFunnel] = useStore("funnel", "saveFunnel");
  const [currentMode, setCurrentMode] = useState(RemunerationsMode.Enum.CSP);

  useEffect(() => {
    if (funnel?.indicateur1?.mode) {
      setCurrentMode(funnel.indicateur1.mode);
    }
  }, []);

  const {
    formState: { isValid, errors },
    handleSubmit,
    register,
    getValues,
    setValue,
  } = useForm<Indic1FormType>({
    mode: "onChange",
    resolver: zodResolver(createSteps.indicateur1),
    defaultValues: funnel?.indicateur1,
  });

  return (
    <form noValidate onSubmit={handleSubmit(noop)}>
      <CenteredContainer>
        <RadioButtons
          legend="Modalité de calcul choisie pour cet indicateur"
          options={[
            {
              label: RemunerationsMode.Label[RemunerationsMode.Enum.CSP],
              nativeInputProps: {
                ...register("mode"),
                value: RemunerationsMode.Enum.CSP,
                defaultChecked: currentMode === RemunerationsMode.Enum.CSP,
              },
            },
            {
              label: RemunerationsMode.Label[RemunerationsMode.Enum.BRANCH_LEVEL],
              nativeInputProps: {
                ...register("mode"),
                value: RemunerationsMode.Enum.BRANCH_LEVEL,
                defaultChecked: currentMode === RemunerationsMode.Enum.BRANCH_LEVEL,
              },
            },
            {
              label: RemunerationsMode.Label[RemunerationsMode.Enum.OTHER_LEVEL],
              nativeInputProps: {
                ...register("mode"),
                value: RemunerationsMode.Enum.OTHER_LEVEL,
                defaultChecked: currentMode === RemunerationsMode.Enum.OTHER_LEVEL,
              },
            },
          ]}
        />
      </CenteredContainer>

      <Container>
        <AlternativeTable
          header={[
            {
              label: "Catégorie socio-professionnelle",
            },
            {
              label: "Tranche d’âge",
            },
            {
              label: "Nombre de salariés",
              subCols: [
                {
                  label: "Femmes",
                },
                {
                  label: "Hommes",
                },
              ],
            },
            {
              label: "Effectifs valides",
              informations:
                "Ce sont les effectifs retenus pour le calcul de l’indicateur comportant au moins 3 femmes et 3 hommes.",
            },
            {
              label: (
                <>
                  Rémunération annuelle brute moyenne par <abbr title="Équivalent temps plein">EQTP</abbr>
                </>
              ),
              informations: (
                <>
                  <p>
                    La rémunération doit être reconstituée en équivalent temps plein sur toute la durée de la période de
                    référence.
                  </p>
                  Doivent être pris en compte dans la rémunération :
                  <ul>
                    <li>
                      les salaires ou traitements ordinaires de base ou minimum et tous les autres avantages et
                      accessoires payés, directement ou indirectement, en espèces ou en nature, par l’employeur au
                      salarié en raison de l’emploi de ce dernier
                    </li>
                    <li>
                      les "bonus", les commissions sur produits, les primes d’objectif liées aux performances
                      individuelles du salarié, variables d’un individu à l’autre pour un même poste
                    </li>
                    <li>les primes collectives (ex : les primes de transport ou primes de vacances)</li>
                    <li>les indemnités de congés payés</li>
                  </ul>
                  Ne doivent pas être pris en compte dans la rémunération :
                  <ul>
                    <li>les indemnités de fin de CDD (notamment la prime de précarité)</li>
                    <li>les sommes versées dans le cadre du compte épargne-temps (CET)</li>
                    <li>les actions, stock-options, compensations différées en actions</li>
                    <li>
                      les primes liées à une sujétion particulière qui ne concernent pas la personne du salarié (prime
                      de froid, prime de nuit etc.)
                    </li>
                    <li>les heures supplémentaires et complémentaires</li>
                    <li>les indemnités de licenciement</li>
                    <li>les indemnités de départ en retraite</li>
                    <li>les primes d’ancienneté</li>
                    <li>les primes d’intéressement et de participation</li>
                  </ul>
                </>
              ),
              subCols: [
                {
                  label: "Femmes",
                },
                {
                  label: "Hommes",
                },
              ],
            },
            {
              label: "Écarts pondérés",
              informations: <CommentEstCalculéLIndicateur skipRemuDetails />,
            },
          ]}
          footer={[
            {
              label: "Ensemble des salariés",
              colspan: 2,
            },
            {
              label: "x femmes - x hommes",
              colspan: 2,
              data: 1000,
            },
            {
              label: "Effectifs valides",
              data: 3,
            },
            {
              label: "Femmes",
              data: <>100000 €</>,
            },
            {
              label: "Hommes",
              data: <>100000 €</>,
            },
            {
              label: "Écart global",
              data: "2,4%",
            },
          ]}
          body={[
            {
              categoryLabel: "Ouvriers",
              subRows: [
                {
                  label: "Moins de 30 ans",
                  cols: [
                    14,
                    78,
                    92,
                    {
                      label: "Rému moyenne - Femmes",
                      nativeInputProps: {
                        type: "number",
                      },
                    },
                    {
                      label: "Rému moyenne - Hommes",
                      nativeInputProps: {
                        type: "number",
                      },
                    },
                    "2,4%",
                  ],
                },
              ],
            },
          ]}
        />
      </Container>
    </form>
  );
};
