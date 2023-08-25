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

  if (count?.total === 0)
    return (
      <IndicatorNote
        noBorder={noBorder}
        note="NC"
        max={NOTE_MAX}
        text="L'indicateur retour de congé maternité est non calculable car il n’y a pas eu d’augmentations salariales pendant la durée du ou des congés maternité."
      />
    );
  return (
    <IndicatorNote
      noBorder={noBorder}
      note={computed.note ?? "-"}
      max={NOTE_MAX}
      text="Nombre de point obtenus à l'indicateur retour de congé maternité"
      legend={
        isValid && canCompute
          ? computed.note === NOTE_MAX
            ? "Tous les points sont accordés."
            : "Aucun point n'est accordé."
          : "Veuillez remplir les champs obligatoires pour obtenir une note."
      }
    />
  );
};
