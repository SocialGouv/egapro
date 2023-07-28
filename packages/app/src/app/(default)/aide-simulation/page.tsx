import { AideSimulationIndicateurUn } from "@components/aide-simulation/IndicateurUn";
import { Container, ContentWithChapter, Grid, GridCol, Summary, SummaryLink } from "@design-system";
import { AnchorLink } from "@design-system/client";
import Link from "next/link";

const title = "Aide simulation";
const description = "Aide pour le calcul et la déclaration de l'index égalité professionnelle femmes‑hommes";

export const metadata = {
  title,
  description,
  openGraph: {
    title,
    description,
  },
};

const AideSimulation = () => {
  return (
    <Container py="8w">
      <Grid align="center">
        <GridCol md={10} lg={8}>
          <h1>{description}</h1>
          <p>
            Pour consulter la FAQ sur le site du ministère du travail, cliquez{" "}
            <Link
              href="https://travail-emploi.gouv.fr/droit-du-travail/egalite-professionnelle-discrimination-et-harcelement/indexegapro"
              target="_blank"
              rel="noreferrer"
            >
              ici
            </Link>
            .
          </p>

          <Summary className="fr-my-6w">
            <SummaryLink href="#champ-d-application-entree-en-vigueur-et-periode-de-reference">
              Champ d'application, entrée en vigueur et période de référence
            </SummaryLink>
            <SummaryLink href="#effectifs-pris-en-compte">Effectifs pris en compte</SummaryLink>
            <SummaryLink href="#indicateur-ecart-de-remuneration">Indicateur - écart de rémunération</SummaryLink>
            <SummaryLink href="#indicateur-ecart-de-taux-d-augmentation-50-250-salaries">
              Indicateur - écart de taux d’augmentation (50 à 250 salariés)
            </SummaryLink>
            <SummaryLink href="#indicateur-cart-de-taux-d-augmentation-plus-de-250-salaries">
              Indicateur - écart de taux d’augmentation (plus de 250 salariés)
            </SummaryLink>
            <SummaryLink href="#indicateur-cart-de-taux-de-promotion-plus-de-250-salaries">
              Indicateur - écart de taux de promotion (plus de 250 salariés)
            </SummaryLink>
            <SummaryLink href="#indicateur-pourcentage-de-salariees-augment-es-dans-l-ann-e-suivant-leur-retour-de-cong-maternite">
              Indicateur - pourcentage de salariées augmentées dans l’année suivant leur retour de congé maternité
            </SummaryLink>
            <SummaryLink href="#indicateur-nombre-de-salaries-du-sexe-sous-represente-parmi-les-10-plus-hautes-remunerations">
              Indicateur - nombre de salariés du sexe sous-représenté parmi les 10 plus hautes rémunérations
            </SummaryLink>
            <SummaryLink href="#publication-et-transmission">Publication et transmission</SummaryLink>
          </Summary>
          <ContentWithChapter>
            <AnchorLink as="h2" anchor="champ-d-application-entree-en-vigueur-et-periode-de-reference">
              Champ d'application, entrée en vigueur et période de référence
            </AnchorLink>
            <p>
              Toutes les entreprises et unités économiques et sociales (UES) d’au moins 50 salariés doivent calculer et
              publier annuellement leur index de l’égalité professionnelle entre les femmes et les hommes, au plus tard
              le 1er mars de l’année en cours, au titre de l’année précédente.
            </p>
            <p>
              Pour la tranche d'effectifs assujettis, l’entreprise ou l’unité économique et sociale (UES) doit définir
              son assujettissement à la date de l’obligation de publication de l’index, soit le 1er mars. Le calcul des
              effectifs assujettis de l’entreprise ou de l’unité économique et sociale (UES) est celui prévu aux
              articles L.1111-2 et L.1111-3 du code du travail.
              <br />
              En revanche, il ne faut pas confondre les effectifs assujetties pour le calcul de l'assujettissement avec
              les effectifs qui sont pris en compte pour le calcul des indicateurs, cf. partie 2.
            </p>
            <p>
              Les indicateurs sont calculés à partir des données de la période de référence annuelle choisie par
              l’entreprise ou l’unité économique et sociale (UES). Cette période doit être de 12 mois consécutifs et
              précéder l’année de publication. Par exemple, elle doit donc nécessairement s’achever au plus tard le 31
              décembre 2021 pour un Index publié en 2022. Uniquement pour l’indicateur « écart de taux d’augmentation »,
              et uniquement pour une entreprise ou une unité économique et sociale (UES) de 50 à 250 salariés,
              l’employeur peut choisir une période de référence de 3 ans maximum. Ce caractère pluriannuel peut être
              révisé tous les 3 ans.
            </p>
            <AnchorLink as="h2" anchor="effectifs-pris-en-compte">
              Effectifs pris en compte
            </AnchorLink>
            <p>
              Les effectifs pris en compte pour le calcul des indicateurs sont appréciés en effectif physique sur la
              période de référence. Ils doivent être renseignés par{" "}
              <strong>catégorie socio-professionnelle et tranche d’âge</strong>.
            </p>
            <p>
              Les caractéristiques individuelles (âge, catégorie de poste) sont appréciées au dernier jour de la période
              de référence ou au dernier jour de présence du salarié dans l’entreprise.
            </p>
            <p>
              <strong>Ne sont pas pris en compte dans les effectifs&nbsp;:</strong>
            </p>
            <ul>
              <li>les apprentis et les contrats de professionnalisation</li>
              <li>
                les salariés mis à la disposition de l’entreprise par une entreprise extérieure (dont les intérimaires)
              </li>
              <li>les expatriés</li>
              <li>les salariés en pré-retraite</li>
              <li>
                les salariés absents plus de 6 mois sur la période de référence (arrêt maladie, congés sans solde, cdd
                &lt;6mois etc.).
              </li>
            </ul>
            <AnchorLink as="h2" anchor="indicateur-ecart-de-remuneration">
              Indicateur - écart de rémunération
            </AnchorLink>
            <AideSimulationIndicateurUn.Definition />
            <AnchorLink anchor="comment-est-calcul-l-indicateur-1">Comment est calculé l’indicateur</AnchorLink>
            <AideSimulationIndicateurUn.CommentEstCalculéLIndicateur />

            <AnchorLink as="h2" anchor="indicateur-ecart-de-taux-d-augmentation-50-250-salaries">
              Indicateur - écart de taux d’augmentation (50 à 250 salariés)
            </AnchorLink>
            <p>
              La notion d’augmentation individuelle correspond à une augmentation individuelle du salaire de base du
              salarié concerné.
            </p>
            <p>
              La notion d’augmentation individuelle pour le calcul de cet indicateur inclut les augmentations de salaire
              liées à une promotion.
            </p>
            <p>
              L’indicateur est calculé{" "}
              <strong>au niveau de l’entreprise ou de l’unité économique et sociale (UES)</strong>, et non par groupes
              de salariés.
            </p>
            <p>
              Pour le calcul de l’indicateur, l’employeur peut choisir une période de référence pluriannuelle, à partir
              des données des deux ou trois années précédentes. Son caractère pluriannuel peut être révisé tous les
              trois ans.
            </p>
            <p>L’indicateur n’est pas calculable :</p>
            <ul>
              <li>Si aucune augmentation individuelle n’est intervenue au cours de la période de référence</li>
              <li>
                Ou si l’effectif pris en compte pour le calcul des indicateurs ne comporte pas au moins 5 femmes et 5
                hommes
              </li>
            </ul>
            <AnchorLink anchor="comment-est-calcul-l-indicateur-2-50-250">Comment est calculé l’indicateur</AnchorLink>
            <p>
              Le calcul est possible si les effectifs pris en compte pour le calcul des indicateurs comptent au moins 5
              femmes et 5 hommes.
            </p>
            <ol>
              <li>
                <p>Le nombre de femmes et d’hommes augmentés au cours de la période de référence est calculé. </p>
              </li>
              <li>
                Le taux d’augmentation des femmes est calculé en rapportant le nombre de femmes augmentées au nombre
                total de femmes pris en compte pour le calcul. Le taux d’augmentation des hommes est calculé en
                rapportant le nombre d’hommes augmentées au nombre total d’hommes pris en compte pour le calcul.
              </li>
              <li>
                Un premier résultat est &quot;l’écart en points de pourcentage&quot; : il s’agit de la valeur absolue de
                l’écart entre les deux taux calculés en 2. Par exemple, le taux d’augmentation des femmes est de 33,13%
                et le taux d’augmentation des hommes est de 30,00%, l’écart est ainsi de 3,13 points de pourcentage.
              </li>
              <li>
                Un second résultat est &quot;l’écart en nombre équivalent de salariés&quot; : l’écart de taux calculé en
                3 est appliqué au plus petit effectif entre les femmes et les hommes. Il correspond au plus petit nombre
                de salariés qu’il aurait fallu augmenter ou ne pas augmenter pour être à égalité des taux
                d’augmentation. Par exemple, l’écart est de 3,13 points de pourcentage dans une entreprise employant 15
                femmes et 20 hommes, on applique 3,13% aux 15 femmes, le nombre équivalent de salariés est ainsi de
                0,4695.
              </li>
              <li>
                L’écart en points de pourcentage et le nombre équivalent de salariés sont arrondis à la première
                décimale.{" "}
              </li>
              <li>
                Le barème est appliqué à l’écart en points de pourcentage et à l’écart en nombre équivalent de salariés,
                et le résultat correspondant au nombre de points le plus élevé est retenu. En reprenant l’exemple en 4,
                c’est le résultat obtenu en nombre équivalent de salariés, soit 0,5 arrondi, qui sera conservée, la note
                finale obtenu à l’indicateur est ainsi de 35 points.
              </li>
            </ol>
            <p>
              Si l’écart constaté joue en faveur du sexe le moins bien rémunéré (indicateur - écart de rémunération), la
              note maximale de 35 points est attribuée à l’entreprise (considérant que l’employeur a mis en place une
              politique de rattrapage adaptée).
            </p>
            <p>
              <strong>Barème appliqué pour l’obtention de la note à l’indicateur</strong>
            </p>
            <div className="fr-table fr-table--no-scroll fr-table--layout-fixed">
              <table>
                <thead>
                  <tr>
                    <th>Résultats obtenus</th>
                    <th>Nombre de points (Note sur 35)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>inférieur ou égal à 2 points de % Ou à 2 salariés</td>
                    <td>35 points</td>
                  </tr>
                  <tr>
                    <td>
                      supérieur à 2 et inférieur ou égal à 5 points de % Ou supérieur à 2 salariés et inférieur ou égal
                      à 5 salariés
                    </td>
                    <td>25 points</td>
                  </tr>
                  <tr>
                    <td>
                      supérieur à 5 et inférieur ou égal à 10 points de % Ou supérieur à 5 salariés et inférieur ou égal
                      à 10 salariés
                    </td>
                    <td>15 points</td>
                  </tr>
                  <tr>
                    <td>supérieur à 10 points de % ou plus de 10 salariés</td>
                    <td>0 point</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <AnchorLink as="h2" anchor="indicateur-cart-de-taux-d-augmentation-plus-de-250-salaries">
              Indicateur - écart de taux d’augmentation (plus de 250 salariés)
            </AnchorLink>
            <p>
              La notion d’
              <strong>
                augmentation individuelle correspond à une augmentation individuelle du salaire de base du salarié
                concerné
              </strong>
              .
            </p>
            <p>
              La notion d’augmentation individuelle pour le calcul de l’indicateur exclut les augmentations de salaires
              liées à une promotion.
            </p>
            <p>Les salariés sont répartis en 4 groupes selon les quatre catégories socio-professionnelles.</p>
            <p>
              Les groupes ne comportant pas <strong>au moins 10 femmes et 10 hommes</strong> ne sont pas retenus pour le
              calcul de l’indicateur.
            </p>
            <p>L’indicateur n’est pas calculable :</p>
            <ul>
              <li>Si aucune augmentation individuelle n’est intervenue au cours de la période de référence.</li>
              <li>
                Ou si le total des effectifs retenus est inférieur à 40% des effectifs pris en compte pour le calcul des
                indicateurs.
              </li>
            </ul>
            <AnchorLink anchor="comment-est-calcul-l-indicateur-2-250-plus">
              Comment est calculé l’indicateur
            </AnchorLink>
            <p>
              Seuls les groupes comprenant au moins 10 hommes et 10 femmes sont pris en compte pour le calcul de
              l’indicateur.
            </p>
            <ol>
              <li>
                Le pourcentage de femmes et d’hommes augmentés au cours de la période de référence est calculé par
                catégorie socio-professionnelle.
              </li>
              <li>
                L’écart de taux d’augmentations est calculé, en points de pourcentage, pour chacun des groupes, en
                soustrayant le pourcentage de femmes augmentées à celui des hommes augmentés.
              </li>
              <li>
                Les écarts obtenus sont multipliés par le ratio de l’effectif du groupe à l’effectif total des groupes
                pris en compte.
              </li>
              <li>
                Les écarts des différents groupes sont ensuite additionnés pour obtenir l’écart global de taux
                d’augmentations entre les femmes et les hommes.{" "}
              </li>
              <li>
                Le résultat final est la valeur absolue de l’écart global de taux d’augmentations, arrondie à la
                première décimale.
              </li>
            </ol>
            <p>
              Si l’écart constaté joue en faveur du sexe le moins bien rémunéré (indicateur - écart de rémunération), la
              note maximale de 20 points est attribuée à l’entreprise (considérant que l’employeur a mis en place une
              politique de rattrapage adaptée).
            </p>
            <p>
              <strong>Barème appliqué pour l’obtention de la note à l’indicateur</strong>
            </p>
            <div className="fr-table fr-table--no-scroll fr-table--layout-fixed">
              <table>
                <thead>
                  <tr>
                    <th>Résultats obtenus</th>
                    <th>Nombre de points (Note sur 20)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>inférieur ou égal à 2 points de %</td>
                    <td>20 points</td>
                  </tr>
                  <tr>
                    <td>supérieur à 2 et inférieur ou égal à 5 points de %</td>
                    <td>10 points</td>
                  </tr>
                  <tr>
                    <td>supérieur à 5 et inférieur ou égal à 10 points de %</td>
                    <td>5 points</td>
                  </tr>
                  <tr>
                    <td>supérieur à 10 points de %</td>
                    <td>0 point</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <AnchorLink as="h2" anchor="indicateur-cart-de-taux-de-promotion-plus-de-250-salaries">
              Indicateur - écart de taux de promotion (plus de 250 salariés)
            </AnchorLink>
            <p>La notion de promotion correspond au passage à un niveau ou coefficient hiérarchique supérieur.</p>
            <p>Les salariés sont répartis en 4 groupes selon les quatre catégories socio-professionnelles.</p>
            <p>
              Les groupes ne comportant pas <strong>au moins 10 femmes et 10 hommes</strong> ne sont pas retenus pour le
              calcul de l’indicateur.
            </p>
            <p>L’indicateur n’est pas calculable :</p>
            <ul>
              <li>Si aucune promotion n’est intervenue au cours de la période de référence.</li>
              <li>
                Ou si le total des effectifs retenus est inférieur à 40% des effectifs pris en compte pour le calcul des
                indicateurs.
              </li>
            </ul>
            <AnchorLink anchor="comment-est-calcul-l-indicateur-4-250-plus">
              Comment est calculé l’indicateur
            </AnchorLink>
            <p>
              Seuls les groupes comprenant au moins 10 hommes et 10 femmes sont pris en compte pour le calcul de
              l’indicateur.
            </p>
            <ol>
              <li>
                Le pourcentage de femmes et d’hommes promus au cours de la période de référence est calculé par
                catégorie socio-professionnelle.
              </li>
              <li>
                L’écart de taux de promotions est calculé, en points de pourcentage, pour chacun des groupes, en
                soustrayant le pourcentage de femmes promues à celui des hommes promus.
              </li>
              <li>
                Les écarts obtenus sont multipliés par le ratio de l’effectif du groupe à l’effectif total des groupes
                pris en compte.
              </li>
              <li>
                Les écarts des différents groupes sont ensuite additionnés pour obtenir l’écart global de taux
                d’augmentations entre les femmes et les hommes.{" "}
              </li>
              <li>
                Le résultat final est la valeur absolue de l’écart global de taux d’augmentations, arrondie à la
                première décimale.
              </li>
            </ol>
            <p>
              Si l’écart constaté joue en faveur du sexe le moins bien rémunéré (indicateur - écart de rémunération), la
              note maximale de 15 points est attribuée à l’entreprise (considérant que l’employeur a mis en place une
              politique de rattrapage adaptée).
            </p>
            <p>
              <strong>Barème appliqué pour l’obtention de la note à l’indicateur</strong>
            </p>
            <div className="fr-table fr-table--no-scroll fr-table--layout-fixed">
              <table>
                <thead>
                  <tr>
                    <th>Résultats obtenus</th>
                    <th>Nombre de points (Note sur 15)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>inférieur ou égal à 2 points de %</td>
                    <td>15 points</td>
                  </tr>
                  <tr>
                    <td>supérieur à 2 et inférieur ou égal à 5 points de %</td>
                    <td>10 points</td>
                  </tr>
                  <tr>
                    <td>supérieur à 5 et inférieur ou égal à 10 points de %</td>
                    <td>5 points</td>
                  </tr>
                  <tr>
                    <td>supérieur à 10 points de %</td>
                    <td>0 point</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <AnchorLink
              as="h2"
              anchor="indicateur-pourcentage-de-salariees-augment-es-dans-l-ann-e-suivant-leur-retour-de-cong-maternite"
            >
              Indicateur - pourcentage de salariées augmentées dans l’année suivant leur retour de congé maternité
            </AnchorLink>
            <p>
              Seules les salariées qui sont rentrées de congé maternité (ou d’adoption) durant la période de référence
              sont prises en considération.
            </p>
            <p>
              Sont considérées <strong>comme augmentées</strong> toutes salariées <strong>revenues de congé</strong>{" "}
              maternité pendant l’année de référence et ayant bénéficié d’une augmentation (générale ou individuelle) à
              leur retour avant la fin de cette même période.
            </p>
            <p>L’indicateur n’est pas calculable :</p>
            <ul>
              <li>S’il n’y a eu aucun retour de congé maternité (ou adoption) au cours de la période de référence.</li>
              <li>S’il n’y a eu aucune augmentation (individuelle ou collective) au cours des congés maternité.</li>
            </ul>

            <AnchorLink anchor="comment-est-calcul-l-indicateur-5">Comment est calculé l’indicateur</AnchorLink>
            <p>
              L’indicateur correspond au ratio entre le nombre de salariées revenues de congé maternité ou d’adoption
              pendant la période de référence et ayant bénéficié d’une augmentation, avant la fin de celle-ci, si des
              augmentations ont eu lieu pendant leur congé, d’une part, et, d’autre part, le nombre de salariés revenus,
              pendant la période de référence, de congé maternité ou d’adoption, durant lequel il y a eu des
              augmentations salariales.
            </p>
            <p>
              <strong>Barème appliqué pour l’obtention de la note à l’indicateur</strong>
            </p>
            <div className="fr-table fr-table--no-scroll fr-table--layout-fixed">
              <table>
                <thead>
                  <tr>
                    <th>Résultats obtenus</th>
                    <th>Nombre de points (Note sur 15)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>égal à 100%</td>
                    <td>15 points</td>
                  </tr>
                  <tr>
                    <td>inférieur à 100%</td>
                    <td>0 point</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <AnchorLink
              as="h2"
              anchor="indicateur-nombre-de-salaries-du-sexe-sous-represente-parmi-les-10-plus-hautes-remunerations"
            >
              Indicateur - nombre de salariés du sexe sous-représenté parmi les 10 plus hautes rémunérations
            </AnchorLink>
            <p>
              Le nombre de femmes et d’hommes parmi les dix plus hautes rémunérations de l’entreprise ou de l’unité
              économique et sociale (UES).
            </p>
            <AnchorLink anchor="comment-est-calcul-l-indicateur-10-plus-hautes-remunerations">
              Comment est calculé l’indicateur
            </AnchorLink>
            <p>
              Le nombre de salariés du sexe sous-représenté est calculé en comparant le nombre de femmes et le nombre
              d’hommes parmi les 10 plus hautes rémunérations.
            </p>
            <p>
              <strong>Barème appliqué pour l’obtention de la note à l’indicateur</strong>
            </p>
            <div className="fr-table fr-table--no-scroll fr-table--layout-fixed">
              <table>
                <thead>
                  <tr>
                    <th>Résultats obtenus (nombre de salariés du sexe sous-représenté)</th>
                    <th>Nombre de points (Note sur 10)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>4 ou 5 salariés</td>
                    <td>10 points</td>
                  </tr>
                  <tr>
                    <td>2 ou 3 salariés</td>
                    <td>5 points</td>
                  </tr>
                  <tr>
                    <td>0 ou 1 salarié</td>
                    <td>0 point</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <AnchorLink as="h2" anchor="publication-et-transmission">
              Publication et transmission
            </AnchorLink>
            <p>
              Les entreprises doivent transmettre leurs indicateurs et leur note globale de l’Index aux services de
              l’inspection du travail (Dreets). Pour effectuer cette transmission, l’entreprise peut cliquer sur le
              bouton &quot;Poursuivre vers la déclaration&quot; situé en bas de la page &quot;Récapitulatif&quot;.{" "}
            </p>
            <p>
              L’index ainsi que l’ensemble des indicateurs le composant doivent être publiés de manière visible et
              lisible sur le site internet de l’entreprise déclarante ou en l’absence de site internet, communiqué aux
              salariés. Les résultats doivent par ailleurs être communiqués au CSE.
            </p>
            <p>
              Si l’entreprise obtient moins de 75 points, elle doit mettre en œuvre des mesures de correction lui
              permettant d’atteindre au moins 75 points dans un délai de 3 ans. Ces mesures doivent être publiées sur le
              site internet de l’entreprise, sur la même page que les résultats de l’Index, dès lors que l’accord ou la
              décision unilatérale est déposé. Elles doivent également être portées à la connaissance des salariés par
              tout moyen. Les mesures prises sont définies :
            </p>
            <ul>
              <li>dans le cadre de la négociation relative à l’égalité professionnelle,</li>
              <li>
                ou à défaut d’accord, par décision unilatérale de l’employeur et après consultation du comité social et
                économique. Cette décision doit être déposée auprès des services de la DREETS. Elle peut être intégrée
                au plan d’action devant être établi à défaut d’accord relatif à l’égalité professionnelle.
              </li>
            </ul>
            <p>
              Si l’entreprise obtient moins de 85 points, elle doit fixer des objectifs de progression pour chacun des
              indicateurs de l’Index dont la note maximale n’a pas été atteinte. Ces objectifs de progression doivent
              être publiés sur le site internet de l’entreprise, sur la même page que les résultats de l’Index. À défaut
              de site internet, ils doivent être portés à la connaissance des salariés par tout moyen.
            </p>
            <p>
              <strong>Comment est calculé l’index</strong>
            </p>
            <p>
              Les indicateurs calculables doivent représenter au moins 75 points de l’Index pour que celui-ci soit
              calculable.
            </p>
            <p>
              Le nombre total de points ainsi obtenus est ramené sur 100 en appliquant la règle de la proportionnalité.
            </p>
          </ContentWithChapter>
        </GridCol>
      </Grid>
    </Container>
  );
};

export default AideSimulation;
