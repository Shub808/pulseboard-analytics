import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto mt-16 max-w-md text-center">
      <p className="text-xs font-semibold tracking-widest text-muted uppercase">
        404
      </p>
      <h1 className="mt-2 text-lg font-semibold text-ink">Page not found</h1>
      <p className="mt-2 text-xs text-muted">
        The route you asked for doesn&apos;t exist in this application.
      </p>
      <Link
        href="/"
        className="mt-5 inline-flex h-9 items-center rounded-(--radius-control) bg-brand-600 px-4 text-sm font-medium text-white hover:bg-brand-700"
      >
        Back to the overview
      </Link>
    </div>
  );
}
