import { CartExperience } from "@/components/store/CartExperience";
import { getCartProducts } from "@/data/mock/customer-portal";

export const metadata = {
  title: "Cart - Elite Central Vacuum",
  description: "Review selected accessories and prepare for checkout.",
};

export default function CartPage() {
  const items = getCartProducts();

  return (
    <main className="bg-[#f7fbfa] pb-20 pt-8 sm:pt-10">
      <div className="mx-auto max-w-360 px-4">
        <CartExperience initialItems={items} />
      </div>
    </main>
  );
}
