import * as React from "react";
import { RepartitionEquilibreeLayout } from "@components/layouts/RepartitionEquilibreeLayout";

const title = "Validation de l'email";

export default function EmailPage() {
  return (
    <>
      <h1>{title}</h1>
      <p>
        Lorem ipsum dolor sit amet consectetur adipisicing elit. Placeat quia deleniti, sequi voluptatum suscipit
        blanditiis mollitia labore eius nobis, aperiam, exercitationem repellat nihil soluta minima vel molestias rerum.
        Maiores, aliquam.
      </p>
      <p>
        Lorem ipsum dolor sit amet consectetur adipisicing elit. Placeat quia deleniti, sequi voluptatum suscipit
        blanditiis mollitia labore eius nobis, aperiam, exercitationem repellat nihil soluta minima vel molestias rerum.
        Maiores, aliquam.
      </p>
      <p>
        Lorem ipsum dolor sit amet consectetur adipisicing elit. Placeat quia deleniti, sequi voluptatum suscipit
        blanditiis mollitia labore eius nobis, aperiam, exercitationem repellat nihil soluta minima vel molestias rerum.
        Maiores, aliquam.
      </p>
      <p>
        Lorem ipsum dolor sit amet consectetur adipisicing elit. Placeat quia deleniti, sequi voluptatum suscipit
        blanditiis mollitia labore eius nobis, aperiam, exercitationem repellat nihil soluta minima vel molestias rerum.
        Maiores, aliquam.
      </p>
      ;
    </>
  );
}

EmailPage.getLayout = function getLayout(page: React.ReactElement) {
  return <RepartitionEquilibreeLayout>{page}</RepartitionEquilibreeLayout>;
};
