import { COUNTIES, REGIONS } from "@common/dict";
import { AdminLayout } from "@components/layouts/AdminLayout";
import {
  Box,
  Container,
  FormCheckbox,
  FormCheckboxGroup,
  TableAdmin,
  TableAdminBody,
  TableAdminBodyRow,
  TableAdminBodyRowCol,
  TableAdminHead,
  TableAdminHeadCol,
} from "@design-system";
import _ from "lodash";
import { useEffect } from "react";

import type { NextPageWithLayout } from "../_app";

interface BaseReferent {
  county?: keyof typeof COUNTIES;
  id: string;
  name: string;
  principal: boolean;
  region: keyof typeof REGIONS;
  type: "email" | "url";
  value: string;
}

interface EmailReferent extends BaseReferent {
  type: "email";
}

interface UrlReferent extends BaseReferent {
  type: "url";
}

type Referent = EmailReferent | UrlReferent;

const data: Referent[] = [
  {
    id: "0",
    principal: true,
    region: "01",
    county: "971",
    name: "Agnès LAUTONE",
    value: "agnes.lautone@deets.gouv.fr",
    type: "email",
  },
  {
    id: "1",
    principal: true,
    region: "02",
    county: "972",
    name: "Marie-Louise MIREILLE",
    value: "mireille.marie-louise@deets.gouv.fr",
    type: "email",
  },
  {
    id: "2",
    principal: true,
    region: "03",
    county: "973",
    name: "Emmanuel LOISEAU",
    value: "emmanuel.loiseau@guyane.pref.gouv.fr",
    type: "email",
  },
  {
    id: "3",
    principal: true,
    region: "04",
    county: "974",
    name: "Pierre MERCADER",
    value: "pierre.mercader@deets.gouv.fr",
    type: "email",
  },
  {
    id: "4",
    principal: true,
    region: "06",
    county: "976",
    name: "Jean-François PENNEL",
    value: "DEETS-976.UC@deets.gouv.fr",
    type: "email",
  },
  {
    id: "5",
    name: "Tassadit TERAHA",
    principal: false,
    region: "11",
    type: "email",
    value: "drieets-idf.ega-pro@drieets.gouv.fr",
  },
  {
    id: "6",
    principal: true,
    region: "11",
    county: "75",
    name: "Alexandra MUSY",
    value: "drieets-idf-ud75.ega-pro@drieets.gouv.fr",
    type: "email",
  },
  {
    id: "7",
    principal: true,
    region: "11",
    county: "77",
    name: "Armelle LE LAY",
    value: "ddets77-ega-pro@seine-et-marne.gouv.fr",
    type: "email",
  },
  {
    id: "8",
    principal: true,
    region: "11",
    county: "78",
    name: "Dorothée BAREL",
    value: "idf-ud78.ega-pro@yvelines.gouv.fr",
    type: "email",
  },
  {
    id: "9",
    principal: true,
    region: "11",
    county: "91",
    name: "Stéphane ROUXEL",
    value: "ddets-ega-pro@essonne.gouv.fr",
    type: "email",
  },
  {
    id: "10",
    principal: true,
    region: "11",
    county: "92",
    name: "Lolita REINA-RICO",
    value: "drieets-idf-ud92.ega-pro@drieets.gouv.fr",
    type: "email",
  },
  {
    id: "11",
    principal: true,
    region: "11",
    county: "93",
    name: "Sami ALLAG",
    value: "sami.allag@drieets.gouv.fr",
    type: "email",
  },
  {
    id: "12",
    principal: true,
    region: "11",
    county: "94",
    name: "Nimira HASSANALY",
    value: "drieets-idf-ud94.ega-pro@drieets.gouv.fr",
    type: "email",
  },
  {
    id: "13",
    principal: true,
    region: "11",
    county: "95",
    name: "Egapro Val d'Oise",
    value: "idf-ud95.ega-pro@val-doise.gouv.fr",
    type: "email",
  },
  {
    id: "14",
    name: "Fabienne MIRAMOND SCARDIA",
    principal: false,
    region: "24",
    type: "email",
    value: "dreets-cvl.ega-pro@dreets.gouv.fr",
  },
  {
    id: "15",
    principal: true,
    region: "24",
    county: "18",
    name: "Fabienne MIRAMOND SCARDIA",
    value: "ddetspp-ega-pro@cher.gouv.fr",
    type: "email",
  },
  {
    id: "16",
    principal: true,
    region: "24",
    county: "28",
    name: "Dorothée GAILLARD",
    value: "ddetspp-ega-pro@eure-et-loir.gouv.fr",
    type: "email",
  },
  {
    id: "17",
    principal: true,
    region: "24",
    county: "36",
    name: "Laure-Clemence PORCHEREL",
    value: "ddetspp-ega-pro@indre.gouv.fr",
    type: "email",
  },
  {
    id: "18",
    principal: true,
    region: "24",
    county: "37",
    name: "Fabienne MIRAMOND SCARDIA",
    value: "ddets-ega-pro@indre-et-loire.gouv.fr",
    type: "email",
  },
  {
    id: "19",
    principal: true,
    region: "24",
    county: "41",
    name: "Fabienne MIRAMOND SCARDIA",
    value: "ddetspp-ega-pro@loir-et-cher.gouv.fr",
    type: "email",
  },
  {
    id: "20",
    principal: true,
    region: "24",
    county: "45",
    name: "Aurore LAPORTE",
    value: "ddets-egalite-professionnelle@loiret.gouv.fr",
    type: "email",
  },
  {
    id: "21",
    name: "Cécile ROUSSEY",
    principal: false,
    region: "27",
    type: "email",
    value: "cecile.roussey@dreets.gouv.fr",
  },
  {
    id: "22",
    principal: true,
    region: "27",
    county: "21",
    name: "Christophe BIOT",
    value: "christophe.biot@cote-dor.gouv.fr",
    type: "email",
  },
  {
    id: "23",
    principal: true,
    region: "27",
    county: "25",
    name: "Ghislaine FLORENTZ",
    value: "ghislaine.florentz@doubs.gouv.fr",
    type: "email",
  },
  {
    id: "24",
    principal: true,
    region: "27",
    county: "39",
    name: "Guilène AILLARD",
    value: "ddetspp-ega-pro@jura.gouv.fr",
    type: "email",
  },
  {
    id: "25",
    principal: true,
    region: "27",
    county: "58",
    name: "Alexandra BUONO",
    value: "ddetspp-ega-pro@nievre.gouv.fr",
    type: "email",
  },
  {
    id: "26",
    principal: true,
    region: "27",
    county: "70",
    name: "Laurent DUDNIK",
    value: "laurent.dudnik@haute-saone.gouv.fr",
    type: "email",
  },
  {
    id: "27",
    principal: true,
    region: "27",
    county: "71",
    name: "Anne FERNANDEZ",
    value: "anne.fernandez@saone-et-loire.gouv.fr",
    type: "email",
  },
  {
    id: "28",
    principal: true,
    region: "27",
    county: "89",
    name: "Florence LAMESA",
    value: "florence.lamesa@yonne.gouv.fr",
    type: "email",
  },
  {
    id: "29",
    principal: true,
    region: "27",
    county: "90",
    name: "Magdalena BARRAL",
    value: "magdalena.barral@territoire-de-belfort.gouv.fr",
    type: "email",
  },
  {
    id: "30",
    name: "Sylvie MACE",
    principal: false,
    region: "28",
    type: "email",
    value: "norm.ega-pro@dreets.gouv.fr",
  },
  {
    id: "31",
    principal: true,
    region: "28",
    county: "14",
    name: "Marie-France HUE",
    value: "ddets-ega-pro@calvados.gouv.fr",
    type: "email",
  },
  {
    id: "32",
    principal: true,
    region: "28",
    county: "27",
    name: "Martine TERRIER",
    value: "ddets-ega-pro@eure.gouv.fr",
    type: "email",
  },
  {
    id: "33",
    principal: true,
    region: "28",
    county: "50",
    name: "Nathalie PLAZA-PETIT",
    value: "ddets-ega-pro@manche.gouv.fr",
    type: "email",
  },
  {
    id: "34",
    principal: true,
    region: "28",
    county: "61",
    name: "Mélisande MALLET-RADEMACHER",
    value: "ddets-ega-pro@orne.gouv.fr",
    type: "email",
  },
  {
    id: "35",
    principal: true,
    region: "28",
    county: "76",
    name: "Mathilde MENELLE",
    value: "DDETS-accord-entreprise@seine-maritime.gouv.fr",
    type: "email",
  },
  {
    id: "36",
    name: "Stéphanie TRUCHY",
    principal: false,
    region: "32",
    type: "email",
    value: "DREETS-HDF.Ega-Pro@dreets.gouv.fr",
  },
  {
    id: "37",
    principal: true,
    region: "32",
    county: "02",
    name: "Vincent LEMOINE",
    value: "ddets-sct@aisne.gouv.fr",
    type: "email",
  },
  {
    id: "38",
    principal: true,
    region: "32",
    county: "59",
    name: "François VOET",
    value: "ddets-59-ega-pro@nord.gouv.fr",
    type: "email",
  },
  {
    id: "39",
    principal: true,
    region: "32",
    county: "60",
    name: "Emilie BARBET",
    value: "ddets-ega-pro@oise.gouv.fr",
    type: "email",
  },
  {
    id: "40",
    principal: true,
    region: "32",
    county: "62",
    name: "Christophe FAIDHERBE",
    value: "ddets-ega-pro@pas-de-calais.gouv.fr",
    type: "email",
  },
  {
    id: "41",
    principal: true,
    region: "32",
    county: "80",
    name: "Agnès DUBOS-DITTARO",
    value: "ddets-ega-pro@somme.gouv.fr",
    type: "email",
  },
  {
    id: "42",
    name: "Fabienne DEROZIER",
    principal: false,
    region: "44",
    type: "email",
    value: "dreets-ge.ega-pro@dreets.gouv.fr",
  },
  {
    id: "43",
    principal: true,
    region: "44",
    county: "08",
    name: "Laurence GRENIER",
    value: "ddetspp-ega-pro@ardennes.gouv.fr",
    type: "email",
  },
  {
    id: "44",
    principal: true,
    region: "44",
    county: "10",
    name: "Adeline LEGRAND",
    value: "ddetspp-ega-pro@aube.gouv.fr",
    type: "email",
  },
  {
    id: "45",
    principal: true,
    region: "44",
    county: "51",
    name: "Jéröme LEFONDEUR",
    value: "ddetspp-ega-pro@marne.gouv.fr",
    type: "email",
  },
  {
    id: "46",
    principal: true,
    region: "44",
    county: "52",
    name: "Aurélie CORNIAUX",
    value: "ddetspp-ega-pro@haute-marne.gouv.fr",
    type: "email",
  },
  {
    id: "47",
    principal: true,
    region: "44",
    county: "54",
    name: "Mickaël MAROT",
    value: "ddets-ega-pro@meurthe-et-moselle.gouv.fr",
    type: "email",
  },
  {
    id: "48",
    principal: true,
    region: "44",
    county: "55",
    name: "Jocelyne HOFBAUER",
    value: "ddetspp-egapro@meuse.gouv.fr",
    type: "email",
  },
  {
    id: "49",
    principal: true,
    region: "44",
    county: "57",
    name: "Marie-Christine STIEN",
    value: "ddets-ega-pro@moselle.gouv.fr",
    type: "email",
  },
  {
    id: "50",
    principal: true,
    region: "44",
    county: "67",
    name: "Heloïse CLAUDEL",
    value: "ddets-ega-pro@bas-rhin.gouv.fr",
    type: "email",
  },
  {
    id: "51",
    principal: true,
    region: "44",
    county: "68",
    name: "Oriane JEANNIARD",
    value: "ddetspp-egal-pro@haut-rhin.gouv.fr",
    type: "email",
  },
  {
    id: "52",
    principal: true,
    region: "44",
    county: "88",
    name: "Tobias KENMEGNE",
    value: "ddetspp-ega-pro@vosges.gouv.fr",
    type: "email",
  },
  {
    id: "53",
    name: "Anne-Laurence LEMASSON",
    principal: false,
    region: "52",
    type: "email",
    value: "dreets-pdl.ega-pro@dreets.gouv.fr",
  },
  {
    id: "54",
    principal: true,
    region: "52",
    county: "44",
    name: "Noémie MOUTON",
    value: "ddets-ega-pro@loire-atlantique.gouv.fr",
    type: "email",
  },
  {
    id: "55",
    principal: true,
    region: "52",
    county: "49",
    name: "Stéphanie SEGRETIN",
    value: "ddets-ega-pro@maine-et-loire.gouv.fr",
    type: "email",
  },
  {
    id: "56",
    principal: true,
    region: "52",
    county: "53",
    name: "Marie-Claire PERIGOIS",
    value: "ddetspp-ega-pro@mayenne.gouv.fr",
    type: "email",
  },
  {
    id: "57",
    principal: true,
    region: "52",
    county: "72",
    name: "Isabelle LAUNAY",
    value: "ddets-ega-pro@sarthe.gouv.fr",
    type: "email",
  },
  {
    id: "58",
    principal: true,
    region: "52",
    county: "85",
    name: "Brigitte COMBRET",
    value: "ddets-ega-pro@vendee.gouv.fr",
    type: "email",
  },
  {
    id: "59",
    name: "Véronique THOMAS",
    principal: false,
    region: "53",
    type: "email",
    value: "DREETS-BRET.Ega-Pro@dreets.gouv.fr",
  },
  {
    id: "60",
    principal: true,
    region: "53",
    county: "22",
    name: "Egapro Côtes d'Armor",
    value: "ddets-ega-pro@cotes-darmor.gouv.fr",
    type: "email",
  },
  {
    id: "61",
    principal: true,
    region: "53",
    county: "29",
    name: "Katya BOSSER",
    value: "ddets-ega-pro@finistere.gouv.fr",
    type: "email",
  },
  {
    id: "62",
    principal: true,
    region: "53",
    county: "35",
    name: "Laurence MOUHOU",
    value: "ddets-ega-pro@ille-et-vilaine.gouv.fr",
    type: "email",
  },
  {
    id: "63",
    principal: true,
    region: "53",
    county: "56",
    name: "Joel GRISONI",
    value: "ddets-ega-pro@morbihan.gouv.fr",
    type: "email",
  },
  {
    id: "64",
    name: "Lauriane CATALA",
    principal: false,
    region: "75",
    type: "email",
    value: "dreets-na.polet@dreets.gouv.fr",
  },
  {
    id: "65",
    principal: true,
    region: "75",
    county: "16",
    name: "Pascale ROUSSELY",
    value: "ddetspp-ega-pro@charente.gouv.fr",
    type: "email",
  },
  {
    id: "66",
    principal: true,
    region: "75",
    county: "17",
    name: "Serge SILO",
    value: "ddets-ega-pro@charente-maritime.gouv.fr",
    type: "email",
  },
  {
    id: "67",
    principal: true,
    region: "75",
    county: "19",
    name: "Jean-Paul LEGROS",
    value: "ddetspp-ega-pro@correze.gouv.fr",
    type: "email",
  },
  {
    id: "68",
    principal: true,
    region: "75",
    county: "23",
    name: "Martine MIMON",
    value: "ddetspp.ega-pro@creuse.gouv.fr",
    type: "email",
  },
  {
    id: "69",
    principal: true,
    region: "75",
    county: "24",
    name: "Stéphane ALONSO",
    value: "ddetspp-uc1@dordogne.gouv.fr",
    type: "email",
  },
  {
    id: "70",
    principal: true,
    region: "75",
    county: "33",
    name: "Corinne COULON",
    value: "ddets-ega-pro@gironde.gouv.fr",
    type: "email",
  },
  {
    id: "71",
    principal: true,
    region: "75",
    county: "40",
    name: "Patrick LASSERE-CATHALA",
    value: "ddetspp-ega-pro@landes.gouv.fr",
    type: "email",
  },
  {
    id: "72",
    principal: true,
    region: "75",
    county: "47",
    name: "Catherine KUENTZ",
    value: "ddtespp-ega-pro@lot-et-garonne.gouv.fr",
    type: "email",
  },
  {
    id: "73",
    principal: true,
    region: "75",
    county: "64",
    name: "Angélique ITHURBURRU",
    value: "ddets-ega-pro@pyrenees-atlantiques.gouv.fr",
    type: "email",
  },
  {
    id: "74",
    principal: true,
    region: "75",
    county: "79",
    name: "François MISTROT",
    value: "ddetspp-it@deux-sevres.gouv.fr",
    type: "email",
  },
  {
    id: "75",
    principal: true,
    region: "75",
    county: "86",
    name: "Alexandra BOILDIEU",
    value: "ddets-ega-pro@vienne.gouv.fr",
    type: "email",
  },
  {
    id: "76",
    principal: true,
    region: "75",
    county: "87",
    name: "Christine CANIZARES",
    value: "ddetsp-ega-pro@haute-vienne.gouv.fr",
    type: "email",
  },
  {
    id: "77",
    name: "Nathalie CAMPOURCY",
    principal: false,
    region: "76",
    type: "email",
    value: "oc.ega-pro@dreets.gouv.fr",
  },
  {
    id: "78",
    principal: true,
    region: "76",
    county: "09",
    name: "Sandra ROUCH",
    value: "ddetspp-ega-pro@ariege.gouv.fr",
    type: "email",
  },
  {
    id: "79",
    principal: true,
    region: "76",
    county: "11",
    name: "Valérie ALES",
    value: "ddetspp-ega-pro@aude.gouv.fr",
    type: "email",
  },
  {
    id: "80",
    principal: true,
    region: "76",
    county: "12",
    name: "Christine DURAND",
    value: "ddetspp-ega-pro@aveyron.gouv.fr",
    type: "email",
  },
  {
    id: "81",
    principal: true,
    region: "76",
    county: "30",
    name: "Paula NUNES",
    value: "ddets-ega-pro@gard.gouv.fr",
    type: "email",
  },
  {
    id: "82",
    principal: true,
    region: "76",
    county: "31",
    name: "Jennifer ABADIE",
    value: "ddets-ega-pro@haute-garonne.gouv.fr",
    type: "email",
  },
  {
    id: "83",
    principal: true,
    region: "76",
    county: "32",
    name: "Nathalie BACCARINO",
    value: "ddetspp-ega-pro@gers.gouv.fr",
    type: "email",
  },
  {
    id: "84",
    principal: true,
    region: "76",
    county: "34",
    name: "Pierre SAMPIETRO",
    value: "ddets-ega-pro@herault.gouv.fr",
    type: "email",
  },
  {
    id: "85",
    principal: true,
    region: "76",
    county: "46",
    name: "Ingrid LE FEVRE",
    value: "ddetspp-ega-pro@lot.gouv.fr",
    type: "email",
  },
  {
    id: "86",
    principal: true,
    region: "76",
    county: "65",
    name: "Fabien JAUZION",
    value: "ddetspp-ega-pro@hautes-pyrenees.gouv.fr",
    type: "email",
  },
  {
    id: "87",
    principal: true,
    region: "76",
    county: "66",
    name: "Mina HANNA-TICHADOU",
    value: "ddets-ega-pro@pyrenees-orientales.gouv.fr",
    type: "email",
  },
  {
    id: "88",
    principal: true,
    region: "76",
    county: "81",
    name: "Françoise LOISEAU",
    value: "ddetspp-ega-pro@tarn.gouv.fr",
    type: "email",
  },
  {
    id: "89",
    principal: true,
    region: "76",
    county: "82",
    name: "Richard BLANCO",
    value: "ddetspp-ega-pro@tarn-et-garonne.gouv.fr",
    type: "email",
  },
  {
    id: "90",
    name: "Michelle CHARPILLE",
    principal: false,
    region: "84",
    type: "email",
    value: "michelle.charpille@dreets.gouv.fr",
  },
  {
    id: "91",
    name: "DREETS AUVERGNE-RHONE-ALPES",
    principal: false,
    region: "84",
    type: "email",
    value: "ara.dialogue-social@dreets.gouv.fr",
  },
  {
    id: "92",
    principal: true,
    region: "84",
    county: "01",
    name: "Caroline MANDY",
    value: "caroline.mandy@ain.gouv.fr",
    type: "email",
  },
  {
    id: "93",
    principal: true,
    name: "Egapro Ain",
    region: "84",
    type: "email",
    value: "ddets-direction@ain.gouv.fr",
    county: "01",
  },
  {
    id: "94",
    principal: true,
    region: "84",
    county: "03",
    name: "Marie-Jeanne FANELLI",
    value: "ddetspp-ega-pro@allier.gouv.fr",
    type: "email",
  },
  {
    id: "95",
    principal: true,
    region: "84",
    county: "07",
    name: "Rémy LE PERRON",
    value: "ddetspp-directeur@ardeche.gouv.fr",
    type: "email",
  },
  {
    id: "96",
    principal: true,
    region: "84",
    county: "15",
    name: "Nathalie ANGELIER",
    value: "nathalie.angelier@cantal.gouv.fr",
    type: "email",
  },
  {
    id: "97",
    principal: true,
    region: "84",
    county: "15",
    name: "Egapro Cantal",
    value: "ddetspp-direction@cantal.gouv.fr",
    type: "email",
  },
  {
    id: "98",
    principal: true,
    region: "84",
    county: "26",
    name: "Brigitte CUNIN",
    value: "ddets@drome.gouv.fr",
    type: "email",
  },
  {
    id: "99",
    principal: true,
    region: "84",
    county: "38",
    name: "Lysiane DUPREZ-COLLIGNON",
    value: "lysiane.duprez-collignon@isere.gouv.fr",
    type: "email",
  },
  {
    id: "100",
    principal: true,
    region: "84",
    county: "38",
    name: "Egapro Isere",
    value: "ddets-direction@isere.gouv.fr",
    type: "email",
  },
  {
    id: "101",
    principal: true,
    region: "84",
    county: "42",
    name: "Marie Cécile CHAMPEIL",
    value: "marie-cecile.champeil@loire.gouv.fr",
    type: "email",
  },
  {
    id: "102",
    principal: true,
    region: "84",
    county: "42",
    name: "Egapro Loire",
    value: "ddets-direction@loire.gouv.fr",
    type: "email",
  },
  {
    id: "103",
    principal: true,
    region: "84",
    county: "43",
    name: "Isabelle ESTIER-PORTE",
    value: "isabelle.estier-porte@haute-loire.gouv.fr",
    type: "email",
  },
  {
    id: "104",
    principal: true,
    region: "84",
    county: "43",
    name: "Egapro Haute-Loire",
    value: "ddcspp@haute-loire.gouv.fr",
    type: "email",
  },
  {
    id: "105",
    principal: true,
    region: "84",
    county: "63",
    name: "Estelle PARAYRE",
    value: "estelle.parayre@puy-de-dome.gouv.fr",
    type: "email",
  },
  {
    id: "106",
    principal: true,
    region: "84",
    county: "63",
    name: "Egapro Puy de Dôme",
    value: "ddcs@puy-de-dome.gouv.fr",
    type: "email",
  },
  {
    id: "107",
    principal: true,
    region: "84",
    county: "69",
    name: "Céline AURET",
    value: "ddets-ega-pro@rhone.gouv.fr",
    type: "email",
  },
  {
    id: "108",
    principal: true,
    region: "84",
    county: "73",
    name: "Hubert GUIRIMAND",
    value: "hubert.guirimand@savoie.gouv.fr",
    type: "email",
  },
  {
    id: "109",
    principal: true,
    region: "84",
    county: "73",
    name: "Egapro Savoie",
    value: "ddetspp-direction@savoie.gouv.fr",
    type: "email",
  },
  {
    id: "110",
    principal: true,
    region: "84",
    county: "74",
    name: "Marie WODLI",
    value: "marie.wodli@haute-savoie.gouv.fr",
    type: "email",
  },
  {
    id: "111",
    principal: true,
    region: "84",
    county: "74",
    name: "Egapro Haute Savoie",
    value: "ddets-direction@haute-savoie.gouv.fr",
    type: "email",
  },
  {
    id: "112",
    name: "Valérie CORNIQUET DEMOLLIENS",
    principal: true,
    region: "93",
    type: "url",
    value: "http://paca.dreets.gouv.fr/Index-egalite-professionnelle-des-referents-pour-repondre-a-vos-questions",
  },
  {
    id: "113",
    name: "Valérie LEPETIT",
    principal: true,
    region: "94",
    type: "email",
    value: "DREETS-CORSE.Ega-pro@dreets.gouv.fr",
  },
];

