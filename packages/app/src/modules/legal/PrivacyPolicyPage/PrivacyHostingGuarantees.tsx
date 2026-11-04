import { NewTabNotice } from "~/modules/layout";

export const HOSTING_GUARANTEES_ID = "garanties-hebergeur";

export function PrivacyHostingGuarantees() {
	return (
		<>
			<h3 className="fr-h6" id={HOSTING_GUARANTEES_ID}>
				Garanties apportées par OVH, notre hébergeur
			</h3>
			<p>
				L'accord de protection des données d'OVH (version 6.0) engage
				l'hébergeur, en tant que sous-traitant, à :
			</p>
			<ul>
				<li>
					traiter les données uniquement dans la mesure nécessaire à
					l'hébergement du service, sans y accéder ni les utiliser à d'autres
					fins ;
				</li>
				<li>
					soumettre ses employés autorisés à traiter les données à une
					obligation de confidentialité et les former à la protection des
					données personnelles ;
				</li>
				<li>
					appliquer des mesures de sécurité techniques et organisationnelles :
					sécurité physique des centres de données, contrôle des identités et
					des accès selon le principe du moindre privilège, isolement des
					clients les uns des autres et suivi des actions effectuées sur son
					système d'information ;
				</li>
				<li>
					ne pas modifier sans notre accord la localisation des centres de
					données choisie à la commande ;
				</li>
				<li>
					limiter aux seules données requises toute communication demandée par
					une autorité, et s'opposer aux demandes d'autorités de pays extérieurs
					à l'Union européenne, sauf dans les cas prévus par l'accord (accord
					international, article 49 du RGPD) ;
				</li>
				<li>
					nous informer dans les meilleurs délais de toute violation de données,
					en décrivant sa nature, ses conséquences probables et les mesures
					prises ;
				</li>
				<li>
					imposer les mêmes obligations à ses propres sous-traitants, en restant
					responsable de leur respect, et nous prévenir à l'avance de tout
					changement de sous-traitant ;
				</li>
				<li>
					supprimer les données hébergées à la fin du service, sauf obligation
					légale contraire ;
				</li>
				<li>
					mettre à notre disposition les informations nécessaires pour démontrer
					sa conformité au RGPD et mener des audits.
				</li>
			</ul>
			<p>
				Le texte intégral de l'accord est un document de l'hébergeur, publié au
				format PDF non accessible :{" "}
				<a
					href="https://storage.gra.cloud.ovh.net/v1/AUTH_325716a587c64897acbef9a4a4726e38/contracts/9e74492-OVH_Data_Protection_Agreement-FR-6.0.pdf"
					rel="noopener noreferrer"
					target="_blank"
				>
					Accord de protection des données d'OVH (PDF, 460 Ko, 41 pages)
					<NewTabNotice />
				</a>
				.
			</p>
		</>
	);
}
