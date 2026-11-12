import { FILE_TOO_LARGE_ERROR } from "./uploadConfig";

export type UploadError = {
	title: string;
	message: string;
};

export const UPLOAD_ERROR = {
	format: (acceptedFormats: string): UploadError => ({
		title: "Format non supporté",
		message: `Ce fichier ne peut pas être importé. Seuls les fichiers au format ${acceptedFormats.toUpperCase()} sont acceptés.`,
	}),
	formatRejected: (message: string): UploadError => ({
		title: "Format non supporté",
		message,
	}),
	tooLarge: (): UploadError => ({
		title: "Fichier trop volumineux",
		message: FILE_TOO_LARGE_ERROR,
	}),
	empty: (message: string): UploadError => ({
		title: "Fichier vide",
		message,
	}),
	invalidFileName: (message: string): UploadError => ({
		title: "Nom de fichier invalide",
		message,
	}),
	virus: (virusName: string | undefined): UploadError => ({
		title: "Fichier rejeté par l'antivirus",
		message: virusName
			? `Fichier rejeté par l'antivirus (signature : ${virusName}).`
			: "Fichier rejeté par l'antivirus.",
	}),
	scanUnavailable: (message: string): UploadError => ({
		title: "Vérification antivirus indisponible",
		message,
	}),
	maxFiles: (message: string): UploadError => ({
		title: "Nombre maximum de fichiers atteint",
		message,
	}),
	unauthorized: (): UploadError => ({
		title: "Session expirée",
		message: "Non authentifié. Merci de vous reconnecter.",
	}),
	notFound: (): UploadError => ({
		title: "Déclaration introuvable",
		message: "Déclaration introuvable pour l'année en cours.",
	}),
	network: (): UploadError => ({
		title: "Échec du transfert (erreur réseau)",
		message:
			"L'import a échoué en raison d'un problème de connexion. Vérifiez votre connexion internet et réessayez.",
	}),
	server: (): UploadError => ({
		title: "Échec du transfert",
		message: "Erreur lors de l'upload du fichier. Merci de réessayer.",
	}),
	aborted: (): UploadError => ({
		title: "Transfert interrompu",
		message: "L'upload a été interrompu. Merci de réessayer.",
	}),
	invalidRequest: (message: string): UploadError => ({
		title: "Requête invalide",
		message,
	}),
};
