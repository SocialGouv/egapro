"use client";

import { fr } from "@codegouvfr/react-dsfr";
import Alert from "@codegouvfr/react-dsfr/Alert";
import ButtonsGroup from "@codegouvfr/react-dsfr/ButtonsGroup";
import RadioButtons from "@codegouvfr/react-dsfr/RadioButtons";
import { CSP } from "@common/core-domain/domain/valueObjects/CSP";
import { CompanyWorkforceRange } from "@common/core-domain/domain/valueObjects/declaration/CompanyWorkforceRange";
import { CSPAgeRange } from "@common/core-domain/domain/valueObjects/declaration/simulation/CSPAgeRange";
import { ageRanges, categories, createSteps } from "@common/core-domain/dtos/CreateSimulationDTO";
import { storePicker } from "@common/utils/zustand";
import { AlternativeTable, type AlternativeTableProps, BackNextButtonsGroup, Link } from "@design-system";
import { ClientAnimate } from "@design-system/utils/client/ClientAnimate";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { type z } from "zod";

import { useSimuFunnelStore } from "../useSimuFunnelStore";

type EffectifsFormType = z.infer<typeof createSteps.effectifs>;

const useStore = storePicker(useSimuFunnelStore);
export const EffectifsForm = () => {
  const router = useRouter();
  const { data: session } = useSession();
  const [funnel, saveFunnel, resetFunnel] = useStore("funnel", "saveFunnel", "resetFunnel");
  const [totalWomen, setTotalWomen] = useState(0);
  const [totalMen, setTotalMen] = useState(0);

  useEffect(() => {
    updateTotal();
  }, []);

  const {
    formState: { isValid, errors },
    handleSubmit,
    register,
    getValues,
    setValue,
  } = useForm<EffectifsFormType>({
    mode: "onChange",
    resolver: zodResolver(createSteps.effectifs),
    defaultValues: funnel?.effectifs,
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

  const total = totalMen + totalWomen;
  const onSubmit = (form: EffectifsFormType) => {
    if (!total) {
      return;
    }

    resetFunnel();
    saveFunnel({ effectifs: form });
    router.push("/index-egapro_/simulateur/indicateur-1");
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

  const resetCSP = () => {
    for (let categoryIndex = 0; categoryIndex < categories.length; categoryIndex++) {
      for (const ageRange of ageRanges) {
        setValue(`csp.${categoryIndex}.ageRange.${ageRange}.women`, 0 as never);
        setValue(`csp.${categoryIndex}.ageRange.${ageRange}.men`, 0 as never);
      }
    }
    setTotalWomen(0);
    setTotalMen(0);
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
          <ButtonsGroup
            buttonsEquisized
            buttonsSize="small"
            inlineLayoutWhen="sm and up"
            buttons={[
              {
                children: "Staff : Remettre à zéro",
                onClick: resetCSP,
                priority: "tertiary no outline",
                iconId: "fr-icon-delete-fill",
                className: fr.cx("fr-mb-md-0"),
                type: "button",
              },
              {
                children: "Staff : Remplir avec des valeurs aléatoires",
                onClick: setRandomValues,
                priority: "tertiary no outline",
                iconId: "fr-icon-github-line",
                className: fr.cx("fr-mb-md-0"),
                type: "button",
              },
            ]}
          />
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
              data: total,
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

      {total === 0 && (
        <Alert
          small
          severity="warning"
          description="Vous devez renseigner au moins un salarié pour pouvoir continuer."
          className={fr.cx("fr-mb-4w")}
        />
      )}

      <BackNextButtonsGroup
        backProps={{
          linkProps: {
            href: "/index-egapro_/simulateur/commencer",
          },
        }}
        nextDisabled={!isValid || !total}
      />
    </form>
  );
};
