import { Text, View } from "@react-pdf/renderer";

import { styles } from "../pdfStyles";
import type { DeclarationPdfData } from "../types";
import { PayGapTable } from "./PayGapTable";

export function VariablePaySection({ data }: { data: DeclarationPdfData }) {
	return (
		<>
			<PayGapTable
				rows={data.step3Data.rows}
				title="Écart de rémunération variable ou complémentaire"
			/>
			{data.step3Data.rows.length > 0 && (
				<View style={styles.proportionRow}>
					<View style={styles.proportionItem}>
						<Text style={styles.proportionLabel}>
							Proportion de bénéficiaires — Femmes
						</Text>
						<Text style={styles.proportionValue}>
							{data.step3Data.beneficiaryWomen
								? `${data.step3Data.beneficiaryWomen} %`
								: "-"}
						</Text>
					</View>
					<View style={styles.proportionItem}>
						<Text style={styles.proportionLabel}>
							Proportion de bénéficiaires — Hommes
						</Text>
						<Text style={styles.proportionValue}>
							{data.step3Data.beneficiaryMen
								? `${data.step3Data.beneficiaryMen} %`
								: "-"}
						</Text>
					</View>
				</View>
			)}
		</>
	);
}
