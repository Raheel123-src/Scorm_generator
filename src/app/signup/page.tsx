'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, Mail, Lock, User, AlertCircle } from 'lucide-react'
import { useAuth } from '@/lib/AuthContext'

export default function SignupPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  })
  const { signup } = useAuth()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      setLoading(false)
      return
    }

    try {
      await signup(formData.name, formData.email, formData.password)
      router.push('/dashboard')
    } catch (error: any) {
      setError(error.response?.data?.message || 'Signup failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#f7f3ee',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem 1rem',
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        style={{
          maxWidth: '30rem',
          width: '100%',
          background: '#fff',
          borderRadius: '2.5rem',
          boxShadow: '0 40px 90px rgba(17,24,39,0.15)',
          border: '1px solid #f0ebe4',
          padding: '3rem',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <Link
            href="/"
            style={{
              textDecoration: 'none',
              color: '#18181b',
              fontWeight: 600,
              fontSize: '1rem',
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
            }}
          >
            LisaStudio
          </Link>
          <h2
            style={{
              marginTop: '1.5rem',
              fontSize: '2rem',
              fontWeight: 600,
              color: '#14110f',
            }}
          >
            Create your account
          </h2>
          <p style={{ marginTop: '0.75rem', color: '#6c5a4c', fontSize: '0.95rem' }}>
            Already have an account?{' '}
            <Link href="/login" style={{ color: '#7c5cff', fontWeight: 600, textDecoration: 'none' }}>
              Sign in
            </Link>
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {error && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.75rem',
              background: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: '0.5rem',
              color: '#dc2626',
              fontSize: '0.875rem'
            }}>
              <AlertCircle size={16} />
              {error}
            </div>
          )}
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* Full Name */}
            <div>
              <label style={{
                display: 'block',
                fontSize: '0.85rem',
                fontWeight: '600',
                color: '#4a3f32',
                marginBottom: '0.4rem',
                letterSpacing: '0.02em',
                textTransform: 'uppercase'
              }}>
                Full name
              </label>
              <div style={{ position: 'relative' }}>
                <User style={{
                  position: 'absolute',
                  left: '0.75rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#b8a99b',
                  width: '1.25rem',
                  height: '1.25rem'
                }} />
                <input
                  name="name"
                  type="text"
                  autoComplete="name"
                  required
                  style={{
                    width: '100%',
                    padding: '0.8rem 0.8rem 0.8rem 2.5rem',
                    border: '1px solid #e5ded3',
                    borderRadius: '1rem',
                    fontSize: '0.95rem',
                    outline: 'none',
                    background: '#fffdf9',
                    transition: 'border-color 0.2s, box-shadow 0.2s',
                    boxSizing: 'border-box'
                  }}
                  placeholder="Enter your full name"
                  value={formData.name}
                  onChange={handleChange}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#7c5cff'
                    e.target.style.boxShadow = '0 0 0 3px rgba(124, 92, 255, 0.15)'
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#e5ded3'
                    e.target.style.boxShadow = 'none'
                  }}
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label style={{
                display: 'block',
                fontSize: '0.85rem',
                fontWeight: '600',
                color: '#4a3f32',
                marginBottom: '0.4rem',
                letterSpacing: '0.02em',
                textTransform: 'uppercase'
              }}>
                Email address
              </label>
              <div style={{ position: 'relative' }}>
                <Mail style={{
                  position: 'absolute',
                  left: '0.75rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#b8a99b',
                  width: '1.25rem',
                  height: '1.25rem'
                }} />
                <input
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  style={{
                    width: '100%',
                    padding: '0.8rem 0.8rem 0.8rem 2.5rem',
                    border: '1px solid #e5ded3',
                    borderRadius: '1rem',
                    fontSize: '0.95rem',
                    outline: 'none',
                    background: '#fffdf9',
                    transition: 'border-color 0.2s, box-shadow 0.2s',
                    boxSizing: 'border-box'
                  }}
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={handleChange}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#7c5cff'
                    e.target.style.boxShadow = '0 0 0 3px rgba(124, 92, 255, 0.15)'
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#e5ded3'
                    e.target.style.boxShadow = 'none'
                  }}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label style={{
                display: 'block',
                fontSize: '0.85rem',
                fontWeight: '600',
                color: '#4a3f32',
                marginBottom: '0.4rem',
                letterSpacing: '0.02em',
                textTransform: 'uppercase'
              }}>
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <Lock style={{
                  position: 'absolute',
                  left: '0.75rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#b8a99b',
                  width: '1.25rem',
                  height: '1.25rem'
                }} />
                <input
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  style={{
                    width: '100%',
                    padding: '0.8rem 2.7rem 0.8rem 2.5rem',
                    border: '1px solid #e5ded3',
                    borderRadius: '1rem',
                    fontSize: '0.95rem',
                    outline: 'none',
                    background: '#fffdf9',
                    transition: 'border-color 0.2s, box-shadow 0.2s',
                    boxSizing: 'border-box'
                  }}
                  placeholder="Create a password"
                  value={formData.password}
                  onChange={handleChange}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#7c5cff'
                    e.target.style.boxShadow = '0 0 0 3px rgba(124, 92, 255, 0.15)'
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#e5ded3'
                    e.target.style.boxShadow = 'none'
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '0.75rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                  color: '#b8a99b',
                    cursor: 'pointer',
                    padding: '0.25rem'
                  }}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label style={{
                display: 'block',
                fontSize: '0.85rem',
                fontWeight: '600',
                color: '#4a3f32',
                marginBottom: '0.4rem',
                letterSpacing: '0.02em',
                textTransform: 'uppercase'
              }}>
                Confirm password
              </label>
              <div style={{ position: 'relative' }}>
                <Lock style={{
                  position: 'absolute',
                  left: '0.75rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#b8a99b',
                  width: '1.25rem',
                  height: '1.25rem'
                }} />
                <input
                  name="confirmPassword"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  style={{
                    width: '100%',
                    padding: '0.8rem 0.8rem 0.8rem 2.5rem',
                    border: '1px solid #e5ded3',
                    borderRadius: '1rem',
                    fontSize: '0.95rem',
                    outline: 'none',
                    background: '#fffdf9',
                    transition: 'border-color 0.2s, box-shadow 0.2s',
                    boxSizing: 'border-box'
                  }}
                  placeholder="Confirm your password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#7c5cff'
                    e.target.style.boxShadow = '0 0 0 3px rgba(124, 92, 255, 0.15)'
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#e5ded3'
                    e.target.style.boxShadow = 'none'
                  }}
                />
              </div>
            </div>
          </div>

          {/* Terms */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
            <input
              id="terms"
              name="terms"
              type="checkbox"
              required
              style={{
                width: '1rem',
                height: '1rem',
                accentColor: '#111827',
                marginTop: '0.125rem'
              }}
            />
            <label htmlFor="terms" style={{
              fontSize: '0.95rem',
              color: '#4a3f32',
              lineHeight: '1.25rem'
            }}>
              I agree to the{' '}
              <Link href="/terms" style={{ color: '#7c5cff', textDecoration: 'none', fontWeight: 600 }}>
                Terms of Service
              </Link>{' '}
              and{' '}
              <Link href="/privacy" style={{ color: '#7c5cff', textDecoration: 'none', fontWeight: 600 }}>
                Privacy Policy
              </Link>
            </label>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              background: loading ? '#cbd5f5' : '#111827',
              color: '#fff',
              fontWeight: 600,
              padding: '0.95rem 1rem',
              borderRadius: '999px',
              border: '1px solid #111827',
              fontSize: '1rem',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'transform 0.2s',
            }}
          >
            {loading ? 'Creating account...' : 'Create account'}
          </button>
        </form>
      </motion.div>
    </div>
  )
}