# Frontend Error Display Fix

## Problem
Error showing as `[object Object]` instead of actual message.

## Fix: Update Error Handling in `/signup/password/page.tsx`

### REPLACE `handleSubmit` function with:

```typescript
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  
  if (loading) return;
  
  setLoading(true);
  setError('');

  if (password.length < 8) {
    setError('Password must be at least 8 characters');
    setLoading(false);
    return;
  }

  try {
    await signupPassword({ email, password });
    sessionStorage.setItem('signup_password', password);
    router.push('/signup/verify');
  } catch (err) {
    // ✅ FIX: Properly extract error message
    let errorMessage = 'Failed to send code';
    
    if (err instanceof Error) {
      errorMessage = err.message;
    } else if (typeof err === 'object' && err !== null) {
      errorMessage = (err as any).detail || 
                     (err as any).message || 
                     JSON.stringify(err);
    }
    
    // Handle specific errors
    if (errorMessage.includes('429') || errorMessage.includes('Too Many Requests')) {
      setError('Too many attempts. Please wait a few minutes.');
    } else if (errorMessage.includes('already registered')) {
      setError('Email already registered. Try logging in instead.');
    } else {
      setError(errorMessage);
    }
  } finally {
    setLoading(false);
  }
};
```

### Also Update `fetchAPI` in `lib/api/authService.ts`:

```typescript
async function fetchAPI<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ 
      detail: `HTTP ${response.status}` 
    }));
    
    // ✅ FIX: Throw Error with string message
    const errorMessage = error.detail || 
                         error.message || 
                         `HTTP ${response.status}`;
    throw new Error(errorMessage);
  }

  return response.json();
}
```

## Backend Rate Limits (Already Fixed!)

✅ Increased `/signup/password` from 10/hour to **30/hour**

## Quick Test

1. Try signup again
2. Errors now show as readable text
3. Can retry up to 30 times per hour
