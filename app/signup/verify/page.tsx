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
    const lastRequestTime = useRef<number>(0);

    useEffect(() => {
        const storedEmail = sessionStorage.getItem('signup_email');
        if (!storedEmail) {
            router.push('/signup');
            return;
        }
        setEmail(storedEmail);

        // ✅ DEBUG: Log session info on mount
        console.log('=== Verify Page Loaded ===');
        console.log('Email:', storedEmail);
        console.log('Password stored:', !!sessionStorage.getItem('signup_password'));
        console.log('API URL:', process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000');
    }, [router]);

    const handleCodeChange = (index: number, value: string) => {
        if (!/^\d*$/.test(value)) return;
        const newCode = [...code];
        newCode[index] = value;
        setCode(newCode);

        if (value && index < 5) {
            inputRefs.current[index + 1]?.focus();
        }

        // ✅ FIX: Auto-submit only when LAST digit is entered AND all digits filled
        if (index === 5 && value && newCode.every(d => d.length === 1)) {
            setLoading(true);
            setTimeout(() => {
                handleVerify(newCode.join(''));
            }, 100);
        }
    };

    const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
        if (e.key === 'Backspace' && !code[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    const handleVerify = async (codeString?: string) => {
        // ✅ 1. JOIN OTP WITH TRIM
        const finalCode = (codeString || code.join('')).trim();

        // ✅ 2. VALIDATE LENGTH
        if (finalCode.length !== 6) {
            setError('Kode harus 6 digit');
            return;
        }

        // ✅ FIX: Throttle requests
        const now = Date.now();
        if (now - lastRequestTime.current < 1000) return;
        lastRequestTime.current = now;

        if (loading) return;

        setLoading(true);
        setError('');

        try {
            console.log('Verifying code for:', email, 'Code:', finalCode);

            // ✅ 3. SEND TO BACKEND WITHOUT MANIPULATION
            const response = await signupVerify({ email, code: finalCode });

            // ✅ SUCCESS: Store temp token and redirect to profile
            sessionStorage.setItem('signup_temp_token', response.temp_token);
            router.push('/signup/profile');
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Verification failed';
            console.error('Verification error:', errorMessage);

            // ✅ 4. HANDLE ERROR FROM BACKEND
            if (errorMessage.toLowerCase().includes('expired')) {
                setError('Kode sudah kadaluarsa. Klik "Resend code" di bawah.');
            } else if (errorMessage.toLowerCase().includes('already used')) {
                setError('Kode sudah digunakan. Silakan minta kode baru.');
            } else if (errorMessage.toLowerCase().includes('invalid')) {
                setError('Kode verifikasi salah. Silakan coba lagi.');
            } else {
                setError(errorMessage || 'Verification failed');
            }

            // ✅ Clear code on error and refocus
            setCode(['', '', '', '', '', '']);
            inputRefs.current[0]?.focus();
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
        } catch (err) {
            setError('Failed to resend code');
        } finally {
            setResending(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-muted/50 px-4">
            <div className="max-w-md w-full space-y-8 p-8 bg-card rounded-lg shadow-lg border">
                <div className="text-center">
                    <h2 className="text-3xl font-bold">Check your inbox</h2>
                    <p className="mt-2 text-muted-foreground">
                        Enter the verification code we just sent to
                    </p>
                    <p className="font-medium mt-1">{email}</p>
                </div>

                <div className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-center mb-3">
                            Code
                        </label>
                        <div className="flex gap-2 justify-center">
                            {code.map((digit, index) => (
                                <input
                                    key={index}
                                    ref={el => { inputRefs.current[index] = el; }}
                                    type="text"
                                    maxLength={1}
                                    value={digit}
                                    onChange={(e) => handleCodeChange(index, e.target.value)}
                                    onKeyDown={(e) => handleKeyDown(index, e)}
                                    className="w-12 h-12 text-center text-2xl font-bold border-2 rounded-md focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                                    autoFocus={index === 0}
                                    disabled={loading}
                                />
                            ))}
                        </div>
                    </div>

                    {error && (
                        <div className="bg-destructive/10 border border-destructive/20 rounded-md p-3 text-destructive text-sm text-center">
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
                            disabled={resending || loading}
                            className="text-sm text-primary hover:underline disabled:text-muted-foreground"
                        >
                            {resending ? 'Sending...' : 'Resend code'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
