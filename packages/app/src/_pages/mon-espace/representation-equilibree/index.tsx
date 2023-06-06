import { YEARS_REPEQ } from "@common/dict";
import { RepresentationEquilibreeStartLayout } from "@components/layouts/RepresentationEquilibreeStartLayout";
import { StaffOnly } from "@components/StaffOnly";
import {
  FormButton,
  FormGroup,
  FormGroupLabel,
  FormInput,
  FormLayout,
  FormLayoutButtonGroup,
  FormSelect,
} from "@design-system";
import { useUser } from "@services/apiClient";
import { useRouter } from "next/router";
import { useForm } from "react-hook-form";

import { type NextPageWithLayout } from "../../_app";

const title = "Recherche de représentation équilibrée";

type FormType = { siren: string; year: string };

const RepresentationEquilibreeListPage: NextPageWithLayout = () => {
  const router = useRouter();
  useUser({ redirectTo: "/representation-equilibree/email" });
  const { register, handleSubmit } = useForm<FormType>({});

  const onSubmit = (data: FormType) => {
    const { siren, year } = data;

    router.push(`./representation-equilibree/${siren}/${year}`);
  };

  return (
    <StaffOnly>
      <h1>{title}</h1>

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <FormLayout>
          <FormGroup>
            <FormGroupLabel htmlFor="year">Année</FormGroupLabel>
            <FormSelect id="year" {...register("year")}>
              {YEARS_REPEQ.sort()
                .reverse()
                .map(year => (
                  <option value={year} key={`year-select-${year}`}>
                    {year}
                  </option>
                ))}
            </FormSelect>
          </FormGroup>
          <FormGroup>
            <FormGroupLabel htmlFor="siren" hint="9 chiffres">
              Numéro Siren de l'entreprise
            </FormGroupLabel>
            <FormInput
              id="siren"
              placeholder="Ex: 504920166, 403461742, 403696735, 914458799"
              type="text"
              {...register("siren")}
              maxLength={9}
            />
          </FormGroup>
          <FormLayoutButtonGroup>
            <FormButton>Rechercher</FormButton>
          </FormLayoutButtonGroup>
        </FormLayout>
      </form>
    </StaffOnly>
  );
};

RepresentationEquilibreeListPage.getLayout = ({ children }) => {
  return <RepresentationEquilibreeStartLayout>{children}</RepresentationEquilibreeStartLayout>;
};

export default RepresentationEquilibreeListPage;
