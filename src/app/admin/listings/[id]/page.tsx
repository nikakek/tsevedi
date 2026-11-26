import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { getListingForEdit } from "@/server/admin";
import { requireAdmin } from "@/server/admin-auth";
import { updateListingAction } from "../../actions";
import { EditForm } from "./edit-form";

export default function EditListingPage({ params }: PageProps<"/admin/listings/[id]">) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <Link
        href="/admin"
        className="text-muted hover:text-ink mb-4 inline-flex items-center gap-1 text-sm"
      >
        <ArrowLeft className="size-4" aria-hidden /> Dashboard
      </Link>
      <Suspense fallback={<p className="text-muted">Loading…</p>}>
        <Editor params={params} />
      </Suspense>
    </div>
  );
}

async function Editor({ params }: Pick<PageProps<"/admin/listings/[id]">, "params">) {
  await requireAdmin();
  const { id } = await params;
  const listing = await getListingForEdit(id);
  if (!listing) notFound();
  const { driver } = listing;

  return (
    <>
      <h1 className="mb-1 text-2xl font-semibold tracking-tight">
        {listing.stops.map((s) => s.place.nameEn).join(" → ")}
      </h1>
      <p className="text-muted mb-6 text-sm">Status: {listing.status}</p>
      <EditForm
        action={updateListingAction.bind(null, listing.id)}
        values={{
          driverName: driver.name,
          phone: driver.phone,
          whatsapp: driver.whatsapp,
          viber: driver.viber,
          telegram: driver.telegram,
          languages: driver.languages,
          vehicleType: driver.vehicleType,
          vehicleModel: driver.vehicleModel ?? "",
          vehicleColor: driver.vehicleColor ?? "",
          plate: driver.plate ?? "",
          seats: driver.seats?.toString() ?? "",
          stops: listing.stops.map((s) => s.place.slug).join(", "),
          departureTime: listing.departureTime,
          days: listing.days.join(","),
          activeMonths: listing.activeMonths.join(","),
          departurePoint: listing.departurePoint,
          departureMapsUrl: listing.departureMapsUrl ?? "",
          returnTime: listing.returnTime ?? "",
          returnPoint: listing.returnPoint ?? "",
          pricePerSeat: listing.pricePerSeat?.toString() ?? "",
          priceWholeVehicle: listing.priceWholeVehicle?.toString() ?? "",
          largeLuggage: listing.largeLuggage === null ? "" : listing.largeLuggage ? "yes" : "no",
          callAhead: listing.callAhead,
          notes: listing.notes ?? "",
          adminNote: listing.adminNote ?? "",
        }}
      />
    </>
  );
}
