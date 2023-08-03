import Table from "@codegouvfr/react-dsfr/Table";

const Définition = () => (
  <>
    <p>
      La rémunération doit être reconstituée en <strong>équivalent temps plein</strong> sur toute la durée de la période
      de référence.
    </p>
    <p>
      <strong>Doivent être pris en compte dans la rémunération :</strong>
    </p>
    <ul>
      <li>
        les salaires ou traitements ordinaires de base ou minimum et tous les autres avantages et accessoires payés,
        directement ou indirectement, en espèces ou en nature, par l’employeur au salarié en raison de l’emploi de ce
        dernier
      </li>
      <li>
        les &quot;bonus&quot;, les commissions sur produits, les primes d’objectif liées aux performances individuelles
        du salarié, variables d’un individu à l’autre pour un même poste
      </li>
      <li>les primes collectives (ex : les primes de transport ou primes de vacances)</li>
      <li>les indemnités de congés payés.</li>
    </ul>
    <p>
      <strong>Ne doivent pas être pris en compte dans la rémunération :</strong>
    </p>
    <ul>
      <li>les indemnités de fin de CDD (notamment la prime de précarité)</li>
      <li>les sommes versées dans le cadre du compte épargne-temps (CET)</li>
      <li>les actions, stock-options, compensations différées en actions</li>
      <li>
        les primes liées à une sujétion particulière qui ne concernent pas la personne du salarié (prime de froid, prime
        de nuit etc.)
      </li>
      <li>les heures supplémentaires et complémentaires</li>
      <li>les indemnités de licenciement</li>
      <li>les indemnités de départ en retraite</li>
      <li>les primes d’ancienneté</li>
      <li>les primes d’intéressement et de participation.</li>
    </ul>
    <p>
      Les groupes ne comportant pas <strong>au moins 3 femmes et 3 hommes</strong> ne doivent pas être retenus pour le
      calcul de l’indicateur.
    </p>
    <p>
      Si le total des effectifs des groupes pouvant être pris en compte pour le calcul de l’indicateur est inférieur à
      40% des effectifs totaux, l’indicateur et l’index ne sont pas calculables.
    </p>
  </>
);

interface CommentEstCalculéLIndicateurProps {
  skipRemuDetails?: boolean;
}
const CommentEstCalculéLIndicateur = ({ skipRemuDetails }: CommentEstCalculéLIndicateurProps) => (
  <>
    <p>
      Seuls les groupes comprenant au moins 3 femmes et au moins 3 hommes sont pris en compte pour le calcul de
      l’indicateur.
    </p>
    <ol>
      {!skipRemuDetails && (
        <li>
          La rémunération moyenne des femmes et des hommes est calculée pour chacun des groupes constitué en calculant
          le salaire en équivalent temps plein pour chaque salarié puis en faisant la moyenne.
        </li>
      )}
      <li>
        L’écart de rémunération est calculé, en pourcentage, pour chacun des groupes, en soustrayant la rémunération
        moyenne des femmes à la rémunération moyenne des hommes et en rapportant ce résultat à la rémunération moyenne
        des hommes.
      </li>
      <li>
        Dans les groupes constitués par catégorie socio-professionnelle, le seuil de pertinence des écarts est de 5%.
        Dans les groupes constitués par niveau ou coefficient hiérarchique, le seuil de pertinence des écarts est de 2%.
        Lorsque l’écart de rémunération est positif, le seuil de pertinence est déduit de l’écart, sans toutefois
        pouvoir l’amener à devenir négatif (plancher à zéro). Lorsque l’écart de rémunération est négatif, le seuil de
        pertinence est ajouté à l’écart, sans toutefois pouvoir l’amener à devenir positif (plafond à zéro).
      </li>
      <li>
        Les écarts ainsi ajustés en fonction des seuils pour chacun des groupes sont multipliés par le ratio de
        l’effectif du groupe à l’effectif total des groupes pris en compte.
      </li>
      <li>Les écarts sont additionnés pour obtenir l’écart global de rémunération entre les femmes et les hommes.</li>
      <li>
        Le résultat final obtenu est la valeur absolue de l’écart global de rémunération, arrondie à la première
        décimale.
      </li>
    </ol>
    <p>
      <strong>Barème appliqué pour l’obtention de la note à l’indicateur</strong>
    </p>

    <Table
      noScroll
      fixed
      headers={["Résultats obtenus", "Nombre de points obtenus (Note sur 40)"]}
      data={[
        ["égal à 0%", "40 points"],
        ["supérieur à 0% et inférieur ou égal à 1%", "39 points"],
        ["supérieur à 1% et inférieur ou égal à 2%", "38 points"],
        ["supérieur à 2% et inférieur ou égal à 3%", "37 points"],
        ["supérieur à 3% et inférieur ou égal à 4%", "36 points"],
        ["supérieur à 4% et inférieur ou égal à 5%", "35 points"],
        ["supérieur à 5% et inférieur ou égal à 6%", "34 points"],
        ["supérieur à 6% et inférieur ou égal à 7%", "33 points"],
        ["supérieur à 7% et inférieur ou égal à 8%", "31 points"],
        ["supérieur à 8% et inférieur ou égal à 9%", "29 points"],
        ["supérieur à 9% et inférieur ou égal à 10%", "27 points"],
        ["supérieur à 10% et inférieur ou égal à 11%", "25 points"],
        ["supérieur à 11% et inférieur ou égal à 12%", "23 points"],
        ["supérieur à 12% et inférieur ou égal à 13%", "21 points"],
        ["supérieur à 13% et inférieur ou égal à 14%", "19 points"],
        ["supérieur à 14% et inférieur ou égal à 15%", "17 points"],
        ["supérieur à 15% et inférieur ou égal à 16%", "14 points"],
        ["supérieur à 16% et inférieur ou égal à 17%", "11 points"],
        ["supérieur à 17% et inférieur ou égal à 18%", "8 points"],
        ["supérieur à 18% et inférieur ou égal à 19%", "5 points"],
        ["supérieur à 19% et inférieur ou égal à 20%", "2 points"],
        ["supérieur à 20%", "0 point"],
      ]}
    />
  </>
);

export const AideSimulationIndicateurUn = {
  Définition,
  CommentEstCalculéLIndicateur,
};
