"use client";

/**
 * Ildiz layout ham yiqilgan holat uchun oxirgi chegara. O'z `<html>` ini beradi.
 * Next 16.3 dan boshlab qayta urinish propi barqaror `retry`.
 */
export default function GlobalError({
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return (
    <html lang="uz">
      <body
        style={{
          margin: 0,
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#090E17',
          color: '#e2e8f0',
          fontFamily: 'system-ui, sans-serif',
          textAlign: 'center',
          padding: '2rem',
        }}
      >
        <div role="alert">
          <h1 style={{ fontSize: '1.5rem', marginBottom: '0.75rem' }}>Ilovada jiddiy xatolik</h1>
          <p style={{ color: '#94a3b8', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
            Sahifani yangilab ko&apos;ring.
          </p>
          <button
            type="button"
            onClick={() => retry()}
            style={{
              background: '#00a383',
              color: '#fff',
              border: 0,
              borderRadius: 12,
              padding: '0.75rem 1.5rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Qayta urinish
          </button>
        </div>
      </body>
    </html>
  );
}
