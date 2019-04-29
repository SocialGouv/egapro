/** @jsx jsx */
import { css, jsx } from "@emotion/core";
import { RouteComponentProps } from "react-router-dom";
import { useForm } from "react-final-form-hooks";
import {
  CategorieSocioPro,
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
  state: Array<Groupe>;
  updateEffectif: (data: ActionEffectifData) => void;
}

const getFieldName = (
  categorieSocioPro: CategorieSocioPro,
  trancheAge: TranchesAges,
  genre: "Hommes" | "Femmes"
): string => "nombreSalaries" + categorieSocioPro + genre + trancheAge;

function GroupEffectif({ state, updateEffectif, history }: Props) {
  const infoFields = state.map(({ categorieSocioPro, tranchesAges }) => {
    return {
      categorieSocioPro,
      tranchesAges: tranchesAges.map(
        ({
          trancheAge,
          nombreSalariesFemmes,
          nombreSalariesHommes
        }: GroupTranchesAges) => {
          return {
            trancheAge,
            nbSalarieFemmeName: getFieldName(
              categorieSocioPro,
              trancheAge,
              "Femmes"
            ),
            nbSalarieFemmeValue:
              nombreSalariesFemmes === undefined
                ? ""
                : String(nombreSalariesFemmes),
            nbSalarieHommeName: getFieldName(
              categorieSocioPro,
              trancheAge,
              "Hommes"
            ),
            nbSalarieHommeValue:
              nombreSalariesHommes === undefined
                ? ""
                : String(nombreSalariesHommes)
          };
        }
      )
    };
  });

  const initialValues = infoFields.reduce((acc1, { tranchesAges }) => {
    return tranchesAges.reduce(
      (
        acc2,
        {
          nbSalarieFemmeName,
          nbSalarieFemmeValue,
          nbSalarieHommeName,
          nbSalarieHommeValue
        }
      ) => {
        return {
          ...acc2,
          [nbSalarieFemmeName]: nbSalarieFemmeValue,
          [nbSalarieHommeName]: nbSalarieHommeValue
        };
      },
      acc1
    );
  }, {});

  const onSubmit = (formData: any) => {
    const data: ActionEffectifData = infoFields.map(
      ({ categorieSocioPro, tranchesAges }) => ({
        categorieSocioPro,
        tranchesAges: tranchesAges.map(
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
      })
    );
    updateEffectif(data);
    history.push("/indicateur1");
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

        {infoFields.map(({ categorieSocioPro, tranchesAges }) => (
          <div css={styles.blocForm} key={categorieSocioPro}>
            <div css={styles.row}>
              <CellHead style={styles.cellHead}>
                {displayNameCategorieSocioPro(categorieSocioPro)}
              </CellHead>
              <Cell style={styles.cellMen}>hommes</Cell>
              <Cell style={styles.cellWomen}>femmes</Cell>
            </div>

            {tranchesAges.map(
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
        ))}

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
