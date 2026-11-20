"use client";

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", textAlign: "center", padding: 32 }}>
      <div>
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: 32 }}>Lost at sea</h1>
        <p style={{ margin: "8px 0 16px" }}>Something went wrong loading this page.</p>
        <button onClick={reset} style={{ font: "inherit", padding: "6px 14px", cursor: "pointer" }}>
          Try again
        </button>
      </div>
    </main>
  );
}
