import { redirect } from "next/navigation";

export default function OrderConfirmationRedirectPage() {
  redirect("/admin/service-requests");
}
