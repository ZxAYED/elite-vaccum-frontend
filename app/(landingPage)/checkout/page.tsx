import { CheckoutExperience } from "@/components/store/CheckoutExperience";
import { getCartProducts } from "@/data/mock/customer-portal";
import { mockCurrentCustomer, mockCurrentUser } from "@/data/mock/user";

export const metadata = {
  title: "Checkout - Elite Central Vacuum",
  description: "Review delivery and payment details before placing an order.",
};

export default function CheckoutPage() {
  const items = getCartProducts();

  return (
    <main className="bg-[#f7fbfa] pb-20 pt-8 sm:pt-10">
      <div className="mx-auto max-w-360 px-4">
        <CheckoutExperience
          initialItems={items}
          user={mockCurrentUser}
          addresses={mockCurrentCustomer.addresses}
        />
      </div>
    </main>
  );
}
