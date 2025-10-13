'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { authAPI } from './api'

interface User {
  id: string
  name: string
  email: string
}

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  signup: (name: string, email: string, password: string) => Promise<void>
  logout: () => void
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const initAuth = async () => {
      try {
        if (authAPI.isAuthenticated()) {
          const userData = authAPI.getCurrentUserData()
          if (userData) {
            setUser(userData)
          }
        }
      } catch (error) {
        console.error('Auth initialization error:', error)
        authAPI.logout()
      } finally {
        setLoading(false)
      }
    }

    initAuth()
  }, [])

  const login = async (email: string, password: string) => {
    try {
      const response = await authAPI.login({ email, password })
      setUser(response.user)
    } catch (error) {
      throw error
    }
  }

  const signup = async (name: string, email: string, password: string) => {
    try {
      const response = await authAPI.signup({ name, email, password })
      setUser(response.user)
    } catch (error) {
      throw error
    }
  }

  const logout = () => {
    authAPI.logout()
    setUser(null)
  }

  const value = {
    user,
    loading,
    login,
    signup,
    logout,
    isAuthenticated: !!user
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
