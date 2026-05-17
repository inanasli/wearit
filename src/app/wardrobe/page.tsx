import { Suspense } from "react";
import { WardrobeManager } from "@/components/WardrobeManager";

export default function WardrobePage() {
  return (
    <Suspense fallback={<div className="panel">Dolap yükleniyor...</div>}>
      <WardrobeManager />
    </Suspense>
  );
}
