export type ContentWithAsideProps = {
  aside: React.ReactNode;
  content: React.ReactNode;
};

export const ContentWithAside = ({ aside, content }: ContentWithAsideProps) => {
  return (
    <div className="fr-grid-row">
      <div className="fr-col-12 fr-col-md-4">{aside}</div>
      <div className="fr-col-12 fr-col-md-8 fr-py-12v">{content}</div>
    </div>
  );
};
