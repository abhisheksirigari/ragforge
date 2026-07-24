import React, { createContext, useContext, useEffect, useState } from 'react'
import { api, getToken, setToken, clearToken } from '../api/client'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    // No /me endpoint is exposed by the API, so we treat presence of a
    // token as "logged in" and let the first real request 401 if it's stale.
    const token = getToken()
    setChecking(false)
    if (!token) setUser(null)
  }, [])

  async function login(email, password) {
    const data = await api.login({ email, password })
    setToken(data.access_token)
    setUser(data.user)
  }

  async function signup(email, password, fullName) {
    const data = await api.signup({ email, password, full_name: fullName })
    setToken(data.access_token)
    setUser(data.user)
  }

  function logout() {
    clearToken()
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, setUser, login, signup, logout, checking, isAuthed: !!getToken() }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