const columnsMap = new Map([
  ["region", "Région"],
  ["county", "Département"],
  ["name", "Nom"],
  ["value", "Valeur"],
  ["type", "Type"],
  ["principal", "Principal"],
]);

const ReferentListPage: NextPageWithLayout = () => {
  useEffect(() => {}, []);
  return (
    <Box as="section">
      <Container py="8w">
        <h1>Liste des des référents Egapro</h1>

        <div>
          <TableAdmin>
            <TableAdminHead>
              {Array.from(columnsMap).map(([columnValue, columnLabel]) => (
                <TableAdminHeadCol
                  key={columnValue}
                  // orderDirection={orderBy === columnValue && orderDirection}
                  // onClick={() => toggleOrderColumn(columnValue)}
                >
                  {columnLabel}
                </TableAdminHeadCol>
              ))}
            </TableAdminHead>
            <TableAdminBody>
              {data.map(referent => (
                <TableAdminBodyRow key={`referent-${referent.id}`}>
                  <TableAdminBodyRowCol>
                    {REGIONS[referent.region]} ({referent.region})
                  </TableAdminBodyRowCol>
                  <TableAdminBodyRowCol>
                    {referent.county ? `${COUNTIES[referent.county]} (${referent.county})` : "-"}
                  </TableAdminBodyRowCol>
                  <TableAdminBodyRowCol>{referent.name}</TableAdminBodyRowCol>
                  <TableAdminBodyRowCol>{_.truncate(referent.value, { length: 45 })}</TableAdminBodyRowCol>
                  <TableAdminBodyRowCol>{referent.type}</TableAdminBodyRowCol>
                  <TableAdminBodyRowCol>
                    <FormCheckboxGroup singleCheckbox size="sm">
                      <FormCheckbox
                        id={referent.id}
                        className="principal-checkbox"
                        defaultChecked={referent.principal}
                        // checked={referent.principal}
                        // onChange={event => toggleItem({ id: item.id, checked: event.target.checked })}
                      />
                    </FormCheckboxGroup>
                  </TableAdminBodyRowCol>
                </TableAdminBodyRow>
              ))}
            </TableAdminBody>
          </TableAdmin>
        </div>
      </Container>
    </Box>
  );
};

ReferentListPage.getLayout = ({ children }) => {
  return <AdminLayout title="Liste référents">{children}</AdminLayout>;
};

export default ReferentListPage;
