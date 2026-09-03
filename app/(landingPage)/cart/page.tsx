import { CartExperience } from "@/components/store/CartExperience";

export const metadata = {
  title: "Cart - Elite Central Vacuum",
  description: "Review selected accessories and prepare for checkout.",
};

export default function CartPage() {
  return (
    <main className="bg-[#f7fbfa] pb-20 pt-8 sm:pt-10">
      <div className="mx-auto max-w-360 px-4">
        <CartExperience />
      </div>
    </main>
  );
}
