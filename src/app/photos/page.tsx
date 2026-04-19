"use client";

import WinnersCanvas from "@/app/components/ui/WinnersCanvas";
import { usePageTitle } from "@/lib/usePageTitle";

export default function PhotosPage() {
  usePageTitle("/photos");

  return (
    <div className="mt-64">
      <WinnersCanvas showControls={true} defaultSeason="s1" height="100vh" />
    </div>
  );
}
