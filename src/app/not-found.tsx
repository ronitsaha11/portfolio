import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-screen max-w-[var(--content-max)] flex-col justify-center px-[var(--spacing-page)]">
      <p className="t-legend m-0" style={{ color: "var(--mark)" }}>
        No sample at this coordinate
      </p>
      <h1 className="t-hero mt-4 mb-0" style={{ color: "var(--ink-hi)" }}>
        404
      </h1>
      <p className="measure mt-5 text-[1.05rem]" style={{ color: "var(--ink-md)" }}>
        The page you asked for is not part of this survey.
      </p>
      <p className="mt-4">
        <Link href="/" className="t-mono text-[0.85rem]">
          ← Return to the survey
        </Link>
      </p>
    </main>
  );
}
