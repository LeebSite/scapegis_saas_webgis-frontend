'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { signupComplete } from '@/lib/api/authService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function SignupProfilePage() {
    const router = useRouter();
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

        // ✅ Validate birthday format (YYYY-MM-DD)
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(birthday)) {
            setError('Invalid birthday format. Please select a valid date.');
            setLoading(false);
            return;
        }

        // ✅ Debug: Log request payload
        console.log('📋 Signup Complete Request:', {
            email,
            temp_token: tempToken,
            name,
            birthday  // Should be YYYY-MM-DD
        });

        try {
            await signupComplete({
                email,
                temp_token: tempToken,
                name,
                birthday  // Already in YYYY-MM-DD format from date input
            });

            // Clear signup data
            sessionStorage.removeItem('signup_email');
            sessionStorage.removeItem('signup_password');
            sessionStorage.removeItem('signup_temp_token');

            // Redirect to login (tokens should be set by backend via cookies)
            router.push('/dashboard/developer');
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to create account';
            console.error('❌ Signup Complete Error:', errorMessage);
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-muted/50 px-4">
            <div className="max-w-md w-full space-y-8 p-8 bg-card rounded-lg shadow-lg border">
                <div>
                    <h2 className="text-3xl font-bold">Let's confirm your age</h2>
                    <p className="mt-2 text-muted-foreground">
                        This helps us personalize your experience and provide
                        the right settings, in line with our Privacy Policy
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label htmlFor="name" className="block text-sm font-medium mb-2">
                            Full name
                        </label>
                        <Input
                            id="name"
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="John Doe"
                            required
                            autoFocus
                        />
                    </div>

                    <div>
                        <label htmlFor="birthday" className="block text-sm font-medium mb-2">
                            Birthday
                        </label>
                        <Input
                            id="birthday"
                            type="date"
                            value={birthday}
                            onChange={(e) => setBirthday(e.target.value)}
                            required
                        />
                    </div>

                    {error && (
                        <div className="bg-destructive/10 border border-destructive/20 rounded-md p-3 text-destructive text-sm">
                            {error}
                        </div>
                    )}

                    <div className="text-xs text-muted-foreground">
                        By clicking "Continue", you agree to our{' '}
                        <a href="/terms" className="text-primary hover:underline">Terms</a>
                        {' '}and have read our{' '}
                        <a href="/privacy" className="text-primary hover:underline">Privacy Policy</a>.
                    </div>

                    <Button type="submit" disabled={loading} className="w-full">
                        {loading ? 'Creating account...' : 'Continue'}
                    </Button>
                </form>
            </div>
        </div>
    );
}
