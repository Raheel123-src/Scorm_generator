'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { ArrowRight, FileText, Upload, Zap } from 'lucide-react'

export default function LandingPage() {
  return (
    <div style={{minHeight: '100vh', background: 'linear-gradient(to bottom right, #f9fafb, #f3f4f6)'}}>
      {/* Navigation */}
      <nav style={{background: 'white', boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)', borderBottom: '1px solid #e5e7eb'}}>
        <div style={{maxWidth: '1280px', margin: '0 auto', padding: '0 1rem'}}>
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: '4rem'}}>
            <div style={{display: 'flex', alignItems: 'center'}}>
              <div>
                <h1 style={{fontSize: '1.5rem', fontWeight: 'bold', color: '#9333ea'}}>LisaStudio</h1>
              </div>
            </div>
            <div style={{display: 'flex', alignItems: 'center', gap: '1rem'}}>
              <Link href="/login" style={{color: '#374151', textDecoration: 'none'}}>
                Login
              </Link>
              <Link href="/signup" className="btn-primary">
                Sign Up
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section style={{padding: '5rem 1rem', position: 'relative'}}>
        <div style={{maxWidth: '1280px', margin: '0 auto'}}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            style={{textAlign: 'center'}}
          >
            <h1 style={{fontSize: '3rem', fontWeight: 'bold', color: '#111827', marginBottom: '1.5rem'}}>
              Create Interactive Courses
              <span style={{display: 'block', color: '#9333ea'}}>with Ease</span>
            </h1>
            <p style={{fontSize: '1.25rem', color: '#6b7280', marginBottom: '2rem', maxWidth: '768px', margin: '0 auto 2rem'}}>
              Build interactive e-learning content using our intuitive editor. 
              Generate courses from scratch or upload documents for auto-generation.
            </p>
            
            <div style={{display: 'flex', flexDirection: 'column', gap: '1rem', justifyContent: 'center', alignItems: 'center'}}>
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <Link href="/signup" className="btn-primary" style={{fontSize: '1.125rem', padding: '0.75rem 2rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem'}}>
                  <FileText style={{width: '1.25rem', height: '1.25rem'}} />
                  Generate Course from Scratch
                  <ArrowRight style={{width: '1.25rem', height: '1.25rem'}} />
                </Link>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.4 }}
              >
                <button className="btn-secondary" style={{fontSize: '1.125rem', padding: '0.75rem 2rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem'}}>
                  <Upload style={{width: '1.25rem', height: '1.25rem'}} />
                  Upload Doc to Auto-generate
                </button>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section style={{padding: '5rem 0', background: 'white'}}>
        <div style={{maxWidth: '1280px', margin: '0 auto', padding: '0 1rem'}}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            style={{textAlign: 'center', marginBottom: '4rem'}}
          >
            <h2 style={{fontSize: '2.25rem', fontWeight: 'bold', color: '#111827', marginBottom: '1rem'}}>
              Powerful Content Types
            </h2>
            <p style={{fontSize: '1.25rem', color: '#6b7280', maxWidth: '512px', margin: '0 auto'}}>
              Create engaging e-learning content with our comprehensive set of content blocks
            </p>
          </motion.div>

          <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem'}}>
            {[
              { icon: FileText, title: 'Welcome Pages', desc: 'Create engaging course introductions' },
              { icon: Zap, title: 'Interactive Quizzes', desc: 'Build comprehensive assessments' },
              { icon: Upload, title: 'Media Content', desc: 'Embed videos, documents, and images' },
            ].map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="card"
              >
                <feature.icon style={{width: '3rem', height: '3rem', color: '#9333ea', marginBottom: '1rem'}} />
                <h3 style={{fontSize: '1.25rem', fontWeight: '600', color: '#111827', marginBottom: '0.5rem'}}>{feature.title}</h3>
                <p style={{color: '#6b7280'}}>{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section style={{padding: '5rem 0', background: '#9333ea'}}>
        <div style={{maxWidth: '1024px', margin: '0 auto', textAlign: 'center', padding: '0 1rem'}}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h2 style={{fontSize: '2.25rem', fontWeight: 'bold', color: 'white', marginBottom: '1rem'}}>
              Ready to Create Your First Course?
            </h2>
            <p style={{fontSize: '1.25rem', color: '#e9d5ff', marginBottom: '2rem'}}>
              Join thousands of educators and trainers creating engaging e-learning content
            </p>
            <Link href="/signup" style={{background: 'white', color: '#9333ea', fontWeight: '500', padding: '0.75rem 2rem', borderRadius: '0.5rem', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.125rem'}}>
              Get Started Free
              <ArrowRight style={{width: '1.25rem', height: '1.25rem'}} />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{background: '#111827', color: 'white', padding: '3rem 0'}}>
        <div style={{maxWidth: '1280px', margin: '0 auto', padding: '0 1rem'}}>
          <div style={{textAlign: 'center'}}>
            <h3 style={{fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem'}}>LisaStudio Platform</h3>
            <p style={{color: '#9ca3af'}}>© 2024 LisaStudio. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}