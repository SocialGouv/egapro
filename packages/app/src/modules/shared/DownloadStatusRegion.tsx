import type { DownloadState } from "./useDownloadClickGuard";

type Props = {
	pendingLabel: string;
	state: DownloadState;
};

/** Screen-reader feedback shared by every guarded download link. */
export function DownloadStatusRegion({ pendingLabel, state }: Props) {
	return (
		<>
			<p aria-atomic="true" aria-live="polite" className="fr-sr-only">
				{state === "pending" ? pendingLabel : ""}
			</p>
			{state === "error" && (
				<p className="fr-text--xs fr-error-text fr-mt-1w fr-mb-0" role="alert">
					Le téléchargement a échoué, réessayez.
				</p>
			)}
		</>
	);
}
