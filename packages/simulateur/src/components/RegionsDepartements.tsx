/** @jsxImportSource @emotion/react */
import { css } from "@emotion/react"
import { Field } from "react-final-form"

import globalStyles from "../utils/globalStyles"

import { required } from "../utils/formHelpers"

function RegionsDepartements({
  nameRegion,
  nameDepartement,
  readOnly,
}: {
  nameRegion: string
  nameDepartement: string
  readOnly: boolean
}) {
  return (
    <Field name={nameRegion} validate={required} component="select">
      {({ input: regionInput, meta: regionMeta }) => (
        <>
          <div css={styles.formField}>
            <label
              css={[styles.label, regionMeta.error && regionMeta.touched && styles.labelError]}
              htmlFor={regionInput.name}
            >
              Région
            </label>
            {readOnly ? (
              <div css={styles.fieldRow}>
                <div css={styles.fakeInput}>{regionInput.value}</div>
              </div>
            ) : (
              <>
                <div css={styles.fieldRow}>
                  <select {...regionInput}>
                    <option value="" key="empty"></option>
                    {Object.keys(regionsDepartements).map((region: string) => (
                      <option value={region} key={region}>
                        {region}
                      </option>
                    ))}
                  </select>
                </div>
                {regionMeta.error && regionMeta.touched && (
                  <p css={styles.error}>veuillez sélectionner une région dans la liste</p>
                )}
              </>
            )}
          </div>

          {/* "sous-champ" qui dépend du `regionInput.value` */}
          <Field
            name={nameDepartement}
            validate={(departement: string, { region }: any) => {
              return required(departement) ||
                regionsDepartements[region] === undefined ||
                !regionsDepartements[region].includes(departement)
                ? true
                : undefined
            }}
            component="select"
          >
            {({ input: deptInput, meta: deptMeta }) => (
              <div css={styles.formField}>
                <label
                  css={[styles.label, deptMeta.error && deptMeta.touched && styles.labelError]}
                  htmlFor={deptInput.name}
                >
                  Département
                </label>
                {readOnly ? (
                  <div css={styles.fieldRow}>
                    <div css={styles.fakeInput}>{deptInput.value}</div>
                  </div>
                ) : (
                  <>
                    <div css={styles.fieldRow}>
                      <select {...deptInput}>
                        <option value="" key="empty"></option>
                        {Array.isArray(regionsDepartements[regionInput.value])
                          ? regionsDepartements[regionInput.value].map((region: string) => (
                              <option value={region} key={region}>
                                {region}
                              </option>
                            ))
                          : null}
                      </select>
                    </div>
                    {deptMeta.error && deptMeta.touched && (
                      <p css={styles.error}>veuillez sélectionner un département dans la liste</p>
                    )}
                  </>
                )}
              </div>
            )}
          </Field>
        </>
      )}
    </Field>
  )
}

const styles = {
  formField: css({
    marginBottom: 20,
  }),
  label: css({
    fontSize: 14,
    fontWeight: "bold",
    lineHeight: "17px",
  }),
  labelError: css({
    color: globalStyles.colors.error,
  }),
  fieldRow: css({
    height: 38,
    marginTop: 5,
    marginBottom: 5,
    display: "flex",
    select: {
      borderRadius: 4,
      border: "1px solid",
      width: "100%",
    },
  }),
  error: css({
    height: 18,
    color: globalStyles.colors.error,
    fontSize: 12,
    textDecoration: "underline",
    lineHeight: "15px",
  }),
  fakeInput: css({
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: "auto",
    paddingLeft: 23,
    paddingRight: 23,

    backgroundColor: "white",
    borderRadius: 5,

    fontSize: 14,
    lineHeight: "38px",
    cursor: "not-allowed",
  }),
}

export default RegionsDepartements

// TODO: refactor en utilisant le endpoint GET /config qui contient déjà les informations régions et départements.
const regionsDepartements: { [key: string]: Array<string> } = {
  "Auvergne-Rhône-Alpes": [
    "Ain",
    "Allier",
    "Ardèche",
    "Cantal",
    "Drôme",
    "Isère",
    "Loire",
    "Haute-Loire",
    "Puy-de-Dôme",
    "Rhône",
    "Savoie",
    "Haute-Savoie",
  ],
  "Bourgogne-Franche-Comté": [
    "Côte-d'Or",
    "Doubs",
    "Jura",
    "Nièvre",
    "Haute-Saône",
    "Saône-et-Loire",
    "Yonne",
    "Territoire de Belfort",
  ],
  Bretagne: ["Côtes-d'Armor", "Finistère", "Ille-et-Vilaine", "Morbihan"],
  "Centre-Val de Loire": ["Cher", "Eure-et-Loir", "Indre", "Indre-et-Loire", "Loir-et-Cher", "Loiret"],
  Corse: ["Corse-du-Sud", "Haute-Corse"],
  "Grand Est": [
    "Ardennes",
    "Aube",
    "Marne",
    "Haute-Marne",
    "Meurthe-et-Moselle",
    "Meuse",
    "Moselle",
    "Bas-Rhin",
    "Haut-Rhin",
    "Vosges",
  ],
  Guadeloupe: ["Guadeloupe"],
  Guyane: ["Guyane"],
  "Hauts-de-France": ["Aisne", "Nord", "Oise", "Pas-de-Calais", "Somme"],
  "Île-de-France": [
    "Paris",
    "Seine-et-Marne",
    "Yvelines",
    "Essonne",
    "Hauts-de-Seine",
    "Seine-Saint-Denis",
    "Val-de-Marne",
    "Val-d'Oise",
  ],
  "La Réunion": ["La Réunion"],
  Martinique: ["Martinique"],
  Mayotte: ["Mayotte"],
  Normandie: ["Calvados", "Eure", "Manche", "Orne", "Seine-Maritime"],
  "Nouvelle-Aquitaine": [
    "Charente",
    "Charente-Maritime",
    "Corrèze",
    "Creuse",
    "Dordogne",
    "Gironde",
    "Landes",
    "Lot-et-Garonne",
    "Pyrénées-Atlantiques",
    "Deux-Sèvres",
    "Vienne",
    "Haute-Vienne",
  ],
  Occitanie: [
    "Ariège",
    "Aude",
    "Aveyron",
    "Gard",
    "Haute-Garonne",
    "Gers",
    "Hérault",
    "Lot",
    "Lozère",
    "Hautes-Pyrénées",
    "Pyrénées-Orientales",
    "Tarn",
    "Tarn-et-Garonne",
  ],
  "Pays de la Loire": ["Loire-Atlantique", "Maine-et-Loire", "Mayenne", "Sarthe", "Vendée"],
  "Provence-Alpes-Côte d'Azur": [
    "Alpes-de-Haute-Provence",
    "Hautes-Alpes",
    "Alpes-Maritimes",
    "Bouches-du-Rhône",
    "Var",
    "Vaucluse",
  ],
}

