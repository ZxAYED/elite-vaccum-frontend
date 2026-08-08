"use client";
import { useState } from "react";
import { Settings, Wrench } from "lucide-react";
import InstallationModal from "./modal/InstallationModal";

const options = [
  {
    id: "install",
    icon: Settings,
    title: "Request For Installation",
    desc: "Full unboxing, assembly, and testing of your new vacuum unit and installation of filter, brushes, motor, components, or smart modules.",
  },
  {
    id: "repair",
    icon: Wrench,
    title: "Request For Repairing",
    desc: "All types of repairing, servicing, cleaning.",
  },
];

export default function ServiceOptions() {
  const [showInstall, setShowInstall] = useState(false);

  function handleClick(id: string) {
    if (id === "install") setShowInstall(true);
    // wire repair modal the same way when ready
  }

  return (
    <section className="py-12 md:py-24 bg-[#F9F9F9]">
      <div className="max-w-360 mx-auto px-4">
        <h2 className="text-2xl font-bold mb-6 text-primary">
          Choose an option you need
        </h2>
        <div className="grid md:grid-cols-2 gap-4 md:px-32">
          {options.map(({ id, icon: Icon, title, desc }) => (
            <button
              key={id}
              onClick={() => handleClick(id)}
              className="text-left bg-white border border-border rounded-xl p-6 hover:border-primary hover:bg-primary/5 transition-colors"
            >
              <div className="flex items-center gap-2 mb-2">
                <Icon size={18} className="text-primary" />
                <span className="font-semibold text-sm">{title}</span>
              </div>
              <p className="text-sm text-muted-foreground">{desc}</p>
            </button>
          ))}
        </div>
      </div>

      {showInstall && (
        <InstallationModal onClose={() => setShowInstall(false)} />
      )}
    </section>
  );
}
