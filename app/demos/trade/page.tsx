import type { Metadata } from "next";
import { archivo } from "@/app/fonts";
import { TradeSite } from "@/components/demos/trade/TradeSite";

export const metadata: Metadata = {
  title: "Northgate Electrical — Local Electrician (Demo)",
  description: "A Southpage demo site for a trusted local electrical contractor, built to generate enquiries.",
};

export default function Page() {
  return (
    <div className={archivo.variable}>
      <TradeSite />
    </div>
  );
}
