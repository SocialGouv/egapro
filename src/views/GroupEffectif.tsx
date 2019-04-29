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

import globalStyles from "../utils/styles";

import { CellHead, Cell } from "../components/Cell";
import CellInputsMenWomen from "../components/CellInputsMenWomen";
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
        <p css={styles.blocTitle}>Indication des effectifs</p>
        <p css={styles.blocSubtitle}>
          Renseignez le nombre d’effectifs par catégorie socio-professionnelle
          (CSP) et par tranche d’âge
        </p>

        <div css={styles.blocForm}>
          <div css={styles.row}>
            <CellHead style={styles.cellHead}>
              {displayNameCategorieSocioPro(effectif.categorieSocioPro)}
            </CellHead>
            <Cell style={styles.cellMen}>hommes</Cell>
            <Cell style={styles.cellWomen}>femmes</Cell>
          </div>

          {infoFields.map(
            ({ trancheAge, nbSalarieFemmeName, nbSalarieHommeName }) => {
              return (
                <CellInputsMenWomen
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
        </div>
        <div css={styles.action}>
          <ButtonSubmit label="valider" />
        </div>
      </div>
    </form>
  );
}

const styles = {
  bloc: css({
    display: "flex",
    flexDirection: "column",
    maxWidth: 1024,
    padding: "12px 0",
    margin: "24px auto"
  }),
  blocTitle: css({
    fontSize: 32
  }),
  blocSubtitle: css({
    marginTop: 7,
    fontSize: 14
  }),
  blocForm: css({
    maxWidth: 264,
    margin: "24px 0"
  }),
  action: css({
    display: "flex",
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 18
  }),
  row: css({
    display: "flex",
    flexDirection: "row",
    alignItems: "flex-end",
    marginTop: 12,
    marginBottom: 24
  }),
  cellHead: css({
    fontSize: 14,
    textTransform: "uppercase"
  }),
  cellMen: css({
    fontSize: 12,
    textAlign: "center",
    color: globalStyles.colors.men
  }),
  cellWomen: css({
    fontSize: 12,
    textAlign: "center",
    color: globalStyles.colors.women
  })
};

export default GroupEffectif;
