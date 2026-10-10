/* eslint-disable @typescript-eslint/no-require-imports */
"use client";
import "leaflet/dist/leaflet.css";
import { CircleMarker, MapContainer, Popup, TileLayer, useMap, Marker } from "react-leaflet";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { PublicMapRecord } from "@/lib/services/map-server";
import { listPublicMapRecords } from "@/lib/services/map-server";
import { validCoordinate } from "@/lib/map/coordinates";

type MapItem = PublicMapRecord;
type MapKind = "all" | "project" | "issue";
const defaultCenter: [number, number] = [13.04, 80.23];

function LocationControl({ onLocate }: { onLocate: () => void }) {
  const map = useMap();
  useEffect(() => {
    const control = new (require("leaflet").Control)({ position: "topright" });
    control.onAdd = () => {
      const button = require("leaflet").DomUtil.create("button", "leaflet-bar") as HTMLButtonElement;
      button.type = "button";
      button.title = "Show my location";
      button.setAttribute("aria-label", "Show my location");
      button.textContent = "◎";
      button.style.cssText = "width:36px;height:36px;background:white;border:0;cursor:pointer;font-size:21px;line-height:1";
      require("leaflet").DomEvent.disableClickPropagation(button);
      button.addEventListener("click", onLocate);
      return button;
    };
    control.addTo(map);
    return () => { control.remove(); };
  }, [map, onLocate]);
  return null;
}

function Recenter({ items, myLocation }: { items: MapItem[]; myLocation: [number, number] | null }) {
  const map = useMap();
  useEffect(() => {
    if (myLocation) {
      map.setView(myLocation, 15);
    } else if (items.length === 0) {
      map.setView(defaultCenter, 12);
    } else if (items.length === 1) {
      map.setView([items[0].latitude, items[0].longitude], 15);
    } else {
      map.fitBounds(items.map(({ latitude, longitude }) => [latitude, longitude] as [number, number]), { padding: [32, 32], maxZoom: 15 });
    }
  }, [items, map, myLocation]);
  return null;
}

function InvalidateSize() {
  const map = useMap();
  useEffect(() => {
    const resize = () => map.invalidateSize({ pan: false });
    const frame = window.requestAnimationFrame(resize);
    const observer = new ResizeObserver(resize);
    observer.observe(map.getContainer());
    window.addEventListener("resize", resize);
    return () => {
      window.cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("resize", resize);
    };
  }, [map]);
  return null;
}

function markerColor(item: MapItem) {
  if (item.kind === "project") return "#0284c7";
  if (item.urgent) return "#dc2626";
  return item.source === "external" ? "#7c3aed" : "#ea580c";
}

