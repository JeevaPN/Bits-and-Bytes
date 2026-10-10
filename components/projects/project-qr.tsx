import { QRCodeSVG } from "qrcode.react";

export function ProjectQr({ slug, title, size = 84 }: { slug: string; title: string; size?: number }) {
  const baseUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");
  const projectUrl = `${baseUrl}/projects/${slug}`;

  return <div className="project-card-qr">
    <QRCodeSVG value={projectUrl} size={size} level="M" includeMargin title={`QR code for ${title}`} />
    <span>Scan for details</span>
  </div>;
}
