import { fr } from "@codegouvfr/react-dsfr";
import Table from "@codegouvfr/react-dsfr/Table";

const Définition = () => (
  <>
    <p>
      Sont prises en compte les salariées qui sont <strong>revenues de congé maternité</strong> (ou d’adoption, et
      éventuellement prolongé par un congé parental) au cours de la période de référence annuelle considérée,{" "}
      <strong>si au moins une augmentation a été faite pendant leur congé</strong>. La prise en compte de chaque
      salariée est donc appréciée individuellement et dépend des éventuelles augmentations ayant eu lieu pendant leur
      congé maternité (ou d’adoption).
    </p>
    <p>
      Sont considérées <strong>comme augmentées</strong> toutes salariées{" "}
      <strong>
        ayant bénéficié, à leur retour de congé maternité (ou d’adoption) ou pendant celui-ci, d’une augmentation
      </strong>{" "}
      correspondant à la majoration de leur rémunération liée à l'obligation de rattrapage salarial au retour de congé
      maternité (ou d’adoption).
    </p>
    <p className={fr.cx("fr-mb-0")}>L’indicateur n’est pas calculable :</p>
    <ul>
      <li>
        si aucun retour de congé maternité (ou d’adoption) n’est intervenu au cours de la période de référence annuelle
        considérée
      </li>
      <li>ou si aucune augmentation n’est intervenue durant la durée du ou des congés maternité (ou d’adoption).</li>
    </ul>
  </>
);

const CommentEstCalculéLIndicateur = () => (
  <>
    <p>
      L’indicateur correspond au ratio entre le nombre de salariées revenues de congé maternité ou d’adoption au cours
      de la période de référence et ayant bénéficié d’une augmentation, avant la fin de celle-ci, si des augmentations
      ont eu lieu pendant leur congé, d’une part, et, d’autre part, le nombre de salariés revenus, pendant la période de
      référence, de congé maternité ou d’adoption, durant lequel il y a eu des augmentations salariales.
    </p>
    <p className={fr.cx("fr-mb-0")}>
      <strong>Barème appliqué pour l’obtention de la note à l’indicateur</strong>
    </p>

    <Table
      noScroll
      fixed
      headers={["Résultat final obtenu", "Nombre de points (Note sur 15)"]}
      data={[
        ["égal à 100%", "15 points"],
        ["inférieur à 100%", "0 point"],
      ]}
    />
  </>
);

export const AideSimulationIndicateurQuatre = {
  Définition,
  CommentEstCalculéLIndicateur,
};
