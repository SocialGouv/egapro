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

import BlocForm from "../components/BlocForm";
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
          <BlocForm
            key={categorieSocioPro}
            title={displayNameCategorieSocioPro(categorieSocioPro)}
            label="nombre de salariés"
            footer="total 2000"
          >
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
          </BlocForm>
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
  action: css({
    display: "flex",
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 18
  })
};

export default GroupEffectif;
