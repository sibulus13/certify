import { handlers } from '@/auth'

// Auth.js v5 route handler — covers all /api/auth/* paths:
//   GET  /api/auth/session
//   GET  /api/auth/signin
//   POST /api/auth/signin/<provider>
//   GET  /api/auth/callback/<provider>
//   POST /api/auth/signout
//   GET  /api/auth/csrf
export const { GET, POST } = handlers
