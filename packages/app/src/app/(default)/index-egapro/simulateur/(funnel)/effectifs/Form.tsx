"use client";

import { fr } from "@codegouvfr/react-dsfr";
import Alert from "@codegouvfr/react-dsfr/Alert";
import ButtonsGroup from "@codegouvfr/react-dsfr/ButtonsGroup";
import RadioButtons from "@codegouvfr/react-dsfr/RadioButtons";
import { ageRanges, categories } from "@common/core-domain/computers/utils";
import { CSP } from "@common/core-domain/domain/valueObjects/CSP";
import { AgeRange } from "@common/core-domain/domain/valueObjects/declaration/AgeRange";
import { CompanyWorkforceRange } from "@common/core-domain/domain/valueObjects/declaration/CompanyWorkforceRange";
import { createSteps } from "@common/core-domain/dtos/CreateSimulationDTO";
import { deleteEmptyStringOnPaste, setValueAsFloatOrEmptyString } from "@common/utils/form";
import { type Any } from "@common/utils/types";
import { storePicker } from "@common/utils/zustand";
import { AlternativeTable, type AlternativeTableProps, BackNextButtonsGroup, Link } from "@design-system";
import { ClientAnimate } from "@design-system/utils/client/ClientAnimate";
import { zodResolver } from "@hookform/resolvers/zod";
import { isEqual } from "lodash";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useEffect } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { type z } from "zod";

import { NAVIGATION, simulateurPath } from "../navigation";
import { useSimuFunnelStore } from "../useSimuFunnelStore";

type EffectifsFormType = z.infer<typeof createSteps.effectifs>;

const effectifsNav = NAVIGATION.effectifs;

let miniComputerCache: { total: number; totalMen: number; totalWomen: number };

const lastCspMiniComputer = {} as EffectifsFormType["csp"];

const miniComputer = (csp: EffectifsFormType["csp"]) => {
  if (isEqual(csp, lastCspMiniComputer) && miniComputerCache) {
    return miniComputerCache;
  }

  const totalWomen = categories.reduce((acc, category) => {
    return (
      acc +
      ageRanges.reduce((acc, ageRange) => {
        return acc + (csp?.[category].ageRanges[ageRange].women || 0);
      }, 0)
    );
  }, 0);

  const totalMen = categories.reduce((acc, category) => {
    return (
      acc +
      ageRanges.reduce((acc, ageRange) => {
        return acc + (csp?.[category].ageRanges[ageRange].men || 0);
      }, 0)
    );
  }, 0);

  const total = totalMen + totalWomen;

  return (miniComputerCache = {
    total,
    totalWomen,
    totalMen,
  });
};

const useStore = storePicker(useSimuFunnelStore);

