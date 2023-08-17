import Table from "@codegouvfr/react-dsfr/Table";

const Définition = () => (
  <>
    <p>
      La notion d’
      <strong>
        augmentation individuelle correspond à une augmentation individuelle du salaire de base du salarié concerné
      </strong>
      .
    </p>
    <p>
      La notion d’augmentation individuelle pour le calcul de l’indicateur exclut les augmentations de salaires liées à
      une promotion.
    </p>
    <p>Les salariés sont répartis en 4 groupes selon les quatre catégories socio-professionnelles.</p>
    <p>
      Les groupes ne comportant pas <strong>au moins 10 femmes et 10 hommes</strong> ne sont pas retenus pour le calcul
      de l’indicateur.
    </p>
    <p>L’indicateur n’est pas calculable :</p>
    <ul>
      <li>Si aucune augmentation individuelle n’est intervenue au cours de la période de référence.</li>
      <li>
        Ou si le total des effectifs retenus est inférieur à 40% des effectifs pris en compte pour le calcul des
        indicateurs.
      </li>
    </ul>
  </>
);

const CommentEstCalculéLIndicateur = () => (
  <>
    <p>
      Seuls les groupes comprenant au moins 10 hommes et 10 femmes sont pris en compte pour le calcul de l’indicateur.
    </p>
    <ol>
      <li>
        Le pourcentage de femmes et d’hommes augmentés au cours de la période de référence est calculé par catégorie
        socio-professionnelle.
      </li>
      <li>
        L’écart de taux d’augmentations est calculé, en points de pourcentage, pour chacun des groupes, en soustrayant
        le pourcentage de femmes augmentées à celui des hommes augmentés.
      </li>
      <li>
        Les écarts obtenus sont multipliés par le ratio de l’effectif du groupe à l’effectif total des groupes pris en
        compte.
      </li>
      <li>
        Les écarts des différents groupes sont ensuite additionnés pour obtenir l’écart global de taux d’augmentations
        entre les femmes et les hommes.{" "}
      </li>
      <li>
        Le résultat final est la valeur absolue de l’écart global de taux d’augmentations, arrondie à la première
        décimale.
      </li>
    </ol>
    <p>
      Si l’écart constaté joue en faveur du sexe le moins bien rémunéré (indicateur - écart de rémunération), la note
      maximale de 20 points est attribuée à l’entreprise (considérant que l’employeur a mis en place une politique de
      rattrapage adaptée).
    </p>
    <p>
      <strong>Barème appliqué pour l’obtention de la note à l’indicateur</strong>
    </p>

    <Table
      noScroll
      fixed
      headers={["Résultats obtenus", "Nombre de points (Note sur 20)"]}
      data={[
        ["inférieur ou égal à 2 points de %", "20 points"],
        ["supérieur à 2 et inférieur ou égal à 5 points de %", "10 points"],
        ["supérieur à 5 et inférieur ou égal à 10 points de %", "5 points"],
        ["supérieur à 10 points de %", "0 point"],
      ]}
    />
  </>
);

export const AideSimulationIndicateurDeux = {
  Définition,
  CommentEstCalculéLIndicateur,
};
