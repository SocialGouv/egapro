import { AideSimulationIndicateurCinq } from "@components/aide-simulation/IndicateurCinq";
import { AideSimulationIndicateurDeux } from "@components/aide-simulation/IndicateurDeux";
import { AideSimulationIndicateurDeuxEtTrois } from "@components/aide-simulation/IndicateurDeuxEtTrois";
import { AideSimulationIndicateurQuatre } from "@components/aide-simulation/IndicateurQuatre";
import { AideSimulationIndicateurTrois } from "@components/aide-simulation/IndicateurTrois";
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
            <AideSimulationIndicateurUn.Définition />
            <AnchorLink anchor="comment-est-calcul-l-indicateur-1">Comment est calculé l’indicateur</AnchorLink>
            <AideSimulationIndicateurUn.CommentEstCalculéLIndicateur />

            <AnchorLink as="h2" anchor="indicateur-ecart-de-taux-d-augmentation-50-250-salaries">
              Indicateur - écart de taux d’augmentation (50 à 250 salariés)
            </AnchorLink>
            <AideSimulationIndicateurDeuxEtTrois.Définition />
            <AnchorLink anchor="comment-est-calcul-l-indicateur-2-50-250">Comment est calculé l’indicateur</AnchorLink>
            <AideSimulationIndicateurDeuxEtTrois.CommentEstCalculéLIndicateur />

            <AnchorLink as="h2" anchor="indicateur-cart-de-taux-d-augmentation-plus-de-250-salaries">
              Indicateur - écart de taux d’augmentation (plus de 250 salariés)
            </AnchorLink>
            <AideSimulationIndicateurDeux.Définition />
            <AnchorLink anchor="comment-est-calcul-l-indicateur-2-250-plus">
              Comment est calculé l’indicateur
            </AnchorLink>
            <AideSimulationIndicateurDeux.CommentEstCalculéLIndicateur />

            <AnchorLink as="h2" anchor="indicateur-cart-de-taux-de-promotion-plus-de-250-salaries">
              Indicateur - écart de taux de promotion (plus de 250 salariés)
            </AnchorLink>
            <AideSimulationIndicateurTrois.Définition />
            <AnchorLink anchor="comment-est-calcul-l-indicateur-3-250-plus">
              Comment est calculé l’indicateur
            </AnchorLink>
            <AideSimulationIndicateurTrois.CommentEstCalculéLIndicateur />

            <AnchorLink
              as="h2"
              anchor="indicateur-pourcentage-de-salariees-augment-es-dans-l-ann-e-suivant-leur-retour-de-cong-maternite"
            >
              Indicateur - pourcentage de salariées augmentées dans l’année suivant leur retour de congé maternité
            </AnchorLink>
            <AideSimulationIndicateurQuatre.Définition />
            <AnchorLink anchor="comment-est-calcul-l-indicateur-4">Comment est calculé l’indicateur</AnchorLink>
            <AideSimulationIndicateurQuatre.CommentEstCalculéLIndicateur />

            <AnchorLink
              as="h2"
              anchor="indicateur-nombre-de-salaries-du-sexe-sous-represente-parmi-les-10-plus-hautes-remunerations"
            >
              Indicateur - nombre de salariés du sexe sous-représenté parmi les 10 plus hautes rémunérations
            </AnchorLink>
            <AideSimulationIndicateurCinq.Définition />
            <AnchorLink anchor="comment-est-calcul-l-indicateur-10-plus-hautes-remunerations">
              Comment est calculé l’indicateur
            </AnchorLink>
            <AideSimulationIndicateurCinq.CommentEstCalculéLIndicateur />

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
