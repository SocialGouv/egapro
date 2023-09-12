import Table from "@codegouvfr/react-dsfr/Table";

const Définition = () => (
  <>
    <p>La notion de promotion correspond au passage à un niveau ou coefficient hiérarchique supérieur.</p>
    <p>Les salariés sont répartis en 4 groupes selon les quatre catégories socio-professionnelles.</p>
    <p>
      Les groupes ne comportant pas <strong>au moins 10 femmes et 10 hommes</strong> ne sont pas retenus pour le calcul
      de l’indicateur.
    </p>
    <p>L’indicateur n’est pas calculable :</p>
    <ul>
      <li>Si aucune promotion n’est intervenue au cours de la période de référence.</li>
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
        Le pourcentage de femmes et d’hommes promus au cours de la période de référence est calculé par catégorie
        socio-professionnelle.
      </li>
      <li>
        L’écart de taux de promotions est calculé, en %, pour chacun des groupes, en soustrayant le pourcentage de
        femmes promues à celui des hommes promus.
      </li>
      <li>
        Les écarts obtenus sont multipliés par le ratio de l’effectif du groupe à l’effectif total des groupes pris en
        compte.
      </li>
      <li>
        Les écarts des différents groupes sont ensuite additionnés pour obtenir l’écart global de taux d’augmentations
        entre les femmes et les hommes.
      </li>
      <li>
        Le résultat final est la valeur absolue de l’écart global de taux d’augmentations, arrondie à la première
        décimale.
      </li>
    </ol>
    <p>
      Si l’écart constaté joue en faveur du sexe le moins bien rémunéré (indicateur - écart de rémunération), la note
      maximale de 15 points est attribuée à l’entreprise (considérant que l’employeur a mis en place une politique de
      rattrapage adaptée).
    </p>
    <p>
      <strong>Barème appliqué pour l’obtention de la note à l’indicateur</strong>
    </p>

    <Table
      noScroll
      fixed
      headers={["Résultats obtenus", "Nombre de points (Note sur 15)"]}
      data={[
        ["inférieur ou égal à 2 points de %", "15 points"],
        ["supérieur à 2 et inférieur ou égal à 5 points de %", "10 points"],
        ["supérieur à 5 et inférieur ou égal à 10 points de %", "5 points"],
        ["supérieur à 10 points de %", "0 point"],
      ]}
    />
  </>
);

export const AideSimulationIndicateurTrois = {
  Définition,
  CommentEstCalculéLIndicateur,
};
