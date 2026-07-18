import type { Metadata } from "next";
import { fraunces } from "@/app/fonts";
import { CoffeeVisit } from "@/components/demos/coffee/CoffeeVisit";

export const metadata: Metadata = { title: "Visit — Ember & Oak (Demo)" };

export default function Page() {
  return <div className={fraunces.variable}><CoffeeVisit /></div>;
}
