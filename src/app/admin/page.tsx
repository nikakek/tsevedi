import {
  Check,
  ExternalLink,
  Eye,
  EyeOff,
  LogOut,
  Pencil,
  Phone,
  RotateCcw,
  X,
} from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import { formatPhone } from "@/lib/phone";
import { formatDays, formatMonths } from "@/lib/schedule";
import {
  getCounts,
  knownPhones,
  listListings,
  listOpenProblems,
  listRecentRideReports,
  type AdminListing,
} from "@/server/admin";
import { requireAdmin } from "@/server/admin-auth";
import {
  approveAction,
  archiveAction,
  confirmAction,
  logoutAction,
  rejectAction,
  resolveProblemAction,
  restoreAction,
  toggleRideReportAction,
} from "./actions";

const TABS = [
  { key: "pending", label: "Pending" },
  { key: "approved", label: "Approved" },
  { key: "problems", label: "Problem reports" },
  { key: "rides", label: "Ride reports" },
  { key: "archived", label: "Archived / rejected" },
] as const;
type Tab = (typeof TABS)[number]["key"];

export default function AdminPage({ searchParams }: PageProps<"/admin">) {
  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      <Suspense fallback={<p className="text-muted">Loading…</p>}>
        <Dashboard searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function Dashboard({ searchParams }: Pick<PageProps<"/admin">, "searchParams">) {
  await requireAdmin();
  const query = await searchParams;
  const tab: Tab = TABS.some((t) => t.key === query.tab) ? (query.tab as Tab) : "pending";
  const counts = await getCounts();
  const badge: Partial<Record<Tab, number>> = {
    pending: counts.pending,
    approved: counts.approved,
    problems: counts.problems,
  };

  return (
    <>
      <header className="mb-6 flex flex-wrap items-center gap-3">
        <h1 className="mr-auto text-2xl font-bold">Tsevedi admin</h1>
        <Link href="/en" className="btn btn-secondary">
          <ExternalLink className="size-4" aria-hidden /> Site
        </Link>
        <form action={logoutAction}>
          <button className="btn btn-secondary">
            <LogOut className="size-4" aria-hidden /> Sign out
          </button>
        </form>
      </header>
      <nav className="border-line mb-6 flex flex-wrap gap-1 border-b">
        {TABS.map((t) => (
          <Link
            key={t.key}
            href={`/admin?tab=${t.key}`}
            aria-current={tab === t.key ? "page" : undefined}
            className="text-muted aria-[current]:border-brand-600 aria-[current]:text-ink -mb-px border-b-2 border-transparent px-3 py-2 text-sm font-medium"
          >
            {t.label}
            {badge[t.key] ? (
              <span className="bg-canvas ml-1.5 rounded-full px-1.5 text-xs">{badge[t.key]}</span>
            ) : null}
          </Link>
        ))}
      </nav>
      {tab === "pending" && <ListingTab status="PENDING" />}
      {tab === "approved" && <ListingTab status="APPROVED" />}
      {tab === "archived" && (
        <>
          <ListingTab status="ARCHIVED" />
          <ListingTab status="REJECTED" />
        </>
      )}
      {tab === "problems" && <ProblemsTab />}
      {tab === "rides" && <RidesTab />}
    </>
  );
}

function route(listing: { stops: Array<{ place: { nameEn: string } }> }) {
  return listing.stops.map((s) => s.place.nameEn).join(" → ");
}

async function ListingTab({ status }: { status: AdminListing["status"] }) {
  const listings = await listListings(status);
  const known =
    status === "PENDING"
      ? await knownPhones(listings.map((l) => l.driver.phone))
      : new Set<string>();
  if (listings.length === 0) return <p className="text-muted py-8 text-center">Nothing here.</p>;
  return (
    <ul className="space-y-3">
      {listings.map((listing) => (
        <li key={listing.id} className="card p-4">
          <ListingSummary listing={listing} knownDriver={known.has(listing.driver.phone)} />
          <div className="border-line mt-3 flex flex-wrap gap-2 border-t pt-3">
            {status === "PENDING" && (
              <>
                <form action={approveAction.bind(null, listing.id)}>
                  <button className="btn btn-primary">
                    <Check className="size-4" aria-hidden /> Approve (checked by phone)
                  </button>
                </form>
                <form action={rejectAction.bind(null, listing.id)}>
                  <button className="btn btn-secondary">
                    <X className="size-4" aria-hidden /> Reject
                  </button>
                </form>
              </>
            )}
            {status === "APPROVED" && (
              <>
                <form action={confirmAction.bind(null, listing.id)}>
                  <button className="btn btn-primary">
                    <Check className="size-4" aria-hidden /> Confirmed today
                  </button>
                </form>
                <form action={archiveAction.bind(null, listing.id)}>
                  <button className="btn btn-secondary">Archive</button>
                </form>
                <Link href={`/en/listings/${listing.id}`} className="btn btn-secondary">
                  <ExternalLink className="size-4" aria-hidden /> View
                </Link>
              </>
            )}
            {(status === "ARCHIVED" || status === "REJECTED") && (
              <form action={restoreAction.bind(null, listing.id)}>
                <button className="btn btn-secondary">
                  <RotateCcw className="size-4" aria-hidden /> Back to pending
                </button>
              </form>
            )}
            <Link href={`/admin/listings/${listing.id}`} className="btn btn-secondary">
              <Pencil className="size-4" aria-hidden /> Edit
            </Link>
          </div>
        </li>
      ))}
    </ul>
  );
}

function ListingSummary({ listing, knownDriver }: { listing: AdminListing; knownDriver: boolean }) {
  const { driver } = listing;
  return (
    <div className="grid gap-x-6 gap-y-1 text-sm sm:grid-cols-2">
      <div className="flex flex-wrap items-baseline gap-2 sm:col-span-2">
        <span className="text-lg font-semibold">{route(listing)}</span>
        <span className="font-mono">{listing.departureTime}</span>
        {listing.returnTime && <span className="text-muted">(back {listing.returnTime})</span>}
        <span className="text-muted text-xs uppercase">{listing.status}</span>
        {listing._count.problemReports > 0 && (
          <span className="bg-brand-50 text-brand-700 rounded-full px-2 text-xs">
            {listing._count.problemReports} open problems
          </span>
        )}
      </div>
      <p>
        <strong>{driver.name}</strong>{" "}
        <a
          href={`tel:${driver.phone}`}
          className="text-brand-700 inline-flex items-center gap-1 hover:underline"
        >
          <Phone className="size-3.5" aria-hidden /> {formatPhone(driver.phone)}
        </a>
        {knownDriver && (
          <span className="ml-2 rounded bg-emerald-50 px-1.5 text-xs text-emerald-700">
            known driver
          </span>
        )}
      </p>
      <p className="text-muted">
        {[driver.whatsapp && "WhatsApp", driver.viber && "Viber", driver.telegram && "Telegram"]
          .filter(Boolean)
          .join(", ") || "No messengers"}
        {" · "}
        {driver.languages.join(", ") || "no languages"}
      </p>
      <p className="text-muted">
        {driver.vehicleType} {driver.vehicleColor} {driver.vehicleModel} {driver.plate}{" "}
        {driver.seats ? `· ${driver.seats} seats` : ""}
      </p>
      <p className="text-muted">
        {formatDays(listing.days, "en") ?? "Daily"} ·{" "}
        {formatMonths(listing.activeMonths, "en") ?? "All year"} ·{" "}
        {listing.pricePerSeat !== null ? `${listing.pricePerSeat}₾/seat` : "no price"}
        {listing.priceWholeVehicle !== null && ` · ${listing.priceWholeVehicle}₾ whole`}
      </p>
      <p className="sm:col-span-2">📍 {listing.departurePoint}</p>
      {listing.notes && <p className="text-muted sm:col-span-2">“{listing.notes}”</p>}
      <p className="text-muted text-xs sm:col-span-2">
        Submitted {listing.createdAt.toISOString().slice(0, 10)} by{" "}
        {listing.submittedByDriver ? "the driver" : "someone else"}
        {listing.submitterContact && <> · contact: {listing.submitterContact}</>}
        {listing.status === "APPROVED" && (
          <>
            {" "}
            ·{" "}
            {listing.verifiedDaysAgo === null
              ? "never confirmed"
              : `confirmed ${listing.verifiedDaysAgo} days ago`}{" "}
            ({listing.freshness})
          </>
        )}
        {listing.adminNote && <> · note: {listing.adminNote}</>}
      </p>
    </div>
  );
}

async function ProblemsTab() {
  const problems = await listOpenProblems();
  if (problems.length === 0)
    return <p className="text-muted py-8 text-center">No open problem reports.</p>;
  return (
    <ul className="space-y-3">
      {problems.map((problem) => (
        <li key={problem.id} className="card flex flex-wrap items-start gap-3 p-4 text-sm">
          <div className="flex-1">
            <p className="font-semibold">
              {problem.kind.replace("_", " ").toLowerCase()} · {route(problem.listing)}{" "}
              {problem.listing.departureTime}
            </p>
            {problem.message && <p className="mt-1">{problem.message}</p>}
            <p className="text-muted mt-1 text-xs">
              {problem.createdAt.toISOString().slice(0, 16).replace("T", " ")} · driver{" "}
              {problem.listing.driver.name}{" "}
              <a href={`tel:${problem.listing.driver.phone}`} className="text-brand-700">
                {formatPhone(problem.listing.driver.phone)}
              </a>
            </p>
          </div>
          <Link href={`/admin/listings/${problem.listing.id}`} className="btn btn-secondary">
            Edit listing
          </Link>
          <form action={resolveProblemAction.bind(null, problem.id)}>
            <button className="btn btn-primary">
              <Check className="size-4" aria-hidden /> Resolved
            </button>
          </form>
        </li>
      ))}
    </ul>
  );
}

async function RidesTab() {
  const reports = await listRecentRideReports();
  if (reports.length === 0)
    return <p className="text-muted py-8 text-center">No ride reports yet.</p>;
  return (
    <ul className="space-y-2">
      {reports.map((report) => (
        <li
          key={report.id}
          className={`card flex flex-wrap items-center gap-3 p-3 text-sm ${report.hidden ? "opacity-50" : ""}`}
        >
          <div className="flex-1">
            <p>
              <strong>{report.outcome}</strong> · {report.travelDate.toISOString().slice(0, 10)} ·{" "}
              {route(report.listing)}
              {report.departedAt && ` · left ${report.departedAt}`}
              {report.pricePaid !== null && ` · paid ${report.pricePaid}₾`}
            </p>
            {report.comment && <p className="text-muted">{report.comment}</p>}
          </div>
          <form action={toggleRideReportAction.bind(null, report.id, !report.hidden)}>
            <button className="btn btn-secondary">
              {report.hidden ? (
                <Eye className="size-4" aria-hidden />
              ) : (
                <EyeOff className="size-4" aria-hidden />
              )}
              {report.hidden ? "Show" : "Hide"}
            </button>
          </form>
        </li>
      ))}
    </ul>
  );
}
