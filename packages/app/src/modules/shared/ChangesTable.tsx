import { DsfrTable } from "./DsfrTable";

export type ChangeRow = {
	field: string;
	label: string;
	previous: string;
	next: string;
};

type Props = {
	changes: ChangeRow[];
};

export function ChangesTable({ changes }: Props) {
	return (
		<DsfrTable
			caption="Modifications à confirmer"
			className="fr-table--bordered fr-mb-2w"
		>
			<thead>
				<tr>
					<th scope="col">Information</th>
					<th scope="col">Valeur actuelle</th>
					<th scope="col">Nouvelle valeur</th>
				</tr>
			</thead>
			<tbody>
				{changes.map((change) => (
					<tr key={change.field}>
						<th scope="row">{change.label}</th>
						<td>{change.previous}</td>
						<td>{change.next}</td>
					</tr>
				))}
			</tbody>
		</DsfrTable>
	);
}
