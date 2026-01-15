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
} from '@/lib/types/auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// ✅ DEBUG: Log API URL on module load
console.log('🔧 Auth Service - API URL configured as:', API_URL);

// ===== HELPER =====
async function fetchAPI<T>(
    endpoint: string,
    options?: RequestInit
): Promise<T> {
    const fullUrl = `${API_URL}${endpoint}`;

    // ✅ DEBUG: Log every API call
    console.log('📡 API Call:', fullUrl);

    const response = await fetch(fullUrl, {
        ...options,
        credentials: 'include', // CRITICAL: for HttpOnly cookies
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
