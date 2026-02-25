import { FooterBody } from "./FooterBody";
import { FooterBottom } from "./FooterBottom";
import { ThemeModal } from "./ThemeModal";

export function Footer() {
	return (
		<footer className="fr-footer" id="footer">
			<div className="fr-container">
				<FooterBody />
				<FooterBottom />
			</div>
			<ThemeModal />
		</footer>
	);
}
