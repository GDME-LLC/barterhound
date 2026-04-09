function normalizeBaseUrl(url: string) {
  return url.replace(/\/+$/, '')
}

export function getAppBaseUrl(requestUrl: URL) {
  const envUrl = process.env.NEXT_PUBLIC_APP_URL
  if (envUrl) {
    return normalizeBaseUrl(envUrl)
  }

  return normalizeBaseUrl(requestUrl.origin)
}

