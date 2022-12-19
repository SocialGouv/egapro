import { BasicLayout } from "@components/layouts/BasicLayout";
import {
  ButtonGroup,
  Container,
  FormButton,
  TableAdmin,
  TableAdminBody,
  TableAdminBodyRow,
  TableAdminBodyRowCol,
  TableAdminHead,
  TableAdminHeadCol,
  Tag,
} from "@design-system";

import type { NextPageWithLayout } from "../_app";

const Home: NextPageWithLayout = () => {
  return (
    <section>
      <Container py="8w">
        <h1>Liste des demandes d’ajout des nouveaux déclarants</h1>
        <ButtonGroup inline="mobile-up" className="fr-mb-4w">
          <FormButton disabled>Valider les demandes</FormButton>
          <FormButton disabled variant="tertiary">
            Refuser les demandes
          </FormButton>
        </ButtonGroup>
        <TableAdmin>
          <TableAdminHead>
            <TableAdminHeadCol>
              <input type="checkbox" />
            </TableAdminHeadCol>
            <TableAdminHeadCol>Status</TableAdminHeadCol>
            <TableAdminHeadCol>Demandeur</TableAdminHeadCol>
            <TableAdminHeadCol>Date de la demande</TableAdminHeadCol>
            <TableAdminHeadCol>Date de traitement</TableAdminHeadCol>
            <TableAdminHeadCol>Siren</TableAdminHeadCol>
            <TableAdminHeadCol colSpan={2}>Email</TableAdminHeadCol>
          </TableAdminHead>
          <TableAdminBody>
            <TableAdminBodyRow>
              <TableAdminBodyRowCol>
                <input type="checkbox" />
              </TableAdminBodyRowCol>
              <TableAdminBodyRowCol>
                <Tag variant="info">À traiter</Tag>
              </TableAdminBodyRowCol>
              <TableAdminBodyRowCol>
                <strong>jean-michel-superlong@beta.gouv.fr</strong>
              </TableAdminBodyRowCol>
              <TableAdminBodyRowCol>12/10/2022</TableAdminBodyRowCol>
              <TableAdminBodyRowCol>-</TableAdminBodyRowCol>
              <TableAdminBodyRowCol>800 168 767</TableAdminBodyRowCol>
              <TableAdminBodyRowCol>laurent.sutterlity@beta.gouv.fr</TableAdminBodyRowCol>
              <TableAdminBodyRowCol />
            </TableAdminBodyRow>
            <TableAdminBodyRow>
              <TableAdminBodyRowCol>
                <input type="checkbox" disabled />
              </TableAdminBodyRowCol>
              <TableAdminBodyRowCol>
                <Tag variant="success">Traité</Tag>
              </TableAdminBodyRowCol>
              <TableAdminBodyRowCol>
                <strong>jean-michel-superlong@beta.gouv.fr</strong>
              </TableAdminBodyRowCol>
              <TableAdminBodyRowCol>12/10/2022</TableAdminBodyRowCol>
              <TableAdminBodyRowCol>12/10/2022</TableAdminBodyRowCol>
              <TableAdminBodyRowCol>800 168 767</TableAdminBodyRowCol>
              <TableAdminBodyRowCol>laurent.sutterlity@beta.gouv.fr</TableAdminBodyRowCol>
              <TableAdminBodyRowCol>
                <FormButton title="Éditer" iconOnly="fr-icon-edit-fill" size="sm" variant="tertiary-no-border" />
              </TableAdminBodyRowCol>
            </TableAdminBodyRow>
            <TableAdminBodyRow>
              <TableAdminBodyRowCol>
                <input type="checkbox" disabled />
              </TableAdminBodyRowCol>
              <TableAdminBodyRowCol>
                <Tag variant="error">Refusé</Tag>
              </TableAdminBodyRowCol>
              <TableAdminBodyRowCol>
                <strong>jean-michel-superlong@beta.gouv.fr</strong>
              </TableAdminBodyRowCol>
              <TableAdminBodyRowCol>12/10/2022</TableAdminBodyRowCol>
              <TableAdminBodyRowCol>12/10/2022</TableAdminBodyRowCol>
              <TableAdminBodyRowCol>800 168 767</TableAdminBodyRowCol>
              <TableAdminBodyRowCol>laurent.sutterlity@beta.gouv.fr</TableAdminBodyRowCol>
              <TableAdminBodyRowCol>
                <FormButton title="Éditer" iconOnly="fr-icon-edit-fill" size="sm" variant="tertiary-no-border" />
              </TableAdminBodyRowCol>
            </TableAdminBodyRow>
            <TableAdminBodyRow>
              <TableAdminBodyRowCol>
                <input type="checkbox" disabled />
              </TableAdminBodyRowCol>
              <TableAdminBodyRowCol>
                <Tag variant="warning">En erreur</Tag>
              </TableAdminBodyRowCol>
              <TableAdminBodyRowCol>
                <strong>jean-michel-superlong@beta.gouv.fr</strong>
              </TableAdminBodyRowCol>
              <TableAdminBodyRowCol>12/10/2022</TableAdminBodyRowCol>
              <TableAdminBodyRowCol>12/10/2022</TableAdminBodyRowCol>
              <TableAdminBodyRowCol>800 168 767</TableAdminBodyRowCol>
              <TableAdminBodyRowCol>laurent.sutterlity@beta.gouv.fr</TableAdminBodyRowCol>
              <TableAdminBodyRowCol>
                <FormButton
                  title="Voir le détail"
                  iconOnly="fr-icon-information-fill"
                  size="sm"
                  variant="tertiary-no-border"
                />
              </TableAdminBodyRowCol>
            </TableAdminBodyRow>
          </TableAdminBody>
        </TableAdmin>
      </Container>
    </section>
  );
};

Home.getLayout = ({ children }) => {
  return <BasicLayout>{children}</BasicLayout>;
};

export default Home;
