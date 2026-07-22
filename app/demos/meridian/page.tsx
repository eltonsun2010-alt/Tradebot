import type { Metadata } from "next";
import { newsreader } from "@/app/fonts";
import { MeridianSite } from "@/components/demos/meridian/MeridianSite";

export const metadata: Metadata = {
  title: "Meridian Advisory — Wealth & Financial Advisory (Demo)",
  description: "A Southpage demo site for a premium, independent wealth and financial advisory firm.",
};

export default function Page() {
  return (
    <div className={newsreader.variable}>
      <MeridianSite />
    </div>
  );
}
