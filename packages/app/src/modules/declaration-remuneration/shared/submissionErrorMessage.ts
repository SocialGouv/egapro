export const SUBMISSION_UNCONFIRMED_MESSAGE =
	"La transmission n'a pas pu être confirmée. Veuillez réessayer.";

// Only these refusals carry a message written for the user; any other failure may expose rules-engine state and facts.
const USER_FACING_ERROR_CODES: ReadonlySet<string> = new Set([
	"FORBIDDEN",
	"CONFLICT",
]);

type SubmissionError = {
	message: string;
	data?: { code: string } | null;
};

export function getSubmissionErrorMessage(
	error: SubmissionError | null,
): string | null {
	if (!error) return null;
	if (error.data && USER_FACING_ERROR_CODES.has(error.data.code)) {
		return error.message;
	}
	return SUBMISSION_UNCONFIRMED_MESSAGE;
}
