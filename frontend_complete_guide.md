# Frontend Authentication Implementation Guide - COMPLETE REDESIGN

## 🎯 Overview

Backend authentication telah diredesign dengan alur terpisah untuk **Admin** dan **Developer**. Panduan ini memberikan spesifikasi lengkap untuk implementasi frontend.

---

## 📋 Changes Summary

### Breaking Changes
```diff
- Magic Link untuk semua user
+ Magic Link HANYA untuk Admin
+ Multi-step signup (4 langkah) untuk Developer
+ Role berubah dari string ke Enum
+ Field birthday ditambahkan
- is_verified dihapus dari response
- auth_provider dihapus dari response
```

---

## 🔄 Authentication Flows

### Flow 1: Developer Signup (ChatGPT-style)
```
Page 1: /signup          → Input email
Page 2: /signup/password → Set password
Page 3: /signup/verify   → Input 6-digit code
Page 4: /signup/profile  → Name + Birthday
Success → Redirect to /dashboard
```

### Flow 2: Developer Login (Quick)
```
Option A: /login → Email/Password
Option B: /login → Google OAuth button
```

### Flow 3: Admin Login (Magic Link Only)
```
/admin/login → Request magic link → Click email link → Auto-login
```

---

## 📦 TypeScript Types

### File: `types/auth.ts`

```typescript
// ===== ENUMS =====
export enum UserRole {
  ADMIN = 'ADMIN',
  DEVELOPER = 'DEVELOPER'
}

export enum AuthProvider {
  LOCAL = 'local',
  GOOGLE = 'google',
  ADMIN_MAGIC_LINK = 'admin_magic_link'
}

// ===== USER =====
export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatar_url?: string | null;
  birthday?: string; // YYYY-MM-DD format
}

// ===== SIGNUP REQUESTS/RESPONSES =====
export interface SignupInitRequest {
  email: string;
}

export interface SignupInitResponse {
  status: 'password_required';
  email: string;
}

export interface SignupPasswordRequest {
  email: string;
  password: string;
}

export interface SignupPasswordResponse {
  status: 'verification_sent';
  email: string;
  message: string;
}

export interface SignupVerifyRequest {
  email: string;
  code: string; // 6 digits
}

export interface SignupVerifyResponse {
  status: 'profile_required';
  email: string;
  temp_token: string;
}

export interface SignupCompleteRequest {
  email: string;
  temp_token: string;
  name: string;
  birthday: string; // YYYY-MM-DD
}

// ===== AUTH TOKENS =====
export interface AuthTokens {
  access_token: string;
  refresh_token?: string;
  token_type: string;
}

// ===== LOGIN =====
export interface LoginRequest {
  email: string;
  password: string;
}

export interface GoogleOAuthRequest {
  id_token: string;
}

// ===== ADMIN =====
export interface AdminMagicLinkRequest {
  email: string;
}

export interface AdminMagicLinkResponse {
  message: string;
}

// ===== SIGNUP STATE (for multi-step form) =====
export interface SignupState {
  email: string;
  password?: string;
  code?: string;
  tempToken?: string;
  name?: string;
  birthday?: string;
  currentStep: 1 | 2 | 3 | 4;
}
```

---

## 🌐 API Service

### File: `lib/api/authService.ts`

