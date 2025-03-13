import { fr } from "@codegouvfr/react-dsfr";
import Summary from "@codegouvfr/react-dsfr/Summary";
import { AideSimulationIndicateurCinq } from "@components/aide-simulation/IndicateurCinq";
import { AideSimulationIndicateurDeux } from "@components/aide-simulation/IndicateurDeux";
import { AideSimulationIndicateurDeuxEtTrois } from "@components/aide-simulation/IndicateurDeuxEtTrois";
import { AideSimulationIndicateurQuatre } from "@components/aide-simulation/IndicateurQuatre";
import { AideSimulationIndicateurTrois } from "@components/aide-simulation/IndicateurTrois";
import { AideSimulationIndicateurUn } from "@components/aide-simulation/IndicateurUn";
import { Container, ContentWithChapter, Grid, GridCol } from "@design-system";
import { AnchorLink } from "@design-system/client";
import Link from "next/link";

const title = "Aide simulation";
const description =
  "Aide pour le calcul, la publication et la transmission de l'index égalité professionnelle femmes-hommes";

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
            Pour consulter la <strong>FAQ</strong> sur le site du ministère du travail, cliquez{" "}
            <Link
              href="https://travail-emploi.gouv.fr/droit-du-travail/egalite-professionnelle-discrimination-et-harcelement/indexegapro"
              target="_blank"
              rel="noreferrer"
            >
              ici
            </Link>
            .
          </p>
          <p>
            Pour contacter le <strong>référent égalité professionnelle</strong> au sein de votre DREETS, cliquez{" "}
            <Link
              href="https://egapro.travail.gouv.fr/apiv2/public/referents_egalite_professionnelle.xlsx"
              target="_blank"
              rel="noreferrer"
            >
              ici
            </Link>
            .
          </p>

          <Summary
            className="fr-my-6w"
            links={[
              {
                text: "Champ d'application",
                linkProps: {
                  href: "#champ-d-application-entree-en-vigueur",
                },
              },
              {
                text: "Période de référence",
                linkProps: {
                  href: "#periode-de-reference",
                },
              },
              {
                text: "Effectifs pris en compte",
                linkProps: {
                  href: "#effectifs-pris-en-compte",
                },
              },
              {
                text: "Indicateur écart de rémunération",
                linkProps: {
                  href: "#indicateur-ecart-de-remuneration",
                },
              },
              {
                text: "Indicateur écart de taux d’augmentations individuelles (50 à 250 salariés)",
                linkProps: {
                  href: "#indicateur-ecart-de-taux-d-augmentation-50-250-salaries",
                },
              },
              {
                text: "Indicateur écart de taux d’augmentations individuelles hors promotions (plus de 250 salariés)",
                linkProps: {
                  href: "#indicateur-cart-de-taux-d-augmentation-plus-de-250-salaries",
                },
              },
              {
                text: "Indicateur écart de taux de promotions (plus de 250 salariés)",
                linkProps: {
                  href: "#indicateur-cart-de-taux-de-promotion-plus-de-250-salaries",
                },
              },
              {
                text: "Indicateur pourcentage de salariées augmentées dans l’année suivant leur retour de congé maternité",
                linkProps: {
                  href: "#indicateur-pourcentage-de-salariees-augment-es-dans-l-ann-e-suivant-leur-retour-de-cong-maternite",
                },
              },
              {
                text: "Indicateur nombre de salariés du sexe sous-représenté parmi les 10 plus hautes rémunérations",
                linkProps: {
                  href: "#indicateur-nombre-de-salaries-du-sexe-sous-represente-parmi-les-10-plus-hautes-remunerations",
                },
              },
              {
                text: "Index de l’égalité professionnelle femmes-hommes",
                linkProps: {
                  href: "#index-egalite-professionnelle-femmes-hommes",
                },
              },
              {
                text: "Mesures de correction et objectifs de progression",
                linkProps: {
                  href: "#mesures-de-correction-et-objectifs-de-progression",
                },
              },
              {
                text: "Publication",
                linkProps: {
                  href: "#publication",
                },
              },
              {
                text: "Transmission",
                linkProps: {
                  href: "#transmission",
                },
              },
              {
                text: "Textes de référence",
                linkProps: {
                  href: "#textes-de-reference",
                },
              },
            ]}
          />

          <ContentWithChapter>
            <AnchorLink as="h2" anchor="champ-d-application-entree-en-vigueur">
              Champ d'application
            </AnchorLink>
            <p>
              Toutes les entreprises (y compris associations et syndicats) et les unités économiques et sociales (UES)
              reconnues, d’au moins 50 salariés,{" "}
              <strong>
                doivent calculer et publier annuellement leur index de l’égalité professionnelle entre les femmes et les
                hommes, au plus tard le 1er mars
              </strong>{" "}
              de l’année en cours, au titre de l’année précédente. Elles doivent également transmettre leurs résultats
              au comité social et économique (CSE) ainsi qu’aux services du ministre chargé du travail.
            </p>
            <p>
              Concernant les employeurs publics, seuls les établissements publics à caractère industriel et commercial
              et certains établissements publics administratifs qui emploient au moins 50 salariés dans des conditions
              de droit privé sont assujettis à l’obligation de calculer et publier l’index. En revanche, les
              collectivités territoriales ne sont pas assujetties à cette obligation.
            </p>
            <p>
              L’entreprise ou l’unité économique et sociale (UES) doit{" "}
              <strong>définir son assujettissement à la date de l’obligation de publication de l’index</strong>, soit le
              1er mars. Le calcul des effectifs assujettis de l’entreprise ou de l’unité économique et sociale (UES) est
              celui prévu aux articles{" "}
              <Link href="https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000019353569" target="_blank">
                L.1111-2
              </Link>{" "}
              et{" "}
              <Link href="https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000031565369" target="_blank">
                L.1111-3
              </Link>{" "}
              du code du travail.
            </p>
            <p>
              En revanche, il ne faut pas confondre les effectifs assujettis pour le calcul de l'assujettissement avec
              les effectifs qui sont pris en compte pour le calcul des indicateurs, cf. partie 3.
            </p>
            <AnchorLink as="h2" anchor="periode-de-reference">
              Période de référence
            </AnchorLink>
            <p>
              Les indicateurs sont calculés à partir des données de la <strong>période de référence annuelle</strong>{" "}
              choisie par l’entreprise ou l’unité économique et sociale (UES). Cette période doit être de{" "}
              <strong>12 mois consécutifs et précéder l’année de publication</strong>. Par exemple, elle doit donc
              nécessairement s’achever au plus tard le 31 décembre 2024 pour un index publié en 2025.
              <br />
              Ainsi, si l’année civile est choisie comme période de référence, les données seront celles du 1er janvier
              2024 au 31 décembre 2024, pour une publication au 1er mars 2025. La période de référence peut également
              aller du 1er juin 2022 au 31 mai 2024, mais pas du 1er janvier 2022 au 31 décembre 2022 pour une
              publication en 2025.
              <br />
              Uniquement pour l’indicateur « écart de taux d’augmentations », et uniquement pour les entreprises et
              unités économiques et sociales (UES) de 50 à 250 salariés assujettis, une période de référence de 3 ans
              maximum peut être choisie, cf. partie 5.
            </p>
            <p>
              Le choix de la période de référence annuelle ne peut pas être changé, il engage l’employeur d’une année
              sur l’autre ; sauf raisons particulières et exceptionnelles qu’il conviendra dès lors de justifier auprès
              de la DREETS (par exemple un changement dans la constitution de l’UES, avec ventes ou acquisition d’une
              des entreprises la composant, ou difficulté économique modifiant la configuration de l’entreprise). Cette
              stabilité permet une meilleure visibilité sur l’évolution de l’index d’une année sur l’autre.
            </p>
            <AnchorLink as="h2" anchor="effectifs-pris-en-compte">
              Effectifs pris en compte
            </AnchorLink>
            <p>
              L’effectif des salariés à prendre en compte pour le calcul des indicateurs est apprécié en{" "}
              <strong>effectif physique</strong> sur la période de référence annuelle considérée.
            </p>
            <p className={fr.cx("fr-mb-0")}>
              <strong>Ne sont pas pris en compte dans l'effectif&nbsp;:</strong>
            </p>
            <ul>
              <li>les apprentis</li>
              <li>les titulaires d'un contrat de professionnalisation</li>
              <li>
                les salariés mis à la disposition de l’entreprise par une entreprise extérieure (dont les intérimaires)
              </li>
              <li>les expatriés</li>
              <li>les salariés en pré-retraite</li>
              <li>
                les salariés absents plus de 6 mois sur la période de référence (arrêt maladie, congés sans solde, CDD
                inférieur à 6 mois etc.).
              </li>
            </ul>
            <p className={fr.cx("fr-mb-0")}>
              Les <strong>caractéristiques individuelles</strong> des salariés suivantes sont appréciées au dernier jour
              de la période de référence annuelle considérée ou au dernier jour de présence du salarié dans l’entreprise
              :
            </p>
            <ul>
              <li>l'âge</li>
              <li>la catégorie socio-professionnelle</li>
              <li>le niveau ou coefficient hiérarchique en application de la classification de branche</li>
              <li>le niveau ou coefficient hiérarchique en application d’une autre méthode de cotation des postes</li>
            </ul>
            <AnchorLink as="h2" anchor="indicateur-ecart-de-remuneration">
              Indicateur écart de rémunération
            </AnchorLink>
            <AideSimulationIndicateurUn.Définition />
            <AnchorLink anchor="comment-est-calcul-l-indicateur-1">Comment est calculé l’indicateur</AnchorLink>
            <AideSimulationIndicateurUn.CommentEstCalculéLIndicateur />
            <AnchorLink as="h2" anchor="indicateur-ecart-de-taux-d-augmentation-50-250-salaries">
              Indicateur écart de taux d’augmentations individuelles (50 à 250 salariés)
            </AnchorLink>
            <AideSimulationIndicateurDeuxEtTrois.Définition />
            <AnchorLink anchor="comment-est-calcul-l-indicateur-2-50-250">Comment est calculé l’indicateur</AnchorLink>
            <AideSimulationIndicateurDeuxEtTrois.CommentEstCalculéLIndicateur />
            <AnchorLink as="h2" anchor="indicateur-cart-de-taux-d-augmentation-plus-de-250-salaries">
              Indicateur écart de taux d’augmentations individuelles hors promotions (plus de 250 salariés)
            </AnchorLink>
            <AideSimulationIndicateurDeux.Définition />
            <AnchorLink anchor="comment-est-calcul-l-indicateur-2-250-plus">
              Comment est calculé l’indicateur
            </AnchorLink>
            <AideSimulationIndicateurDeux.CommentEstCalculéLIndicateur />
            <AnchorLink as="h2" anchor="indicateur-cart-de-taux-de-promotion-plus-de-250-salaries">
              Indicateur écart de taux de promotions (plus de 250 salariés)
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
              Indicateur pourcentage de salariées augmentées dans l’année suivant leur retour de congé maternité
            </AnchorLink>
            <AideSimulationIndicateurQuatre.Définition />
            <AnchorLink anchor="comment-est-calcul-l-indicateur-4">Comment est calculé l’indicateur</AnchorLink>
            <AideSimulationIndicateurQuatre.CommentEstCalculéLIndicateur />
            <AnchorLink
              as="h2"
              anchor="indicateur-nombre-de-salaries-du-sexe-sous-represente-parmi-les-10-plus-hautes-remunerations"
            >
              Indicateur nombre de salariés du sexe sous-représenté parmi les 10 plus hautes rémunérations
            </AnchorLink>
            <AideSimulationIndicateurCinq.Définition />
            <AnchorLink anchor="comment-est-calcul-l-indicateur-10-plus-hautes-remunerations">
              Comment est calculé l’indicateur
            </AnchorLink>
            <AideSimulationIndicateurCinq.CommentEstCalculéLIndicateur />
            <AnchorLink as="h2" anchor="index-egalite-professionnelle-femmes-hommes">
              Index de l’égalité professionnelle femmes-hommes
            </AnchorLink>
            <AnchorLink anchor="comment-est-calcul-l-index">Comment est calculé l’index</AnchorLink>
            <p>L’index correspond à la somme des points obtenus pour chacun des indicateurs.</p>
            <p>
              Lorsqu’un ou plusieurs indicateurs ne sont pas calculables, le nombre total de points obtenus aux
              indicateurs calculables est ramené sur 100 en appliquant la règle de la proportionnalité.
            </p>
            <p>
              Dès lors que le nombre maximum de points pouvant être obtenus, au total, avant application de la règle de
              la proportionnalité, est inférieur à 75 points, l’index n’est pas calculable pour la période de référence
              annuelle considérée.
            </p>
            <AnchorLink as="h2" anchor="mesures-de-correction-et-objectifs-de-progression">
              Mesures de correction et objectifs de progression
            </AnchorLink>
            <p>
              Les entreprises et unités économiques et sociales (UES) ayant obtenu un{" "}
              <strong>index inférieur à 75 points</strong> doivent définir des{" "}
              <strong>mesures de correction adéquates et pertinentes</strong> leur permettant d’atteindre au moins 75
              points dans un délai de 3 ans, le cas échéant en allouant une enveloppe de rattrapage salariale.{" "}
            </p>
            <p>
              Les entreprises et unités économiques et sociales (UES) ayant obtenu un{" "}
              <strong>index inférieur à 85 points</strong> doivent fixer des <strong>objectifs de progression</strong>{" "}
              pour chacun des indicateurs calculables de l’index dont la note maximale n’a pas été atteinte, leur
              permettant d’atteindre au moins 85 points.
            </p>
            <p>
              Les mesures de correction et les objectifs de progression sont définis :
              <ul>
                <li>dans le cadre de la négociation obligatoire sur l’égalité professionnelle</li>
                <li>
                  ou à défaut d’accord, par décision unilatérale de l’employeur et après consultation du comité social
                  et économique. Cette décision doit être déposée auprès des services de la DREETS. Elle peut être
                  intégrée au plan d’action devant être établi à défaut d’accord relatif à l’égalité professionnelle.
                </li>
              </ul>
            </p>
            <AnchorLink as="h2" anchor="publication">
              Publication
            </AnchorLink>

            <AnchorLink anchor="publication-index-indicateurs">Index et ses indicateurs</AnchorLink>
            <p>
              La <strong>note obtenue à l’index</strong> ainsi que celle{" "}
              <strong>obtenue à chacun des indicateurs</strong> doivent être{" "}
              <strong>publiés de manière visible et lisible sur le site internet</strong> de l’entreprise, lorsqu’il en
              existe un (y compris lorsque l’entreprise fait partie d’un groupe ou d’une unité économique et sociale),{" "}
              <strong>chaque année au plus tard le 1er mars</strong>, et devront rester en ligne au moins jusqu’à la
              publication des résultats l’année suivante. Une publication sur le site intranet de l’entreprise n’est
              donc pas suffisante. Par exemple, l’entreprise peut publier ses résultats sur la page d’accueil du site
              internet ou dans une rubrique facilement identifiable et accessible en deux ou trois clics.
              <br />A défaut de site internet propre à l’entreprise, l’index et ses indicateurs doivent être publiés sur
              le site du groupe ou de l’unité économique et sociale auquel l’entreprise appartient, s’il en existe un.
            </p>
            <p>
              En <strong>l’absence de site internet</strong> (au niveau de l’entreprise, du groupe ou de l’unité
              économique et sociale), l’index et ses indicateurs doivent être{" "}
              <strong>communiqués aux salariés par tout moyen</strong> (courrier papier ou électronique, affichage…).
            </p>
            <p>
              Lorsque l’index n’est pas calculable, l’entreprise n’a pas l’obligation de publication de cet index.
              Toutefois, l’entreprise est tenue de publier la note obtenue aux indicateurs calculables. Lorsqu’un
              indicateur n’est pas calculable, l’entreprise n’a pas l’obligation de publication de cet indicateur.
            </p>
            <AnchorLink anchor="mesures-de-correction-et-objectifs-de-progression">
              Mesures de correction et objectifs de progression
            </AnchorLink>
            <p>
              Les mesures de correction et les objectifs de progression de chacun des indicateurs doivent être{" "}
              <strong>publiés sur le site internet</strong> de l’entreprise lorsqu’il en existe un,{" "}
              <strong>sur la même page que les résultats obtenus à l’index</strong>, dès lors que l’accord ou la
              décision unilatérale est déposé.
            </p>
            <p>
              Les <strong>mesures de correction</strong> doivent rester consultables jusqu’à ce que l’entreprise ou
              l’unité économique et sociale obtienne un index au moins égal à 75 points. Elles doivent par ailleurs être{" "}
              <strong>communiquées aux salariés par tout moyen</strong> (courrier papier ou électronique, affichage…).
            </p>
            <p>
              Les objectifs de progression doivent rester consultables jusqu’à ce que l’entreprise ou l’unité économique
              et sociale obtienne un index au moins égal à 85 points. À défaut de site internet, ils doivent être
              communiqués aux salariés par tout moyen (courrier papier ou électronique, affichage…).
            </p>
            <AnchorLink as="h2" anchor="transmission">
              Transmission
            </AnchorLink>
            <p>
              Les entreprises et unités économiques et sociales (UES) doivent{" "}
              <strong>transmettre leurs résultats</strong>, ainsi que toutes les informations nécessaires, au{" "}
              <strong>comité social et économique</strong> (CSE) et aux{" "}
              <strong>services du ministre chargé du travail</strong>.
            </p>
            <AnchorLink anchor="comite-social-et-economique">Comité social et économique</AnchorLink>
            <p>
              Les résultats doivent être transmis au CSE{" "}
              <strong>en amont de la première réunion qui suit la publication</strong> de l’index et de ses indicateurs.
              En cas de modification des données transmises aux services du ministre chargé du travail, le CSE doit être
              à nouveau informé.
            </p>
            <p>
              Les résultats sont mis à la disposition du CSE, via la{" "}
              <strong>base de données économiques et sociales (BDESE)</strong>. Ils sont présentés, pour le premier
              indicateur relatif à l’écart de rémunération, par tranche d’âge et par catégorie de postes équivalents
              (soit par catégorie socio-professionnelle, soit par niveau ou coefficient hiérarchique en application de
              la classification de branche ou d’une autre méthode de cotation des postes). Les résultats des indicateurs
              relatifs aux écarts de taux d’augmentations et de promotions sont présentés par catégorie
              socio-professionnelle. Le CSE est destinataire a minima de toutes les informations transmises aux services
              du ministre chargé du travail.
            </p>
            <p>
              Les informations mentionnées ci-dessus sont accompagnées de toutes les précisions utiles à leur
              compréhension, notamment relatives à la méthodologie appliquée, la répartition des salariés par catégorie
              socio-professionnelle ou par niveau ou coefficient hiérarchique et, le cas échéant, des mesures de
              correction envisagées ou déjà mises en œuvre.
            </p>
            <p>
              Dans le cas où certains indicateurs ne peuvent pas être calculés, l’information du CSE sur les indicateurs
              doit quand même être assurée et est accompagnée de toutes les précisions expliquant les raisons pour
              lesquelles les indicateurs n’ont pas pu être calculés.
            </p>
            <p>
              Les entreprises et unités économiques et sociales ayant obtenu un index inférieur à 75 points doivent
              transmettre au CSE, via la BDESE, une fois l’accord ou la décision déposé, leurs objectifs de progression
              ainsi que les modalités de publication de ces objectifs et des mesures de correction.
            </p>
            <p>
              Les entreprises et unités économiques et sociales ayant obtenu un index compris entre 75 et 84 points
              inclus doivent transmettre au CSE, via la BDESE, une fois l’accord ou la décision déposé, leurs objectifs
              de progression ainsi que les modalités de publication de ces objectifs.
            </p>
            <AnchorLink anchor="services-du-ministere-charge-du-travail">
              Services du ministre chargé du travail
            </AnchorLink>
            <p>
              Les résultats de l’index et de ses indicateurs, ainsi que toutes les informations nécessaires, doivent
              être transmis aux services du ministre chargé du travail{" "}
              <strong>chaque année au plus tard le 1er mars</strong>, via un formulaire de déclaration accessible sur le{" "}
              <Link href="https://egapro.travail.gouv.fr/index-egapro" target="_blank">
                site Egapro
              </Link>
              .<br />
              Si l’index est calculé au niveau de l’unité économique et sociale (UES), une seule déclaration doit être
              transmise aux services du ministre chargé du travail et l'entreprise déclarant pour le compte de l'UES
              doit être celle ayant effectué la déclaration les années précédentes.
            </p>
            <p>
              Pour les entreprises et unités économique et sociales ayant obtenu un index inférieur à 75 points, les
              objectifs de progression ainsi que les modalités de publication de ces objectifs et des mesures de
              correction doivent être transmis aux services du ministre chargé du travail, via un formulaire de
              déclaration accessible sur le{" "}
              <Link href="https://egapro.travail.gouv.fr/index-egapro" target="_blank">
                site Egapro
              </Link>
              , dès que l’accord ou la décision est déposé.
            </p>
            <p>
              Pour les entreprises et unités économique et sociales ayant obtenu un index compris entre 75 et 84 points
              inclus, les objectifs de progression ainsi que les modalités de publication de ces objectifs doivent être
              transmis aux services du ministre chargé du travail, via un formulaire de déclaration accessible sur le{" "}
              <Link href="https://egapro.travail.gouv.fr/index-egapro" target="_blank">
                site Egapro
              </Link>
              , dès que l’accord ou la décision est déposé.
            </p>
            <p>
              Les informations contenues dans les formulaires de déclaration sont listées dans l’arrêté du 17 août 2022
              définissant les modèles de présentation et les modalités de transmission à l'administration des
              indicateurs et du niveau de résultat en matière d'écart de rémunération entre les femmes et les hommes
              dans l'entreprise.
            </p>
            <AnchorLink as="h2" anchor="textes-de-reference">
              Textes de référence
            </AnchorLink>
            <ul>
              <li>
                Décret n°2019-15 du 08 janvier 2019 portant application des dispositions visant à supprimer les écarts
                de rémunération entre les femmes et les hommes dans l'entreprise et relatives à la lutte contre les
                violences sexuelles et les agissements sexistes au travail.
              </li>
              <li>
                Décret n°2019-382 du 29 avril 2019 portant application des dispositions de l'article 104 de la loi n°
                2018-771 du 5 septembre 2018 pour la liberté de choisir son avenir professionnel relatif aux obligations
                en matière d'égalité professionnelle entre les femmes et les hommes dans l'entreprise.
              </li>
              <li>
                Décret n°2021-265 du 10 mars 2021 relatif aux mesures visant à supprimer les écarts de rémunération
                entre les femmes et les hommes dans l’entreprise et portant application de l’article 244 de la loi n°
                2020-1721 du 29 décembre 2020 de finances pour 2021.
              </li>
              <li>
                Décret n° 2022-243 du 25 février 2022 relatif aux mesures visant à supprimer les écarts de rémunération
                entre les femmes et les hommes dans l'entreprise prévues par l'article 13 de la loi visant à accélérer
                l'égalité économique et professionnelle et par l'article 244 de la loi n° 2020-1721 du 29 décembre 2020
                de finances pour 2021.
              </li>
              <li>
                Arrêté du 17 août 2022 définissant les modèles de présentation et les modalités de transmission à
                l'administration des indicateurs et du niveau de résultat en matière d'écart de rémunération entre les
                femmes et les hommes dans l'entreprise.
              </li>
            </ul>
          </ContentWithChapter>
        </GridCol>
      </Grid>
    </Container>
  );
};

export default AideSimulation;
