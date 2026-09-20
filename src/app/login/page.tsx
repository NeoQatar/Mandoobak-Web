
'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { auth } from '@/lib/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { Loader2, Eye, EyeOff, AlertCircle } from 'lucide-react';
import Image from 'next/image';

function getAuthErrorMessage(error: any): string {
  const code: string = error?.code ?? '';
  const message: string = error?.message ?? '';

  const isInvalidCredential =
    code === 'auth/invalid-credential' ||
    code === 'auth/invalid-login-credentials' ||
    code === 'auth/user-not-found' ||
    code === 'auth/wrong-password' ||
    message.includes('INVALID_LOGIN_CREDENTIALS') ||
    message.includes('INVALID_PASSWORD');

  if (isInvalidCredential) return 'Incorrect email or password. Please try again.';

  switch (code) {
    case 'auth/invalid-email':
      return 'The email address is not valid.';
    case 'auth/user-disabled':
      return 'This account has been disabled. Please contact support.';
    case 'auth/too-many-requests':
      return 'Too many failed attempts. Please wait a moment and try again.';
    case 'auth/network-request-failed':
      return 'Network error. Please check your internet connection.';
    default:
      return 'Something went wrong. Please try again.';
  }
}

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage('');
    try {
        await signInWithEmailAndPassword(auth, email, password);
        router.push('/dashboard');
    } catch (error: any) {
        setErrorMessage(getAuthErrorMessage(error));
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <div className="w-full h-screen flex overflow-hidden bg-background">
      {/* Left Side - Branding Image */}
      <div className="hidden lg:block w-1/2 relative h-full">
        <Image 
          src="/assets/images/mandobak-login-new.jpg" 
          alt="School Branding" 
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-black/10" /> {/* Subtle overlay for text readability if needed */}
        
        {/* Branding Overlay */}
        {/* <div className="absolute inset-0 flex flex-col items-center justify-center text-white z-10">
            <h1 className="text-7xl font-jiwez tracking-wide mb-4 drop-shadow-md">Mandobak</h1>
            <p className="text-xl font-light tracking-wide opacity-90">All Government Services in One App.</p>
        </div> */}
      </div>

      {/* Right Side - Login Form */}
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
            <h1 className="text-3xl font-bold tracking-tight text-[#4A0E33]">Sign In</h1>
            <p className="text-muted-foreground text-sm max-w-[300px] mx-auto leading-relaxed">
              Access a wide range of official services from the Qatar government.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="font-semibold text-gray-700">Email <span className="text-destructive">*</span></Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setErrorMessage(''); }}
                required
                className="h-12 bg-gray-50 border-gray-200"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="font-semibold text-gray-700">Password <span className="text-destructive">*</span></Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setErrorMessage(''); }}
                  required
                  className="h-12 bg-gray-50 border-gray-200 pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>
            
            {errorMessage && (
              <div className="flex items-center gap-2 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <Button className="w-full h-12 text-base font-semibold bg-[#4A0E33] hover:bg-[#350a24]" type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isLoading ? 'Signing In...' : 'Sign In'}
            </Button>

            <div className="flex justify-end">
                <Link href="/forgot-password" className="text-sm font-bold text-[#4A0E33] hover:underline">
                    Forgot Password?
                </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