```typescript
import {
  SignupInitRequest,
  SignupInitResponse,
  SignupPasswordRequest,
  SignupPasswordResponse,
  SignupVerifyRequest,
  SignupVerifyResponse,
  SignupCompleteRequest,
  LoginRequest,
  GoogleOAuthRequest,
  AdminMagicLinkRequest,
  AdminMagicLinkResponse,
  AuthTokens,
  User
} from '@/types/auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// ===== HELPER =====
async function fetchAPI<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    credentials: 'include', // CRITICAL: untuk HttpOnly cookies
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || `HTTP ${response.status}`);
  }

  return response.json();
}

// ===== DEVELOPER SIGNUP (Multi-step) =====

export async function signupInit(
  data: SignupInitRequest
): Promise<SignupInitResponse> {
  return fetchAPI('/api/v1/auth/signup/init', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function signupPassword(
  data: SignupPasswordRequest
): Promise<SignupPasswordResponse> {
  return fetchAPI('/api/v1/auth/signup/password', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function signupVerify(
  data: SignupVerifyRequest
): Promise<SignupVerifyResponse> {
  return fetchAPI('/api/v1/auth/signup/verify', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function signupComplete(
  data: SignupCompleteRequest
): Promise<AuthTokens> {
  return fetchAPI('/api/v1/auth/signup/complete', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// ===== DEVELOPER LOGIN =====

export async function login(
  data: LoginRequest
): Promise<AuthTokens> {
  return fetchAPI('/api/v1/auth/login', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function googleOAuth(
  data: GoogleOAuthRequest
): Promise<AuthTokens> {
  return fetchAPI('/api/v1/auth/oauth/google', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// ===== ADMIN LOGIN =====

export async function adminRequestMagicLink(
  data: AdminMagicLinkRequest
): Promise<AdminMagicLinkResponse> {
  return fetchAPI('/api/v1/auth/admin/request-link', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function adminVerifyMagicLink(
  token: string
): Promise<AuthTokens> {
  return fetchAPI(`/api/v1/auth/admin/verify?token=${token}`, {
    method: 'GET',
  });
}

// ===== USER INFO =====

export async function getCurrentUser(): Promise<User> {
  return fetchAPI('/api/v1/auth/me', {
    method: 'GET',
  });
}

export async function logout(): Promise<void> {
  await fetchAPI('/api/v1/auth/logout', {
    method: 'POST',
  });
}
```

---

## 🎨 Page Implementations

### 1. Signup Step 1: Email Input

**Route**: `/signup`

**File**: `app/signup/page.tsx`

```tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signupInit } from '@/lib/api/authService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Link from 'next/link';

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await signupInit({ email });
      
      // Store email in sessionStorage for next step
      sessionStorage.setItem('signup_email', email);
      
      router.push('/signup/password');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to continue');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow">
        <div>
          <h2 className="text-3xl font-bold text-center">Create your account</h2>
          <p className="mt-2 text-center text-gray-600">
            Get started with ScapeGIS
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email address
            </label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              autoFocus
              className="mt-1"
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3 text-red-700 text-sm">
              {error}
            </div>
          )}

          <Button
            type="submit"
            disabled={loading}
            className="w-full"
          >
            {loading ? 'Checking...' : 'Continue'}
          </Button>
        </form>

        <div className="text-center text-sm">
          <span className="text-gray-600">Already have an account? </span>
          <Link href="/login" className="text-blue-600 hover:underline">
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
```

---

### 2. Signup Step 2: Password

**Route**: `/signup/password`

**File**: `app/signup/password/page.tsx`

```tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { signupPassword } from '@/lib/api/authService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function SignupPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const storedEmail = sessionStorage.getItem('signup_email');
    if (!storedEmail) {
      router.push('/signup');
      return;
    }
    setEmail(storedEmail);
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      setLoading(false);
      return;
    }

    try {
      await signupPassword({ email, password });
      
      // Store for next step
      sessionStorage.setItem('signup_password', password);
      
      router.push('/signup/verify');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send code');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow">
        <div>
          <h2 className="text-3xl font-bold">Create a password</h2>
          <p className="mt-2 text-gray-600">
            You'll use this password to log in to ScapeGIS
          </p>
        </div>

        <div className="bg-gray-100 rounded-md p-3">
          <p className="text-sm text-gray-600">Email address</p>
          <p className="font-medium">{email}</p>
          <button
            onClick={() => router.push('/signup')}
            className="text-sm text-blue-600 hover:underline mt-1"
          >
            Edit
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Password
            </label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 8 characters"
              required
              autoFocus
              className="mt-1"
            />
            <p className="mt-1 text-xs text-gray-500">
              Use at least 8 characters
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3 text-red-700 text-sm">
              {error}
            </div>
          )}

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? 'Sending code...' : 'Continue'}
          </Button>
        </form>
      </div>
    </div>
  );
}
```

---

### 3. Signup Step 3: Verification Code

**Route**: `/signup/verify`

**File**: `app/signup/verify/page.tsx`

```tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { signupVerify, signupPassword } from '@/lib/api/authService';
import { Button } from '@/components/ui/button';

export default function SignupVerifyPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resending, setResending] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    const storedEmail = sessionStorage.getItem('signup_email');
    if (!storedEmail) {
      router.push('/signup');
      return;
    }
    setEmail(storedEmail);
  }, [router]);

  const handleCodeChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return; // Only digits

    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all 6 digits entered
    if (newCode.every(d => d.length === 1)) {
      handleVerify(newCode.join(''));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async (codeString?: string) => {
    const finalCode = codeString || code.join('');
    
    if (finalCode.length !== 6) {
      setError('Please enter all 6 digits');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await signupVerify({ email, code: finalCode });
      
      // Store temp token for next step
      sessionStorage.setItem('signup_temp_token', response.temp_token);
      
      router.push('/signup/profile');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid code');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    setError('');
    
    try {
      const password = sessionStorage.getItem('signup_password');
      if (!password) {
        router.push('/signup/password');
        return;
      }
      
      await signupPassword({ email, password });
      setCode(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
      
      // Show success message briefly
      setError(''); // Clear any errors
      setTimeout(() => {
        // Could show a success toast here
      }, 100);
    } catch (err) {
      setError('Failed to resend code');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow">
        <div className="text-center">
          <h2 className="text-3xl font-bold">Check your inbox</h2>
          <p className="mt-2 text-gray-600">
            Enter the verification code we just sent to
          </p>
          <p className="font-medium mt-1">{email}</p>
        </div>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 text-center mb-3">
              Code
            </label>
            <div className="flex gap-2 justify-center">
              {code.map((digit, index) => (
                <input
                  key={index}
                  ref={el => inputRefs.current[index] = el}
                  type="text"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleCodeChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  className="w-12 h-12 text-center text-2xl font-bold border-2 border-gray-300 rounded-md focus:border-blue-500 focus:outline-none"
                  autoFocus={index === 0}
                />
              ))}
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3 text-red-700 text-sm text-center">
              {error}
            </div>
          )}

          <Button
            onClick={() => handleVerify()}
            disabled={loading || code.some(d => !d)}
            className="w-full"
          >
            {loading ? 'Verifying...' : 'Continue'}
          </Button>

          <div className="text-center">
            <button
              onClick={handleResend}
              disabled={resending}
              className="text-sm text-blue-600 hover:underline disabled:text-gray-400"
            >
              {resending ? 'Sending...' : 'Resend code'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
```

---

### 4. Signup Step 4: Profile Completion

**Route**: `/signup/profile`

**File**: `app/signup/profile/page.tsx`

```tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { signupComplete } from '@/lib/api/authService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/context/AuthContext';

export default function SignupProfilePage() {
  const router = useRouter();
  const { refreshUser } = useAuth();
  const [email, setEmail] = useState('');
  const [tempToken, setTempToken] = useState('');
  const [name, setName] = useState('');
  const [birthday, setBirthday] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const storedEmail = sessionStorage.getItem('signup_email');
    const storedToken = sessionStorage.getItem('signup_temp_token');
    
    if (!storedEmail || !storedToken) {
      router.push('/signup');
      return;
    }
    
    setEmail(storedEmail);
    setTempToken(storedToken);
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await signupComplete({
        email,
        temp_token: tempToken,
        name,
        birthday
      });

      // Clear signup data
      sessionStorage.removeItem('signup_email');
      sessionStorage.removeItem('signup_password');
      sessionStorage.removeItem('signup_temp_token');

      // Refresh user data
      await refreshUser();

      // Redirect to dashboard
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow">
        <div>
          <h2 className="text-3xl font-bold">Let's confirm your age</h2>
          <p className="mt-2 text-gray-600">
            This helps us personalize your experience and provide
            the right settings, in line with our Privacy Policy
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
              Full name
            </label>
            <Input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Lazatin"
              required
              autoFocus
              className="mt-1"
            />
          </div>

          <div>
            <label htmlFor="birthday" className="block text-sm font-medium text-gray-700">
              Birthday
            </label>
            <Input
              id="birthday"
              type="date"
              value={birthday}
              onChange={(e) => setBirthday(e.target.value)}
              required
              className="mt-1"
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3 text-red-700 text-sm">
              {error}
            </div>
          )}

          <div className="text-xs text-gray-500">
            By clicking "Continue", you agree to our{' '}
            <a href="/terms" className="text-blue-600 hover:underline">Terms</a>
            {' '}and have read our{' '}
            <a href="/privacy" className="text-blue-600 hover:underline">Privacy Policy</a>.
          </div>

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? 'Creating account...' : 'Continue'}
          </Button>
        </form>
      </div>
    </div>
  );
}
```