export function OSMMap() {
  const [records, setRecords] = useState<MapItem[]>([]);
  const [query, setQuery] = useState("");
  const [kind, setKind] = useState<MapKind>("all");
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const [myLocation, setMyLocation] = useState<[number, number] | null>(null);
  const [locationMessage, setLocationMessage] = useState("");

  const locateMe = useMemo(() => () => {
    if (!navigator.geolocation) {
      setLocationMessage("Location is not supported by this browser.");
      return;
    }
    setLocationMessage("Finding your location…");
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const position: [number, number] = [coords.latitude, coords.longitude];
        setMyLocation(position);
        setLocationMessage("");
      },
      (reason) => setLocationMessage(reason.code === reason.PERMISSION_DENIED
        ? "Allow location access in your browser to show your position."
        : "Your location could not be determined. Please try again."),
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 30000 },
    );
  }, []);

  useEffect(() => {
    setBusy(true); setError("");
    let active = true;
    void listPublicMapRecords().then((result) => {
      if (!active) return;
      if (result.ok) setRecords(result.data);
      else setError(result.error.message);
    }).finally(() => { if (active) setBusy(false); });
    return () => { active = false; };
  }, [reloadKey]);

  const items = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase();
    return records.filter((item) => (kind === "all" || item.kind === kind)
      && validCoordinate(item.latitude, item.longitude)
      && (!needle || `${item.title} ${item.location} ${item.source ?? ""} ${item.status}`.toLocaleLowerCase().includes(needle)));
  }, [records, query, kind]);

  const center: [number, number] = items[0] ? [items[0].latitude, items[0].longitude] : defaultCenter;
  return <section className="osm-map" aria-label="OpenStreetMap public records">
    <div className="osm-map-toolbar" style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "end", marginBottom: 14 }}>
      <label className="label osm-map-search" style={{ flex: "1 1 260px", margin: 0 }}>Search map records<input className="field" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Street, landmark, project or issue" /></label>
      <label className="label osm-map-filter" style={{ margin: 0 }}>Show<select className="field" value={kind} onChange={(event) => setKind(event.target.value as MapKind)}><option value="all">Projects and issues</option><option value="project">Projects only</option><option value="issue">Issues only</option></select></label>
      {!busy && !error && <span aria-live="polite">{items.length} mapped record{items.length === 1 ? "" : "s"}</span>}
    </div>
    {busy && <p className="card" role="status">Loading public map data…</p>}
    {error && <div className="card" role="alert" style={{ color: "#a33" }}><p>{error}</p><button className="button" type="button" onClick={() => setReloadKey((value) => value + 1)}>Retry</button></div>}
    {!busy && !error && items.length === 0 && <p className="card" role="status">{records.length ? "No records match this search and filter." : "No public records with valid coordinates are available yet."} Public reporting remains available without the map.</p>}
    <div className="osm-map-canvas" style={{ height: 480, borderRadius: 10, overflow: "hidden", border: "1px solid var(--border)" }}>
      <MapContainer center={center} zoom={12} scrollWheelZoom style={{ height: "100%", width: "100%" }}>
        <TileLayer attribution={'&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap contributors</a>'} url={process.env.NEXT_PUBLIC_OSM_TILE_URL || "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"} />
        <InvalidateSize />
        <LocationControl onLocate={locateMe} />
        <Recenter items={items} myLocation={myLocation} />
        {myLocation && <Marker position={myLocation}><Popup>You are here</Popup></Marker>}
        {items.map((item) => <CircleMarker key={`${item.kind}-${item.id}`} center={[item.latitude, item.longitude]} radius={item.urgent ? 11 : 8} pathOptions={{ color: markerColor(item), fillColor: markerColor(item), fillOpacity: 0.85 }}>
          <Popup><strong>{item.title}</strong><br />{item.kind === "project" ? `Project · ${item.status}` : `${item.source ?? "citizen"} issue · ${item.status}`}<br />📍 {item.location}<br /><Link href={item.href}>Open details →</Link></Popup>
        </CircleMarker>)}
      </MapContainer>
    </div>
    {locationMessage && <p className="card" role="status" style={{ marginTop: 12 }}>{locationMessage}</p>}
    <div className="card" style={{ marginTop: 12 }}><strong>Legend:</strong> <span style={{ color: "#0284c7" }}>● official project</span> · <span style={{ color: "#ea580c" }}>● citizen issue</span> · <span style={{ color: "#7c3aed" }}>● external observation</span> · <span style={{ color: "#dc2626" }}>● urgent issue</span><p style={{ marginBottom: 0, color: "var(--muted)", fontSize: 13 }}>OSM supplies the basemap; CivicSync supplies records and status. Map positions use the records’ stored coordinates.</p></div>
    <div className="card" style={{ marginTop: 12 }}><h2>Accessible record list</h2>{items.length ? <ul>{items.map((item) => <li key={`list-${item.kind}-${item.id}`}><Link href={item.href} style={{ color: "var(--accent)" }}>{item.title}</Link> · {item.location} · {item.kind === "project" ? item.status : `${item.source ?? "citizen"} · ${item.status}`}</li>)}</ul> : <p>No mapped records.</p>}<a href="https://www.openstreetmap.org/fixthemap" target="_blank" rel="noreferrer" style={{ color: "var(--accent)" }}>Report an OpenStreetMap data problem →</a></div>
  </section>;
}
