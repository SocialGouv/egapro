import Table from "@codegouvfr/react-dsfr/Table";

const Définition = () => (
  <>
    <p>
      Seules les salariées qui sont rentrées de congé maternité (ou d’adoption) durant la période de référence sont
      prises en considération.
    </p>
    <p>
      Sont considérées <strong>comme augmentées</strong> toutes salariées <strong>revenues de congé</strong> maternité
      pendant l’année de référence et ayant bénéficié d’une augmentation (générale ou individuelle) à leur retour avant
      la fin de cette même période.
    </p>
    <p>L’indicateur n’est pas calculable :</p>
    <ul>
      <li>S’il n’y a eu aucun retour de congé maternité (ou adoption) au cours de la période de référence.</li>
      <li>S’il n’y a eu aucune augmentation (individuelle ou collective) au cours des congés maternité.</li>
    </ul>
  </>
);

const CommentEstCalculéLIndicateur = () => (
  <>
    <p>
      L’indicateur correspond au ratio entre le nombre de salariées revenues de congé maternité ou d’adoption pendant la
      période de référence et ayant bénéficié d’une augmentation, avant la fin de celle-ci, si des augmentations ont eu
      lieu pendant leur congé, d’une part, et, d’autre part, le nombre de salariés revenus, pendant la période de
      référence, de congé maternité ou d’adoption, durant lequel il y a eu des augmentations salariales.
    </p>
    <p>
      <strong>Barème appliqué pour l’obtention de la note à l’indicateur</strong>
    </p>

    <Table
      noScroll
      fixed
      headers={["Résultats obtenus", "Nombre de points (Note sur 15)"]}
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
