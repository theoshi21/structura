import Link from 'next/link'
import Logo from '@/components/Logo'
import Button from '@/components/Button'
import Card from '@/components/Card'
import Badge from '@/components/Badge'

/** Feature card data for the Features section */
const features = [
  { emoji: '📅', title: 'Event Management', description: 'Plan and track events from proposal to completion.' },
  { emoji: '📄', title: 'Document Storage', description: 'Centralize permits, contracts, and receipts in one place.' },
  { emoji: '✅', title: 'Checklists', description: 'Never miss a step with structured task checklists.' },
  { emoji: '💰', title: 'Budget Tracking', description: 'Monitor allocations and expenditures in real time.' },
  { emoji: '👥', title: 'User Roles', description: 'Assign organizer, officer, or admin roles with ease.' },
  { emoji: '📊', title: 'Audit Trail', description: 'Track every action with a full audit history.' },
  { emoji: '⚡', title: 'Real-time Updates', description: 'Stay in sync with live data across your team.' },
]

/**
 * Sticky top navigation bar with logo, anchor links, and a Sign In button.
 * Dark navy background with centered nav links and right-aligned Sign In.
 */
function Navbar() {
  return (
    <nav className="sticky top-0 z-50 w-full bg-dark-navy border-b border-light-gray/10">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Logo white />

        {/* Center nav links */}
        <div className="hidden md:flex items-center gap-8">
          <a href="#features" className="font-body text-sm text-mid-gray hover:text-off-white transition-colors">
            Features
          </a>
          <a href="#about" className="font-body text-sm text-mid-gray hover:text-off-white transition-colors">
            About
          </a>
          <a href="#contact" className="font-body text-sm text-mid-gray hover:text-off-white transition-colors">
            Contact
          </a>
        </div>

        {/* Sign In button */}
        <Link href="/sign-in">
          <Button variant="outline" size="sm">
            Sign In
          </Button>
        </Link>
      </div>
    </nav>
  )
}

/**
 * Hero section with radial purple glow, badge, heading, subtext, and CTA buttons.
 * Full dark navy background with centered layout.
 */
function Hero() {
  return (
    <section className="relative bg-dark-navy overflow-hidden">
      {/* Radial purple glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 60% 50% at 50% 40%, rgba(79,70,232,0.25) 0%, rgba(129,140,248,0.08) 40%, transparent 70%)',
        }}
      />

      <div className="relative max-w-3xl mx-auto px-6 py-28 flex flex-col items-center text-center gap-6">
        {/* Badge */}
        <Badge label="Student Organization Platform" color="purple" className="tracking-widest text-xs" />

        {/* Heading */}
        <h1 className="font-heading text-5xl md:text-6xl text-off-white leading-tight">
          Manage without the{' '}
          <span className="text-accent">chaos.</span>
        </h1>

        {/* Subtext */}
        <p className="font-body text-mid-gray text-lg max-w-xl leading-relaxed">
          Structura brings your student organization&apos;s events, documents, budgets, and checklists into one streamlined platform.
        </p>

        {/* CTA buttons */}
        <div className="flex flex-wrap items-center justify-center gap-4 mt-2">
          <Link href="/register">
            <Button variant="primary" size="lg">
              Get Started →
            </Button>
          </Link>
          <a href="#features">
            <Button variant="outline" size="lg">
              See Features
            </Button>
          </a>
        </div>
      </div>
    </section>
  )
}

/**
 * Features section displaying a 7-card grid (4 top, 3 bottom) of platform capabilities.
 * Each card shows an emoji icon, bold title, and short description.
 */
function Features() {
  const topRow = features.slice(0, 4)
  const bottomRow = features.slice(4)

  return (
    <section id="features" className="bg-near-black py-24 px-6">
      <div className="max-w-6xl mx-auto flex flex-col items-center gap-4 mb-14">
        {/* Section label */}
        <span className="font-body text-xs font-semibold uppercase tracking-widest text-accent">
          What Structura Offers
        </span>
        {/* Section heading */}
        <h2 className="font-heading text-4xl text-off-white text-center">
          Everything your organization needs
        </h2>
      </div>

      {/* Top row — 4 cards */}
      <div className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-5">
        {topRow.map((feature) => (
          <FeatureCard key={feature.title} {...feature} />
        ))}
      </div>

      {/* Bottom row — 3 cards centered */}
      <div className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-5 lg:w-3/4">
        {bottomRow.map((feature) => (
          <FeatureCard key={feature.title} {...feature} />
        ))}
      </div>
    </section>
  )
}

