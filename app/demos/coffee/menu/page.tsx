import type { Metadata } from "next";
import { fraunces } from "@/app/fonts";
import { CoffeeMenu } from "@/components/demos/coffee/CoffeeMenu";

export const metadata: Metadata = { title: "Coffee — Ember & Oak (Demo)" };

export default function Page() {
  return <div className={fraunces.variable}><CoffeeMenu /></div>;
}
