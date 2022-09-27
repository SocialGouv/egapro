import { RepartitionEquilibreeLayout } from "@components/layouts/RepartitionEquilibreeLayout";

export default function CommencerPage() {
  return <h1>Commencer</h1>;
}

CommencerPage.getLayout = function getLayout(page: React.ReactElement) {
  return <RepartitionEquilibreeLayout>{page}</RepartitionEquilibreeLayout>;
};
