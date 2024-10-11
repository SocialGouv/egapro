import { fr } from "@codegouvfr/react-dsfr";
import Table from "@codegouvfr/react-dsfr/Table";

const Définition = () => (
  <p>
    Le nombre de femmes et d’hommes parmi les dix plus hautes rémunérations de l’entreprise ou de l’unité économique et
    sociale (UES).
  </p>
);

const CommentEstCalculéLIndicateur = () => (
  <>
    <p>
      Le nombre de salariés du sexe sous-représenté est calculé en comparant le nombre de femmes et le nombre d’hommes
      parmi les 10 plus hautes rémunérations sur la période de référence annuelle considérée.
    </p>
    <p className={fr.cx("fr-mb-0")}>
      <strong>Barème appliqué pour l’obtention de la note à l’indicateur</strong>
    </p>

    <Table
      noScroll
      fixed
      headers={["Résultat final obtenu (nombre de salariés du sexe sous-représenté)", "Nombre de points (Note sur 10)"]}
      data={[
        ["4 ou 5 salariés", "10 points"],
        ["2 ou 3 salariés", "5 points"],
        ["0 ou 1 salarié", "0 point"],
      ]}
    />
  </>
);

export const AideSimulationIndicateurCinq = {
  Définition,
  CommentEstCalculéLIndicateur,
};
