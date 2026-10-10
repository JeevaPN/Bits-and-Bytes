import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, ClipboardList, MapPinned, UsersRound } from "lucide-react";
import { getCurrentWorkspaceRole } from "@/lib/auth/authorization";
import { workspaceHome } from "@/lib/auth/workspace-access";

const features = [
  {
    icon: MapPinned,
    title: "Public work, made clear",
    description: "Follow project locations, schedules, and updates in one neighbourhood view.",
  },
  {
    icon: ClipboardList,
    title: "Local issues, with follow-through",
    description: "Neighbours can report concerns while civic teams review and coordinate the response.",
  },
  {
    icon: UsersRound,
    title: "Community work, connected",
    description: "Community partners can take on suitable work and share progress with the people nearby.",
  },
];

export default async function Home() {
  const role = await getCurrentWorkspaceRole();
  if (role) redirect(workspaceHome(role));

  return (
    <main className="landing-page">
      <section className="landing-hero">
        <div className="container landing-hero-grid">
          <div className="landing-copy">
            <div className="eyebrow landing-eyebrow">CivicSync · neighbourhood, in the know</div>
            <h1 className="landing-title">
              A clearer view of
              <span>your neighbourhood.</span>
            </h1>
            <p className="landing-description">
              CivicSync brings public works, local concerns, and community action together so people can see what is happening and where to take part.
            </p>
            <div className="landing-actions">
              <Link className="button landing-primary-action" href="/auth/sign-in">
                Sign in <ArrowRight size={17} aria-hidden="true" />
              </Link>
              <Link className="button secondary landing-secondary-action" href="/auth/sign-up">
                Create an account
              </Link>
            </div>
            <p className="landing-note">A shared place for neighbours, civic teams, and community partners.</p>
          </div>

          <aside className="landing-overview-card" aria-label="What CivicSync brings together">
            <div className="landing-overview-heading">
              <span className="landing-overview-mark" aria-hidden="true"><span /></span>
              <div><span className="eyebrow">One neighbourhood view</span><strong>From notice to action</strong></div>
            </div>
            <div className="landing-overview-flow">
              <div><span className="landing-flow-index">01</span><span><strong>See the work</strong><small>Projects and progress</small></span></div>
              <div><span className="landing-flow-index">02</span><span><strong>Raise a concern</strong><small>Issues and follow-up</small></span></div>
              <div><span className="landing-flow-index">03</span><span><strong>Work together</strong><small>Local groups and civic teams</small></span></div>
            </div>
            <div className="landing-overview-footer"><span /> A more connected neighbourhood starts with a clearer picture.</div>
          </aside>
        </div>
      </section>

      <section className="container landing-features" aria-labelledby="landing-features-title">
        <div className="landing-section-intro">
          <div className="eyebrow">A shared civic picture</div>
          <h2 id="landing-features-title">The parts of local life,<br /><em>in one place.</em></h2>
        </div>
        <div className="landing-feature-grid">
          {features.map(({ icon: Icon, title, description }, index) => (
            <article className="landing-feature" key={title}>
              <div className="landing-feature-top"><span className="landing-feature-icon"><Icon size={19} aria-hidden="true" /></span><span className="landing-feature-index">0{index + 1}</span></div>
              <h3>{title}</h3>
              <p>{description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="landing-bottom-cta">
        <div className="container landing-bottom-cta-inner">
          <div><div className="eyebrow">Get started with CivicSync</div><h2>Make your neighbourhood easier to understand.</h2></div>
          <Link className="button landing-primary-action" href="/auth/sign-up">Create your account <ArrowRight size={17} aria-hidden="true" /></Link>
        </div>
      </section>
    </main>
  );
}
