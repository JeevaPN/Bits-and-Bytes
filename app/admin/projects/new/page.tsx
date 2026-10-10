import Link from "next/link";
import { ProjectForm } from "@/components/admin/project-form";
import { SectionHeading } from "@/components/admin/section-heading";
export default function NewAdminProject() { return <section>
  <SectionHeading eyebrow="Project management" title="Create a project" description="Save an authorized public works record with its schedule, location, and publication status." action={<Link className="button secondary" href="/admin/projects">← Project list</Link>} />
  <ProjectForm />
</section>; }
