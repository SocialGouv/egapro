import { fr } from "@codegouvfr/react-dsfr";
import Table from "@codegouvfr/react-dsfr/Table";

const Définition = () => (
  <>
    <p>
      L’indicateur concerne les entreprises et unités économiques et sociales (UES) dont l’effectif assujetti est de
      plus de 250 salariés.
    </p>
    <p>
      La notion de promotion correspond <strong>au passage à un niveau ou coefficient hiérarchique supérieur</strong>.
    </p>
    <p>
      L’indicateur est calculé <strong>par catégorie socio-professionnelle</strong>.
    </p>
    <p className={fr.cx("fr-mb-0")}>L’indicateur n’est pas calculable :</p>
    <ul>
      <li>Si aucune promotion n’est intervenue au cours de la période de référence annuelle considérée.</li>
      <li>
        Ou si l’effectif total des salariés retenus pour le calcul de l’indicateur est inférieur à 40% de l’effectif
        total des salariés pris en compte pour le calcul des indicateurs.
      </li>
    </ul>
  </>
);

const CommentEstCalculéLIndicateur = () => (
  <>
    <p>
      Le calcul est possible si l’effectif total des salariés retenus représente au moins 40% de l’effectif total des
      salariés pris en compte pour le calcul des indicateurs.
    </p>
    <ol>
      <li>
        <p className={fr.cx("fr-mb-0")}>Les salariés sont répartis par catégorie socio-professionnelle.</p>
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
      <li>
        <p>
          Seules les catégories socio-professionnelles comprenant au moins dix femmes et dix hommes sont prises en
          compte.
        </p>
      </li>
      <li>
        <p>
          Dans chacune des catégories socio-professionnelles, le pourcentage de femmes et d’hommes promus au cours de la
          période de référence est calculé.
        </p>
      </li>
      <li>
        <p>
          L’écart de taux de promotions est calculé, en %, pour chacune des catégories socio-professionnelles, en
          soustrayant le pourcentage de femmes promues à celui des hommes promus.
        </p>
      </li>
      <li>
        <p>
          Les écarts obtenus sont multipliés par le ratio de l’effectif de la catégorie socio-professionnelle à
          l’effectif total des catégories socio-professionnelles prises en compte, puis additionnés pour obtenir l’écart
          global de taux de promotions entre les femmes et les hommes.
        </p>
      </li>
      <li>
        <p>
          Le résultat final est la valeur absolue de l’écart global de taux de promotions, arrondie à la première
          décimale.
        </p>
      </li>
    </ol>
    <p>
      Si l’écart global joue en faveur du sexe le moins bien rémunéré (indicateur écart de rémunération), la note
      maximale de 15 points est attribuée (considérant que l’employeur a mis en place une politique de rattrapage
      adaptée).
    </p>
    <p className={fr.cx("fr-mb-0")}>
      <strong>Barème appliqué pour l’obtention de la note à l’indicateur</strong>
    </p>

    <Table
      noScroll
      fixed
      headers={["Résultat final obtenu", "Nombre de points (Note sur 15)"]}
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
