/** @jsx jsx */
import { Fragment } from "react";
import { css, jsx } from "@emotion/core";
import { Field } from "react-final-form";

import globalStyles from "../utils/globalStyles";

import { required } from "../utils/formHelpers";

function AnneeDeclaration({
  name,
  label,
  readOnly,
}: {
  name: string;
  label: string;
  readOnly: boolean;
}) {
  // TODO: ce code est correct mais peut prêter à confusion : les utilisateurs
  // peuvent croire qu'il faut mettre "2020" pour une déclaration en février
  // 2020, alors que leur période de référence se termine le 31 décembre 2019
  // (et donc l'année au titre de laquelle les indicateurs sont calculés devrait
  // être 2019). Cf https://github.com/SocialGouv/egapro/issues/503
  // const currentYear = new Date().getFullYear();
  // // 2018 est la première année pour laquelle il était possible de déclarer, et
  // // il est possible de déclarer jusqu'à l'année n.
  // const numYears = currentYear - 2018 + 1;
  // const yearList = Array(numYears)
  //   .fill(0)
  //   .map((_item, index) => Number(2018 + index).toString())
  //   .reverse();
  // TODO: supprimer cette ligne et repasser au code ci-dessus, ou alors
  // supprimer l'année au titre de laquelle les indicateurs sont calculés, et
  // utiliser l'année de la date de fin de la période de référence.
  const yearList = ["2020", "2019", "2018"];
  return (
    <Field name={name} validate={required} component="select">
      {({ input, meta }) => (
        <div css={styles.formField}>
          <label
            css={[
              styles.label,
              meta.error && meta.touched && styles.labelError,
            ]}
            htmlFor={input.name}
          >
            {label}
          </label>
          {readOnly ? (
            <div css={styles.fieldRow}>
              <div css={styles.fakeInput}>{input.value}</div>
            </div>
          ) : (
            <Fragment>
              <div css={styles.fieldRow}>
                <select {...input}>
                  <option />
                  {yearList.map((year: string) => (
                    <option value={year} key={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>
              {meta.error && meta.touched && (
                <p css={styles.error}>
                  veuillez sélectionner une année de déclaration dans la liste
                </p>
              )}
            </Fragment>
          )}
        </div>
      )}
    </Field>
  );
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
};

export default AnneeDeclaration;
