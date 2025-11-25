'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { ArrowRight, Star, Users, BookOpen, Shield, Play, PenTool } from 'lucide-react'

const sellingPoints = [
  {
    title: 'Prepare with confidence',
    desc: 'Get guided prompts, warm-up exercises, and expert critique before you hit record.',
    icon: PenTool,
  },
  {
    title: 'Unlock every interview',
    desc: 'Learn storytelling frameworks and interactive formats that help your content shine.',
    icon: BookOpen,
  },
  {
    title: 'Join a curated circle',
    desc: 'Build with other creators inside private cohorts, live sessions, and async critiques.',
    icon: Users,
  },
]

const highlightSections = [
  {
    eyebrow: 'Make sense of complex topics',
    title: 'Turn scattered research into clear, binge-worthy lessons.',
    copy: 'LisaStudio helps you map expert knowledge into sleek modules, pair them with interactive elements, and publish them as polished experiences that feel handcrafted.',
  },
  {
    eyebrow: 'Build the skills that matter',
    title: 'Blend async study with guided community feedback.',
    copy: 'Mix live critiques, cohort discussions, and self-paced checkpoints so every learner gets practical takeaways and a real sense of progress.',
  },
]

const brandLogos = ['Figma', 'Shopify', 'Airbnb', 'Duolingo', 'Notion', 'Intercom', 'Dropbox', 'Mailchimp']

