import { fr } from "@codegouvfr/react-dsfr";
import Alert from "@codegouvfr/react-dsfr/Alert";
import ButtonsGroup from "@codegouvfr/react-dsfr/ButtonsGroup";
import { type IndicateurUnComputer } from "@common/core-domain/computers/IndicateurUnComputer";
import {
  ageRanges,
  categories,
  type ExternalRemunerations,
  flattenRemunerations,
} from "@common/core-domain/computers/utils";
import { CSP } from "@common/core-domain/domain/valueObjects/CSP";
import { AgeRange } from "@common/core-domain/domain/valueObjects/declaration/AgeRange";
import { type createSteps } from "@common/core-domain/dtos/CreateSimulationDTO";
import { Object } from "@common/utils/overload";
import { ERROR_TOOLTIP_ID } from "@components/utils/TooltipWrapper";
import { AlternativeTable, type AlternativeTableProps, CenteredContainer } from "@design-system";
import { useFormContext } from "react-hook-form";
import { Tooltip } from "react-tooltip";
import { type z } from "zod";

import { useSimuFunnelStore, useSimuFunnelStoreHasHydrated } from "../useSimuFunnelStore";
import { getCspRemuWithCount } from "../utils";
import { Indicateur1Note } from "./Indicateur1Note";
import { getCommonBodyColumns, getCommonFooter, getCommonHeader } from "./tableUtil";

type Indic1FormType = z.infer<typeof createSteps.indicateur1>;

interface CSPModeTableProps {
  computer: IndicateurUnComputer;
  staff?: boolean;
}

export const CSPModeTable = ({ computer, staff }: CSPModeTableProps) => {
  const funnel = useSimuFunnelStore(state => state.funnel);
  const hydrated = useSimuFunnelStoreHasHydrated();

  const {
    register,
    formState: { errors, isValid },
    watch,
    setValue,
    trigger,
  } = useFormContext<Indic1FormType>();

  if (!hydrated || !funnel?.effectifs) {
    return null;
  }

  const countOnly = getCspRemuWithCount(funnel.effectifs.csp, []);
  computer.setInput(flattenRemunerations(countOnly));
  const canCompute = computer.canCompute();
  if (!canCompute) {
    return (
      <CenteredContainer fluid>
        <Alert
          className="fr-mb-3w"
          severity="info"
          title="L'indicateur n'est pas calculable par CSP"
          description="L’ensemble des groupes valides (c’est-à-dire comptant au moins 3 femmes et 3 hommes), représentent moins de 40% des effectifs."
        />
      </CenteredContainer>
    );
  }

  const remunerations = watch("remunerations") as ExternalRemunerations;
  computer.setInput(flattenRemunerations(getCspRemuWithCount(funnel.effectifs.csp, remunerations)));

  computer.compute();

  const pasteFromExcel = () => {
    if (!funnel.effectifs) return;
    const paste = window.prompt("Copiez les colonnes Femmes et Hommes des salaires depuis Excel (sans les en-têtes)");
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
    for (let categoryIndex = 0; categoryIndex < categories.length; categoryIndex++) {
      const category = categories[categoryIndex];
      for (const ageRange of ageRanges) {
        if (
          (funnel.effectifs.csp[category].ageRanges[ageRange].women || 0) < 3 ||
          (funnel.effectifs.csp[category].ageRanges[ageRange].men || 0) < 3
        ) {
          continue;
        }
        const [womenSalary, menSalary] = lines[lineIndex];
        setValue(`remunerations.${categoryIndex}.category.${ageRange}.womenSalary`, +womenSalary as never);
        setValue(`remunerations.${categoryIndex}.category.${ageRange}.menSalary`, +menSalary as never);
        lineIndex++;
      }
    }
    trigger("remunerations");
  };

  return (
    <>
      {staff && (
        <ButtonsGroup
          buttonsEquisized
          buttonsSize="small"
          inlineLayoutWhen="sm and up"
          buttons={[
            {
              type: "button",
              priority: "tertiary no outline",
              onClick: pasteFromExcel,
              iconId: "fr-icon-clipboard-line",
              children: "Staff : Coller les salaires depuis Excel",
              className: fr.cx("fr-mb-md-0"),
            },
          ]}
        />
      )}
      <AlternativeTable
        header={getCommonHeader({ firstColumnLabel: "Catégorie socio-professionnelle" })}
        body={categories.map((categoryName, categoryIndex) => {
          const categoryId = categoryName;
          register(`remunerations.${categoryIndex}.categoryId`, { value: categoryId });
          register(`remunerations.${categoryIndex}.name`, { value: categoryName });

          return {
            categoryLabel: CSP.Label[categoryName],
            ...(() => {
              const effectifsCspCategory = funnel?.effectifs?.csp[categoryName];
              if (!effectifsCspCategory) {
                return {
                  mergedLabel: "Pas de données",
                };
              }

              const totalCategory = [...Object.values(effectifsCspCategory.ageRanges)].reduce(
                (acc, ageRange) => acc + (ageRange.women || 0) + (ageRange.men || 0),
                0,
              );

              if (!totalCategory) {
                return {
                  mergedLabel: "Aucun effectif pris en compte renseigné",
                };
              }

              return {
                subRows: ageRanges.map<AlternativeTableProps.SubRow>(ageRange => ({
                  label: AgeRange.Label[ageRange],
                  ...(() => {
                    const csp = funnel!.effectifs!.csp[categoryName].ageRanges[ageRange];

                    return getCommonBodyColumns({
                      ageRange,
                      categoryId,
                      categoryIndex,
                      categoryName,
                      computer,
                      errors,
                      register,
                      firstCols: [csp.women || "-", csp.men || "-"],
                      menCount: csp.men || 0,
                      womenCount: csp.women || 0,
                    });
                  })(),
                })) as [AlternativeTableProps.SubRow, ...AlternativeTableProps.SubRow[]],
              };
            })(),
          };
        })}
        footer={getCommonFooter({
          computer,
          effectifsCsp: funnel.effectifs.csp,
        })}
      />

      <CenteredContainer fluid py="1w">
        <Indicateur1Note computer={computer} isValid={isValid} />
      </CenteredContainer>

      <Tooltip id={ERROR_TOOLTIP_ID} disableStyleInjection="core" />
    </>
  );
};
