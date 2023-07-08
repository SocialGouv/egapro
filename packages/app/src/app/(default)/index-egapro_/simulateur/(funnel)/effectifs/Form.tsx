"use client";

import { fr } from "@codegouvfr/react-dsfr";
import Alert from "@codegouvfr/react-dsfr/Alert";
import Button from "@codegouvfr/react-dsfr/Button";
import RadioButtons from "@codegouvfr/react-dsfr/RadioButtons";
import { CSP } from "@common/core-domain/domain/valueObjects/CSP";
import { CompanyWorkforceRange } from "@common/core-domain/domain/valueObjects/declaration/CompanyWorkforceRange";
import { CSPAgeRange } from "@common/core-domain/domain/valueObjects/declaration/simulation/CSPAgeRange";
import { createSteps } from "@common/core-domain/dtos/CreateSimulationDTO";
import { Object } from "@common/utils/overload";
import { storePicker } from "@common/utils/zustand";
import { AlternativeTable, type AlternativeTableProps, BackNextButtonsGroup, Link } from "@design-system";
import { ClientAnimate } from "@design-system/utils/client/ClientAnimate";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { type z } from "zod";

import { useSimuFunnelStore } from "../useSimuFunnelStore";

Object;

type EffectifsFormType = z.infer<typeof createSteps.effectifs>;

const categories = [
  CSP.Enum.OUVRIERS,
  CSP.Enum.EMPLOYES,
  CSP.Enum.TECHNICIENS_AGENTS_MAITRISES,
  CSP.Enum.INGENIEURS_CADRES,
] as const;
const ageRanges = [
  CSPAgeRange.Enum.LESS_THAN_30,
  CSPAgeRange.Enum.FROM_30_TO_39,
  CSPAgeRange.Enum.FROM_40_TO_49,
  CSPAgeRange.Enum.FROM_50_TO_MORE,
] as const;