export const regionCode: { [key: string]: string } = {
  "Auvergne-Rhône-Alpes": "84",
  "Bourgogne-Franche-Comté": "27",
  Bretagne: "53",
  "Centre-Val de Loire": "24",
  Corse: "94",
  "Grand Est": "44",
  Guadeloupe: "01",
  Guyane: "03",
  "Hauts-de-France": "32",
  "Île-de-France": "11",
  "La Réunion": "04",
  Martinique: "02",
  Mayotte: "06",
  Normandie: "28",
  "Nouvelle-Aquitaine": "75",
  Occitanie: "76",
  "Pays de la Loire": "52",
  "Provence-Alpes-Côte d'Azur": "93",
}

export const stringFromCode = (correspondance: { [key: string]: string }) => (code: string) =>
  //TODO REFACTOR : utiliser Object.values
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  Object.entries(correspondance || {}).find(([_, c]) => c === code)?.[0] || ""

export const regionFromCode = stringFromCode(regionCode)

export const departementCode: { [key: string]: string } = {
  Ain: "01",
  Aisne: "02",
  Allier: "03",
  "Alpes-de-Haute-Provence": "04",
  "Hautes-Alpes": "05",
  "Alpes-Maritimes": "06",
  Ardèche: "07",
  Ardennes: "08",
  Ariège: "09",
  Aube: "10",
  Aude: "11",
  Aveyron: "12",
  "Bouches-du-Rhône": "13",
  Calvados: "14",
  Cantal: "15",
  Charente: "16",
  "Charente-Maritime": "17",
  Cher: "18",
  Corrèze: "19",
  "Corse-du-Sud": "2A",
  "Haute-Corse": "2B",
  "Côte-d'Or": "21",
  "Côtes-d'Armor": "22",
  Creuse: "23",
  Dordogne: "24",
  Doubs: "25",
  Drôme: "26",
  Eure: "27",
  "Eure-et-Loir": "28",
  Finistère: "29",
  Gard: "30",
  "Haute-Garonne": "31",
  Gers: "32",
  Gironde: "33",
  Hérault: "34",
  "Ille-et-Vilaine": "35",
  Indre: "36",
  "Indre-et-Loire": "37",
  Isère: "38",
  Jura: "39",
  Landes: "40",
  "Loir-et-Cher": "41",
  Loire: "42",
  "Haute-Loire": "43",
  "Loire-Atlantique": "44",
  Loiret: "45",
  Lot: "46",
  "Lot-et-Garonne": "47",
  Lozère: "48",
  "Maine-et-Loire": "49",
  Manche: "50",
  Marne: "51",
  "Haute-Marne": "52",
  Mayenne: "53",
  "Meurthe-et-Moselle": "54",
  Meuse: "55",
  Morbihan: "56",
  Moselle: "57",
  Nièvre: "58",
  Nord: "59",
  Oise: "60",
  Orne: "61",
  "Pas-de-Calais": "62",
  "Puy-de-Dôme": "63",
  "Pyrénées-Atlantiques": "64",
  "Hautes-Pyrénées": "65",
  "Pyrénées-Orientales": "66",
  "Bas-Rhin": "67",
  "Haut-Rhin": "68",
  Rhône: "69",
  "Haute-Saône": "70",
  "Saône-et-Loire": "71",
  Sarthe: "72",
  Savoie: "73",
  "Haute-Savoie": "74",
  Paris: "75",
  "Seine-Maritime": "76",
  "Seine-et-Marne": "77",
  Yvelines: "78",
  "Deux-Sèvres": "79",
  Somme: "80",
  Tarn: "81",
  "Tarn-et-Garonne": "82",
  Var: "83",
  Vaucluse: "84",
  Vendée: "85",
  Vienne: "86",
  "Haute-Vienne": "87",
  Vosges: "88",
  Yonne: "89",
  "Territoire de Belfort": "90",
  Essonne: "91",
  "Hauts-de-Seine": "92",
  "Seine-Saint-Denis": "93",
  "Val-de-Marne": "94",
  "Val-d'Oise": "95",
  Guadeloupe: "971",
  Martinique: "972",
  Guyane: "973",
  "La Réunion": "974",
  "Saint-Pierre-et-Miquelon": "975",
  Mayotte: "976",
  "Saint-Barthélemy": "977",
  "Saint-Martin": "978",
  "Terres australes et antarctiques françaises": "984",
  "Wallis-et-Futuna": "986",
  "Polynésie française": "987",
  "Nouvelle-Calédonie": "988",
  "Île de Clipperton": "989",
}

export const departementFromCode = stringFromCode(departementCode)
