import {
  type IndicateurQuatreComputer,
  type MaternityLeaves,
} from "@common/core-domain/computers/IndicateurQuatreComputer";
import { IndicatorNote } from "@design-system";
import { last } from "lodash";

interface Props {
  computer: IndicateurQuatreComputer;
  count: MaternityLeaves | undefined;
  isValid: boolean;
  noBorder?: boolean;
}

export const Indicateur4Note = ({ computer, isValid, count, noBorder }: Props) => {
  const NOTE_MAX = last(computer.NOTE_TABLE);
  const canCompute = computer.canCompute();
  const computed = computer.compute();

  if (count?.total === 0 && isValid)
    return (
      <IndicatorNote
        noBorder={noBorder}
        note="NC"
        legend="Il n’y a pas eu d’augmentations salariales pendant la durée du ou des congés maternité (ou d'adoption),"
        text="L'indicateur n'est pas calculable"
      />
    );
  return (
    <IndicatorNote
      noBorder={noBorder}
      note={computed.note ?? "-"}
      max={NOTE_MAX}
      text="Nombre de point obtenus à l'indicateur retour de congé maternité"
      legend={
        (!isValid || !canCompute) &&
        "Veuillez renseigner les champs obligatoires pour obtenir le nombre de points à l'indicateur."
      }
    />
  );
};
