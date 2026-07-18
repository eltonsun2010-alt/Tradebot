import type { Metadata } from "next";
import { fraunces } from "@/app/fonts";
import { CoffeeAbout } from "@/components/demos/coffee/CoffeeAbout";

export const metadata: Metadata = { title: "Our Story — Ember & Oak (Demo)" };

export default function Page() {
  return <div className={fraunces.variable}><CoffeeAbout /></div>;
}
