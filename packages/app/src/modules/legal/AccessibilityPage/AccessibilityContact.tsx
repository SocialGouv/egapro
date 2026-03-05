import { NewTabNotice } from "~/modules/layout";

/** Feedback, contact, and recourse information. */
export function AccessibilityContact() {
	return (
		<>
			<h2 className="fr-h4">Retour d'information et contact</h2>
			<p>
				Si vous n'arrivez pas à accéder à un contenu ou à un service, vous
				pouvez contacter le responsable du site pour être orienté vers une
				alternative accessible ou obtenir le contenu sous une autre forme.
			</p>
			<p>
				Contactez-nous à :{" "}
				<a href="mailto:index@travail.gouv.fr">index@travail.gouv.fr</a>
			</p>

			<h2 className="fr-h4">Voie de recours</h2>
			<p>
				Cette procédure est à utiliser dans le cas suivant : vous avez signalé
				au responsable du site un défaut d'accessibilité qui vous empêche
				d'accéder à un contenu ou à un des services du portail et vous n'avez
				pas obtenu de réponse satisfaisante.
			</p>
			<p>Vous pouvez :</p>
			<ul>
				<li>
					Écrire un message au{" "}
					<a
						href="https://formulaire.defenseurdesdroits.fr/"
						rel="noopener noreferrer"
						target="_blank"
					>
						Défenseur des droits
						<NewTabNotice />
					</a>
				</li>
				<li>
					Contacter le délégué du{" "}
					<a
						href="https://www.defenseurdesdroits.fr/saisir/delegues"
						rel="noopener noreferrer"
						target="_blank"
					>
						Défenseur des droits dans votre région
						<NewTabNotice />
					</a>
				</li>
				<li>
					Envoyer un courrier par la poste (gratuit, ne pas mettre de timbre) à
					l'adresse suivante : Défenseur des droits, Libre réponse 71120, 75342
					Paris CEDEX 07
				</li>
			</ul>
		</>
	);
}