const useStore = storePicker(useSimuFunnelStore);
export const EffectifsForm = () => {
  const router = useRouter();
  const { data: session } = useSession();
  const [funnel, saveFunnel] = useStore("funnel", "saveFunnel");
  const [totalWomen, setTotalWomen] = useState(0);
  const [totalMen, setTotalMen] = useState(0);

  const {
    formState: { isValid, errors },
    handleSubmit,
    register,
    getValues,
    setValue,
  } = useForm<EffectifsFormType>({
    mode: "onChange",
    resolver: zodResolver(createSteps.effectifs),
    defaultValues: funnel,
  });

  const updateTotal = () => {
    const csp = getValues("csp");
    setTotalWomen(
      categories.reduce((acc, _, categoryIndex) => {
        return (
          acc +
          ageRanges.reduce((acc, ageRange) => {
            return acc + (csp?.[categoryIndex].ageRange[ageRange]?.women || 0);
          }, 0)
        );
      }, 0),
    );

    setTotalMen(
      categories.reduce((acc, _, categoryIndex) => {
        return (
          acc +
          ageRanges.reduce((acc, ageRange) => {
            return acc + (csp?.[categoryIndex].ageRange[ageRange]?.men || 0);
          }, 0)
        );
      }, 0),
    );
  };

  const onSubmit = (form: EffectifsFormType) => {
    saveFunnel(form);
    router.push("/index-egapro/simulateur/indicateurs-1");
  };

  const setRandomValues = () => {
    for (let categoryIndex = 0; categoryIndex < categories.length; categoryIndex++) {
      for (const ageRange of ageRanges) {
        setValue(`csp.${categoryIndex}.ageRange.${ageRange}.women`, Math.floor(Math.random() * 100) as never);
        setValue(`csp.${categoryIndex}.ageRange.${ageRange}.men`, Math.floor(Math.random() * 100) as never);
      }
    }
    updateTotal();
  };

  return (
    <form noValidate onSubmit={handleSubmit(onSubmit)}>
      <RadioButtons
        legend="Tranche d'effectifs assujettis de l'entreprise ou de l'unité économique et sociale (UES)"
        state={errors.workforceRange && "error"}
        stateRelatedMessage={errors.workforceRange?.message}
        options={[
          {
            label: "De 50 à 250 inclus",
            nativeInputProps: {
              ...register("workforceRange"),
              value: CompanyWorkforceRange.Enum.FROM_50_TO_250,
            },
          },
          {
            label: "De 251 à 999 inclus",
            nativeInputProps: {
              ...register("workforceRange"),
              value: CompanyWorkforceRange.Enum.FROM_251_TO_999,
            },
          },
          {
            label: "De 1000 à plus",
            nativeInputProps: {
              ...register("workforceRange"),
              value: CompanyWorkforceRange.Enum.FROM_1000_TO_MORE,
            },
          },
        ]}
      />
      <Alert
        small
        severity="info"
        description={
          <>
            Pour la tranche d'effectifs assujettis, l’entreprise ou l’unité économique et sociale (UES) doit définir son
            assujettissement chaque année à la date de l’obligation de publication de l’index, soit le 1er mars. Le
            calcul des effectifs assujettis de l’entreprise ou de l’unité économique et sociale (UES) est celui prévu
            aux articles{" "}
            <Link
              href="https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000006900783/2008-05-01#:~:text=2%C2%B0%20Les%20salari%C3%A9s%20titulaires,l'entreprise%20%C3%A0%20due%20proportion"
              target="_blank"
            >
              L.1111-2
            </Link>{" "}
            et{" "}
            <Link
              href="https://www.legifrance.gouv.fr/codes/section_lc/LEGITEXT000006072050/LEGISCTA000006177833/#:~:text=3%C2%B0%20Les%20salari%C3%A9s%20%C3%A0,la%20dur%C3%A9e%20conventionnelle%20du%20travail."
              target="_blank"
            >
              L.1111-3
            </Link>{" "}
            du code du travail.
          </>
        }
      />
      <p className={fr.cx("fr-mt-4w")}>
        L'effectif des salariés à prendre en compte pour le calcul des indicateurs et de l'index est apprécié en
        effectif physique sur la période de référence annuelle choisie par l’employeur.
      </p>
      <p>
        Sont obligatoirement exclus de ce périmètre : les apprentis, les titulaires d’un contrat de
        professionnalisation, les salariés mis à la disposition de l’entreprise par une entreprise extérieure (dont les
        intérimaires), les salariés expatriés, ainsi que les salariés absents plus de la moitié de la période de
        référence annuelle considérée (sauf pour le calcul de l’indicateur relatif au retour de congé maternité).
      </p>

      <ClientAnimate>
        {session?.user.staff && (
          <Button
            iconId="fr-icon-github-line"
            type="button"
            size="small"
            onClick={setRandomValues}
            priority="tertiary no outline"
          >
            Staff : Remplir avec des valeurs aléatoires
          </Button>
        )}
        <AlternativeTable
          header={[
            {
              label: "Catégorie socioprofessionnelle",
              informations:
                "Les caractéristiques individuelles (CSP, âge) sont appréciées au dernier jour de la période de référence ou au dernier jour de présence du salarié dans l’entreprise.",
            },
            {
              label: "Tranche d’âge",
              informations:
                "Les caractéristiques individuelles (CSP, âge) sont appréciées au dernier jour de la période de référence ou au dernier jour de présence du salarié dans l’entreprise.",
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
          ]}
          body={categories.map((category, categoryIndex) => ({
            categoryLabel: CSP.Label[category],
            subRows: ageRanges.map<AlternativeTableProps.SubRow>(ageRange => ({
              label: (
                <>
                  <input type="hidden" value={category} {...register(`csp.${categoryIndex}.name`)} />
                  {CSPAgeRange.Label[ageRange]}
                </>
              ),
              cols: [
                {
                  label: `${category}, ${ageRange}, femmes`,
                  nativeInputProps: {
                    ...register(`csp.${categoryIndex}.ageRange.${ageRange}.women`, {
                      setValueAs: (value: string) => parseInt(value, 10) || 0,
                      onBlur: updateTotal,
                    }),
                    type: "number",
                    min: 0,
                  },
                  state: errors.csp?.[categoryIndex]?.ageRange?.[ageRange]?.women && "error",
                  stateRelatedMessage: errors.csp?.[categoryIndex]?.ageRange?.[ageRange]?.women?.message,
                },
                {
                  label: `${category}, ${ageRange}, hommes`,
                  nativeInputProps: {
                    ...register(`csp.${categoryIndex}.ageRange.${ageRange}.men`, {
                      setValueAs: (value: string) => parseInt(value, 10) || 0,
                      onBlur: updateTotal,
                    }),
                    type: "number",
                    min: 0,
                  },
                  state: errors.csp?.[categoryIndex]?.ageRange?.[ageRange]?.men && "error",
                  stateRelatedMessage: errors.csp?.[categoryIndex]?.ageRange?.[ageRange]?.men?.message,
                },
              ],
            })) as [AlternativeTableProps.SubRow, ...AlternativeTableProps.SubRow[]],
          }))}
          footer={[
            {
              label: "Ensemble des salariés",
              data: totalWomen + totalMen,
              colspan: 2,
            },
            {
              label: `Femme`,
              data: totalWomen,
            },
            {
              label: `Homme`,
              data: totalMen,
            },
          ]}
        />
      </ClientAnimate>

      <BackNextButtonsGroup
        backProps={{
          linkProps: {
            href: "/index-egapro_/simulateur/commencer",
          },
        }}
        nextDisabled={!isValid}
      />
    </form>
  );
};
