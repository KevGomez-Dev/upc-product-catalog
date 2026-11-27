'use client';

import { LoadError } from '../components/status';

export default function ApplicationError({ reset }: { reset: () => void }) {
  return (
    <main className="recovery">
      <h1>Catálogo UPC</h1>
      <LoadError
        message="No se pudo abrir la página. Revisa la conexión e intenta de nuevo."
        retry={reset}
      />
    </main>
  );
}