export default function LandingPage() {
  return (
    <div style={{ minHeight: '100vh', background: '#f7f3ee' }}>
      <nav style={{ maxWidth: '1100px', margin: '0 auto', padding: '1.5rem 1.5rem 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#8c5bff' }} />
          <p style={{ fontWeight: 600, fontSize: '1.125rem', color: '#111827' }}>LisaStudio</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <Link href="/login" style={{ color: '#111827', textDecoration: 'none', fontWeight: 500 }}>Login</Link>
          <Link href="/signup" style={{ padding: '0.6rem 1.4rem', borderRadius: '999px', border: '1px solid #111827', textDecoration: 'none', fontWeight: 600, color: '#111827' }}>
            Sign up
          </Link>
        </div>
      </nav>

      <main style={{ maxWidth: '1100px', margin: '0 auto', padding: '3rem 1.5rem 5rem' }}>
        {/* Hero */}
        <section style={{ background: '#fffdf9', borderRadius: '48px', padding: '4rem 3rem', position: 'relative', overflow: 'hidden', boxShadow: '0 30px 70px rgba(17,24,39,0.08)' }}>
          <div style={{ position: 'absolute', inset: '0', pointerEvents: 'none', background: 'radial-gradient(circle at top right, rgba(140,91,255,0.15), transparent 40%)' }} />
          <div style={{ position: 'relative' }}>
            <p style={{ fontSize: '0.95rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#6b4c3b' }}>Curated learning studio</p>
            <h1 style={{ fontSize: '3.25rem', fontWeight: 600, lineHeight: 1.15, color: '#1a1814', marginTop: '1rem' }}>
              Learn how to build standout learning experiences.
            </h1>
            <p style={{ marginTop: '1.5rem', fontSize: '1.15rem', color: '#4a3f32', maxWidth: '620px' }}>
              Explore how top creators plan narratives, mix media, and ship interactive courses. Cohort-based, live critiques, and async libraries built for modern teams.
            </p>
            <div style={{ marginTop: '2rem', display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center' }}>
              <Link href="/signup" style={{ background: '#111827', color: '#fff', padding: '0.85rem 1.8rem', borderRadius: '999px', textDecoration: 'none', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                Request an invitation
                <ArrowRight size={18} />
              </Link>
              <button style={{ border: '1px solid #111827', background: 'transparent', borderRadius: '999px', padding: '0.85rem 1.5rem', fontWeight: 600, cursor: 'pointer' }}>
                Browse syllabus
              </button>
            </div>
            <div style={{ marginTop: '1.5rem', color: '#5c4d3e', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Shield size={16} />
              <span>Invitation only · cancel anytime</span>
            </div>
          </div>
        </section>

        {/* Selling points */}
        <section style={{ marginTop: '4rem' }}>
          <p style={{ textAlign: 'center', fontSize: '1.1rem', color: '#4a3f32', marginBottom: '1.5rem' }}>Experience self-paced build time plus live group reviews.</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: '1.5rem' }}>
            {sellingPoints.map((point) => (
              <div key={point.title} style={{ background: '#fff', borderRadius: '32px', padding: '1.75rem', boxShadow: '0 12px 30px rgba(0,0,0,0.05)' }}>
                <point.icon size={28} style={{ color: '#7c5cff', marginBottom: '1rem' }} />
                <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#1a1814' }}>{point.title}</h3>
                <p style={{ marginTop: '0.5rem', color: '#5c4d3e' }}>{point.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Logos */}
        <section style={{ marginTop: '4rem', textAlign: 'center' }}>
          <p style={{ color: '#4a3f32', fontSize: '1rem', marginBottom: '1.5rem' }}>Creators from these teams build with LisaStudio</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '1.5rem', color: '#9a8d7f', fontWeight: 600 }}>
            {brandLogos.map((brand) => (
              <span key={brand}>{brand}</span>
            ))}
          </div>
        </section>

        {/* Highlight sections */}
        <section style={{ marginTop: '4rem', display: 'flex', flexDirection: 'column', gap: '3rem' }}>
          {highlightSections.map((section, idx) => (
            <div key={section.title} style={{ background: '#fff', borderRadius: '36px', padding: '2.5rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: '2rem', alignItems: 'center', boxShadow: '0 20px 40px rgba(17,24,39,0.08)' }}>
              <div>
                <p style={{ textTransform: 'uppercase', letterSpacing: '0.08em', fontSize: '0.85rem', color: '#7c5cff' }}>{section.eyebrow}</p>
                <h3 style={{ fontSize: '1.85rem', fontWeight: 600, color: '#1a1814', marginTop: '0.75rem' }}>{section.title}</h3>
                <p style={{ marginTop: '1rem', color: '#5c4d3e', lineHeight: 1.6 }}>{section.copy}</p>
              </div>
              <div style={{ borderRadius: '28px', padding: '2rem', background: idx % 2 === 0 ? '#f4edff' : '#ffece2', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#111827', fontWeight: 600 }}>
                  <Play size={18} />
                  <span>Mini lesson preview</span>
                </div>
                <p style={{ color: '#5c4d3e' }}>
                  Drop in bite-sized clips, interactive prompts, and guided reflections to help learners practice, rewind, and apply immediately.
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#7c5cff' }}>
                  <Star size={16} />
                  <span>Rated 4.9 by cohort alum</span>
                </div>
              </div>
            </div>
          ))}
        </section>

        {/* Invitation CTA */}
        <section style={{ marginTop: '4rem', background: '#111827', color: '#fff', borderRadius: '40px', padding: '3rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: '2rem', alignItems: 'center' }}>
          <div>
            <p style={{ letterSpacing: '0.08em', textTransform: 'uppercase', fontSize: '0.9rem', color: '#94a3b8' }}>By invitation only</p>
            <h3 style={{ fontSize: '2rem', fontWeight: 600, marginTop: '0.75rem' }}>Have better interviews—regardless of which side of the table you sit on.</h3>
            <p style={{ marginTop: '1rem', color: '#cbd5f5' }}>Subscriptions renew monthly · cancel anytime · built for design, product, and learning teams.</p>
          </div>
          <div>
            <Link href="/signup" style={{ background: '#fff', color: '#111827', padding: '0.95rem 2.3rem', borderRadius: '999px', textDecoration: 'none', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
              Visit the studio
              <ArrowRight size={18} />
            </Link>
            <div style={{ marginTop: '1rem', fontSize: '0.9rem', color: '#cbd5f5' }}>Questions? hello@lisastudio.com</div>
          </div>
        </section>
      </main>
    </div>
  )
}