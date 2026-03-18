import { NextResponse } from "next/server";

/**
 * Mock GIP MDS API endpoint.
 * Returns sample CSV data in the same format as the real GIP API.
 * Used for development and testing until the real API is available.
 */

const MOCK_CSV = `destinataire;projet;horodatage;date_debut;date_fin;nb_lignes
DGT;DTS;2027-03-14T12:32:04;2026-01-01;2026-12-31;2
SIREN;Effectif_RCD;Effectif_H_rem_annuelle_globale;Effectif_F_rem_annuelle_globale;Effectif_H_taux_horaire_global;Effectif_F_taux_horaire_global;Effectif_H_rem_annuelle_variable;Effectif_F_rem_annuelle_variable;Rem_globale_annuelle_moyenne_ecart;Rem_globale_annuelle_moyenne_F;Rem_globale_annuelle_moyenne_H;Taux_horaire_global_moyen_ecart;Taux_horaire_global_moyen_F;Taux_horaire_global_moyen_H;Rem_variable_annuelle_moyenne_ecart;Rem_variable_annuelle_moyenne_F;Rem_variable_annuelle_moyenne_H;Taux_horaire_variable_moyen_ecart;Taux_horaire_variable_moyen_F;Taux_horaire_variable_moyen_H;Rem_globale_annuelle_médiane_ecart;Rem_globale_annuelle_médiane_F;Rem_globale_annuelle_médiane_H;Taux_horaire_global_médian_ecart;Taux_globale_annuelle_médiane_F;Taux_globale_annuelle_médiane_H;Rem_variable_annuelle_médiane_ecart;Rem_variable_annuelle_médiane_F;Rem_variable_annuelle_médiane_H;Taux_horaire_variable_médian_ecart;Taux_horaire_variable_médian_F;Taux_horaire_variable_médian_H;Proportion_variable_F;Proportion_variable_H;Seuil_Q1_Rem_globale;Seuil_Q2_Rem_globale;Seuil_Q3_Rem_globale;Seuil_Q4_Rem_globale;Quartile1_Rem_globale_annuelle_proportion_F;Quartile2_Rem_globale_annuelle_proportion_F;Quartile3_Rem_globale_annuelle_proportion_F;Quartile4_Rem_globale_annuelle_proportion_F;Quartile1_Rem_globale_annuelle_proportion_H;Quartile2_Rem_globale_annuelle_proportion_H;Quartile3_Rem_globale_annuelle_proportion_H;Quartile4_Rem_globale_annuelle_proportion_H;Seuil_Q1_Taux_horaire_global;Seuil_Q2_Taux_horaire_global;Seuil_Q3_Taux_horaire_global;Seuil_Q4_Taux_horaire_global;Quartile1_Taux_horaire_global_proportion_F;Quartile2_Taux_horaire_global_proportion_F;Quartile3_Taux_horaire_global_proportion_F;Quartile4_Taux_horaire_global_proportion_F;Quartile1_Taux_horaire_global_proportion_H;Quartile2_Taux_horaire_global_proportion_H;Quartile3_Taux_horaire_global_proportion_H;Quartile4_Taux_horaire_global_proportion_H;indice;indice_nature_exo;indice_unite;indice_ratio_suspensions;indice_suspensions_longues;indice_suspensions_sans_fin;indice_ratio_arrets;indice_arrets_longs;indice_arrets_0;indice_quotite250;indice_quotite0;indice_sup_annee_civile;indice_ratio_FP;indice_rem_extremes;indice_taux_extremes
130025265;78,55;51;41;50;41;10;11;0,0569;34648,98;36739,82;0,0717;13,21;14,23;0,005;473,93;476,29;0,207;2,72;3,43;0,0585;33648,98;35739,82;0,0771;12,21;13,23;0,0271;443,93;456,29;0,3127;2,22;3,23;26,8293;24,3902;980,99;1450,82;1750,92;2100,50;0,5366;0,5278;0,5484;0,6667;0,4634;0,4722;0,4516;0,3333;7,25;10,12;12,92;15,50;0,5349;0,5294;0,5455;0,6923;0,4651;0,4657;0,4545;0,3077;0,9;0,2;0,1;0,1;0;0,001;0,1;0,928;0,001;0,1;0,1;0,1;0,928;0,928;0,001
928474829;50;33;22;33;22;3;0;0,1661;45648,98;54739,82;0,1172;15,21;17,23;0,0109;213,93;216,29;0,2922;1,72;2,43;0,0554;35648,98;37739,82;0,0908;10,21;11,23;-0,142;543,93;476,29;0,2388;3,22;4,23;0;13,6364;1080,99;1250,82;1350,92;1800,00;0,525;0,4865;0,5333;0,7333;0,475;0,5135;0,4667;0,2667;6,25;11,12;11,92;14,80;0,4315;0,5463;0,5468;0,6918;0,5685;0,4655;0,4532;0,3082;0,9;0,25;0,15;0,66;;;0,11;;;0,12;0,1;0,15`;

export function GET() {
	return new NextResponse(MOCK_CSV, {
		headers: {
			"Content-Type": "text/csv; charset=utf-8",
		},
	});
}
