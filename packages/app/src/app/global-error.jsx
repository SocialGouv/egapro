"use client";

export default function GlobalError({ error, reset }) {
  return (
    <div style={{ padding: 24 }}>
      <h1>Une erreur est survenue</h1>
      <p>Merci de réessayer.</p>

      <button onClick={() => reset()}>
        Réessayer
      </button>
    </div>
  );
}
