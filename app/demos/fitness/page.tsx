import type { Metadata } from "next";
import { anton } from "@/app/fonts";
import { FitnessDemo } from "@/components/demos/FitnessDemo";

export const metadata: Metadata = {
  title: "Pulse — Strength Studio (Demo)",
  description: "A Southpage demo site for a high-energy strength & conditioning studio.",
};

export default function Page() {
  return (
    <div className={anton.variable}>
      <FitnessDemo />
    </div>
  );
}
