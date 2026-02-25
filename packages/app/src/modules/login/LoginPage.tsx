import Image from "next/image";

import { LoginForm } from "./LoginForm";

/**
 * Login page with two-column layout: form on the left, illustration on the right.
 *
 * Both columns span the full viewport width (not fr-container). Each column uses
 * an inner wrapper with `max-width: 39rem` (half of fr-container) to align its
 * content with the header's fr-container:
 *
 * - **Form column**: inner wrapper is RIGHT-aligned (justify-content: flex-end)
 *   so its left padding matches the container's left content edge.
 * - **Illustration column**: inner wrapper is LEFT-aligned (default) so its right
 *   padding matches the container's right content edge. The image is pushed to
 *   the right within that wrapper (justify-content: flex-end), creating a
 *   right-aligned appearance on wide viewports that transitions to centered
 *   as the viewport narrows toward the container width.
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
						style={{ display: "flex", flex: "0 0 50%" }}
					>
						{/*
						 * Inner wrapper mirrors the form column's approach:
						 * - max-width: 39rem = half of fr-container (624px)
						 * - left-aligned in the column (default)
						 * - paddingInlineEnd: 1.5rem matches fr-container padding
						 *   → right edge of content = container content right edge
						 * - justify-content: flex-end → image is right-aligned
						 */}
						<div
							style={{
								alignItems: "center",
								boxSizing: "border-box",
								display: "flex",
								justifyContent: "flex-end",
								maxWidth: "39rem",
								paddingBlock: "4.5rem",
								paddingInlineEnd: "1.5rem",
								width: "100%",
							}}
						>
							<Image
								alt=""
								height={220}
								src="/img/login-illustration.svg"
								style={{ height: "auto", maxWidth: "100%" }}
								width={362}
							/>
						</div>
					</div>
				</div>
			</div>
		</main>
	);
}