---

### 5. Login Page (Developer)

**Route**: `/login`

**File**: `app/login/page.tsx`

```tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { login, googleOAuth } from '@/lib/api/authService';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { GoogleLogin } from '@react-oauth/google';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const { refreshUser } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await login({ email, password });
      await refreshUser();
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse: any) => {
    try {
      await googleOAuth({ id_token: credentialResponse.credential });
      await refreshUser();
      router.push('/dashboard');
    } catch (err) {
      setError('Google login failed');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow">
        <div>
          <h2 className="text-3xl font-bold text-center">Welcome back</h2>
          <p className="mt-2 text-center text-gray-600">
            Sign in to your ScapeGIS account
          </p>
        </div>

        {/* Email/Password Login */}
        <form onSubmit={handleEmailLogin} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="mt-1"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Password
            </label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="mt-1"
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3 text-red-700 text-sm">
              {error}
            </div>
          )}

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? 'Signing in...' : 'Sign in'}
          </Button>
        </form>

        {/* Divider */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">Or continue with</span>
          </div>
        </div>

        {/* Google Login */}
        <div className="flex justify-center">
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={() => setError('Google login failed')}
          />
        </div>

        {/* Sign up link */}
        <div className="text-center text-sm">
          <span className="text-gray-600">Don't have an account? </span>
          <Link href="/signup" className="text-blue-600 hover:underline">
            Sign up
          </Link>
        </div>

        {/* Admin link */}
        <div className="text-center text-xs text-gray-500">
          <Link href="/admin/login" className="hover:underline">
            Admin access
          </Link>
        </div>
      </div>
    </div>
  );
}
```

---

### 6. Admin Login Page

**Route**: `/admin/login`

**File**: `app/admin/login/page.tsx`

```tsx
'use client';

import { useState } from 'react';
import { adminRequestMagicLink } from '@/lib/api/authService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Link from 'next/link';

export default function AdminLoginPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await adminRequestMagicLink({ email });
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send link');
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full p-8 bg-white rounded-lg shadow">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
              <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="mt-6 text-2xl font-bold">Check your email</h2>
            <p className="mt-2 text-gray-600">
              We've sent a magic link to <strong>{email}</strong>.
              Click the link to sign in instantly.
            </p>
            <p className="mt-4 text-sm text-gray-500">
              The link expires in 10 minutes.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow">
        <div>
          <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-blue-100">
            <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 className="mt-6 text-3xl font-bold text-center">Admin Access</h2>
          <p className="mt-2 text-center text-gray-600">
            Sign in with your admin email
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Admin Email
            </label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@scapegis.com"
              required
              autoFocus
              className="mt-1"
            />
            <p className="mt-1 text-xs text-gray-500">
              Admin access only. We'll send you a magic link.
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3 text-red-700 text-sm">
              {error}
            </div>
          )}

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? 'Sending...' : 'Send Magic Link'}
          </Button>
        </form>

        <div className="text-center text-sm">
          <Link href="/login" className="text-gray-600 hover:underline">
            ← Back to regular login
          </Link>
        </div>
      </div>
    </div>
  );
}
```

---

### 7. Admin Verify Page

**Route**: `/admin/verify`

**File**: `app/admin/verify/page.tsx`

```tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { adminVerifyMagicLink } from '@/lib/api/authService';
import { useAuth } from '@/context/AuthContext';

export default function AdminVerifyPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { refreshUser } = useAuth();
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
  const [error, setError] = useState('');

  useEffect(() => {
    const token = searchParams.get('token');
    
    if (!token) {
      setStatus('error');
      setError('No token provided');
      return;
    }

    verifyToken(token);
  }, [searchParams]);

  const verifyToken = async (token: string) => {
    try {
      await adminVerifyMagicLink(token);
      await refreshUser();
      setStatus('success');
      
      setTimeout(() => {
        router.push('/dashboard');
      }, 1000);
    } catch (err) {
      setStatus('error');
      setError(err instanceof Error ? err.message : 'Invalid or expired link');
    }
  };

  if (status === 'verifying') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto" />
          <p className="mt-4 text-lg">Verifying your admin access...</p>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full p-8 bg-white rounded-lg shadow text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
            <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className="mt-6 text-2xl font-bold text-red-600">Verification Failed</h2>
          <p className="mt-2 text-gray-600">{error}</p>
          <Button
            onClick={() => router.push('/admin/login')}
            className="mt-6"
          >
            Request New Link
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full p-8 bg-white rounded-lg shadow text-center">
        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
          <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="mt-6 text-2xl font-bold text-green-600">Success!</h2>
        <p className="mt-2 text-gray-600">Redirecting to dashboard...</p>
      </div>
    </div>
  );
}
```

