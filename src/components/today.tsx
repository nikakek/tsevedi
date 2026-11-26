import { connection } from "next/server";
import { todayInGeorgia } from "@/lib/schedule";

/** Renders children with today's date in Georgia, computed per request (never baked into a prerender). */
export async function TodayInGeorgia({
  children,
}: {
  children: (today: string) => React.ReactNode;
}) {
  await connection();
  return <>{children(todayInGeorgia())}</>;
}
