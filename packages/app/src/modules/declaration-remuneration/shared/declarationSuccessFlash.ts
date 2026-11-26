const MAX_AGE_MS = 30_000;

function createTransmissionSuccessFlash(storageKey: string) {
	function mark() {
		try {
			window.sessionStorage.setItem(storageKey, String(Date.now()));
		} catch {
			// Storage can be disabled; navigation must still work after submission.
		}
	}

	function consume() {
		try {
			const storedAt = window.sessionStorage.getItem(storageKey);
			window.sessionStorage.removeItem(storageKey);

			if (!storedAt) return false;

			const age = Date.now() - Number(storedAt);
			return Number.isFinite(age) && age >= 0 && age <= MAX_AGE_MS;
		} catch {
			return false;
		}
	}

	return { mark, consume };
}

const declarationTransmissionFlash = createTransmissionSuccessFlash(
	"egapro:declaration-transmission-success",
);
const jointEvaluationTransmissionFlash = createTransmissionSuccessFlash(
	"egapro:joint-evaluation-transmission-success",
);
const secondDeclarationTransmissionFlash = createTransmissionSuccessFlash(
	"egapro:second-declaration-transmission-success",
);

export const markDeclarationTransmissionSuccess =
	declarationTransmissionFlash.mark;
export const consumeDeclarationTransmissionSuccess =
	declarationTransmissionFlash.consume;
export const markJointEvaluationTransmissionSuccess =
	jointEvaluationTransmissionFlash.mark;
export const consumeJointEvaluationTransmissionSuccess =
	jointEvaluationTransmissionFlash.consume;
export const markSecondDeclarationTransmissionSuccess =
	secondDeclarationTransmissionFlash.mark;
export const consumeSecondDeclarationTransmissionSuccess =
	secondDeclarationTransmissionFlash.consume;
