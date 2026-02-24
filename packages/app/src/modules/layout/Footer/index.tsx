import { FooterBody } from "./FooterBody";
import { FooterBottom } from "./FooterBottom";
import { FooterTopLinks } from "./FooterTopLinks";
import { ThemeModal } from "./ThemeModal";

export function Footer() {
	return (
		<footer className="fr-footer" id="footer">
			<FooterTopLinks />
			<div className="fr-container">
				<FooterBody />
				<FooterBottom />
			</div>
			<ThemeModal />
		</footer>
	);
}
