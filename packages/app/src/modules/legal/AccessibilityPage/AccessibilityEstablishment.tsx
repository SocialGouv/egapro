/** Declaration establishment details: dates, technologies, and testing. */
export function AccessibilityEstablishment() {
	return (
		<>
			<h2 className="fr-h4">Établissement de cette déclaration</h2>
			<p>
				Cette déclaration a été établie le{" "}
				<time dateTime="2024-03-01">1er mars 2024</time>. Elle a été mise à jour
				le <time dateTime="2025-03-01">1er mars 2025</time>.
			</p>
			<p>Technologies utilisées pour la réalisation du site :</p>
			<ul>
				<li>HTML5</li>
				<li>CSS</li>
				<li>JavaScript</li>
			</ul>
			<p>
				Environnement de test : les tests ont été effectués avec les
				combinaisons de navigateurs et technologies d'assistance suivantes :
			</p>
			<ul>
				<li>Firefox et NVDA</li>
				<li>Safari et VoiceOver</li>
			</ul>
			<p>Outils utilisés pour vérifier l'accessibilité :</p>
			<ul>
				<li>Axe DevTools</li>
				<li>Lighthouse</li>
				<li>WAVE</li>
			</ul>
		</>
	);
}
