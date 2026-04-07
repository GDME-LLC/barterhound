export type ActionState = {
  error?: string
  success?: string
}

export function requireString(
  formData: FormData,
  key: string,
  label: string,
  minimum = 1,
) {
  const value = String(formData.get(key) ?? '').trim()

  if (value.length < minimum) {
    throw new Error(`${label} is required.`)
  }

  return value
}

export function optionalString(formData: FormData, key: string) {
  const value = String(formData.get(key) ?? '').trim()
  return value.length > 0 ? value : null
}

export function parseInteger(
  formData: FormData,
  key: string,
  label: string,
  options?: {
    min?: number
    max?: number
    required?: boolean
  },
) {
  const raw = String(formData.get(key) ?? '').trim()

  if (!raw) {
    if (options?.required === false) {
      return null
    }

    throw new Error(`${label} is required.`)
  }

  const value = Number.parseInt(raw, 10)

  if (Number.isNaN(value)) {
    throw new Error(`${label} must be a number.`)
  }

  if (options?.min !== undefined && value < options.min) {
    throw new Error(`${label} must be at least ${options.min}.`)
  }

  if (options?.max !== undefined && value > options.max) {
    throw new Error(`${label} must be at most ${options.max}.`)
  }

  return value
}

export function parseFloatValue(
  formData: FormData,
  key: string,
  label: string,
  options?: {
    min?: number
    max?: number
    required?: boolean
  },
) {
  const raw = String(formData.get(key) ?? '').trim()

  if (!raw) {
    if (options?.required === false) {
      return null
    }

    throw new Error(`${label} is required.`)
  }

  const value = Number.parseFloat(raw)

  if (Number.isNaN(value)) {
    throw new Error(`${label} must be a number.`)
  }

  if (options?.min !== undefined && value < options.min) {
    throw new Error(`${label} must be at least ${options.min}.`)
  }

  if (options?.max !== undefined && value > options.max) {
    throw new Error(`${label} must be at most ${options.max}.`)
  }

  return value
}
