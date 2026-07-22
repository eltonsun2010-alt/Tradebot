import type { Metadata } from "next";
import { cormorant } from "@/app/fonts";
import { CafeSite } from "@/components/demos/cafe/CafeSite";

export const metadata: Metadata = {
  title: "Café Aurelia — Neighbourhood Café (Demo)",
  description: "A Southpage demo site for a warm, editorial neighbourhood café and coffee bar.",
};

export default function Page() {
  return (
    <div className={cormorant.variable}>
      <CafeSite />
    </div>
  );
}
