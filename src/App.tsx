/** @jsx jsx */
import { css, jsx } from "@emotion/core";
import React, { useState } from "react";

function useField(name: string, defaultValue: string = "") {
  const [value, setValue] = useState(defaultValue);

  const [active, setActive] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [touched, setTouched] = useState(false);
  //const [valid, setValid] = useState(false);

  const handleChange = (event: any) => {
    const { value } = event.target;
    setValue(value);
    setDirty(value !== defaultValue);
  };

  const handleBlur = () => {
    setTouched(true);
    setActive(false);
  };

  const handleFocus = () => {
    setActive(true);
  };

  return {
    input: {
      type: "number",
      pattern: "[0-9]",
      name,
      value,
      onChange: handleChange,
      onBlur: handleBlur,
      onFocus: handleFocus
    },
    meta: {
      valueNumber: value ? parseInt(value, 10) : 0,
      active,
      dirty,
      touched
    }
  };
}

function App() {
  const nbSalarieFemmeField = useField("nombreSalariesFemmes");
  const nbSalarieHommeField = useField("nombreSalariesHommes");
  const remuFemmeField = useField("remunerationAnnuelleBrutFemmes");
  const remuHommeField = useField("remunerationAnnuelleBrutHommes");

  const sp = 5 / 100;

  const ev =
    nbSalarieFemmeField.meta.valueNumber + nbSalarieHommeField.meta.valueNumber;

  const erm =
    (remuHommeField.meta.valueNumber - remuFemmeField.meta.valueNumber) /
    remuHommeField.meta.valueNumber;
  const esp = Math.sign(erm) * Math.max(0, Math.abs(erm) - sp);

  const ep = (esp * ev) / ev;

  return (
    <div>
      <header css={styles.header}>
        <p>EGAPRO - Prototype</p>
      </header>

      <div css={styles.bloc}>
        <p css={styles.blocTitle}>Employés - 30 à 39 ans</p>

        <div css={styles.fieldGroup}>
          <label
            css={styles.fieldLabel}
            htmlFor={nbSalarieFemmeField.input.name}
          >
            Nombre de salariés femmes
          </label>
          <input
            css={styles.fieldInput}
            id={nbSalarieFemmeField.input.name}
            {...nbSalarieFemmeField.input}
          />
        </div>

        <div css={styles.fieldGroup}>
          <label
            css={styles.fieldLabel}
            htmlFor={nbSalarieHommeField.input.name}
          >
            Nombre de salariés hommes
          </label>
          <input
            css={styles.fieldInput}
            id={nbSalarieHommeField.input.name}
            {...nbSalarieHommeField.input}
          />
        </div>

        {nbSalarieFemmeField.meta.touched && nbSalarieHommeField.meta.touched && (
          <React.Fragment>
            <div css={styles.message}>
              {nbSalarieFemmeField.meta.valueNumber >= 3 &&
              nbSalarieHommeField.meta.valueNumber >= 3 ? (
                <p>Effectif valide de {ev} personnes</p>
              ) : (
                <p>
                  Groupe invalide car il ne contient pas suffisament de
                  personnes (au moins 3 femmes et 3 hommes)
                </p>
              )}
            </div>
            <div css={styles.fieldGroup}>
              <label
                css={styles.fieldLabel}
                htmlFor={remuFemmeField.input.name}
              >
                Rénumération annuelle brute moyenne femmes
              </label>
              <input
                css={styles.fieldInput}
                id={remuFemmeField.input.name}
                {...remuFemmeField.input}
              />
            </div>
            <div css={styles.fieldGroup}>
              <label
                css={styles.fieldLabel}
                htmlFor={remuHommeField.input.name}
              >
                Rénumération annuelle brute moyenne hommes
              </label>
              <input
                css={styles.fieldInput}
                id={remuHommeField.input.name}
                {...remuHommeField.input}
              />
            </div>
            {remuFemmeField.meta.touched && remuHommeField.meta.touched && (
              <div css={styles.message}>
                {remuFemmeField.meta.valueNumber > 0 &&
                remuHommeField.meta.valueNumber > 0 ? (
                  <React.Fragment>
                    <p>Écart de rémunération moyenne {erm}</p>
                    <p>Écart après application du seuil de pertinence {esp}</p>
                    <p>Écart pondéré {ep}</p>
                  </React.Fragment>
                ) : (
                  <p>Veuillez renseigner les rénumérations moyennes</p>
                )}
              </div>
            )}
          </React.Fragment>
        )}
      </div>
    </div>
  );
}

const styles = {
  header: css({
    backgroundColor: "#282c34",
    minHeight: "10vh",
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "calc(10px + 2vmin)",
    color: "white",
    textAlign: "center"
  }),
  bloc: css({
    display: "flex",
    flexDirection: "column",
    maxWidth: 800,
    padding: "12px 24px",
    margin: "24px auto",
    backgroundColor: "white",
    borderRadius: 6,
    boxShadow: "0px 1px 3px rgba(0, 0, 0, 0.12)"
  }),
  blocTitle: css({
    fontSize: 24,
    paddingTop: 6,
    paddingBottom: 24,
    color: "#353535"
  }),
  fieldGroup: css({
    display: "flex",
    flexDirection: "column",
    marginBottom: 24
  }),
  fieldLabel: css({
    marginBottom: 6
  }),
  fieldInput: css({
    fontSize: 20,
    padding: "2px 6px"
  }),
  message: css({
    fontSize: 26,
    fontWeight: 200,
    textAlign: "center",
    marginBottom: 32,
    marginTop: 12
  })
};

export default App;
