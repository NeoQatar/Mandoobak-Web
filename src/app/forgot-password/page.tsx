'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { app } from '@/lib/firebase';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { Loader2, ArrowLeft, AlertCircle, CheckCircle2, Mail } from 'lucide-react';
import Image from 'next/image';

type ResetResult = {
  ok: boolean;
  code?: string;
};

function resetErrorMessage(code?: string): string {
  switch (code) {
    case 'not_found':
      return 'No account found with this email. Please use the email registered for your vendor or staff account.';
    case 'use_phone_otp':
      return 'Customer accounts sign in with phone OTP. Password reset is only for vendor and staff accounts.';
    case 'invalid-argument':
      return 'Please enter a valid email address.';
    case 'resource-exhausted':
      return 'Too many attempts. Please wait a minute and try again.';
    default:
      return 'Failed to send reset email. Please try again or contact support.';
  }
}

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [sentTo, setSentTo] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const router = useRouter();

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = email.trim().toLowerCase();
    setErrorMessage('');

    if (!trimmed) {
      setErrorMessage('Please enter your email address.');
      return;
    }

    setIsLoading(true);
    try {
      const functions = getFunctions(app, 'us-central1');
      const requestPasswordReset = httpsCallable<{ email: string }, ResetResult>(
        functions,
        'requestPasswordReset'
      );
      const { data } = await requestPasswordReset({ email: trimmed });

      if (!data?.ok) {
        setErrorMessage(resetErrorMessage(data?.code));
        return;
      }

      setSentTo(trimmed);
      setSent(true);
    } catch (error: unknown) {
      const code =
        typeof error === 'object' &&
        error !== null &&
        'code' in error
          ? String((error as { code?: string }).code).replace(/^functions\//, '')
          : undefined;
      const message =
        typeof error === 'object' &&
        error !== null &&
        'message' in error
          ? String((error as { message?: string }).message)
          : undefined;

      if (code === 'invalid-argument' || code === 'resource-exhausted') {
        setErrorMessage(resetErrorMessage(code));
      } else if (message && !message.startsWith('INTERNAL')) {
        setErrorMessage(message);
      } else {
        setErrorMessage(resetErrorMessage(code));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = () => {
    setSent(false);
    setErrorMessage('');
  };

  return (
    <div className="w-full h-screen flex overflow-hidden bg-background">
      <div className="hidden lg:block w-1/2 relative h-full">
        <Image
          src="/assets/images/mandobak-login-new.jpg"
          alt="Mandobak"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-black/10" />
      </div>

      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 lg:p-12">
        <div className="w-full max-w-[420px] flex flex-col gap-8">
          <div className="space-y-3 text-center">
            <div className="flex justify-center mb-6">
              <div className="relative w-32 h-32">
                <Image
                  src="/assets/images/mandobak-logo.jpg"
                  alt="Mandobak Logo"
                  fill
                  className="object-contain"
                />
              </div>
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-[#4A0E33]">
              {sent ? 'Check Your Email' : 'Forgot Password'}
            </h1>
            <p className="text-muted-foreground text-sm max-w-[320px] mx-auto leading-relaxed">
              {sent
                ? 'A password reset link has been sent to your registered email.'
                : 'Enter the email linked to your vendor or staff account. We will only send a reset link if the account exists.'}
            </p>
          </div>

          {!sent ? (
            <form onSubmit={handleReset} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email" className="font-semibold text-gray-700">
                  Email <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setErrorMessage('');
                  }}
                  required
                  autoComplete="email"
                  autoFocus
                  className="h-12 bg-gray-50 border-gray-200"
                />
              </div>

              {errorMessage && (
                <div
                  role="alert"
                  className="flex items-start gap-2 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
                >
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <Button
                className="w-full h-12 text-base font-semibold bg-[#4A0E33] hover:bg-[#350a24]"
                type="submit"
                disabled={isLoading}
              >
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {isLoading ? 'Checking account...' : 'Send Reset Link'}
              </Button>

              <div className="flex justify-center">
                <Link
                  href="/login"
                  className="text-sm font-bold text-[#4A0E33] hover:underline flex items-center gap-1"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to Sign In
                </Link>
              </div>
            </form>
          ) : (
            <div className="space-y-5">
              <div
                role="status"
                className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-4 text-sm text-emerald-900"
              >
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600 mt-0.5" />
                  <div className="space-y-2">
                    <p className="font-semibold">Reset email sent</p>
                    <p className="leading-relaxed">
                      We sent a password reset link to{' '}
                      <span className="font-medium break-all">{sentTo}</span>.
                    </p>
                    <ul className="list-disc pl-4 space-y-1 text-emerald-800/90">
                      <li>Check your inbox and spam/junk folder</li>
                      <li>The link expires after a short time</li>
                      <li>After resetting, use the new password on web and mobile</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 rounded-md border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-600">
                <Mail className="h-4 w-4 shrink-0 text-[#4A0E33]" />
                <span>Didn’t get it? Wait a minute, then resend or try another email.</span>
              </div>

              <Button
                className="w-full h-12 text-base font-semibold bg-[#4A0E33] hover:bg-[#350a24]"
                onClick={() => router.push('/login')}
              >
                Back to Sign In
              </Button>

              <div className="flex justify-center">
                <button
                  type="button"
                  onClick={handleResend}
                  className="text-sm font-bold text-[#4A0E33] hover:underline"
                >
                  Resend Email
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
