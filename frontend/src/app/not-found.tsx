import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-resort-dark flex flex-col items-center justify-center text-center px-6">
      <p className="text-8xl font-bold text-[var(--gold)] mb-4">404</p>
      <h1 className="text-2xl font-bold text-white mb-2">Room Not Found</h1>
      <p className="text-white/60 mb-8 max-w-md">
        The page you&apos;re looking for doesn&apos;t exist. Perhaps the tide brought it away.
      </p>
      <div className="flex gap-4">
        <Link
          href="/"
          className="rounded-full bg-[var(--gold)] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[var(--gold-light)] hover:text-[var(--navy)] transition-all"
        >
          Back to Home
        </Link>
        <Link
          href="/rooms"
          className="rounded-full border border-white/20 px-6 py-2.5 text-sm font-medium text-white hover:bg-white/10 transition-all"
        >
          Browse Rooms
        </Link>
      </div>
    </div>
  );
}
