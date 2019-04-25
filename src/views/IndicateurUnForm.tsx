/** @jsx jsx */
import { css, jsx } from "@emotion/core";
import { RouteComponentProps } from "react-router-dom";
import { useForm } from "react-final-form-hooks";
import {
  TranchesAges,
  Groupe,
  GroupTranchesAges,
  ActionIndicateurUnData
} from "../globals.d";

import { calculValiditeGroupe } from "../utils/calculsEgaProIndicateurUn";

import RowFemmesHommes from "../components/RowFemmesHommes";
import ButtonSubmit from "../components/ButtonSubmit";
import {
  displayNameCategorieSocioPro,
  displayNameTranchesAges
} from "../utils/helpers";

interface Props extends RouteComponentProps {
  effectif: Groupe;
  updateIndicateurUn: (data: ActionIndicateurUnData) => void;
}

const getFieldName = (
  trancheAge: TranchesAges,
  genre: "Hommes" | "Femmes"
): string => "remunerationAnnuelleBrut" + trancheAge + genre;

function IndicateurUnForm({ effectif, updateIndicateurUn, history }: Props) {
  const infoFields = effectif.tranchesAges.map(
    ({
      trancheAge,
      nombreSalariesFemmes,
      nombreSalariesHommes,
      remunerationAnnuelleBrutFemmes,
      remunerationAnnuelleBrutHommes
    }: GroupTranchesAges) => {
      return {
        trancheAge,
        calculable: calculValiditeGroupe(
          nombreSalariesFemmes || 0,
          nombreSalariesHommes || 0
        ),
        remunerationAnnuelleBrutFemmesName: getFieldName(trancheAge, "Femmes"),
        remunerationAnnuelleBrutFemmesValue:
          remunerationAnnuelleBrutFemmes === undefined
            ? ""
            : String(remunerationAnnuelleBrutFemmes),
        remunerationAnnuelleBrutHommesName: getFieldName(trancheAge, "Hommes"),
        remunerationAnnuelleBrutHommesValue:
          remunerationAnnuelleBrutHommes === undefined
            ? ""
            : String(remunerationAnnuelleBrutHommes)
      };
    }
  );

  const initialValues = infoFields.reduce(
    (
      acc,
      {
        remunerationAnnuelleBrutFemmesName,
        remunerationAnnuelleBrutFemmesValue,
        remunerationAnnuelleBrutHommesName,
        remunerationAnnuelleBrutHommesValue
      }
    ) => {
      return {
        ...acc,
        [remunerationAnnuelleBrutFemmesName]: remunerationAnnuelleBrutFemmesValue,
        [remunerationAnnuelleBrutHommesName]: remunerationAnnuelleBrutHommesValue
      };
    },
    {}
  );

  const onSubmit = (formData: any) => {
    const data: ActionIndicateurUnData = {
      categorieSocioPro: effectif.categorieSocioPro,
      tranchesAges: infoFields.map(
        ({
          trancheAge,
          remunerationAnnuelleBrutFemmesName,
          remunerationAnnuelleBrutHommesName
        }) => ({
          trancheAge,
          remunerationAnnuelleBrutFemmes:
            formData[remunerationAnnuelleBrutFemmesName] === ""
              ? undefined
              : parseInt(formData[remunerationAnnuelleBrutFemmesName], 10),
          remunerationAnnuelleBrutHommes:
            formData[remunerationAnnuelleBrutHommesName] === ""
              ? undefined
              : parseInt(formData[remunerationAnnuelleBrutHommesName], 10)
        })
      )
    };
    updateIndicateurUn(data);

    const nextRoute =
      "/indicateur1" +
      (effectif.categorieSocioPro < 3
        ? `/categorieSocioPro/${effectif.categorieSocioPro + 1}`
        : "/resultat");
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
          Rémunération annuelle brute moyenne -{" "}
          {displayNameCategorieSocioPro(effectif.categorieSocioPro)}
        </p>

        <div css={styles.row}>
          <div css={styles.cellHead}>rémunération</div>
          <div css={styles.cell}>femmes</div>
          <div css={styles.cell}>hommes</div>
        </div>

        {infoFields.map(
          ({
            trancheAge,
            calculable,
            remunerationAnnuelleBrutFemmesName,
            remunerationAnnuelleBrutHommesName
          }) => {
            return (
              <RowFemmesHommes
                key={trancheAge}
                form={form}
                name={displayNameTranchesAges(trancheAge)}
                calculable={calculable}
                femmeFieldName={remunerationAnnuelleBrutFemmesName}
                hommeFieldName={remunerationAnnuelleBrutHommesName}
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
    color: "#353535"
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
  }),
  message: css({
    fontSize: 26,
    fontWeight: 200,
    textAlign: "center",
    marginBottom: 32,
    marginTop: 12
  })
};

export default IndicateurUnForm;
