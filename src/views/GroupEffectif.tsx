/** @jsx jsx */
import { css, jsx } from "@emotion/core";
import { RouteComponentProps } from "react-router-dom";
import { useForm } from "react-final-form-hooks";
import {
  TranchesAges,
  Groupe,
  GroupTranchesAges,
  ActionEffectifData
} from "../globals.d";

import RowFemmesHommes from "../components/RowFemmesHommes";
import ButtonSubmit from "../components/ButtonSubmit";

import {
  displayNameCategorieSocioPro,
  displayNameTranchesAges
} from "../utils/helpers";

interface Props extends RouteComponentProps {
  effectif: Groupe;
  updateEffectif: (data: ActionEffectifData) => void;
}

const getFieldName = (
  trancheAge: TranchesAges,
  genre: "Hommes" | "Femmes"
): string => "nombreSalaries" + trancheAge + genre;

function GroupEffectif({ effectif, updateEffectif, history }: Props) {
  const infoFields = effectif.tranchesAges.map(
    ({
      trancheAge,
      nombreSalariesFemmes,
      nombreSalariesHommes
    }: GroupTranchesAges) => {
      return {
        trancheAge,
        nbSalarieFemmeName: getFieldName(trancheAge, "Femmes"),
        nbSalarieFemmeValue:
          nombreSalariesFemmes === undefined
            ? ""
            : String(nombreSalariesFemmes),
        nbSalarieHommeName: getFieldName(trancheAge, "Hommes"),
        nbSalarieHommeValue:
          nombreSalariesHommes === undefined ? "" : String(nombreSalariesHommes)
      };
    }
  );

  const initialValues = infoFields.reduce(
    (
      acc,
      {
        nbSalarieFemmeName,
        nbSalarieFemmeValue,
        nbSalarieHommeName,
        nbSalarieHommeValue
      }
    ) => {
      return {
        ...acc,
        [nbSalarieFemmeName]: nbSalarieFemmeValue,
        [nbSalarieHommeName]: nbSalarieHommeValue
      };
    },
    {}
  );

  const onSubmit = (formData: any) => {
    const data: ActionEffectifData = {
      categorieSocioPro: effectif.categorieSocioPro,
      tranchesAges: infoFields.map(
        ({ trancheAge, nbSalarieFemmeName, nbSalarieHommeName }) => ({
          trancheAge,
          nombreSalariesFemmes:
            formData[nbSalarieFemmeName] === ""
              ? undefined
              : parseInt(formData[nbSalarieFemmeName], 10),
          nombreSalariesHommes:
            formData[nbSalarieHommeName] === ""
              ? undefined
              : parseInt(formData[nbSalarieHommeName], 10)
        })
      )
    };

    updateEffectif(data);
    const nextRoute =
      effectif.categorieSocioPro < 3
        ? `/effectifs/${effectif.categorieSocioPro + 1}`
        : "/indicateur1";
    history.push(nextRoute);
  };

  const { form, handleSubmit /*, values, pristine, submitting*/ } = useForm({
    initialValues,
    onSubmit // the function to call with your form values upon valid submit
    //validate // a record-level validation function to check all form values
  });

  return (
    <form onSubmit={handleSubmit}>
      <div css={styles.bloc}>
        <p css={styles.blocTitle}>
          Nombre de salarié -{" "}
          {displayNameCategorieSocioPro(effectif.categorieSocioPro)}
        </p>

        <div css={styles.row}>
          <div css={styles.cellHead}>tranche d'âge</div>
          <div css={styles.cell}>femmes</div>
          <div css={styles.cell}>hommes</div>
        </div>

        {infoFields.map(
          ({ trancheAge, nbSalarieFemmeName, nbSalarieHommeName }) => {
            return (
              <RowFemmesHommes
                key={trancheAge}
                form={form}
                name={displayNameTranchesAges(trancheAge)}
                calculable={true}
                femmeFieldName={nbSalarieFemmeName}
                hommeFieldName={nbSalarieHommeName}
              />
            );
          }
        )}

        <ButtonSubmit label="Valider" />
      </div>
    </form>
  );
}

const styles = {
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
    color: "#353535",
    textAlign: "center"
  }),
  row: css({
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
    marginBottom: 24
  }),
  cellHead: css({
    flexGrow: 1,
    flexBasis: "0%",
    textAlign: "right",
    fontWeight: "bold"
  }),
  cell: css({
    flexGrow: 2,
    flexBasis: "0%",
    marginLeft: 24,
    textAlign: "center",
    fontWeight: "bold"
  })
};

export default GroupEffectif;
