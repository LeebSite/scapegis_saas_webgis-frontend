"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
// use native img tag for logo
import { useAuthStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { UserRole } from "@/lib/types";
import { getDashboardRoute } from "@/lib/utils";
import http from "@/lib/api/http";

import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';

export default function LoginPage() {
	const router = useRouter();
	const setUser = useAuthStore((state) => state.setUser);

	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const [showPassword, setShowPassword] = useState(false);
	const [error, setError] = useState<string | null>(null);



	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setIsLoading(true);
		setError(null); // Clear previous errors

		try {
			const res = await http.post("/auth/login", { email, password });
			localStorage.setItem("access_token", res.data.access_token);
			localStorage.setItem("refresh_token", res.data.refresh_token);

			const me = await http.get("/auth/me");
			setUser(me.data);

			const dashboardRoute = getDashboardRoute(me.data.role as UserRole);
			router.push(dashboardRoute);
		} catch (err: any) {
			// Show user-friendly error message
			const errorMessage =
				err.response?.data?.message ||
				err.response?.data?.detail ||
				"Invalid email or password. Please try again.";
			setError(errorMessage);
			console.error("Login failed:", err);
		} finally {
			setIsLoading(false);
		}
	};

	const handleGoogleSuccess = async (credentialResponse: any) => {
		setIsLoading(true);
		setError(null);

		try {
			const res = await http.post("/auth/oauth/google", { id_token: credentialResponse.credential });

			localStorage.setItem("access_token", res.data.access_token);
			localStorage.setItem("refresh_token", res.data.refresh_token);

			const me = await http.get("/auth/me");
			setUser(me.data);
			const dashboardRoute = getDashboardRoute(me.data.role as UserRole);
			router.push(dashboardRoute);
		} catch (error: any) {
			const errorMessage =
				error.response?.data?.message ||
				error.response?.data?.detail ||
				"Google authentication failed. Please try again.";
			setError(errorMessage);
			console.error("Google Login Failed:", error);
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "YOUR_CLIENT_ID"}>
			<div className="min-h-screen flex items-center justify-center bg-muted/50 px-4">
				<Card className="w-full max-w-md">
					<CardHeader className="space-y-1">
						<div className="flex items-center justify-center mb-4">
							<div className="flex items-center gap-2">
								<img src="/img/logo_scapegis.svg" alt="Scapegis Logo" width={48} height={48} className="block" />
								<span className="font-kayak text-2xl tracking-wide font-semibold text-[#01123E]">Scapegis</span>
							</div>
						</div>
						<CardTitle className="text-2xl text-center">Sign in to your account</CardTitle>
						<CardDescription className="text-center">Welcome back — please enter your details</CardDescription>
					</CardHeader>
					<CardContent>
						{/* Error Alert */}
						{error && (
							<div className="mb-4 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg relative" role="alert">
								<div className="flex items-start">
									<svg className="h-5 w-5 text-red-400 mr-2 mt-0.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
										<path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
									</svg>
									<span className="text-sm font-medium">{error}</span>
								</div>
							</div>
						)}

						<form onSubmit={handleSubmit} className="space-y-4">
							<div className="space-y-2">
								<Label htmlFor="email">Email</Label>
								<Input id="email" type="email" placeholder="name@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
							</div>

							<div className="space-y-2">
								<Label htmlFor="password">Password</Label>
								<div className="relative">
									<Input
										id="password"
										type={showPassword ? "text" : "password"}
										value={password}
										onChange={(e) => setPassword(e.target.value)}
										required
										className="pr-10"
									/>
									<button
										type="button"
										aria-label={showPassword ? "Hide password" : "Show password"}
										onClick={() => setShowPassword((s) => !s)}
										className="absolute right-2 top-1/2 -translate-y-1/2 inline-flex items-center justify-center rounded px-2 py-1 text-sm text-muted-foreground hover:text-foreground"
									>
										{showPassword ? (
											<svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
												<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-5 0-9-3.5-10-8 1-2.5 3-4.5 5.25-5.75M3 3l18 18" />
											</svg>
										) : (
											<svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
												<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
												<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
											</svg>
										)}
									</button>
								</div>
							</div>

							<Button type="submit" className="w-full" disabled={isLoading}>{isLoading ? "Signing in..." : "Sign in"}</Button>
						</form>

						<div className="relative my-4">
							<div className="absolute inset-0 flex items-center">
								<span className="w-full border-t" />
							</div>
							<div className="relative flex justify-center text-xs uppercase">
								<span className="bg-background px-2 text-muted-foreground">Or continue with</span>
							</div>
						</div>

						<div className="flex justify-center w-full">
							<GoogleLogin onSuccess={handleGoogleSuccess} />
						</div>

						<div className="mt-4 text-center text-sm">
							<span className="text-muted-foreground">Don't have an account? </span>
							<Link href="/register" className="text-primary hover:underline">Create one</Link>
						</div>
					</CardContent>
				</Card>
			</div>
		</GoogleOAuthProvider>
	);
}
