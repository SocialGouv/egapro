import Table from "@codegouvfr/react-dsfr/Table";

const Définition = () => (
  <>
    <p>
      La notion d’augmentation individuelle correspond à une augmentation individuelle du salaire de base du salarié
      concerné.
    </p>
    <p>
      La notion d’augmentation individuelle pour le calcul de cet indicateur inclut les augmentations de salaire liées à
      une promotion.
    </p>
    <p>
      L’indicateur est calculé <strong>au niveau de l’entreprise ou de l’unité économique et sociale (UES)</strong>, et
      non par groupes de salariés.
    </p>
    <p>
      Pour le calcul de l’indicateur, l’employeur peut choisir une période de référence pluriannuelle, à partir des
      données des deux ou trois années précédentes. Son caractère pluriannuel peut être révisé tous les trois ans.
    </p>
    <p>L’indicateur n’est pas calculable :</p>
    <ul>
      <li>Si aucune augmentation individuelle n’est intervenue au cours de la période de référence</li>
      <li>
        Ou si l’effectif pris en compte pour le calcul des indicateurs ne comporte pas au moins 5 femmes et 5 hommes
      </li>
    </ul>
  </>
);

const CommentEstCalculéLIndicateur = () => (
  <>
    <p>
      Le calcul est possible si les effectifs pris en compte pour le calcul des indicateurs comptent au moins 5 femmes
      et 5 hommes.
    </p>
    <ol>
      <li>
        <p>Le nombre de femmes et d’hommes augmentés au cours de la période de référence est calculé. </p>
      </li>
      <li>
        Le taux d’augmentation des femmes est calculé en rapportant le nombre de femmes augmentées au nombre total de
        femmes pris en compte pour le calcul. Le taux d’augmentation des hommes est calculé en rapportant le nombre
        d’hommes augmentées au nombre total d’hommes pris en compte pour le calcul.
      </li>
      <li>
        Un premier résultat est &quot;l’écart en points de pourcentage&quot; : il s’agit de la valeur absolue de l’écart
        entre les deux taux calculés en 2. Par exemple, le taux d’augmentation des femmes est de 33,13% et le taux
        d’augmentation des hommes est de 30,00%, l’écart est ainsi de 3,13 points de pourcentage.
      </li>
      <li>
        Un second résultat est &quot;l’écart en nombre équivalent de salariés&quot; : l’écart de taux calculé en 3 est
        appliqué au plus petit effectif entre les femmes et les hommes. Il correspond au plus petit nombre de salariés
        qu’il aurait fallu augmenter ou ne pas augmenter pour être à égalité des taux d’augmentation. Par exemple,
        l’écart est de 3,13 points de pourcentage dans une entreprise employant 15 femmes et 20 hommes, on applique
        3,13% aux 15 femmes, le nombre équivalent de salariés est ainsi de 0,4695.
      </li>
      <li>
        L’écart en points de pourcentage et le nombre équivalent de salariés sont arrondis à la première décimale.{" "}
      </li>
      <li>
        Le barème est appliqué à l’écart en points de pourcentage et à l’écart en nombre équivalent de salariés, et le
        résultat correspondant au nombre de points le plus élevé est retenu. En reprenant l’exemple en 4, c’est le
        résultat obtenu en nombre équivalent de salariés, soit 0,5 arrondi, qui sera conservée, la note finale obtenu à
        l’indicateur est ainsi de 35 points.
      </li>
    </ol>
    <p>
      Si l’écart constaté joue en faveur du sexe le moins bien rémunéré (indicateur - écart de rémunération), la note
      maximale de 35 points est attribuée à l’entreprise (considérant que l’employeur a mis en place une politique de
      rattrapage adaptée).
    </p>
    <p>
      <strong>Barème appliqué pour l’obtention de la note à l’indicateur</strong>
    </p>

    <Table
      noScroll
      fixed
      headers={["Résultats obtenus", "Nombre de points (Note sur 35)"]}
      data={[
        ["inférieur ou égal à 2 points de % Ou à 2 salariés", "35 points"],
        [
          "supérieur à 2 et inférieur ou égal à 5 points de % Ou supérieur à 2 salariés et inférieur ou égal à 5 salariés",
          "25 points",
        ],
        [
          "supérieur à 5 et inférieur ou égal à 10 points de % Ou supérieur à 5 salariés et inférieur ou égal à 10 salariés",
          "15 points",
        ],
        ["supérieur à 10 points de % ou plus de 10 salariés", "0 point"],
      ]}
    />
  </>
);

export const AideSimulationIndicateurDeuxEtTrois = {
  Définition,
  CommentEstCalculéLIndicateur,
};
