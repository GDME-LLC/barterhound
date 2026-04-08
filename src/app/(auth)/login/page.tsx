import { AuthCard } from '@/components/auth-card'

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string }>
}) {
  const { message } = await searchParams

  return (
    <AuthCard
      title="Welcome back"
      description="Sign in with email/password or continue with Google or Facebook."
      action="/auth/login"
      submitLabel="Sign in"
      alternateHref="/signup"
      alternateLabel="Need an account? Create one."
      message={message}
    />
  )
}
