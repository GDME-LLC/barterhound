import { GoogleGenAI } from '@google/genai'

function requireEnv(key: string) {
  const value = process.env[key]
  if (!value) {
    throw new Error(`${key} is required.`)
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

