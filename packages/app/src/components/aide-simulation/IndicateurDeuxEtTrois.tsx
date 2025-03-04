import { fr } from "@codegouvfr/react-dsfr";
import Table from "@codegouvfr/react-dsfr/Table";

const Définition = () => (
  <>
    <p>
      L‘indicateur concerne les entreprises et unités économiques et sociales (UES) dont l’effectif assujetti est
      compris entre 50 et 250 salariés inclus.
    </p>
    <p>
      La notion d’augmentation individuelle correspond à une{" "}
      <strong>augmentation individuelle du salaire de base du salarié concerné</strong>. Elle inclut les augmentations
      de salaire liées à une promotion.
    </p>
    <p>
      L’indicateur est calculé <strong>au niveau de l’entreprise ou de l’unité économique et sociale (UES)</strong>, et
      non par groupes de salariés.
    </p>
    <p>
      Pour le calcul de l’indicateur, une période de référence pluriannuelle peut être choisie, à partir des données des
      deux ou trois années précédentes. Son caractère pluriannuel peut être révisé tous les trois ans.
    </p>
    <p className={fr.cx("fr-mb-0")}>L’indicateur n’est pas calculable :</p>
    <ul>
      <li>
        si aucune augmentation individuelle n’est intervenue au cours de la période de référence annuelle considérée
      </li>
      <li>
        ou si l’effectif total des salariés pris en compte pour le calcul des indicateurs ne compte pas au moins 5
        femmes et 5 hommes.
      </li>
    </ul>
  </>
);

const CommentEstCalculéLIndicateur = () => (
  <>
    <p>
      Le calcul est possible si l’effectif total des salariés pris en compte pour le calcul des indicateurs compte au
      moins 5 femmes et 5 hommes.
    </p>
    <ol>
      <li>
        <p>Le nombre de femmes et d’hommes augmentés au cours de la période de référence est calculé. </p>
      </li>
      <li>
        <p>
          Le taux d’augmentation des femmes est calculé en rapportant le nombre de femmes augmentées au nombre total de
          femmes pris en compte pour le calcul des indicateurs. Le taux d’augmentation des hommes est calculé en
          rapportant le nombre d’hommes augmentés au nombre total d’hommes pris en compte pour le calcul des
          indicateurs.
        </p>
      </li>
      <li>
        <p>
          Un premier résultat est "l’écart en %", il s’agit de la valeur absolue de l’écart entre les deux taux calculés
          en 2. Par exemple, le taux d’augmentation des femmes est de 33,13% et le taux d’augmentation des hommes est de
          30,00%, l’écart est ainsi de 3,13%.
        </p>
      </li>
      <li>
        <p>
          Un second résultat est "l’écart en nombre équivalent de salariés", l’écart de taux calculé en 3 est appliqué
          au plus petit effectif entre les femmes et les hommes. Il correspond au plus petit nombre de salariés qu’il
          aurait fallu augmenter ou ne pas augmenter pour être à égalité des taux d’augmentation. Par exemple, l’écart
          est de 3,13% dans une entreprise employant 15 femmes et 20 hommes, on applique 3,13% aux 15 femmes, le nombre
          équivalent de salariés est ainsi de 0,4695.
        </p>
      </li>
      <li>
        <p>L’écart en % et le nombre équivalent de salariés sont arrondis à la première décimale. </p>
      </li>
      <li>
        Le barème est appliqué à l’écart en % et à l’écart en nombre équivalent de salariés, et le résultat
        correspondant au nombre de points le plus élevé est retenu. En reprenant l’exemple en 4, c’est le résultat
        obtenu en nombre équivalent de salariés, soit 0,5 arrondi, qui sera conservée, la note finale obtenue à
        l’indicateur est ainsi de 35 points.
      </li>
    </ol>
    <p className={fr.cx("fr-mt-2w")}>
      Si l’écart en % joue en faveur du sexe le moins bien rémunéré (indicateur écart de rémunération), la note maximale
      de 35 points est attribuée (considérant que l’employeur a mis en place une politique de rattrapage adaptée).
    </p>
    <p className={fr.cx("fr-m-0")}>
      <strong>Barème appliqué pour l’obtention de la note à l’indicateur</strong>
    </p>

    <Table
      noScroll
      fixed
      headers={["Résultat final obtenu", "Nombre de points (Note sur 35)"]}
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
