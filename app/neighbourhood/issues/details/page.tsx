"use client";

import { useEffect, useState } from "react";
import { IssueDetail } from "@/components/neighbourhood/issue-detail";

export default function IssuePage() {
  const [id, setId] = useState("");
  useEffect(() => setId(new URLSearchParams(window.location.search).get("id") ?? ""), []);
  return id ? <IssueDetail id={id} backHref="/issues" /> : <main className="container"><p className="card" role="alert">Choose a report from the public issue list.</p></main>;
}
