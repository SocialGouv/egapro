import Image from "next/image";

import { LoginForm } from "./LoginForm";

/** Login page with two-column layout: form on the left, illustration on the right. */
export function LoginPage() {
	return (
		<main id="content" tabIndex={-1}>
			<div
				style={{
					display: "flex",
					flexDirection: "row",
					minHeight: "60vh",
				}}
			>
				<div className="fr-p-4w fr-p-md-8w" style={{ flex: 1 }}>
					<LoginForm />
				</div>
				<div
					aria-hidden="true"
					className="fr-hidden fr-unhidden-md"
					style={{
						alignItems: "center",
						background: "var(--background-alt-blue-france)",
						display: "flex",
						flex: 1,
						justifyContent: "center",
						padding: "4.5rem 6rem",
					}}
				>
					<Image
						alt=""
						height={500}
						src="/img/login-illustration.svg"
						style={{ maxWidth: "100%", height: "auto" }}
						width={720}
					/>
				</div>
			</div>
		</main>
	);
}
