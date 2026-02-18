import { HeaderBrand } from "./HeaderBrand";
import { HeaderQuickAccess } from "./HeaderQuickAccess";
import { MobileMenu } from "./MobileMenu";

export function Header() {
	return (
		<header className="fr-header">
			<div className="fr-header__body">
				<div className="fr-container">
					<div className="fr-header__body-row">
						<HeaderBrand />
						<HeaderQuickAccess />
					</div>
				</div>
			</div>
			<MobileMenu />
		</header>
	);
}
