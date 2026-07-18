import type { Metadata } from "next";
import { fraunces } from "@/app/fonts";
import { CoffeeDemo } from "@/components/demos/CoffeeDemo";

export const metadata: Metadata = {
  title: "Ember & Oak — Coffee Roaster (Demo)",
  description: "A Southpage demo site for a small-batch coffee roaster.",
};

export default function Page() {
  return (
    <div className={fraunces.variable}>
      <CoffeeDemo />
    </div>
  );
}
