import { FAQPart, FAQSection } from "../globals"

export const faqData: FAQPart = {
  champApplication: {
    title: "Champ d’application et entrée en vigueur",
    qr: [
      {
        question: "À qui s'applique l'obligation de calcul et de publication de l'Index? ",
        reponse: [
          "Le calcul de l’Index est obligatoire pour les entreprises, les associations et les syndicats, qui emploient au moins 50 salariés.",
          "En ce qui concerne les employeurs publics, seuls les établissements publics à caractère industriel et commercial et certains établissements publics administratifs qui emploient au moins 50 salariés dans des conditions de droit privé sont assujettis à l'obligation de publier l'Index. En revanche, les collectivités territoriales ne sont pas assujetties à cette obligation.",
        ],
      },
      {
        question:
          "Comment calcule-t-on les seuils d'effectifs des entreprises pour apprécier leur assujettissement à l'obligation de publication de l'Index ?",
        reponse: [
          "Pour apprécier le seuil d'effectifs de l'entreprise permettant de définir la date d'assujettissement à l'obligation de publication de l'Index, l'entreprise doit se fonder sur l'effectif à la date de l'obligation de publication de l'Index. Le calcul des effectifs de l'entreprise est celui prévu aux articles L.1111-2 et L.1111-3 du code du travail.",
          "En revanche, il ne faut pas confondre les effectifs pris en compte pour le calcul des seuils avec les effectifs qui sont examinés pour le calcul de l'index (ex: les salariés absents plus de la moitié de la période de référence annuelle considérée sont exclus des effectifs étudiés pour les indicateurs ; cf. questions 1.3  et paragraphes 2 des annexes du décret du 8 janvier 2019). ",
        ],
      },
      {
        question:
          "À quel niveau l'Index doit-il être calculé, par exemple dans le cas d'une entreprise à établissements multiples, d'un groupe  ou d'une unité économique et sociale (UES)?",
        reponse: [
          "L’Index est calculé au niveau de chaque entreprise constituant une entité légale.",
          "Lorsque l'entreprise comporte plusieurs établissements, le calcul des indicateurs est effectué au niveau de l'entreprise, et non de l'établissement.",
          "Lorsque plusieurs sociétés forment un groupe, les indicateurs doivent être calculés au niveau de chaque entreprise composant le groupe.",
          "En cas de constitution d’un comité social et économique (CSE) au niveau d’une unité économique et sociale (UES) reconnue par accord collectif, ou par décision de justice entre plusieurs entreprises juridiquement distinctes, les indicateurs sont calculés au niveau de l’UES.",
        ],
      },
      {
        question:
          "Le seuil d'effectifs entraînant l'assujettissement à l'obligation de calculer l'Index s'apprécie-t-il au niveau de l'unité économique et sociale (UES) quand il en existe une ?",
        reponse: [
          "Oui. Dès lors que l'unité économique et sociale (UES) a été reconnue comme telle et comprend au moins 50 salariés à la date de l'obligation de publication de l'Index, elle est soumise à l'obligation de calcul de l'Index, quelle que soit la taille des entreprises qui la composent.",
          "Par exemple, une UES comprenant 3 entreprises, respectivement de 100, 80 et 20 salariés est soumise à l'obligation de calculer l'Index. L'effectif pris en compte pour le calcul de l'Index sera alors l'effectif total de l'UES.",
          "En revanche, l'obligation de publier l'Index repose sur chaque entreprise comprenant au moins 50 salariés, et non l'UES.",
        ],
      },
      {
        question:
          "Une entreprise ayant déjà publié son Index en 2019 (sur une période de référence se terminant en 2018) est-elle tenue de le faire à nouveau au 1er mars 2020 (sur une période de référence se terminant en 2019) ?",
        reponse: [
          "Oui, toutes les entreprises d’au moins 50 salariés doivent publier leur Index au plus tard le 1er mars 2020 (sur une période de référence se terminant en 2019), même si elles ont déjà procédé à cette publication en 2019.",
        ],
      },
    ],
  },
  periodeReference: {
    title: "Période de référence",
    qr: [
      {
        question:
          "Les entreprises d'au moins 50 salariés assujetties à l'obligation de publication au 1er mars 2020 doivent-elles calculer leurs indicateurs sur la base des données de l'année 2019 ?",
        reponse: [
          "Les indicateurs sont calculés à partir des données de la période de référence annuelle que l’employeur a choisie. Cette période de référence, de 12 mois consécutifs, est celle qui précède l’année de publication : elle doit donc nécessairement s’achever au plus tard le 31 décembre 2019 pour un Index publié en 2020.",
          "Ainsi, si l’entreprise d'au moins 50 salariés a choisi l’année civile comme année de référence, les données seront celles du 1er janvier 2019 au 31 décembre 2019, pour une publication au 1er mars 2020. La période de référence peut également aller du 1er juin 2018 au 31 mai 2019, mais pas du 1er janvier 2018 au 31 décembre 2018 pour une publication en 2020.",

          "Attention : dans les entreprises de 50 à 250 salariés, l'employeur peut décider de calculer l’indicateur relatif à l'écart de taux augmentations individuelles sur une période de référence pluriannuelle, à partir des données des 2 ou 3 années précédentes. Son caractère pluriannuel peut alors être révisé tous les 3 ans.",
          "Par exemple, si l’entreprise a choisi l’année civile 2019 comme période de référence pour le calcul de son Index en 2020, elle pourra calculer son indicateur relatif à l'écart de taux augmentations individuelles sur une période de référence de 2 ou 3 ans.",
          "Cette période de référence pourra ainsi aller respectivement du 1er janvier 2018 au 31 décembre 2019, ou du 1er janvier 2017 au 31 décembre 2019. En 2023, elle pourra alors réviser le caractère pluriannuel de cette période de référence.",
        ],
      },
      {
        question: "Est-il possible de changer de période annuelle de référence d'une année sur l'autre ?",
        reponse: [
          "Non, le choix de la période annuelle de référence engage l'employeur d'une année sur l'autre ; sauf raisons particulières et exceptionnelles qu'il conviendra dès lors de justifier auprès de la Direccte (par exemple un changement dans la constitution de l'UES, avec ventes ou acquisition d'une des entreprises la composant, ou difficulté économique modifiant la configuration de l'entreprise). Cette stabilité permet une meilleure visibilité sur l'évolution de la note obtenue d'une année sur l'autre.",
        ],
      },
    ],
  },
  effectifs: {
    title: "Effectifs à prendre en compte pour le calcul des indicateurs",
    qr: [
      {
        question: "Quels sont les effectifs à prendre en considération pour calculer les indicateurs ?",
        reponse: [
          "L’effectif des salariés à prendre en compte pour le calcul des indicateurs est apprécié sur la période de référence annuelle choisie par l’employeur.",
          "Sont obligatoirement exclus de ce périmètre : les apprentis, les titulaires d’un contrat de professionnalisation, les salariés mis à la disposition de l’entreprise par une entreprise extérieure (dont les intérimaires), les salariés expatriés, ainsi que les salariés absents plus de la moitié de la période de référence annuelle considérée (sauf pour le calcul de l'indicateur relatif au retour de congé maternité - cf. rubrique G).",
          "Les salariés en pré-retraite, bien qu’ils apparaissent dans les effectifs, sont rémunérés mais ne sont pas présents, sont par ailleurs exclus.",
        ],
      },
      {
        question:
          "Les effectifs qui ont quitté l’entreprise avant la fin de la période de référence mais qui ont été présents plus de 6 mois doivent-ils être pris en compte pour le calcul des indicateurs ?",
        reponse: [
          "Oui, ils doivent être pris en compte. Leurs caractéristiques individuelles sont alors appréciées au dernier jour de présence dans l’entreprise. Par caractéristiques individuelles on entend l’âge, le niveau ou coefficient hiérarchique en application de la classification de branche, du niveau selon la méthode de cotation des postes de l’entreprise, ou de la catégorie socio-professionnelle (CSP). Par exemple s’ils ont quitté l’entreprise au 1er septembre, ce sont leurs caractéristiques au 31 août qui seront prises en compte.",
          "Un salarié promu avec un changement de catégorie socio-professionnelle en cours d’année sera pris en compte dans la CSP effective au 31 décembre (ou au dernier jour) de l’année étudiée.",
        ],
      },
      {
        question:
          "L’obligation de présence du salarié pendant au moins 6 mois pour sa prise en compte dans les effectifs est-elle obligatoirement continue ?",
        reponse: ["Non, cette période de présence d’au moins 6 mois peut être continue ou discontinue."],
      },
      {
        question:
          "Qu’entend-on par une absence de plus de la moitié de la période de référence annuelle ? S’agit-il d’une période de suspension de rémunération et d’indemnisation ou de l’absence physique de la personne ?",
        reponse: [
          "Pour déterminer quels sont les salariés absents plus de la moitié de la période de référence, on exclut les salariés dont le contrat de travail a été suspendu pendant plus de six mois au cours de cette période. Cela amène à exclure les salariés en congé maladie, en congé maternité (sauf pour l'indicateur relatif au retour de congé maternité - cf. rubrique G), ou en congé sans solde et qui ont, à ce titre, été absents sur une durée de plus de 6 mois.",
          "En revanche, les congés payés sont pris en compte comme du temps de présence.",
          "Les salariés titulaires d’un contrat de travail à durée déterminée de moins de 6 mois sont également exclus.",
        ],
      },
      {
        question:
          "Les salariés d’une société extérieure détachés au sein de l’entreprise sont-ils inclus dans le périmètre des effectifs à prendre en compte pour le calcul des indicateurs ?",
        reponse: [
          "Les salariés d’une société extérieure détachés au sein de l’entreprise ne sont pas pris en compte au même titre que les salariés mis à la disposition de l’entreprise par une entreprise extérieure (cf. paragraphe 2 des annexes du décret du 8 janvier 2019).",
        ],
      },
      {
        question: "Faut-il prendre en compte les salariés placés en activité partielle (chômage partiel) ?",
        reponse: [
          "Les salariés placés en activité partielle ne sont pas pris en compte dans les effectifs pour le calcul de l’Index pour les périodes où ils ne sont pas en activité.",
        ],
      },
      {
        question:
          "Les effectifs sont-ils appréciés sur la totalité de la période de référence ou au dernier jour de celle-ci ?",
        reponse: [
          "L’effectif des salariés pris en compte pour le calcul des indicateurs est apprécié sur la période de référence annuelle et non au dernier jour de celle-ci. Ainsi, qu’il soit à temps partiel ou à temps plein, si le salarié était présent plus de la moitié de la période de référence et répond aux conditions du décret, il compte pour 1 (cf. 2. des annexes).",
        ],
      },
      {
        question:
          "Les salariés d’une entreprise de travail temporaire en mission au sein d’une entreprise utilisatrice sont-ils inclus dans le périmètre des effectifs de l’entreprise de travail temporaire pour le calcul des indicateurs ?",
        reponse: [
          "Quand bien même l’entreprise de travail temporaire est l’employeur des salariés intérimaires, elle leur applique les politiques salariales des différentes entreprises utilisatrices. L’entreprise de travail temporaire doit donc mesurer son Index uniquement en se fondant sur ses salariés permanents.",
          "De même, les salariés en portage salarial dans une entreprise cliente ne sont pas pris en compte dans le calcul de l’Index de cette entreprise.",
        ],
      },
      {
        question:
          "Les cadres dirigeants sont-ils pris en compte dans l’effectif des salariés pour le calcul des indicateurs ? ",
        reponse: [
          "Oui, les cadres dirigeants doivent être pris en compte pour le calcul des indicateurs dès lors qu’ils sont salariés de l’entité légale concernée.",
        ],
      },
      {
        question:
          "Pour calculer les effectifs à prendre en compte, faut-il exclure les personnes absentes plus de 6 mois dont les absences sont injustifiées ?",
        reponse: ["Oui, les personnes absentes plus de six mois pour absence injustifiée sont exclues du calcul."],
      },
      {
        question:
          "Les alternants embauchés par la suite en CDI au cours de la période de référence, avec une reprise d’ancienneté au premier jour de leur alternance, sont-ils pris en compte dans l’effectif des salariés pour le calcul des indicateurs ?",
        reponse: [
          "Le décret précise que les apprentis et les titulaires d’un contrat de professionnalisation ne sont pas pris en compte pour le calcul des indicateurs.",
          "S’ils sont embauchés en CDI à la suite de leur alternance, ils seront pris en compte uniquement si la période passée en CDI est supérieure à six mois. Dans cette hypothèse, l’assiette de rémunération prise en compte sera celle qui porte sur la période passée en CDI.",
        ],
      },
      {
        question: "Quelle est la définition des 4 catégories socio-professionnelles (CSP) retenue dans le décret ?",
        reponse: [
          "La définition des quatre CSP retenues dans le décret correspond à la nomenclature de l’INSEE. Les 4 CSP prévues par le décret du 8 janvier 2019 étant les suivantes : Ouvriers / Employés / Techniciens et agents de maîtrise/ Ingénieurs et cadres.",
        ],
      },
    ],
  },
  remuneration: {
    title: "Éléments de la rémunération pris en compte",
    qr: [
      {
        question:
          "Pour le calcul de l’Index, le salaire de référence peut-il être le salaire contractuel de base versé ?",
        reponse: [
          "Non. Au sens de l’article L. 3221-3 du code du travail, la rémunération à prendre en compte comprend non seulement le salaire ou traitement ordinaire de base ou minimum, mais également tous les autres avantages et accessoires payés, directement ou indirectement, en espèces ou en nature, par l’employeur au salarié en raison de l’emploi de ce dernier.",
          "Sont exclues de l’assiette de rémunération : les indemnités de licenciement (et de rupture conventionnelle) , les indemnités de fin CDD (notamment la prime de précarité), les indemnités de départ à la retraite, ainsi que les indemnités compensatrices de congés payés, versées en fin de contrat.",
          "En revanche, les indemnités de congés payés sont prises en compte dans l'assiette de rémunération.",
          "Sont par ailleurs exclus les primes liées à une sujétion particulière (qui ne concerne pas la personne du salarié), les primes d’ancienneté, les heures supplémentaires, les heures complémentaires (y compris effectuées dans le cadre de compléments d’heures) et les versements effectués au titre de l’intéressement et de la participation.",
        ],
      },
      {
        question: "Dans le détail, quels types de primes faut-il exclure ou prendre en compte ?",
        reponse: [
          "Sont exclues du calcul de l’index, les primes liées à une sujétion particulière qui ne concerne pas la personne du salarié. Ces primes se rapportent non pas à la personne du salarié ou à ses performances, mais aux contraintes ou caractéristiques liées à son poste de travail (ex : prime de salissure, prime de froid, prime d’ouverture / de fermeture d’un magasin, prime d’astreinte, etc.).",
          "Les primes collectives attribuées à tous les salariés, quel que soit leur poste de travail, sont à inclure dans la rémunération (par exemple : prime de transport ou prime de vacances).",
          'Les "bonus", les commissions sur produits, les primes d’objectif liées aux performances individuelles du salarié, variables d’un individu à l’autre pour un même poste, sont prises en compte dans l’assiette de rémunération.',
        ],
      },
      {
        question:
          "Le salaire de référence à prendre en compte pour le calcul des indicateurs renvoie-t-il à une rémunération brute ?",
        reponse: [
          "Oui, la rémunération prise en compte pour le calcul des indicateurs correspond à la rémunération annuelle brute moyenne, reconstituée en équivalent temps plein sur la période de référence annuelle considérée.",
        ],
      },
      {
        question: "Comment traiter le cas des rémunérations et majorations versées un dimanche ou un jour férié ?",
        reponse: [
          "Pour les heures de travail réalisées un jour férié, le montant de base du salaire est pris en compte, mais pas la majoration, qui correspond à une sujétion particulière liée à la fonction.",
          "Pour les heures travaillées le dimanche, incluses dans l’horaire hebdomadaire, le montant de base est pris en compte, mais pas la majoration (sujétion particulière liée à la fonction).",
          "En revanche, dans le cas du travail dominical effectué en plus de l’horaire hebdomadaire prévu, l’intégralité de la rémunération est exclue au même titre que les heures complémentaires et supplémentaires.",
        ],
      },
      {
        question: "Faut-il reconstituer la rémunération d’une personne absente une partie de la période de référence ?",
        reponse: [
          "La rémunération de chaque salarié, au sens de l’article L. 3221-3, est reconstituée en équivalent temps plein sur la période de référence annuelle considérée.",
          "Par exemple, un salarié parti en congé sabbatique pendant 4 mois sera bien inclus dans les effectifs pris en compte pour le calcul des indicateurs. Sa rémunération sera reconstituée en équivalent temps plein sur les 12 mois.",
        ],
      },
      {
        question:
          "L’employeur doit-il prendre en compte la rémunération variable théorique au contrat ou la rémunération réellement versée ?",
        reponse: [
          "L’employeur doit prendre en compte la rémunération réellement versée, de laquelle sont exclus les indemnités de licenciement (ou de rupture conventionnelle), les indemnités de fin CDD (notamment la prime de précarité) , les indemnités de départ à la retraite, les primes liées à une sujétion particulière qui ne concerne pas la personne du salarié, les primes d’ancienneté, les heures supplémentaires, les heures complémentaires (y compris effectuées dans le cadre de compléments d’heures) ainsi que les versements effectués au titre de l’intéressement et de la participation.",
          "Ainsi, les bonus ou les primes d’objectifs, variables d’une année sur l’autre ou d’un mois sur l’autre, dont le montant théorique est fixé à l’avance mais qui sont effectivement versés sur l’exercice suivant, ne sont pris en compte que lorsqu’ils sont effectivement versés.",
          "Pour les salariés absents une partie de l’année de référence, et qui n’ont à ce titre pas touché de bonus ou de primes variables, il faut donc compter 0.",
        ],
      },
      {
        question:
          "Dans le cas où les salariés ont le choix entre un véhicule de fonction et une indemnité ou crédit déplacement, doit-on exclure ces bénéfices de l’assiette de rémunération ?",
        reponse: [
          "Dans le cas où la voiture de fonction peut être utilisée à des fins personnelles, il s’agit d’un avantage en nature, qui doit être pris en compte dans l’assiette de rémunération. De même, l’indemnité ou crédit déplacement, qui est l’équivalent en espèces de l’avantage tiré d’une voiture de fonction pouvant être utilisée à des fins personnelles, relève des avantages en espèces devant être pris en compte dans l’assiette.",
        ],
      },
      {
        question:
          "Les actions, stock-options ou compensations différées en actions perçues par certains salariés doivent-elles être prises en compte dans l’assiette de rémunération ?",
        reponse: [
          "Non, ces éléments ne doivent pas être pris en compte dans l’assiette de rémunération car ils ne sont pas attribués en contrepartie d’un travail, mais correspondent à des gains liés au statut d’actionnaire. Ces éléments de rémunération sont optionnels, le salarié ayant le choix d’y souscrire ou non. De plus, leur versement est effectué de manière différée dans le temps.",
        ],
      },
      {
        question:
          "Faut-il reconstituer la rémunération d’un salarié absent pour maladie une partie de la période de référence (moins de six mois) mais dont l’absence bénéficie d’un maintien total de salaire ?",
        reponse: [
          "Pour mémoire, les périodes où le contrat de travail du salarié est suspendu ne sont pas prises en compte dans le calcul.",
          "La rémunération du salarié absent pour maladie pendant une période inférieure à six mois est reconstituée en équivalent temps plein sur la période de référence.",
        ],
      },
      {
        question:
          "La rémunération d’un salarié à temps partiel doit-elle être reconstituée en équivalent temps plein sur les 12 mois de la période de référence ?",
        reponse: [
          "Oui, la rémunération des salariés à temps partiel est reconstituée en équivalent temps plein sur la période de référence annuelle considérée.",
        ],
      },
      {
        question:
          "Le compte épargne-temps (CET) doit-il être inclus dans les éléments de la rémunération à prendre en compte ?",
        reponse: [
          "Le compte épargne-temps (CET) permet au salarié d’accumuler des droits à congé rémunéré en contrepartie des périodes de congé ou de repos non pris ou des sommes qu’il y a affectées. Il peut également, en accord avec l’employeur et à sa demande, bénéficier d’une rémunération, immédiate ou différée.",
          "Certaines de ces sommes peuvent correspondent à des heures supplémentaires, complémentaires qui sont exclues de l’assiette de rémunération. Dans la mesure où il n’est pas possible de faire la distinction au moment du versement, les sommes issues de la monétisation du CET ne doivent pas être prises en compte.",
        ],
      },
    ],
  },
  indicateur1: {
    title: "Indicateur - écart de rémunération",
    qr: [
      {
        question:
          "Est-il possible de répartir les salariés par ancienneté plutôt que par tranche d’âge, ou de modifier les tranches d’âge ?",
        reponse: [
          "Non, cela n’est pas possible d’adapter ce critère pour comparer les écarts de rémunération. La répartition par tranches d’âge facilite la collecte et le traitement de données objectives, contrairement à une répartition par ancienneté, plus difficile à définir. Les quatre tranches d’âge définies dans le décret sont les suivantes : - moins de 30 ans ; - de 30 à 39 ans ; - de 40 à 49 ans ; - et 50 ans et plus.",
          "Il n’est pas non plus possible d’opter pour des tranches d’âge plus fines, par exemple de 0-5 ans / 6-10 ans etc.",
        ],
      },
      {
        question:
          "S’agissant des catégories de postes équivalents, est-il possible de changer de méthode de répartition des salariés d’une année sur l’autre, notamment au sein d’une même période de 3 ans au cours de laquelle l’évolution de la note de l’Index sera examinée ? Ou le choix initial lie-t-il l’employeur ?",
        reponse: [
          "Le décret prévoit que les employeurs ont la possibilité de répartir les salariés selon la classification de branche ou selon « une autre méthode de cotation des postes » après consultation du comité social et économique (ou des anciennes instances représentatives du personnel si la mise en place du CSE n’a pas encore eu lieu).",
          "L’employeur a la possibilité de changer de méthode de répartition des salariés d’une année sur l’autre, ses différents Index seront comparés au cours d’un cycle de 3 ans, peu importe que la méthode ait été modifiée",
        ],
      },
      {
        question:
          "Est-il possible de retenir une méthode de cotation reposant sur les seuls intitulés de postes ou de fonctions des salariés, ou selon les catégories de métiers ?",
        reponse: [
          "La méthode de cotation des postes ne doit pas aboutir à une construction des catégories par métier ou par fonction. Les catégories doivent au contraire inclure plusieurs métiers afin de corriger les biais liés à la non mixité de certains métiers.",
          "Dès lors, la répartition des salariés selon le seul intitulé des postes ou des fonctions ne correspond pas à l’esprit du décret. Le but est bien de mesurer les écarts de rémunération entre femmes et hommes effectuant un travail de valeur égale.",
          "Ainsi, il n’est pas possible de procéder aux cotations de postes par filières si cela conduit à repartir les salariés par métiers.",
          "Les échantillons peuvent se faire, par exemple, par niveau de responsabilité. Par exemple : un(e) technicien(ne) de maintenance peut se trouver dans le même échantillon qu’un(e) assistant(e) des ventes, si leur niveau de responsabilité est le même et qu’ils sont dans la même tranche d’âge.",
          'La méthode de cotation peut consister à segmenter une CSP existante, par exemple, dans la catégorie "Cadre", distinguer "cadres dirigeants", "managers supérieurs", et "managers intermédiaires", etc.)',
        ],
      },
      {
        question:
          "Les entreprises souhaitant utiliser la catégorisation par CSP, mais dont la convention de branche ne reprend pas les catégories de l’INSEE sont-elles contraintes de reconstituer les 4 CSP prévues au décret pour répartir leurs effectifs ?",
        reponse: [
          'Parmi les 4 catégories socio-professionnelles (CSP) visées par le décret à défaut de cotation spécifique (Ouvriers / Employés / Techniciens et agents de maîtrise/ Ingénieurs et cadres), les entreprises peuvent regrouper des catégories pour en avoir 2 ou 3 (ex : employés et ouvriers) si cela correspond au premier échelon de leur convention collective de branche. Cependant elles ne peuvent pas "créer" des catégories distinctes de celles du décret.',
        ],
      },
      {
        question: "Dans quels cas l’employeur doit-il obligatoirement consulter le comité social et économique (CSE) ?",
        reponse: [
          "La consultation du CSE mentionnée au paragraphe 4.1. des annexes du décret du 8 janvier 2019 est obligatoire si l’employeur choisit une catégorisation par niveau ou coefficient hiérarchique en application de la classification de branche, ou d’une autre méthode de cotation des postes. La consultation du CSE n’est en revanche pas obligatoire dans le cas d’une répartition des salariés par CSP ou s’il choisit de regrouper entre elles une des 4 CSP existantes. Par exemple : le calcul de l’indicateur écart de rémunérations, avec 2 catégories cadres / non cadres (comprenant ouvriers / employés / techniciens-agents de maitrise) est possible sans consultation (avec un seuil de pertinence de 5% et non 2%).",
          "Une entreprise ayant déjà informé ses IRP par le passé sur la méthode de cotation des postes devra procéder à une nouvelle consultation dans le cadre du calcul de l’Index.",
        ],
      },
      {
        question: "Lorsque l’entreprise a plusieurs établissements, à quel niveau le CSE doit-il être consulté ?",
        reponse: ["Lorsque l’entreprise a plusieurs établissements, c’est le CSE central qui doit être consulté."],
      },
      {
        question: "La consultation du comité social et économique implique-t-elle nécessairement un avis ?",
        reponse: [
          "Oui, la consultation du comité social et économique mentionnée aux paragraphes 4.1 des annexes du décret du 8 janvier 2019 implique un avis.",
        ],
      },
      {
        question: "Dans quel délai maximum le CSE doit-il rendre son avis ?",
        reponse: [
          "Les délais de consultation du CSE prévus par le code du travail (articles L. 2312-16 et R. 2312-6) sont les suivants :",
          "1 mois à compter de la mise à disposition des informations ;",
          "2 mois en cas d’intervention d’un expert (financé à 100% par le CSE). Ce dernier a 2 mois maximum à compter de sa désignation pour rendre son rapport ;",
          "3 mois en cas d’intervention d’une ou plusieurs expertises dans le cadre de consultation se déroulant à la fois au niveau du comité social et économique central et d’un ou plusieurs comités sociaux économiques d’établissement.",
          "À noter toutefois qu’il est possible de conclure un accord permettant de réduire ce délai. Celui-ci doit toutefois permettre au CSE ou, le cas échéant, au comité central d’exercer utilement sa compétence, en fonction de la nature et de l’importance des questions qui lui sont soumises.",
        ],
      },
      {
        question:
          "Les VRP peuvent-ils constituer une cinquième CSP ? En cas de réponse négative, à quelle CSP les rattacher ?",
        reponse: [
          'Non, il n’est pas possible de créer une cinquième CSP "VRP" car cela revient à créer une catégorie de poste par "métier" ce qui est contraire à la philosophie de l’index.',
          "Ainsi, l’employeur a deux possibilités :",
          "Soit il rattache les VRP à une CSP existante, soit les TAM ou les cadres selon leur statut ;",
          "Soit il répartit les salariés, après consultation du CSE, par niveau ou coefficient hiérarchique ou toute autre méthode de cotation des postes.",
        ],
      },
    ],
  },
  indicateur2: {
    title: "Indicateur - écart de taux d’augmentations",
    qr: [
      {
        question:
          'Les "écarts de taux d’augmentations individuelles" correspondent-ils à des écarts de montants d’augmentations ou à des écarts de nombres de bénéficiaires d’augmentation ?',
        reponse: [
          "La notion d’ « écarts de taux d’augmentations individuelles » renvoie à l’écart des taux de bénéficiaires d’augmentations individuelles. Ainsi, l’indicateur écart de taux d'augmentations est calculé en comparant le pourcentage de salariés augmentés, hors promotions, parmi les hommes à celui de salariées augmentées, hors promotions, parmi les femmes pour chacun des quatre groupes de CSP comptant 10 salariés ou plus de l’un et de l’autre sexe. Il en va de même pour le calcul de l'indicateur relatif à l’écart de taux de promotions.",
        ],
      },
      {
        question:
          "Lorsqu’en application d’un accord d’entreprise, une entreprise augmente automatiquement au bout de trois ans les salariés qui n’ont pas eu sur les trois dernières années l’équivalent de 3% d’augmentation, de telle sorte que sur les trois ans ils ont effectivement une rémunération augmentée de 3%, est-ce une augmentation individuelle ?",
        reponse: [
          "Non, dès lors que l’augmentation est basée sur des critères pouvant englober plusieurs salariés, en application d’un accord collectif d’entreprise, elle doit être considérée comme une augmentation collective.",
        ],
      },
      {
        question:
          "Pour l’indicateur relatif à l’écart de taux d'augmentations, est-il possible, comme pour l’indicateur écart de rémunérations, de répartir les salariés par CSP ou par niveau ou coefficient hiérarchique ?",
        reponse: [
          "Non. La répartition des salariés, après consultation du comité social et économique, par niveau ou coefficient hiérarchique, en application de la classification de branche ou d'une autre méthode de cotation des postes n'est possible que pour le calcul du 1er indicateur relatif à l'écart de rémunération.",
          "Pour le calcul de l'indicateurs relatif à l'écart de taux d'augmentations, les salariés sont répartis selon les 4 catégories socio-professionnelles définies en annexe du décret (ouvriers ; employés ; techniciens et agents de maîtrise ; ingénieurs et cadres).",
        ],
      },
    ],
  },
  indicateur3: {
    title: "Indicateur - écart de taux de promotions",
    qr: [
      {
        question:
          'Pour les "écarts de taux de promotions", quelle est la définition d’une "promotion" au sens du décret ?',
        reponse: [
          "La notion de promotion est définie en annexe du décret comme le passage à un niveau de classification ou coefficient supérieur, dans la classification de branche ou dans le système de cotation choisi par l’entreprise.",
          "À noter que le passage à un niveau de classification ou coefficient supérieur n’est pas lié au choix retenu pour la répartition des salariés dans les catégories de postes pour le calcul de l’indicateur écart de rémunérations.",
          "Il est conseillé à l’entreprise d’être la plus transparente possible sur la méthode de promotion, afin que les salariés et les représentants élus au CSE puissent identifier clairement la notion de promotion.",
        ],
      },
      {
        question:
          "Quel est l’effectif à prendre en compte pour le calcul du pourcentage de promotions ? Les salariés qui ont été promus au cours de l’année de référence mais qui ont quitté l’entreprise avant la fin de cette période sont-ils pris en compte ?",
        reponse: [
          "Le calcul des effectifs à prendre en compte est le même pour tous les indicateurs (cf. rubrique C du questions/réponses). Ainsi les salariés promus au cours de l’année de référence mais qui ont quitté l’entreprise avant la fin de la période sont pris en compte dès lors qu’ils remplissent les critères prévus au paragraphe 2 des annexes du décret du 8 janvier 2019 (https://www.legifrance.gouv.fr/affichCodeArticle.do;jsessionid=26B8F4D02F6C0E60EC6708AD18D25B94.tplgfr23s_1?cidTexte=LEGITEXT000006072050&idArticle=LEGIARTI000038137262&dateTexte=20190225&categorieLien=id#LEGIARTI000038137262).",
        ],
      },
      {
        question:
          "Pour le calcul de l’indicateur relatif aux taux de promotions, les changements automatiques de coefficient en application d’une convention collective nationale peuvent-ils être pris en compte ?",
        reponse: [
          "La notion de promotion est définie en annexes du décret comme le franchissement d’un niveau ou coefficient hiérarchique supérieur. Les changements automatiques de coefficient en application d’une convention collective nationale sont donc à prendre en compte pour le calcul de l’indicateur relatif aux taux de promotions.",
        ],
      },
      {
        question:
          "Pour l’indicateur relatif à l’écart de taux de promotions, est-il possible, comme pour l’indicateur écart de rémunérations, de répartir les salariés par CSP ou par niveau ou coefficient hiérarchique ?",
        reponse: [
          "Non. La répartition des salariés, après consultation du comité social et économique, par niveau ou coefficient hiérarchique, en application de la classification de branche ou d'une autre méthode de cotation des postes n'est possible que pour le calcul du 1er indicateur relatif à l'écart de rémunération.",
          "Pour le calcul de l'indicateurs relatif à l'écart de taux de promotions, les salariés sont répartis selon les 4 catégories socio-professionnelles définies en annexe du décret (ouvriers ; employés ; techniciens et agents de maîtrise ; ingénieurs et cadres).",
        ],
      },
    ],
  },
  indicateur2et3: {
    title: "Indicateurs - écart de taux d’augmentations",
    qr: [
      {
        question:
          "Les « écarts de taux d’augmentations individuelles » correspondent-ils à des écarts de montants d’augmentations ou à des écarts de nombres de bénéficiaires d’augmentation ?",
        reponse: [
          "La notion d’ « écarts de taux d’augmentations individuelles » renvoie à l’écart des taux de bénéficiaires d’augmentations individuelles, qu’elles correspondent ou non à une promotion. Pour que l'indicateur soit calculable, l'entreprise doit comporter au moins 5 femmes et 5 hommes après retraitement des effectifs pour le calcul de l'ensemble des indicateurs.",
        ],
      },
      {
        question:
          "Lorsqu’en application d’un accord d’entreprise, une entreprise augmente automatiquement au bout de trois ans les salariés qui n’ont pas eu sur les trois dernières années l’équivalent de 3% d’augmentation, de telle sorte que sur les trois ans ils ont effectivement une rémunération augmentée de 3%, est-ce une augmentation individuelle ?",
        reponse: [
          "Non, dès lors que l’augmentation est basée sur des critères pouvant englober plusieurs salariés, en application d’un accord collectif d’entreprise, elle doit être considérée comme une augmentation collective.",
        ],
      },
      {
        question:
          "S’agissant de l’indicateur relatif à l’écart de taux d’augmentations, est-il possible d’apprécier cet indicateur sur une période de référence de trois ans ?",
        reponse: [
          "L’employeur peut décider de calculer l’indicateur relatif aux augmentations individuelles sur une période de référence pluriannuelle, à partir des données des deux ou trois années précédentes. Son caractère pluriannuel peut être révisé tous les trois ans.",
          "Dans le cas où l’employeur choisit de calculer l’indicateur sur une période de référence pluriannuelle, il devra dans un premier temps retenir les effectifs pris en compte sur la période de référence annuelle retenue pour le calcul des autres indicateurs. Dans un second temps, pour le calcul de l’indicateur relatif à l'écart de taux d'augmentations, il regardera parmi ces effectifs combien ont bénéficié d’une augmentation individuelle sur les deux ou trois années considérées. Le choix d’une période de référence pluriannuelle revient à compter les salariés qui ont été augmentés au moins une fois sur les deux ou trois années considérées. Il convient ainsi de compter une seule fois un salarié augmenté chaque année sur la période de référence pluriannuelle retenue.",
        ],
      },
      {
        question:
          "Pour l’indicateur relatif à l’écart de taux d’augmentations individuelles, est-il possible, comme pour l’indicateur écart de rémunérations, de répartir les salariés par CSP ou par niveau ou coefficient hiérarchique ?",
        reponse: [
          "Non. La répartition des salariés, après consultation du comité social et économique, par niveau ou coefficient hiérarchique, en application de la classification de branche ou d'une autre méthode de cotation des postes n'est possible que pour le calcul du 1er indicateur relatif à l'écart de rémunération.",
          "Le calcul de l'indicateur relatif à l'écart de taux d'augmentations individuelles est effectué au niveau de l'entreprise.",
        ],
      },
    ],
  },
  indicateur4: {
    title: "Indicateur - congé maternité",
    qr: [
      {
        question:
          "Concernant l’indicateur relatif au retour de congé maternité, comment interpréter « l’année suivant » le retour de congé maternité ?",
        reponse: [
          "L’indicateur concerne les salariées qui sont revenues de congé maternité au cours de la période annuelle de référence. Parmi ces salariées, seules sont prises en compte, pour le calcul de l’indicateur, celles ayant eu un congé maternité durant lequel des augmentations salariales (générales ou individuelles) ont eu lieu. Pour elles, comme le prévoit la loi depuis 2006, il faut procéder à une réévaluation de leur rémunération.",
          "Ainsi, si une salariée revient en décembre de congé maternité et que des augmentations ont été versées pendant la période de ce congé, elle devra avoir une augmentation à son retour avant la fin de l’année (si l’année civile est la période de référence).",
          "L’indicateur est calculé en divisant le nombre de femmes augmentées à leur retour de congé maternité (lorsque ce retour a lieu pendant la période de référence), par le nombre de salariées revenues de congé maternité pendant la période de référence, et au cours duquel des augmentations salariales ont eu lieu.",
          "Si plusieurs femmes sont revenues de congé maternité pendant l’année de référence, et qu’une seule d’entre elles n’a pas été augmentée alors qu’elle relève d’une catégorie profesionnelle où la rémunération a été augmentée, la note de l’indicateur est égale à 0.",
        ],
      },
      {
        question: "Comment calculer l’indicateur lorsque le congé maternité est suivi d’un congé parental ?",
        reponse: [
          "Lorsque le congé maternité est suivi d’un congé parental, l’indicateur est calculé en comparant le nombre de salariées ayant bénéficié d’une augmentation à leur retour physique dans l’entreprise, pendant l’année de référence, au nombre de salariées ayant béneficié d'un congé maternité pendant lequel des augmentations salariales ont eu lieu. Seules les augmentations intervenues pendant le congé de maternité sont prises en compte, et non celles intervenues pendant le congé parental.",
        ],
      },
      {
        question:
          "Les salariées absentes plus de six mois mais qui sont revenuesavant la fin de la période de référence doivent-elles être prises en compte pour le calcul de l’indicateur relatif au retour de congé maternité ?",
        reponse: [
          "Oui, les salariées revenues de congé maternité pendant la période de référence et qui ont été absentes plus de 6 mois pendant cette même période, doivent être prises en compte uniquement pour le calcul de l’indicateur",
        ],
      },
      {
        question:
          "En évaluant la période de référence du 1er janvier au 31 décembre 2019, si une salariée revient de congé maternité au 31 août 2019 et qu’elle est augmentée au 1er janvier 2020, alors que ses collègues ont été revalorisés au 1er juillet 2019, celle-ci est-elle considérée comme augmentée ou non au titre de l’indicateur relatif au retour de congé maternité ?",
        reponse: [
          "Non, elle n’est pas considérée comme augmentée, car le respect de l’obligation est apprécié sur l’année de référence, soit dans cet exemple sur l'année civile 2019.",
        ],
      },
      {
        question:
          "Les augmentations salariales des salariées en congé maternité, accordées durant ce congé (et non au retour de la salariée) sont-elles prises en compte pour le calcul de l’indicateur relatif au retour de congé maternité ?",
        reponse: [
          "Oui. L’indicateur a pour objet de déterminer le pourcentage de salariées ayant bénéficié d’une augmentation à leur retour de congé maternité si des augmentations sont intervenues durant la durée de leur congé maternité. Or en pratique, beaucoup d’entreprises procèdent aux augmentations prévues par l’article L.1225-26 du code du travail simultanément aux augmentations générales prévues pour l’ensemble des salariés. Ces augmentations peuvent donc être effectives pendant le congé maternité et non à l’issue de celui-ci. Il est logique et conforme à l’esprit du texte de prendre en compte l’augmentation que les femmes ont connue au cours de leur congé de maternité si elle se situe pendant la période de référence pour le calcul de l’indicateur.",
        ],
      },
      {
        question:
          "L’employeur doit-il verser à la salariée, à son retour de congé maternité, une moyenne des bonus qui ont été payés aux autres salariés en son absence ?",
        reponse: [
          "Non. L’article L. 1225-26 du code du travail prévoit qu’à leur retour de congé maternité, les salariées doivent bénéficier des augmentations générales ainsi que de la moyenne des augmentations individuelles perçues pendant la durée de ce congé par les salariés relevant de la même catégorie professionnelle ou, à défaut, de la moyenne des augmentations individuelles dans l’entreprise.",
          "Selon la jurisprudence, dès lors qu’une prime est expressément subordonnée à la participation effective du salarié à une activité de l’entreprise et qu’elle répond à des critères d’attribution objectifs, mesurables et licites, elle n’est pas due à la salariée pendant son congé de maternité. (Cass. soc., 19 septembre 2018, nº 17-11.618 FS-PB : https://www.courdecassation.fr/jurisprudence_2/arrets_publies_2986/chambre_sociale_3168/2018_8506/septembre_8946/1294_19_40212.html)",
        ],
      },
      {
        question:
          "Le congé d’adoption est-il pris en compte pour le calcul de l’indicateur relatif au retour de congé maternité ?",
        reponse: [
          "Oui, le congé d’adoption est pris en compte dans le calcul de l’indicateur, au même titre que le congé de maternité.",
        ],
      },
      {
        question:
          "Obtient-on nécessairement 0 à l’indicateur relatif au retour de congé maternité dans le cas où seules 2 salariées n’ont pas bénéficié d’une augmentation durant l’année 2019 alors qu’elles étaient absentes pour congé maternité à l’occasion de l’exercice annuel de revalorisation, étant donné que ces deux salariées avaient bénéficié toutes deux d’une augmentation au second semestre 2018 ?",
        reponse: [
          "Le calcul de l’Index étant basé sur une période de référence annuelle, si la période choisie est l’année 2019, il n’est pas possible de déroger à la règle posée par le décret n° 2019-15 du 8 janvier 2019, car les deux salariées concernées ont bénéficié d’une revalorisation au second semestre de l’année 2018.",
        ],
      },
    ],
  },
  publication: {
    title: "Publication et transmission de l’index",
    qr: [
      {
        question: "Faut-il publier uniquement l’Index ou également le détail des indicateurs ?",
        reponse: [
          "L’obligation de publicité concerne uniquement la note globale de l’Index. Le détail des indicateurs est quant à lui réservé au comité social et économique (CSE) et aux services de l’inspection du travail. Néanmoins, si l’entreprise souhaite publier le résultat de chaque indicateur sur son site Internet, rien ne l’en empêche.",
          "Elle peut également y faire figurer les mesures de correction prévues.",
        ],
      },
      {
        question: "Sur quel site internet l’entreprise doit-elle publier son Index ?",
        reponse: [
          "La note globale de l’Index doit être publiée sur le site internet de l'entreprise, lorsqu'il en existe un (y compris lorsque l’entreprise fait partie d’un groupe ou d’une UES). Une publication sur le site Intranet de l'entreprise n'est donc pas suffisante.",
          "La note globale pourra être publiée sur son site de présentation, il n'est pas pour autant obligatoire qu'elle figure sur la page d'accueil. ",
          "À défaut de site internet propre à l'entreprise, l'Index doit être publié sur le site du groupe (ou de l'UES) auquel l'entreprise appartient, s'il en existe un.",
          "S'il n'y a aucun site Internet (au niveau de l'entreprise, du groupe ou de l'UES), la note globale sera portée à la connaissance des salariés par tout moyen (courrier papier ou électronique, affichage...).",
          "L'employeur devra, dans tous les cas, communiquer aux services de l'inspection du travail et au CSE, en même temps que ses résultats, le lien du site internet sur lequel est publié son Index.",
        ],
      },
      {
        question: "Quelles sont les informations à transmettre au comité social et économique (CSE) ? ",
        reponse: [
          "Les indicateurs ainsi que la note globale sont mis à la disposition du comité social et économique (CSE), via la base de données économiques et sociales. Les résultats sont présentés, pour le premier indicateur relatif à l’écart de rémunération entre les femmes et les hommes, par catégorie socio-professionnelle, niveau ou coefficient hiérarchique ou selon les niveaux de la méthode de cotation des postes de l’entreprise, ainsi que par tranches d’âge. Les résultats des indicateurs relatifs au écarts de taux d’augmentations sont présentés par catégorie socio-professionnelle. Le CSE est destinataire a minima de toutes les informations transmises à la DIRECCTE.",
          "Conformément à l’article D. 1142-5 du code du travail, les informations mentionnées ci-dessus sont accompagnées de toutes les précisions utiles à leur compréhension, notamment relatives à la méthodologie appliquée, la répartition des salariés par catégorie socio-professionnelle ou selon les niveaux de la méthode de cotation des postes de l’entreprise et, le cas échéant, des mesures de correction envisagées ou déjà mises en œuvre.",
          "Dans le cas où certains indicateurs ne peuvent pas être calculés, l’information du CSE sur les indicateurs doit quand même être assurée et est accompagnée de toutes les précisions expliquant les raisons pour lesquelles les indicateurs n’ont pas pu être calculés.",
        ],
      },
      {
        question:
          "Comment les entreprises doivent-elles transmettre leurs résultats aux services de l’inspection du travail ?",
        reponse: [
          "Les entreprises doivent transmettre leurs indicateurs et leur note globale aux services de l’inspection du travail (Direccte et Dieccte) par le biais d’un formulaire en ligne, accessible sur le site du ministère du travail.",
          "Ce formulaire reprend les informations listées dans l’arrêté du 31 janvier 2019 définissant les modèles de présentation et les modalités de transmission à l’administration des indicateurs et du niveau de résultat en matière d’écart de rémunération entre les femmes et les hommes dans l’entreprise.",
        ],
      },
      {
        question:
          "Quelles sont les modalités de transmission des résultats au comité social et économique lorsque l’entreprise a plusieurs établissements ?",
        reponse: [
          "L’Index est calculé au niveau de l’entreprise : les résultats seront donc transmis au CSE central selon les modalités définies à l’article D.1142-5, via la base de données économiques et sociale (accessible a minima aux membres élus du CSE).",
        ],
      },
      {
        question: "Une entreprise créée en juillet 2019 doit-elle publier son Index en 2020 ?",
        reponse: [
          "Une entreprise créée en juillet 2019 doit publier son Index au 1er mars 2020 si, à cette date, son effectif comprend au moins 50 salariés. Néanmoins, si elle ne dispose pas de données sur douze mois consécutifs à la date d’assujettissement à l’obligation de publication, ses indicateurs et, partant, son Index ne seront pas calculables pour la première année. L’entreprise devra communiquer à la Direccte et au CSE les raisons pour lesquelles les indicateurs n’ont pas pu être calculés (article D. 1142-5).",
        ],
      },
      {
        question:
          "À quelle date doit être publié l’Index d’une entreprise qui n’a actuellement aucun salarié et se verra transférer plus de 50 salariés au 1er mars 2020 ?",
        reponse: [
          "Il convient de dissocier l’assujettissement à l’obligation de publier l’Index et la période de référence. Dans le cas présent, l’entreprise aura l’obligation de publier l’Index au 1er mars 2020. En revanche, à défaut de données sur douze mois consécutifs, son Index ne sera pas calculable à cette date. Elle devra communiquer à la Direccte et au CSE les raisons pour lesquelles les indicateurs n’ont pas pu être calculés (article D. 1142-5).",
        ],
      },
      {
        question:
          "Dans quels délais l’entreprise doit elle transmettre ses résultats à son CSE suite à la publication de l’Index ?",
        reponse: [
          "L’entreprise transmet les résultats à son CSE en amont de la première réunion qui suit la publication de l’Index. Un modèle de transmission des données au CSE sera mis à disposition sur le site du ministère du travail : ce modèle est facultatif, l’entreprise étant libre d’en choisir un autre dès lors qu’elle respecte les conditions posées par l’article D.1142-5 du code du travail.",
          "En cas de modification des données transmises aux services de l’inspection du travail, le CSE doit être à nouveau informé.",
        ],
      },
    ],
  },
}

export const faqSections: FAQSection = {
  champApplication: {
    title: "Champ d’application et entrée en vigueur",
    parts: ["champApplication"],
  },
  informations: {
    title: "Période de référence",
    parts: ["periodeReference"],
  },
  effectifs: {
    title: "Effectifs pris en compte",
    parts: ["effectifs"],
  },
  indicateur1: {
    title: "Indicateur - écart de rémunération",
    parts: ["remuneration", "indicateur1"],
  },
  indicateur2et3: {
    title: "Indicateur - écart d'augmentations (50 à 250 salariés)",
    parts: ["indicateur2et3"],
  },
  indicateur2: {
    title: "Indicateur - écart d’augmentations (plus de 250 salariés)",
    parts: ["indicateur2"],
  },
  indicateur3: {
    title: "Indicateur - écart de promotions (plus de 250 salariés)",
    parts: ["indicateur3"],
  },
  indicateur4: {
    title: "Indicateur - congé maternité",
    parts: ["indicateur4"],
  },
  indicateur5: {
    title: "Indicateur - hautes rémunérations",
    parts: [],
  },
  resultat: {
    title: "Résultat",
    parts: ["publication"],
  },
}
