/** @jsx jsx */
import { Fragment } from "react";
import { css, jsx } from "@emotion/core";
import { Field } from "react-final-form";

import globalStyles from "../utils/globalStyles";

import { required } from "../utils/formHelpers";

function RegionsDepartements({
  nameRegion,
  nameDepartement,
  readOnly
}: {
  nameRegion: string;
  nameDepartement: string;
  readOnly: boolean;
}) {
  return (
    <Field name={nameRegion} validate={required} component="select">
      {({ input: regionInput, meta: regionMeta }) => (
        <Fragment>
          <div css={styles.formField}>
            <label
              css={[
                styles.label,
                regionMeta.error && regionMeta.touched && styles.labelError
              ]}
              htmlFor={regionInput.name}
            >
              Région
            </label>
            {readOnly ? (
              <div css={styles.fieldRow}>
                <div css={styles.fakeInput}>{regionInput.value}</div>
              </div>
            ) : (
              <Fragment>
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
                  <p css={styles.error}>
                    veuillez sélectionner une région dans la liste
                  </p>
                )}
              </Fragment>
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
                : undefined;
            }}
            component="select"
          >
            {({ input: deptInput, meta: deptMeta }) => (
              <div css={styles.formField}>
                <label
                  css={[
                    styles.label,
                    deptMeta.error && deptMeta.touched && styles.labelError
                  ]}
                  htmlFor={deptInput.name}
                >
                  Département
                </label>
                {readOnly ? (
                  <div css={styles.fieldRow}>
                    <div css={styles.fakeInput}>{deptInput.value}</div>
                  </div>
                ) : (
                  <Fragment>
                    <div css={styles.fieldRow}>
                      <select {...deptInput}>
                        <option value="" key="empty"></option>
                        {Array.isArray(regionsDepartements[regionInput.value])
                          ? regionsDepartements[regionInput.value].map(
                              (region: string) => (
                                <option value={region} key={region}>
                                  {region}
                                </option>
                              )
                            )
                          : null}
                      </select>
                    </div>
                    {deptMeta.error && deptMeta.touched && (
                      <p css={styles.error}>
                        veuillez sélectionner un département dans la liste
                      </p>
                    )}
                  </Fragment>
                )}
              </div>
            )}
          </Field>
        </Fragment>
      )}
    </Field>
  );
}

const styles = {
  formField: css({
    marginBottom: 20
  }),
  label: css({
    fontSize: 14,
    fontWeight: "bold",
    lineHeight: "17px"
  }),
  labelError: css({
    color: globalStyles.colors.error
  }),
  fieldRow: css({
    height: 38,
    marginTop: 5,
    marginBottom: 5,
    display: "flex",
    select: {
      borderRadius: 4,
      border: "1px solid",
      width: "100%"
    }
  }),
  error: css({
    height: 18,
    color: globalStyles.colors.error,
    fontSize: 12,
    textDecoration: "underline",
    lineHeight: "15px"
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
    lineHeight: "38px"
  })
};

export default RegionsDepartements;

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
    "Haute-Savoie"
  ],
  "Bourgogne-Franche-Comté": [
    "Côte-d'Or",
    "Doubs",
    "Jura",
    "Nièvre",
    "Haute-Saône",
    "Saône-et-Loire",
    "Yonne",
    "Territoire de Belfort"
  ],
  Bretagne: ["Côtes-d'Armor", "Finistère", "Ille-et-Vilaine", "Morbihan"],
  "Centre-Val de Loire": [
    "Cher",
    "Eure-et-Loir",
    "Indre",
    "Indre-et-Loire",
    "Loir-et-Cher",
    "Loiret"
  ],
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
    "Vosges"
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
    "Val-d'Oise"
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
    "Haute-Vienne"
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
    "Tarn-et-Garonne"
  ],
  "Pays de la Loire": [
    "Loire-Atlantique",
    "Maine-et-Loire",
    "Mayenne",
    "Sarthe",
    "Vendée"
  ],
  "Provence-Alpes-Côte d'Azur": [
    "Alpes-de-Haute-Provence",
    "Hautes-Alpes",
    "Alpes-Maritimes",
    "Bouches-du-Rhône",
    "Var",
    "Vaucluse"
  ]
};
