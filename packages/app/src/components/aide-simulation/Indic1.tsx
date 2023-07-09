import Table from "@codegouvfr/react-dsfr/Table";

interface Props {
  skipRemuDetails?: boolean;
}
export const CommentEstCalculéLIndicateur = ({ skipRemuDetails }: Props) => (
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
