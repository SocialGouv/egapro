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
  const [password, setPassword] = useState("");
  const [raisonSociale, setRaisonSociale] = useState("test");
  const [indicatorsData, setIndicatorsData] = useState([]);

  const handleRaisonSocialChange = useInputValueChangeHandler(setRaisonSociale);
  const handlePasswordChange = useInputValueChangeHandler(setPassword);
  const debouncedRaisonSociale = useDebounce(raisonSociale, DEBOUNCE_DELAY);
  const debouncedPassword = useDebounce(password, DEBOUNCE_DELAY);

  useEffect(() => {
    if (debouncedRaisonSociale.length > 0) {
      findIndicatorsDataForRaisonSociale(debouncedRaisonSociale, { token: debouncedPassword})
        .then(({ jsonBody }) => {
          setIndicatorsData(jsonBody);
        });
    }
  }, [debouncedRaisonSociale, debouncedPassword, setIndicatorsData])

  return (<div>
    <div>
      <label>Mot de passe</label>
      <input type="password" value={password} onChange={handlePasswordChange} />
    </div>
    <div>
      <label>Raison Sociale</label>
      <input value={raisonSociale} placeholder="Raison Sociale" onChange={handleRaisonSocialChange}/>
    </div>

    <table>
      <thead>
        <th>Raison Sociale</th>
        <th>Adresse</th>
        <th>SIREN</th>
        <th>Année de déclaration</th>
        <th>Indice</th>
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
            <td>{informationsEntreprise.nomEntreprise}</td>
            <td>{informationsEntreprise.adresse}</td>
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
