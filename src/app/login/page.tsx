'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, Mail, Lock, AlertCircle } from 'lucide-react'
import { useAuth } from '@/lib/AuthContext'

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const { login } = useAuth()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await login(formData.email, formData.password)
      router.push('/dashboard')
    } catch (error: any) {
      setError(error.response?.data?.message || 'Login failed. Please try again.')
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
          width: '100%',
          maxWidth: '30rem',
          background: '#fff',
          borderRadius: '2.5rem',
          padding: '3rem',
          boxShadow: '0 40px 90px rgba(17,24,39,0.15)',
          border: '1px solid #f0ebe4',
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
            Sign in to your studio
          </h2>
          <p style={{ marginTop: '0.75rem', color: '#6c5a4c', fontSize: '0.95rem' }}>
            Or{' '}
            <Link href="/signup" style={{ color: '#7c5cff', fontWeight: 600, textDecoration: 'none' }}>
              create a new account
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
                  autoComplete="current-password"
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
                  placeholder="Enter your password"
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
                    color: '#9ca3af',
                    cursor: 'pointer',
                    padding: '0.25rem'
                  }}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>
          </div>

          {/* Remember me and Forgot password */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                style={{
                  width: '1rem',
                  height: '1rem',
                  accentColor: '#111827'
                }}
              />
              <label htmlFor="remember-me" style={{
                fontSize: '0.9rem',
                color: '#4a3f32'
              }}>
                Remember me
              </label>
            </div>

            <button
              type="button"
              style={{
                fontSize: '0.9rem',
                color: '#7c5cff',
                fontWeight: '600',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                textDecoration: 'none'
              }}
              onClick={() => {
                console.log('Forgot password clicked')
              }}
            >
              Forgot your password?
            </button>
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
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </motion.div>
    </div>
  )
}