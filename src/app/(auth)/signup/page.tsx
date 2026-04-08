import { AuthCard } from '@/components/auth-card'

export default async function SignUpPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string }>
}) {
  const { message } = await searchParams

  return (
    <AuthCard
      title="Create your account"
      description="Use email/password, Google, or Facebook. After sign-in, finish your public profile."
      action="/auth/signup"
      submitLabel="Create account"
      alternateHref="/login"
      alternateLabel="Already have an account? Sign in."
      message={message}
    />
  )
}