---

## 🔄 Auth Context (Updated)

### File: `context/AuthContext.tsx`

```typescript
'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, UserRole } from '@/types/auth';
import { getCurrentUser } from '@/lib/api/authService';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  refreshUser: () => Promise<void>;
  isAdmin: boolean;
  isDeveloper: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshUser = async () => {
    try {
      setLoading(true);
      const userData = await getCurrentUser();
      setUser(userData);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch user:', err);
      setUser(null);
      setError(err instanceof Error ? err.message : 'Failed to fetch user');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const isAdmin = user?.role === UserRole.ADMIN;
  const isDeveloper = user?.role === UserRole.DEVELOPER;

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      error, 
      refreshUser, 
      isAdmin, 
      isDeveloper 
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
```

---

## 🛡️ Protected Routes

### File: `components/ProtectedRoute.tsx`

```typescript
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { UserRole } from '@/types/auth';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireRole?: UserRole;
}

export function ProtectedRoute({ children, requireRole }: ProtectedRouteProps) {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/login');
      } else if (requireRole && user.role !== requireRole) {
        router.push('/dashboard'); // or 403 page
      }
    }
  }, [user, loading, requireRole, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (!user || (requireRole && user.role !== requireRole)) {
    return null;
  }

  return <>{children}</>;
}
```

---

## 📱 Environment Variables

### File: `.env.local`

```bash
# Backend API
NEXT_PUBLIC_API_URL=http://localhost:8000

# Google OAuth
NEXT_PUBLIC_GOOGLE_CLIENT_ID=940830341579-0fcheup5gm7naos0cubblmueftb6viqp.apps.googleusercontent.com
```

**⚠️ CRITICAL**: Restart Next.js after changing `.env.local`!

---

## ✅ Testing Checklist

### Developer Signup
- [ ] Enter email → redirects to password page
- [ ] Set password → sends verification code (check console)
- [ ] Enter correct code → redirects to profile page
- [ ] Complete profile → creates account & redirects to dashboard
- [ ] User info displays correctly in navbar/profile

### Developer Login
- [ ] Email/password login works
- [ ] Google OAuth login works
- [ ] Redirects to dashboard after login

### Admin Login
- [ ] Request magic link sends email (check console)
- [ ] Click magic link verifies and logs in
- [ ] Admin sees admin dashboard/features

### Edge Cases
- [ ] Expired verification code shows error
- [ ] Wrong verification code shows error
- [ ] Resend code works
- [ ] Navigation back/forward works
- [ ] Refresh page during signup maintains state

---

## 🚀 Quick Start Commands

```bash
# Install dependencies
npm install @react-oauth/google

# Update environment variables
# Edit .env.local with values above

# Restart dev server
npm run dev
```

---

## 📊 Summary of Changes

| Aspect | Old | New |
|--------|-----|-----|
| Signup | Magic link for all | 4-step form for developers |
| Admin login | Same as users | Dedicated magic link flow |
| User role | String | Enum (ADMIN/DEVELOPER) |
| User fields | No birthday | Birthday required |
| Response fields | Had is_verified, auth_provider | Removed both |
| Pages needed | 2 (login, signup) | 7 (login, admin/login, signup x4, admin/verify) |

**Total new pages**: 5 (4 signup steps + admin login)

---

## 🎯 Implementation Priority

1. **High Priority** (Must have for MVP):
   - Login page
   - Signup pages (all 4 steps)
   - Auth context updates
   - TypeScript types

2. **Medium Priority**:
   - Admin login page
   - Protected routes
   - Error handling

3. **Low Priority** (Nice to have):
   - Loading states
   - Animations
   - Toast notifications

---

**🔥 READY TO IMPLEMENT!**