/**
 * Individual feature card with emoji, title, and description.
 * Reused inside the Features section grid.
 */
function FeatureCard({ emoji, title, description }: { emoji: string; title: string; description: string }) {
  return (
    <Card className="flex flex-col gap-3 p-6">
      <span className="text-3xl" role="img" aria-label={title}>{emoji}</span>
      <h3 className="font-body font-semibold text-off-white text-base">{title}</h3>
      <p className="font-body text-sm text-mid-gray leading-relaxed">{description}</p>
    </Card>
  )
}

/**
 * About section with left-aligned layout explaining the platform's purpose.
 * Includes a label, heading, and two body paragraphs.
 */
function About() {
  return (
    <section id="about" className="bg-dark-navy py-24 px-6">
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
        {/* Text content */}
        <div className="flex flex-col gap-6">
          <span className="font-body text-xs font-semibold uppercase tracking-widest text-accent">
            Why Structura
          </span>
          <h2 className="font-heading text-4xl text-off-white leading-snug">
            Built for student organizations that mean business.
          </h2>
          <p className="font-body text-mid-gray leading-relaxed">
            Student organizations juggle a lot — event proposals, budget requests, document submissions, and team coordination — often across scattered spreadsheets and group chats. Structura replaces that chaos with a single, structured workspace designed specifically for how student orgs operate.
          </p>
          <p className="font-body text-mid-gray leading-relaxed">
            Whether you&apos;re an organizer tracking your event checklist, an officer reviewing budget allocations, or an admin approving submissions, Structura gives every role exactly what they need — nothing more, nothing less.
          </p>
        </div>

        {/* Decorative panel */}
        <div className="hidden md:flex flex-col gap-4">
          <div className="rounded-2xl border border-light-gray/10 bg-near-black p-8 flex flex-col gap-5">
            {[
              { label: 'Active Events', value: '12' },
              { label: 'Documents Filed', value: '48' },
              { label: 'Budget Utilized', value: '72%' },
            ].map(({ label, value }) => (
              <div key={label} className="flex items-center justify-between border-b border-light-gray/10 pb-4 last:border-0 last:pb-0">
                <span className="font-body text-sm text-mid-gray">{label}</span>
                <span className="font-heading text-2xl text-accent">{value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

/**
 * Pre-footer CTA section prompting users to get started.
 * Centered layout with a heading and primary action button.
 */
function CallToAction() {
  return (
    <section id="contact" className="bg-near-black py-24 px-6">
      <div className="max-w-2xl mx-auto flex flex-col items-center text-center gap-6">
        <h2 className="font-heading text-4xl md:text-5xl text-off-white leading-tight">
          Ready to get organized?
        </h2>
        <p className="font-body text-mid-gray text-lg">
          Join student organizations already using Structura to run smoother, faster, and with less chaos.
        </p>
        <Link href="/register">
          <Button variant="primary" size="lg" className="mt-2 px-10">
            Get Started Now
          </Button>
        </Link>
      </div>
    </section>
  )
}

/**
 * Footer bar with Logo + wordmark on the left and copyright text on the right.
 * Dark navy background with a thin top border.
 */
function Footer() {
  return (
    <footer className="bg-dark-navy border-t border-light-gray/10">
      <div className="max-w-6xl mx-auto px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <Logo white />
        <p className="font-body text-sm text-mid-gray">
          © 2025 Structura. All rights reserved.
        </p>
      </div>
    </footer>
  )
}

/**
 * Landing page root — composes Navbar, Hero, Features, About, CTA, and Footer sections.
 */
export default function Home() {
  return (
    <main className="min-h-screen bg-dark-navy">
      <Navbar />
      <Hero />
      <Features />
      <About />
      <CallToAction />
      <Footer />
    </main>
  )
}
