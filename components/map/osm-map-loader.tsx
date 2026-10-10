"use client";

import dynamic from "next/dynamic";

const OSMMap = dynamic(
  () => import("@/components/map/osm-map").then((module) => module.OSMMap),
  {
    ssr: false,
    loading: () => <div className="card">Loading OpenStreetMap…</div>,
  },
);

export function OSMMapLoader() {
  return <OSMMap />;
}
