import Link from "next/link";
import { ProjectForm } from "@/components/admin/project-form";
import { SectionHeading } from "@/components/admin/section-heading";
export default function NewAdminProject() { return <section>
  <SectionHeading eyebrow="Project management" title="Create a project draft" description="Capture the public works details. Publishing and QR creation require an authorized server workflow." action={<Link className="button secondary" href="/admin/projects">← Project list</Link>} />
  <ProjectForm />
</section>; }
