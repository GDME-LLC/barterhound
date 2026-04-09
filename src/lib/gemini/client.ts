import { GoogleGenAI } from '@google/genai'

function requireEnv(key: string) {
  const value = process.env[key]
  if (!value || value.trim().length === 0 || value === 'your-gemini-api-key') {
    throw new Error(
      `${key} is required. Set it in .env.local for local dev and in Vercel Environment Variables for deployments.`,
    )
  }
  return value
}

export function getGeminiClient() {
  const apiKey = requireEnv('GEMINI_API_KEY')
  return new GoogleGenAI({ apiKey })
}

export function getGeminiModelName() {
  return process.env.GEMINI_MODEL || 'gemini-2.0-flash'
}
