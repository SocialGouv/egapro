type Props = {
  max: number;
  note: number;
};

export const IndicatorNote = ({ max, note }: Props) => {
  return (
    <div style={{ border: "1px solid lightgrey", display: "flex", gap: 30, padding: 20, margin: "50px 0" }}>
      <div style={{ borderRight: "1px solid gray", paddingRight: 20 }}>
        {note} / {max}
      </div>
      <div>Nombre de points obtenus à l'indicateur</div>
    </div>
  );
};
