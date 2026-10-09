"use client";
export function DemoAction({ label, detail }: { label: string; detail: string }) { return <button className="button secondary" type="button" onClick={() => window.alert(`Demo action · ${label}\n\n${detail}\n\nNo changes were saved.`)}>{label}</button>; }
