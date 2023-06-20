import Input from "@codegouvfr/react-dsfr/Input";
import { AlternativeTableCell, AlternativeTableRow } from "@design-system";

export type StaffingSubRowProps = {
  errorMessage?: string;
  isError?: boolean;
  label: string;
};
const StaffingSubRow = ({ label, isError, errorMessage }: StaffingSubRowProps) => (
  <>
    <AlternativeTableCell as="th" scope="row">
      {label}
    </AlternativeTableCell>
    <AlternativeTableCell>
      <Input
        label="Nombre de femmes"
        hideLabel
        state={isError ? "error" : undefined}
        stateRelatedMessage={errorMessage}
        classes={{ message: "fr-sr-only" }}
      />
    </AlternativeTableCell>
    <AlternativeTableCell>
      <Input
        label="Nombre d'hommes"
        hideLabel
        state={isError ? "error" : undefined}
        stateRelatedMessage={errorMessage}
        classes={{ message: "fr-sr-only" }}
      />
    </AlternativeTableCell>
  </>
);

export type RowStaffingTableProps = {
  category?: string;
};

export const RowStaffingTable = ({ category }: RowStaffingTableProps) => (
  <>
    <AlternativeTableRow>
      <AlternativeTableCell as="th" rowSpan={4} scope="rowgroup">
        {category}
      </AlternativeTableCell>
      <StaffingSubRow label="Moins de 30 ans" />
    </AlternativeTableRow>
    <AlternativeTableRow>
      <StaffingSubRow label="De 30 à 39 ans" />
    </AlternativeTableRow>
    <AlternativeTableRow>
      <StaffingSubRow label="De 40 à 49 ans" />
    </AlternativeTableRow>
    <AlternativeTableRow>
      <StaffingSubRow label="50 ans et plus" />
    </AlternativeTableRow>
  </>
);
