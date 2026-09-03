import { CheckoutExperience } from "@/components/store/CheckoutExperience";
import { mockCurrentCustomer, mockCurrentUser } from "@/data/mock/user";

export const metadata = {
  title: "Checkout - Elite Central Vacuum",
  description: "Review delivery and payment details before placing an order.",
};

export default function CheckoutPage() {
  return (
    <main className="bg-[#f7fbfa] pb-20 pt-8 sm:pt-10">
      <div className="mx-auto max-w-360 px-4">
        <CheckoutExperience
          user={mockCurrentUser}
          addresses={mockCurrentCustomer.addresses}
        />
      </div>
    </main>
  );
}
