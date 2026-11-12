import { describe, expect, it } from "vitest";
import { FILE_TOO_LARGE_ERROR } from "../uploadConfig";
import { UPLOAD_ERROR } from "../uploadErrors";

describe("UPLOAD_ERROR", () => {
	it("builds the format message from the formats accepted by the surface", () => {
		expect(UPLOAD_ERROR.format("pdf")).toEqual({
			title: "Format non supporté",
			message:
				"Ce fichier ne peut pas être importé. Seuls les fichiers au format PDF sont acceptés.",
		});
		expect(UPLOAD_ERROR.format("xlsx, csv")).toEqual({
			title: "Format non supporté",
			message:
				"Ce fichier ne peut pas être importé. Seuls les fichiers au format XLSX, CSV sont acceptés.",
		});
	});

	it("keeps the format title with the server-provided message", () => {
		expect(UPLOAD_ERROR.formatRejected("Type refusé")).toEqual({
			title: "Format non supporté",
			message: "Type refusé",
		});
	});

	it("shares the size message with the server", () => {
		expect(UPLOAD_ERROR.tooLarge()).toEqual({
			title: "Fichier trop volumineux",
			message: FILE_TOO_LARGE_ERROR,
		});
		expect(FILE_TOO_LARGE_ERROR).toContain("10 Mo");
	});

	it("titles the empty, invalid-name and invalid-request cases", () => {
		expect(UPLOAD_ERROR.empty("Le fichier est vide.")).toEqual({
			title: "Fichier vide",
			message: "Le fichier est vide.",
		});
		expect(UPLOAD_ERROR.invalidFileName("Nom trop long")).toEqual({
			title: "Nom de fichier invalide",
			message: "Nom trop long",
		});
		expect(UPLOAD_ERROR.invalidRequest("En-tête manquant")).toEqual({
			title: "Requête invalide",
			message: "En-tête manquant",
		});
	});

	it("names the virus signature when the server provides one", () => {
		expect(UPLOAD_ERROR.virus("Eicar-Test-Signature")).toEqual({
			title: "Fichier rejeté par l'antivirus",
			message:
				"Fichier rejeté par l'antivirus (signature : Eicar-Test-Signature).",
		});
		expect(UPLOAD_ERROR.virus(undefined)).toEqual({
			title: "Fichier rejeté par l'antivirus",
			message: "Fichier rejeté par l'antivirus.",
		});
	});

	it("delegates the availability, quota and name messages to the server", () => {
		expect(UPLOAD_ERROR.scanUnavailable("Indisponible")).toEqual({
			title: "Vérification antivirus indisponible",
			message: "Indisponible",
		});
		expect(UPLOAD_ERROR.maxFiles("Quatre fichiers maximum")).toEqual({
			title: "Nombre maximum de fichiers atteint",
			message: "Quatre fichiers maximum",
		});
	});

	it("keeps a stable copy for the cases the client owns", () => {
		expect(UPLOAD_ERROR.unauthorized()).toEqual({
			title: "Session expirée",
			message: "Non authentifié. Merci de vous reconnecter.",
		});
		expect(UPLOAD_ERROR.notFound()).toEqual({
			title: "Déclaration introuvable",
			message: "Déclaration introuvable pour l'année en cours.",
		});
		expect(UPLOAD_ERROR.network()).toEqual({
			title: "Échec du transfert (erreur réseau)",
			message:
				"L'import a échoué en raison d'un problème de connexion. Vérifiez votre connexion internet et réessayez.",
		});
		expect(UPLOAD_ERROR.server()).toEqual({
			title: "Échec du transfert",
			message: "Erreur lors de l'upload du fichier. Merci de réessayer.",
		});
		expect(UPLOAD_ERROR.aborted()).toEqual({
			title: "Transfert interrompu",
			message: "L'upload a été interrompu. Merci de réessayer.",
		});
	});
});
