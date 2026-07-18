import type { Metadata } from "next";
import { poppins } from "@/app/fonts";
import { DentalDemo } from "@/components/demos/DentalDemo";

export const metadata: Metadata = {
  title: "Marlowe Dental — Dental Studio (Demo)",
  description: "A Southpage demo site for a modern, calm dental practice.",
};

export default function Page() {
  return (
    <div className={poppins.variable}>
      <DentalDemo />
    </div>
  );
}
