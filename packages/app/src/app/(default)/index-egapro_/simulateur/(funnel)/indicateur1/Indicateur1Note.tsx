import { type IndicateurUnComputer } from "@common/core-domain/computers/IndicateurUnComputer";
import { type Any } from "@common/utils/types";
import { IndicatorNote } from "@design-system";
import { useFormContext } from "react-hook-form";

interface Props {
  computer: IndicateurUnComputer<Any, Any>;
}

export const Indicateur1Note = ({ computer }: Props) => {
  const {
    formState: { isValid },
  } = useFormContext();

  const computed = computer.canCompute() ? computer.compute() : null;
  const advantageText = (() => {
    if (!computed) return "";
    if (computed.genderAdvantage === "equality") {
      return "Les femmes et les hommes sont à égalité";
    }
    let text = "Écart de rémunération ";
    if (computed.note === 40) {
      text += "constaté ";
    }
    text += `en faveur des ${computed.genderAdvantage === "women" ? "femmes" : "hommes"}`;

    return text;
  })();

  return (
    <IndicatorNote
      note={isValid && computed ? computed.note : "-"}
      max={40}
      text="Nombre de points obtenus à l'indicateur"
      legend={isValid ? advantageText : "Veuillez remplir le reste des rémunérations pour avoir votre note"}
    />
  );
};
