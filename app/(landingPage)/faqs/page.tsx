import { Metadata } from "next";
import { FaqsClient } from "@/components/faqs/FaqsClient";

export const metadata: Metadata = {
  title: "Frequently Asked Questions | Elite Central Vacuum",
  description:
    "Explore answers to common questions about central vacuum installation, motor maintenance, inlet clogs, repair services, and warranty coverage.",
};

export default function FaqsPage() {
  return <FaqsClient />;
}
