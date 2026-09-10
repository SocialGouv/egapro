import type { FaqSection } from "./types";

export const FAQ_SECTIONS: FaqSection[] = [
	{
		id: "dispositif",
		title: "Le dispositif et ses 7 indicateurs",
		subsections: [
			{
				title: "Ce que mesure le dispositif",
				items: [
					{
						question: "Sur quoi porte la déclaration ?",
						answer:
							"Sur les écarts de rémunération entre les femmes et les hommes dans votre entreprise. Le dispositif repose sur 7 indicateurs, désignés par les lettres A à G. Les six premiers sont calculés pour vous à partir de vos données de paie ; le septième, l'indicateur G, est le seul que votre entreprise calcule et saisit elle-même.",
					},
					{
						question: "Que mesure chacun des sept indicateurs ?",
						answer:
							"A : l'écart de rémunération moyenne. B : l'écart sur la rémunération variable. C : l'écart médian de rémunération. D : l'écart médian de rémunération variable. E : la proportion de bénéficiaires d'une rémunération variable, par sexe. F : la répartition des effectifs par quartile de rémunération. G : l'écart de rémunération, base et variable confondues, par catégorie d'emploi.",
					},
					{
						question: "Y a-t-il encore une note globale sur 100 ?",
						answer:
							"Non. Le dispositif actuel ne produit ni note, ni barème, ni classement. Il publie des écarts, indicateur par indicateur. Ce qui déclenche des obligations n'est pas un score insuffisant mais un écart qui dépasse le seuil d'alerte de l'indicateur G.",
					},
				],
			},
			{
				title: "Qui doit déclarer",
				items: [
					{
						question: "Mon entreprise est-elle tenue de déclarer ?",
						answer:
							"En dessous de 50 salariés, la déclaration est volontaire. À partir de 50 salariés, elle est obligatoire et annuelle depuis la campagne 2027. Le seuil de 100 salariés ne change pas cette périodicité : il ouvre les obligations supplémentaires, avis du CSE et parcours de mise en conformité.",
					},
					{
						question:
							"Une entreprise de moins de 50 salariés qui déclare volontairement doit-elle tout remplir ?",
						answer:
							"Oui. Une déclaration volontaire porte les 7 indicateurs, indicateur G compris. Le caractère volontaire porte sur le fait de déclarer, pas sur le contenu de la déclaration.",
					},
					{
						question: "L'effectif retenu est-il celui d'aujourd'hui ?",
						answer:
							"Non, c'est l'effectif annuel moyen de l'année de référence, c'est-à-dire l'année civile précédant la campagne. Il vous est présenté dans la déclaration ; vous n'avez pas à le recalculer.",
					},
				],
			},
		],
	},
	{
		id: "donnees-preremplies",
		title: "Les données pré-remplies par le GIP-MDS",
		subsections: [
			{
				title: "D'où viennent les indicateurs A à F",
				items: [
					{
						question: "Qui calcule les indicateurs A à F ?",
						answer:
							"Le GIP-MDS les calcule à partir de vos déclarations sociales nominatives (DSN). Vous n'avez ni chiffre à saisir, ni fichier à déposer pour ces six indicateurs : ils sont déjà là quand vous ouvrez votre déclaration.",
					},
					{
						question: "Quand ces données deviennent-elles disponibles ?",
						answer:
							"Elles sont mises à disposition chaque année au mois de mars, pour l'année de référence précédente. Tant qu'elles ne sont pas publiées, la campagne n'est pas ouverte et votre déclaration ne peut pas être commencée.",
					},
					{
						question: "Puis-je consulter ces données avant de déclarer ?",
						answer:
							"Oui. Depuis Mon espace, vous pouvez télécharger un récapitulatif PDF des données pré-remplies issues de la DSN, avant même d'avoir commencé votre déclaration.",
					},
				],
			},
			{
				title: "Quand les données semblent fausses",
				items: [
					{
						question:
							"Un indicateur pré-rempli me paraît erroné. Puis-je le corriger dans Egapro ?",
						answer:
							"Non, les indicateurs A à F ne sont pas modifiables dans Egapro : ils reflètent vos DSN. Une donnée qui vous paraît fausse se corrige à la source, dans vos déclarations sociales. Signalez-le par le formulaire de contact afin que la correction soit prise en compte pour la campagne concernée.",
					},
					{
						question: "Pourquoi certains indicateurs sont-ils incalculables ?",
						answer:
							"Un indicateur est incalculable quand les effectifs concernés sont insuffisants pour produire une comparaison, par exemple lorsqu'un sexe n'est pas représenté dans un groupe. La déclaration reste due : l'indicateur est alors présenté comme non calculable, et cela ne vous pénalise pas.",
					},
				],
			},
		],
	},
	{
		id: "quartiles",
		title: "Les quartiles de rémunération",
		subsections: [
			{
				title: "Comprendre l'étape",
				items: [
					{
						question: "Qu'est-ce qu'un quartile de rémunération ?",
						answer:
							"Vos salariés sont classés par rémunération croissante puis répartis en 4 tranches d'effectif égal, appelées quartiles. Le premier quartile réunit les rémunérations les plus basses, le quatrième les plus hautes. L'indicateur F observe la part de femmes et d'hommes dans chacune de ces tranches.",
					},
					{
						question: "Que dois-je saisir à cette étape ?",
						answer:
							"Vous saisissez 3 seuils de rémunération : ceux qui séparent le premier quartile du deuxième, le deuxième du troisième, et le troisième du quatrième. Le quatrième quartile n'a pas de seuil haut, il n'y a donc rien à renseigner pour lui. La borne basse de chaque quartile est déduite automatiquement du seuil précédent.",
					},
					{
						question: "Pourquoi le quartile supérieur est-il regardé de près ?",
						answer:
							"Parce qu'il concentre les rémunérations les plus élevées et révèle le plafond de verre. La répartition y est considérée comme équilibrée tant que la part de chaque sexe y reste dans une marge de 5 % autour de la parité, soit entre 45 % et 55 %. Au-delà, le déséquilibre est signalé.",
					},
				],
			},
		],
	},
	{
		id: "indicateur-g",
		title: "L'indicateur G et les catégories d'emploi",
		subsections: [
			{
				title: "Qui doit le renseigner, et quand",
				items: [
					{
						question: "Suis-je concerné par l'indicateur G cette année ?",
						answer:
							"À partir de 250 salariés, il est dû chaque année. Entre 150 et 249 salariés, il est dû une année sur trois, en commençant par la campagne 2027 — donc 2027, 2030, 2033, et ainsi de suite. À partir de la campagne 2030, cette périodicité triennale s'étend à toutes les entreprises soumises à l'obligation, dès 50 salariés. En dessous de 50 salariés, une déclaration volontaire le comporte toujours.",
					},
					{
						question: "Comment savoir si l'année en cours est une année G ?",
						answer:
							"Vous n'avez pas à le calculer : si l'indicateur G est dû pour votre entreprise cette année, l'étape correspondante apparaît dans votre déclaration. Si elle n'apparaît pas, il n'est pas attendu de vous cette année.",
					},
				],
			},
			{
				title: "Définir ses catégories d'emploi",
				items: [
					{
						question: "Qui décide des catégories d'emploi ?",
						answer:
							"Votre entreprise, par accord collectif ou, à défaut, par décision unilatérale de l'employeur. Il n'existe pas de nomenclature imposée : les catégories doivent refléter l'organisation réelle du travail chez vous, en regroupant des emplois de valeur comparable.",
					},
					{
						question: "Que faut-il renseigner pour chaque catégorie ?",
						answer:
							"Les effectifs de femmes et d'hommes, puis la rémunération brute annuelle et horaire, base et rémunération variable comprises. L'écart est calculé pour vous à partir de ces valeurs.",
					},
					{
						question:
							"Puis-je préparer ces données en dehors de la plateforme ?",
						answer:
							"Oui. L'étape propose un modèle de tableur à télécharger, à compléter hors ligne, puis à réimporter. Le contenu importé reste modifiable dans le formulaire avant transmission.",
					},
					{
						question: "Mes catégories d'emploi sont-elles rendues publiques ?",
						answer:
							"Non. Seuls les indicateurs A à F sont consultables publiquement. L'indicateur G, vos catégories d'emploi et les rémunérations associées restent confidentiels et ne sont accessibles qu'à l'administration.",
					},
				],
			},
		],
	},
	{
		id: "seuil-alerte",
		title: "Le seuil d'alerte et la seconde déclaration",
		subsections: [
			{
				title: "Le seuil",
				items: [
					{
						question: "À partir de quel écart suis-je en alerte ?",
						answer:
							"Le seuil d'alerte est fixé à 5 % d'écart sur l'indicateur G. En dessous, aucune obligation supplémentaire ne se déclenche. À partir de 5 %, et pour les entreprises d'au moins 100 salariés, le parcours de mise en conformité s'ouvre.",
					},
					{
						question:
							"Un écart au-dessus du seuil est-il une sanction ou une faute ?",
						answer:
							"Ni l'un ni l'autre. C'est un constat qui ouvre une obligation d'agir : justifier l'écart, le corriger, ou l'examiner avec les représentants du personnel. La plateforme sert à tracer cette démarche.",
					},
				],
			},
			{
				title: "Le parcours de mise en conformité",
				items: [
					{
						question: "Quels parcours puis-je choisir ?",
						answer:
							"Trois : justifier l'écart par des éléments objectifs, engager des mesures correctives et le mesurer à nouveau par une seconde déclaration, ou déposer une évaluation conjointe menée avec les représentants du personnel. Le choix est enregistré et se verrouille dès qu'une action en découle.",
					},
					{
						question: "Qu'est-ce que la seconde déclaration ?",
						answer:
							"C'est une nouvelle mesure de l'indicateur G après vos mesures correctives, dans les six mois suivant la première. Elle porte sur une période de référence que vous choisissez, comprise entre la date de votre première déclaration et la fin de l'année civile.",
					},
					{
						question: "Combien de déclarations puis-je faire dans l'année ?",
						answer:
							"Deux au maximum par année civile : la déclaration initiale, et le cas échéant la seconde déclaration du parcours de conformité.",
					},
					{
						question: "Qu'est-ce qu'une évaluation conjointe ?",
						answer:
							"C'est un examen de l'écart mené avec les représentants du personnel, dont vous déposez le document au format PDF. Un seul document par déclaration : en déposer un nouveau remplace le précédent.",
					},
				],
			},
		],
	},
	{
		id: "avis-cse",
		title: "L'avis du CSE",
		subsections: [
			{
				title: "Qui est concerné",
				items: [
					{
						question: "Dois-je déposer un avis du CSE ?",
						answer:
							"Oui à partir de 100 salariés, où il est obligatoire. En dessous de ce seuil, le dépôt n'est pas seulement facultatif : il n'est pas ouvert, et l'étape n'apparaît pas dans votre démarche.",
					},
					{
						question: "Sur quoi le CSE se prononce-t-il ?",
						answer:
							"Sur deux points distincts : l'exactitude des données déclarées, et les écarts constatés. Chacun donne lieu à un avis favorable ou défavorable, daté. La consultation sur les écarts peut être sans objet si aucun écart ne la rend nécessaire.",
					},
				],
			},
			{
				title: "Le dépôt des documents",
				items: [
					{
						question: "Combien de fichiers puis-je déposer ?",
						answer:
							"Jusqu'à 4 fichiers PDF par année. Ce plafond couvre les avis portant sur la première comme sur la seconde déclaration.",
					},
					{
						question:
							"Pourquoi dois-je associer chaque fichier à un type de contenu ?",
						answer:
							"Parce qu'un même procès-verbal peut porter sur l'exactitude, sur les écarts, ou sur les deux, et pour l'une ou l'autre déclaration. L'association indique quel avis se trouve dans quel document. Chaque type ne peut être associé qu'à un seul fichier, et tous les types attendus doivent l'être avant de pouvoir transmettre.",
					},
					{
						question: "Un avis défavorable bloque-t-il ma déclaration ?",
						answer:
							"Non. Le sens de l'avis est enregistré et transmis tel quel ; il ne conditionne pas la validité de votre déclaration.",
					},
				],
			},
		],
	},
	{
		id: "depot-documents",
		title: "Déposer un document",
		subsections: [
			{
				title: "Ce que le dépôt accepte",
				items: [
					{
						question: "Quels formats de fichier puis-je déposer ?",
						answer:
							"Le PDF, pour l'avis du CSE comme pour l'évaluation conjointe. Les autres formats sont écartés dès la sélection du fichier.",
					},
					{
						question: "Y a-t-il une taille maximale ?",
						answer:
							"10 Mo par fichier. Au-delà, le dépôt est refusé avant même l'envoi, et le message vous l'indique.",
					},
					{
						question: "Le nom de mon fichier peut-il poser problème ?",
						answer:
							"Il doit faire au plus 200 caractères et ne pas contenir de caractères réservés par les systèmes de fichiers. Un nom refusé se renomme : rien d'autre n'est à corriger, et le contenu du document n'est pas en cause.",
					},
				],
			},
			{
				title: "Après le dépôt",
				items: [
					{
						question: "Mon fichier est-il contrôlé ?",
						answer:
							"Oui. Chaque fichier est analysé par un antivirus pendant l'envoi. Un fichier détecté comme infecté est rejeté et n'est jamais conservé.",
					},
					{
						question: "Puis-je supprimer ou remplacer un fichier déposé ?",
						answer:
							"Tant que la démarche n'est pas close, oui. Pour l'avis du CSE, chaque fichier se supprime individuellement. Pour l'évaluation conjointe, il n'y a qu'un seul document : en déposer un nouveau remplace le précédent.",
					},
					{
						question: "Reçois-je une confirmation de dépôt ?",
						answer:
							"Oui, un accusé de réception vous est envoyé par e-mail dès qu'un dépôt aboutit.",
					},
				],
			},
		],
	},
	{
		id: "representation-equilibree",
		title: "La représentation équilibrée",
		subsections: [
			{
				title: "Une déclaration distincte",
				items: [
					{
						question:
							"En quoi cette déclaration diffère-t-elle de celle des indicateurs ?",
						answer:
							"Elle porte sur un tout autre sujet : la place des femmes et des hommes parmi les cadres dirigeants et au sein des instances dirigeantes, et non sur les rémunérations. Elle a son propre parcours, sa propre échéance et son propre récapitulatif.",
					},
					{
						question: "Quelles entreprises sont concernées ?",
						answer:
							"Celles d'au moins 1 000 salariés sur chacun des 3 derniers exercices, au titre de la loi Rixain. Si vous êtes en dessous de ce seuil, le premier écran vous permet de le déclarer, et la démarche se clôt sans autre étape.",
					},
					{
						question: "Quelle est l'échéance ?",
						answer:
							"Elle est fixée campagne par campagne par l'administration et peut varier d'une année à l'autre. Celle qui s'applique à votre entreprise est affichée dans Mon espace et sur l'écran de déclaration.",
					},
				],
			},
			{
				title: "Le seuil de représentation",
				items: [
					{
						question: "Quel est le pourcentage à atteindre ?",
						answer:
							"Chaque sexe doit représenter au moins 30 % des cadres dirigeants et au moins 30 % des membres des instances dirigeantes. Ce seuil est porté à 40 % à compter de la campagne 2029.",
					},
					{
						question: "Les deux indicateurs sont-ils appréciés ensemble ?",
						answer:
							"Non, ils restent indépendants : les cadres dirigeants et les instances dirigeantes reçoivent chacun leur propre verdict, et aucune note d'ensemble n'est produite. Un indicateur peut être sans objet, par exemple en l'absence d'instance dirigeante.",
					},
					{
						question:
							"Que dois-je faire si un écart dépasse le seuil réglementaire ?",
						answer:
							"Vous devez définir des mesures correctives par accord collectif ou par décision unilatérale de l'employeur, et les déposer sur TéléAccords. Une étape supplémentaire de la déclaration recueille alors vos informations de publication.",
					},
				],
			},
		],
	},
	{
		id: "declaration-habilitation",
		title: "Se connecter et déclarer",
		subsections: [
			{
				title: "L'accès à la plateforme",
				items: [
					{
						question: "Comment se connecte-t-on à Egapro ?",
						answer:
							"Par ProConnect, l'identité numérique des professionnels. Il n'y a pas de compte Egapro à créer ni de mot de passe propre à la plateforme : votre habilitation ProConnect détermine l'entreprise pour laquelle vous déclarez.",
					},
					{
						question: "Qui, dans l'entreprise, peut déclarer ?",
						answer:
							"Le représentant légal, ou toute personne qu'il a habilitée via ProConnect pour le SIREN concerné. La déclaration est rattachée à l'entreprise, pas à la personne qui la saisit.",
					},
					{
						question:
							"Deux personnes peuvent-elles remplir la déclaration en même temps ?",
						answer:
							"Une seule à la fois peut la modifier. Lorsqu'une déclaration est déjà ouverte en écriture par un collègue, un bandeau vous indique qui la détient et les formulaires passent en lecture seule, afin qu'aucune saisie ne soit écrasée.",
					},
				],
			},
			{
				title: "Le déroulement de la déclaration",
				items: [
					{
						question: "Puis-je remplir la déclaration en plusieurs fois ?",
						answer:
							"Oui. Chaque étape est enregistrée en brouillon au fur et à mesure et vous pouvez reprendre plus tard. Un brouillon laissé sans activité expire au bout de 30 jours.",
					},
					{
						question: "Que se passe-t-il quand je transmets ?",
						answer:
							"Votre déclaration est transmise aux services du ministère chargé du travail, un accusé de réception est envoyé à votre adresse e-mail, et un récapitulatif PDF devient téléchargeable depuis Mon espace. Aucune démarche complémentaire n'est à faire auprès de la DREETS.",
					},
					{
						question: "Où retrouver mes déclarations passées ?",
						answer:
							"Dans Mon espace, qui liste vos démarches par année, leur état d'avancement et les documents associés : données pré-remplies, récapitulatifs de déclaration et récapitulatif des éléments transmis.",
					},
					{
						question: "Pourquoi me demande-t-on mon numéro de téléphone ?",
						answer:
							"Il est demandé une fois, au premier accès à Mon espace, pour que l'administration puisse vous joindre au sujet de vos déclarations. Il ne sert à rien d'autre.",
					},
					{
						question:
							"Je déclare pour plusieurs entreprises. Est-ce possible ?",
						answer:
							"Oui. Mon espace liste toutes les entreprises rattachées à votre habilitation, chacune avec ses propres démarches. Vous passez de l'une à l'autre sans vous reconnecter.",
					},
					{
						question: "Je n'ai pas reçu l'accusé de réception, que faire ?",
						answer:
							"Vérifiez d'abord vos courriers indésirables. Le bandeau de confirmation et Mon espace proposent un bouton pour vous le renvoyer, sans avoir à toucher à votre déclaration.",
					},
				],
			},
		],
	},
	{
		id: "calendrier-modification",
		title: "Calendrier et modification",
		subsections: [
			{
				title: "Les échéances",
				items: [
					{
						question: "Quelles sont les dates limites ?",
						answer:
							"Elles sont fixées campagne par campagne par l'administration et peuvent varier d'une année à l'autre. Aucune date n'est à retenir de mémoire : celles qui s'appliquent à votre entreprise sont affichées dans Mon espace et sur les écrans concernés.",
					},
					{
						question: "Que se passe-t-il si une échéance est dépassée ?",
						answer:
							"L'écran concerné passe en lecture seule et l'action n'est plus possible. Les étapes déjà accomplies et les documents déjà transmis restent consultables et téléchargeables.",
					},
				],
			},
			{
				title: "Corriger après coup",
				items: [
					{
						question: "Puis-je modifier une déclaration déjà transmise ?",
						answer:
							"Oui, tant que la date limite de modification de la campagne n'est pas dépassée. Vous rouvrez votre déclaration, corrigez, puis transmettez à nouveau : la nouvelle version remplace la précédente et un nouvel accusé de réception vous est envoyé.",
					},
					{
						question:
							"Une modification est-elle la même chose qu'une seconde déclaration ?",
						answer:
							"Non. Une modification corrige une déclaration existante sur la même période de référence. Une seconde déclaration est une nouvelle mesure, sur une nouvelle période, dans le cadre du parcours de conformité ouvert par un écart au-dessus du seuil d'alerte.",
					},
					{
						question: "Qui voit l'historique de mes modifications ?",
						answer:
							"Chaque étape franchie et chaque transmission sont horodatées et conservées. Cet historique est accessible à l'administration et vous est présenté dans le détail de votre démarche.",
					},
				],
			},
		],
	},
	{
		id: "publication-consultation",
		title: "Ce qui est publié, et ce qui ne l'est pas",
		subsections: [
			{
				title: "Vos résultats vus de l'extérieur",
				items: [
					{
						question: "Mes résultats sont-ils publics ?",
						answer:
							"Les indicateurs A à F le sont : toute personne peut les consulter. L'indicateur G, lui, ne l'est jamais — vos catégories d'emploi et les rémunérations associées restent confidentielles et ne sont accessibles qu'à l'administration.",
					},
					{
						question: "Où mes résultats sont-ils consultables ?",
						answer:
							"Depuis la page d'accueil d'Egapro, sans connexion. La recherche se fait par SIREN, par raison sociale, par région, par département ou par secteur d'activité.",
					},
					{
						question:
							"Les données publiées sont-elles téléchargeables en masse ?",
						answer:
							"Oui, un export est proposé depuis la recherche publique, pensé pour un usage d'analyse. Il ne contient que ce qui est déjà consultable en ligne, donc jamais l'indicateur G.",
					},
					{
						question: "Dois-je publier moi-même mes résultats quelque part ?",
						answer:
							"Rien ne vous est demandé sur Egapro à ce titre : transmettre votre déclaration suffit à la porter à la connaissance de l'administration, et la publication des indicateurs A à F est assurée par la plateforme.",
					},
				],
			},
		],
	},
	{
		id: "donnees-personnelles",
		title: "Vos données",
		subsections: [
			{
				title: "Conservation et accès",
				items: [
					{
						question:
							"Combien de temps mes déclarations sont-elles conservées ?",
						answer:
							"La durée applicable figure dans la politique de confidentialité, qui fait foi. Passé ce délai, une purge automatique quotidienne supprime la déclaration et tout ce qui s'y rattache — catégories d'emploi, avis du CSE, historique — sans intervention humaine et sans démarche de votre part.",
					},
					{
						question:
							"Les documents que j'ai déposés disparaissent-ils aussi ?",
						answer:
							"Oui. Les PDF suivent le sort de la déclaration à laquelle ils appartiennent et sont effacés de l'espace de stockage en même temps qu'elle.",
					},
					{
						question: "Qui accède à mes données pendant ce temps ?",
						answer:
							"Vous, les personnes habilitées pour votre entreprise, et les services du ministère chargé du travail. Les consultations de données sensibles sont journalisées.",
					},
				],
			},
		],
	},
	{
		id: "aide-contacts",
		title: "Trouver de l'aide",
		subsections: [
			{
				title: "Sur la plateforme",
				items: [
					{
						question: "Où voir les échéances qui me concernent ?",
						answer:
							"Sur la page d'aide, qui affiche les dates de la campagne en cours, et dans Mon espace, où chaque démarche porte la sienne.",
					},
					{
						question: "Comment poser une question à l'équipe ?",
						answer:
							"Par le formulaire de contact accessible depuis la page d'aide. Indiquez votre SIREN et l'écran concerné : cela évite un aller-retour.",
					},
				],
			},
			{
				title: "Votre interlocuteur en région",
				items: [
					{
						question: "Qui contacter localement ?",
						answer:
							"Un annuaire public des référents à l'égalité professionnelle est disponible sur la plateforme, organisé par région et par département.",
					},
					{
						question: "Comment obtenir leurs coordonnées ?",
						answer:
							"En ouvrant la fiche du référent : le téléphone et l'adresse e-mail y figurent. Ils ne sont volontairement pas affichés dans la liste, afin d'éviter leur collecte automatisée.",
					},
				],
			},
		],
	},
];