export const EffectifsForm = () => {
  const router = useRouter();
  const { data: session } = useSession();
  const [funnel, saveFunnel, resetFunnel, setSelectedCompanyWorkforceRange] = useStore(
    "funnel",
    "saveFunnel",
    "resetFunnel",
    "setSelectedCompanyWorkforceRange",
  );

  useEffect(() => {
    // updateTotal();
    if (funnel?.effectifs?.workforceRange) {
      setSelectedCompanyWorkforceRange(funnel.effectifs.workforceRange);
    }
  }, []);

  const methods = useForm<EffectifsFormType>({
    mode: "onChange",
    resolver: zodResolver(createSteps.effectifs),
    defaultValues: funnel?.effectifs,
  });

  const {
    formState: { isValid, errors },
    handleSubmit,
    register,
    setValue,
    trigger,
    watch,
  } = methods;

  const { total, totalMen, totalWomen } = miniComputer(watch("csp"));

  const onSubmit = (form: EffectifsFormType) => {
    if (!total) {
      return;
    }

    if (!isEqual(form, funnel?.effectifs)) {
      resetFunnel();
      saveFunnel({ effectifs: form as Any });
    }
    router.push(simulateurPath(effectifsNav.next()));
  };

  const setRandomValues = () => {
    for (const category of categories) {
      for (const ageRange of ageRanges) {
        setValue(`csp.${category}.ageRanges.${ageRange}.women`, Math.floor(Math.random() * 100) as never);
        setValue(`csp.${category}.ageRanges.${ageRange}.men`, Math.floor(Math.random() * 100) as never);
      }
    }
  };

  const resetCSP = () => {
    for (const category of categories) {
      for (const ageRange of ageRanges) {
        setValue(`csp.${category}.ageRanges.${ageRange}.women`, 0 as never);
        setValue(`csp.${category}.ageRanges.${ageRange}.men`, 0 as never);
      }
    }
  };

  const pasteFromExcel = () => {
    const paste = window.prompt(
      `Copiez les colonnes Femmes et Hommes des effectifs depuis Excel (valeurs "0" incluses et sans les en-têtes)`,
    );
    if (!paste) {
      return;
    }

    const tab = "	";
    const lines = paste
      .replace("\r\n", "\n")
      .split("\n")
      .filter(line => line.trim())
      .map(line => line.split(tab).map(cell => cell.trim().replace(/\s/gi, "")));

    let lineIndex = 0;
    for (const category of categories) {
      for (const ageRange of ageRanges) {
        const [womenSalary, menSalary] = lines[lineIndex];
        setValue(`csp.${category}.ageRanges.${ageRange}.women`, womenSalary as never);
        setValue(`csp.${category}.ageRanges.${ageRange}.men`, menSalary as never);
        lineIndex++;
      }
    }
    trigger("csp");
  };

  return (
    <FormProvider {...methods}>
      <form noValidate onSubmit={handleSubmit(onSubmit)}>
        <p className="fr-text--xs">Les champs suivis d'une * sont obligatoires</p>

        <h3>Effectifs assujettis</h3>
        <Alert
          small
          className={fr.cx("fr-mb-4w")}
          severity="info"
          title="Aide"
          description={
            <>
              L’entreprise ou l’unité économique et sociale (UES) doit définir son assujettissement chaque année à la
              date de l’obligation de publication de l’index, soit le 1er mars. Le calcul des effectifs assujettis est
              celui prévu aux articles{" "}
              <Link href="https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000019353569" target="_blank">
                L.1111-2
              </Link>{" "}
              et{" "}
              <Link href="https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000031565369" target="_blank">
                L.1111-3
              </Link>{" "}
              du code du travail. <br />
              Pour en savoir plus,{" "}
              <Link href="/aide-index#champ-d-application-entree-en-vigueur" target="_blank">
                cliquez ici
              </Link>
            </>
          }
        />
        <RadioButtons
          legend="Quelle est la tranche d'effectifs assujettis de l'entreprise ou de l'unité économique et sociale (UES) ? *"
          state={errors.workforceRange && "error"}
          stateRelatedMessage={errors.workforceRange?.message}
          options={[
            CompanyWorkforceRange.Enum.FROM_50_TO_250,
            CompanyWorkforceRange.Enum.FROM_251_TO_999,
            CompanyWorkforceRange.Enum.FROM_1000_TO_MORE,
          ].map(workforceRange => ({
            label: CompanyWorkforceRange.Label[workforceRange],
            nativeInputProps: {
              ...register("workforceRange", {
                onChange(evt) {
                  setSelectedCompanyWorkforceRange(evt.target.value);
                },
              }),
              value: workforceRange,
              "data-cy": `workforceRange.${workforceRange}`,
            },
          }))}
        />

        <h3>Effectifs pris en compte</h3>
        <Alert
          small
          title="Aide"
          severity="info"
          description={
            <>
              L'effectif des salariés à prendre en compte pour le calcul des indicateurs est apprécié en effectif
              physique sur la période de référence annuelle considérée.
              <br />
              Ne sont pas pris en compte dans l'effectif : les apprentis et les contrats de professionnalisation, les
              salariés mis à la disposition de l’entreprise par une entreprise extérieure (dont les intérimaires), les
              expatriés, les salariés en pré-retraite, les salariés absents plus de 6 mois sur la période de référence.
              <br />
              Pour en savoir plus,{" "}
              <Link href="/aide-index#effectifs-pris-en-compte" target="_blank">
                cliquez ici
              </Link>
            </>
          }
        />

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
                  iconId: "fr-icon-refresh-line",
                  className: fr.cx("fr-mb-md-0"),
                  type: "button",
                },
                {
                  children: "Staff : Coller depuis Excel",
                  onClick: pasteFromExcel,
                  priority: "tertiary no outline",
                  iconId: "fr-icon-clipboard-line",
                  className: fr.cx("fr-mb-md-0"),
                  type: "button",
                },
              ]}
            />
          )}
          <AlternativeTable
            withTooltip
            header={[
              {
                label: "Catégorie socio-professionnelle",
                informations:
                  "Les caractéristiques individuelles (catégorie socio-professionnelle, âge) sont appréciées au dernier jour de la période de référence annuelle considérée ou au dernier jour de présence du salarié dans l’entreprise.",
              },
              {
                label: "Tranche d’âge",
                informations:
                  "Les caractéristiques individuelles (catégorie socio-professionnelle, âge) sont appréciées au dernier jour de la période de référence annuelle considérée ou au dernier jour de présence du salarié dans l’entreprise.",
              },
              {
                label: "Nombre de salariés (en effectif physique)*",
                subCols: [
                  {
                    label: "Femmes",
                  },
                  {
                    label: "Hommes",
                  },
                ],
                informations: (
                  <>
                    <p>
                      L’effectif des salariés à prendre en compte pour le calcul des indicateurs est apprécié en{" "}
                      <strong>effectif physique</strong> sur la période de référence annuelle considérée.
                    </p>
                    <p className={fr.cx("fr-mb-0")}>
                      <strong>Ne sont pas pris en compte dans l'effectif&nbsp;:</strong>
                    </p>
                    <ul>
                      <li>les apprentis</li>
                      <li>les titulaires d'un contrat de professionnalisation</li>
                      <li>
                        les salariés mis à la disposition de l’entreprise par une entreprise extérieure (dont les
                        intérimaires)
                      </li>
                      <li>les expatriés</li>
                      <li>les salariés en pré-retraite</li>
                      <li>
                        les salariés absents plus de 6 mois sur la période de référence (arrêt maladie, congés sans
                        solde, CDD inférieur à 6 mois etc.).
                      </li>
                    </ul>
                  </>
                ),
              },
            ]}
            body={categories.map(category => ({
              categoryLabel: CSP.Label[category],
              subRows: ageRanges.map<AlternativeTableProps.SubRow>(ageRange => ({
                label: AgeRange.Label[ageRange],
                cols: [
                  {
                    label: `${category}, ${ageRange}, femmes`,
                    nativeInputProps: {
                      onPaste: deleteEmptyStringOnPaste,
                      ...register(`csp.${category}.ageRanges.${ageRange}.women`, {
                        setValueAs: setValueAsFloatOrEmptyString,
                      }),
                      id: `csp.${category}.ageRanges.${ageRange}.women`,
                      type: "number",
                      min: 0,
                    },
                    state: errors.csp?.[category]?.ageRanges?.[ageRange]?.women && "error",
                    stateRelatedMessage: errors.csp?.[category]?.ageRanges?.[ageRange]?.women?.message,
                  },
                  {
                    label: `${category}, ${ageRange}, hommes`,
                    nativeInputProps: {
                      onPaste: deleteEmptyStringOnPaste,
                      ...register(`csp.${category}.ageRanges.${ageRange}.men`, {
                        setValueAs: setValueAsFloatOrEmptyString,
                      }),
                      id: `csp.${category}.ageRanges.${ageRange}.men`,
                      type: "number",
                      min: 0,
                    },
                    state: errors.csp?.[category]?.ageRanges?.[ageRange]?.men && "error",
                    stateRelatedMessage: errors.csp?.[category]?.ageRanges?.[ageRange]?.men?.message,
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
                label: `Femmes`,
                data: totalWomen,
              },
              {
                label: `Hommes`,
                data: totalMen,
              },
            ]}
          />
        </ClientAnimate>

        <BackNextButtonsGroup
          backProps={{
            linkProps: {
              href: simulateurPath(effectifsNav.prev()),
            },
          }}
          nextProps={{
            id: "simu-workforce-next",
          }}
          nextDisabled={!isValid || !total}
        />
      </form>
    </FormProvider>
  );
};
