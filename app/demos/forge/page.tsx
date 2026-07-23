import type { Metadata } from "next";
import { anton, barlow } from "@/app/fonts";
import { ForgeSite } from "@/components/demos/forge/ForgeSite";

export const metadata: Metadata = {
  title: "FORGE — Strength Studio (Demo)",
  description: "A Southpage demo site for a high-energy strength & conditioning studio.",
};

export default function Page() {
  return (
    <div className={`${anton.variable} ${barlow.variable}`}>
      <ForgeSite />
    </div>
  );
}
