import Table from "@codegouvfr/react-dsfr/Table";

const Définition = () => (
  <>
    <p>
      La rémunération de chaque salarié, au sens de l’article L. 3221-3, doit être reconstituée en{" "}
      <strong>équivalent temps plein</strong> sur la période de référence annuelle considérée.
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
      L'indicateur est calculé <strong>par tranche d’âge et par catégorie de postes équivalents</strong> (soit par
      catégorie socio-professionnelle, soit, après consultation du comité social et économique, par niveau ou
      coefficient hiérarchique en application de la classification de branche ou d’une autre méthode de cotation des
      postes).
    </p>
    <p>
      L’indicateur n'est pas calculable si l'effectif total des salariés retenus pour le calcul de l’indicateur est
      inférieur à 40% de l'effectif total des salariés pris en compte pour le calcul des indicateurs.
    </p>
  </>
);

interface CommentEstCalculéLIndicateurProps {
  skipRemuDetails?: boolean;
}
const CommentEstCalculéLIndicateur = ({ skipRemuDetails }: CommentEstCalculéLIndicateurProps) => (
  <>
    <p>
      Le calcul est possible si l’effectif total des salariés retenus représente au moins 40% de l’effectif total des
      salariés pris en compte pour le calcul des indicateurs.
    </p>
    <ol>
      {!skipRemuDetails && (
        <li>
          <p>Les salariés sont répartis en groupe, par tranche d’âge et par catégorie de postes équivalents.</p>
          <p>
            Les tranches d’âge sont les suivantes :
            <ul>
              <li>Moins de 30 ans</li>
              <li>De 30 à 39 ans</li>
              <li>De 40 à 49 ans</li>
              <li>50 ans et plus</li>
            </ul>
          </p>
          <p>
            S’agissant des catégories de postes équivalents, l’employeur peut répartir les salariés, après consultation
            du comité social et économique, par niveau ou coefficient hiérarchique, en application de la classification
            de branche ou d’une autre méthode de cotation des postes. La méthode de cotation des postes est adoptée
            après avis du comité social et économique.
          </p>
          <p>
            Si l’employeur ne souhaite pas répartir les salariés par niveau ou coefficient hiérarchique , ou si cette
            méthode de répartition ne permet pas de calculer l’indicateur, il répartit les salariés par catégorie
            socio-professionnelle.
          </p>
          <p>
            Les catégories socio-professionnelles sont les suivantes :
            <ul>
              <li>ouvriers</li>
              <li>employés</li>
              <li>techniciens et agents de maîtrise</li>
              <li>ingénieurs et cadres</li>
            </ul>
          </p>
        </li>
      )}
      <li>
        <p>Seuls les groupes comprenant au moins trois femmes et au moins trois hommes sont pris en compte</p>
        <p>
          Si, en application de cette règle, le calcul de l’indicateur par niveau ou coefficient hiérarchique, dans les
          conditions prévues au 1, est rendu impossible, la répartition par niveau ou coefficient hiérarchique n’est pas
          retenue et les salariés sont répartis selon les quatre catégories socio-professionnelles définies au même 1.
        </p>
      </li>
      <li>
        La rémunération moyenne des femmes et des hommes est calculée pour chacun des groupes ainsi constitués en
        calculant le salaire en équivalent temps plein pour chaque salarié puis en faisant la moyenne.
      </li>
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
        Les écarts ainsi ajustés en fonction des seuils pour chacun des groupes, sont multipliés par le ratio de
        l’effectif du groupe à l’effectif total des groupes pris en compte, puis additionnés pour obtenir l’écart global
        de rémunération entre les femmes et les hommes.
      </li>
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
