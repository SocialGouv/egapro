import Image from "next/image";

import { LoginForm } from "./LoginForm";

/**
 * Login page with two-column layout: form on the left, illustration on the right.
 *
 * The columns span the full viewport width (not fr-container) so the illustration
 * gets 50 % of the viewport, matching the Figma design. The form column's inner
 * wrapper uses max-width: 39rem (half of fr-container) + justify-content: flex-end
 * to align its content with the header's fr-container.
 */
export function LoginPage() {
	return (
		<main id="content" tabIndex={-1}>
			{/* Responsive padding for the form inner wrapper */}
			<style>{`
				.login-form-inner {
					box-sizing: border-box;
					display: flex;
					flex-direction: column;
					justify-content: center;
					max-width: 39rem;
					padding: 2rem 1.5rem;
					width: 100%;
				}
				@media (min-width: 48em) {
					.login-form-inner {
						padding: 3.5rem 7.5rem 3.5rem 1.5rem;
					}
				}
			`}</style>

			<div
				style={{ minHeight: "60vh", overflow: "hidden", position: "relative" }}
			>
				{/* Blue background panel — covers the right half of the viewport */}
				<div
					aria-hidden="true"
					className="fr-hidden fr-unhidden-md"
					style={{
						background: "var(--background-alt-blue-france)",
						bottom: 0,
						left: "50%",
						position: "absolute",
						right: 0,
						top: 0,
					}}
				/>

				<div
					style={{ display: "flex", minHeight: "60vh", position: "relative" }}
				>
					{/* Form column — left half; on mobile the illustration is hidden so flex:1 fills 100% */}
					<div
						style={{
							display: "flex",
							flex: 1,
							justifyContent: "flex-end",
						}}
					>
						<div className="login-form-inner">
							<LoginForm />
						</div>
					</div>

					{/* Illustration column — right 50 % of viewport, hidden on mobile */}
					<div
						aria-hidden="true"
						className="fr-hidden fr-unhidden-md"
						style={{
							alignItems: "center",
							display: "flex",
							flex: "0 0 50%",
							justifyContent: "center",
							padding: "4.5rem 6rem",
						}}
					>
						<Image
							alt=""
							height={220}
							src="/img/login-illustration.svg"
							style={{ height: "auto", width: "100%" }}
							width={362}
						/>
					</div>
				</div>
			</div>
		</main>
	);
}
