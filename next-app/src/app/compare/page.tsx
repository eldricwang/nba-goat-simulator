import { Suspense } from "react";
import CompareClient from "./CompareClient";

export default function ComparePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-neutral-950 text-white flex items-center justify-center">
          <div className="text-white/30">Loading...</div>
        </div>
      }
    >
      <CompareClient />
    </Suspense>
  );
}
