import * as React from "react";
import {useEffect, useState} from "react";
import {useDebounce, useInputValueChangeHandler} from "../../utils/hooks";
import {findIndicatorsDataForRaisonSociale} from "../../utils/api";
import {AppState} from "../../globals";

const DEBOUNCE_DELAY = 500;

interface FetchedIndicatorsData {
  id: string,
  data: {
    informations: AppState["informations"];
    declaration: AppState["declaration"];
    informationsEntreprise: AppState["informationsEntreprise"];
  }
}

const ConsulterIndex: React.FC = () => {
  const [raisonSociale, setRaisonSociale] = useState("test");
  const [indicatorsData, setIndicatorsData] = useState([]);

  const handleRaisonSocialChange = useInputValueChangeHandler(setRaisonSociale);
  const debouncedRaisonSociale = useDebounce(raisonSociale, DEBOUNCE_DELAY);

  useEffect(() => {
    if (debouncedRaisonSociale.length > 0) {
      findIndicatorsDataForRaisonSociale(debouncedRaisonSociale)
        .then(({ jsonBody }) => {
          setIndicatorsData(jsonBody);
        });
    }
  }, [debouncedRaisonSociale, setIndicatorsData])

  return (<div>
    <div>
      <label>Raison Sociale</label>
      <input value={raisonSociale} placeholder="Raison Sociale" onChange={handleRaisonSocialChange}/>
    </div>

    <table>
      <thead>
        <tr>
          <th>Structure</th>
          <th>Raison Sociale</th>
          <th>Nom UES</th>
          <th>Région</th>
          <th>Département</th>
          <th>SIREN</th>
          <th>Année de déclaration</th>
          <th>Indice</th>
        </tr>
      </thead>
      <tbody>
        {indicatorsData.map(({
          id,
          data: {
            informations,
            informationsEntreprise,
            declaration
          }
        }: FetchedIndicatorsData) => {
          return (<tr key={id}>
            <td>{informationsEntreprise.structure}</td>
            <td>{informationsEntreprise.nomEntreprise}</td>
            <td>{informationsEntreprise.nomUES}</td>
            <td>{informationsEntreprise.region}</td>
            <td>{informationsEntreprise.departement}</td>
            <td>{informationsEntreprise.siren}</td>
            <td>{informations.anneeDeclaration}</td>
            <td>{declaration.totalPoint}/{declaration.totalPointCalculable}</td>
          </tr>)
        })}
      </tbody>
    </table>
  </div>);
};

export default ConsulterIndex;
