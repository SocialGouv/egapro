// import { useUser } from "@components/AuthContext";
import Link from "next/link";
import { ButtonAsLink } from "../../design-system/base/ButtonAsLink";
import { FormLayout, FormLayoutButtonGroup } from "../../design-system/layout/FormLayout";
import type { NextPageWithLayout } from "../_app";
import { RepartitionEquilibreeLayout } from "@components/layouts/RepartitionEquilibreeLayout";

const title = "Écart de représentation";

const EcartRepresentationPage: NextPageWithLayout = () => {
  return (
    <>
      <h1>{title}</h1>

      <form noValidate>
        <FormLayout>
          <FormLayoutButtonGroup>
            <Link href="/ecart-rep/periode-reference" passHref>
              <ButtonAsLink size="sm" variant="secondary">
                Précédent
              </ButtonAsLink>
            </Link>
            <Link href="/xxx" passHref>
              <ButtonAsLink size="sm" isDisabled>
                Suivant
              </ButtonAsLink>
            </Link>
          </FormLayoutButtonGroup>
        </FormLayout>
      </form>
    </>
  );
};

EcartRepresentationPage.getLayout = ({ children }) => {
  return <RepartitionEquilibreeLayout>{children}</RepartitionEquilibreeLayout>;
};

export default EcartRepresentationPage;
