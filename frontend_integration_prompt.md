# Frontend Integration Prompt - Scapegis WebGIS Backend

## 📋 Context

Backend telah direfactor dari  menjadi **Workspace-based** multi-tenancy dengan fitur kolaborasi tim dan subscription plans. Frontend perlu disesuaikan untuk mendukung perubahan ini.

---

## 🔄 Breaking Changes

### 1. **User Data Structure**

**SEBELUM:**
```typescript
interface User {
  id: number;  // ❌ INTEGER
  full_name: string;  // ❌ DEPRECATED
  email: string;
  role: string;
}
```

**SEKARANG:**
```typescript
interface User {
  id: string;  // ✅ UUID (string)
  name: string;  // ✅ Renamed from full_name
  email: string;
  role: 'admin' | 'developer';  // Simplified roles
  avatar_url?: string;
  is_verified: boolean;
  auth_provider: 'local' | 'google';
}
```

**Action Required:**
- ✅ Ubah semua `user.id` dari `number` → `string`
- ✅ Ubah `user.full_name` → `user.name`
- ✅ Tambahkan field baru: `avatar_url`, `is_verified`, `auth_provider`

---

### 2. **Authentication Endpoints**

#### **POST /auth/register**

**Request:**
```typescript
{
  email: string;
  password: string;
  name: string;  // ✅ Bukan full_name lagi!
  role?: 'admin' | 'developer';  // Optional, default: 'developer'
}
```

**Response:**
```typescript
{
  access_token: string;
  refresh_token: string;  // ✅ NEW!
  token_type: "bearer";
}
```

#### **POST /auth/login**

**Response:**
```typescript
{
  access_token: string;
  refresh_token: string;  // ✅ NEW!
  token_type: "bearer";
}
```

**Action Required:**
- ✅ Simpan `refresh_token` di localStorage/cookie
- ✅ Implement token refresh logic

#### **GET /auth/me**

**Response:**
```typescript
{
  id: string;  // UUID
  name: string;
  email: string;
  role: 'admin' | 'developer';
  avatar_url?: string;
  is_verified: boolean;
  auth_provider: 'local' | 'google';
}
```

#### **POST /auth/refresh** ✨ NEW

**Request:**
```typescript
{
  refresh_token: string;
}
```

**Response:**
```typescript
{
  access_token: string;
  token_type: "bearer";
}
```

**Usage:**
```typescript
// Auto-refresh when access token expires
async function refreshAccessToken() {
  const refreshToken = localStorage.getItem('refresh_token');
  const response = await fetch('/api/v1/auth/refresh', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh_token: refreshToken })
  });
  const data = await response.json();
  localStorage.setItem('access_token', data.access_token);
}
```

#### **POST /auth/logout** ✨ NEW

**Request:**
```typescript
{
  refresh_token: string;
}
```

**Response:**
```typescript
{
  message: "Logged out successfully";
}
```

#### **POST /auth/oauth/google** ✨ NEW

**Request:**
```typescript
{
  id_token: string;  // From Google Sign-In
}
```

**Response:**
```typescript
{
  access_token: string;
  refresh_token: string;
  token_type: "bearer";
}
```

**Implementation:**
```bash
npm install @react-oauth/google
```

```tsx
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';

function App() {
  return (
    <GoogleOAuthProvider clientId="YOUR_GOOGLE_CLIENT_ID">
      <LoginPage />
    </GoogleOAuthProvider>
  );
}

function LoginPage() {
  const handleGoogleSuccess = async (credentialResponse) => {
    const response = await fetch('/api/v1/auth/oauth/google', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id_token: credentialResponse.credential })
    });
    const data = await response.json();
    localStorage.setItem('access_token', data.access_token);
    localStorage.setItem('refresh_token', data.refresh_token);
    router.push('/dashboard');
  };

  return <GoogleLogin onSuccess={handleGoogleSuccess} />;
}
```

---

## 🏢 New Concept: Workspaces (Team Collaboration)

### **Workspace Data Structure**

```typescript
interface Workspace {
  id: string;  // UUID
  name: string;
  owner_id: string;  // UUID
  subscription_id?: string;  // UUID
  created_at: string;
  updated_at: string;
}

interface WorkspaceMember {
  id: string;
  workspace_id: string;
  user_id: string;
  role: 'owner' | 'admin' | 'member';
  joined_at: string;
}

interface WorkspaceInvitation {
  id: string;
  workspace_id: string;
  email: string;
  invited_by: string;  // User ID
  role: 'admin' | 'member';
  token: string;
  status: 'pending' | 'accepted' | 'expired';
  expires_at: string;
  created_at: string;
}
```

### **Workspace Flow**

**1. User Register → Auto-create Workspace**
```
User "Andi" register
  ↓
Auto-create workspace "Andi's Workspace"
  ↓
Auto-assign Free subscription
  ↓
Andi becomes owner
```

**2. Invite Team Members**
```typescript
// POST /workspaces/{workspace_id}/invite
{
  email: "siti@example.com",
  role: "member"  // or "admin"
}

// Response
{
  invitation_id: string;
  email: string;
  token: string;
  expires_at: string;
}
```

**3. Accept Invitation**
```typescript
// POST /invitations/{token}/accept
// No body needed, token in URL

// Response
{
  workspace: Workspace;
  member: WorkspaceMember;
}
```

**UI Components Needed:**
- ✅ Workspace selector dropdown (if user has multiple workspaces)
- ✅ Team members list
- ✅ Invite member modal
- ✅ Pending invitations list

---

## 💳 Subscription Plans

### **Subscription Data Structure**

```typescript
interface Subscription {
  id: string;
  name: 'Free' | 'Basic' | 'Professional';
  max_prompts_per_month: number;  // -1 = unlimited
  max_projects: number;  // -1 = unlimited
  max_members: number;  // -1 = unlimited
  max_custom_maps: number;
  price_per_month: number;  // in IDR
  features: {
    custom_maps: boolean;
    advanced_ai: boolean;
  };
}
```

### **Subscription Plans**

| Plan | Prompts/Month | Projects | Members | Custom Maps | Price |
|------|---------------|----------|---------|-------------|-------|
| Free | 5 | 1 | 1 | 0 | Rp 0 |
| Basic | 100 | 10 | 5 | 3 | Rp 100,000 |
| Professional | Unlimited | Unlimited | Unlimited | Unlimited | Rp 500,000 |

### **Subscription Request Flow**

```typescript
// POST /subscription-requests
{
  workspace_id: string;
  region_requested: string;  // "Jakarta Pusat"
  project_type: string;  // "perumahan" | "komersial"
  notes?: string;
}

// Response
{
  id: string;
  status: 'pending' | 'processing' | 'approved' | 'rejected';
  created_at: string;
}
```

**UI Flow:**
```
User clicks "Upgrade Subscription"
  ↓
Show subscription plans
  ↓
User selects "Basic" or "Professional"
  ↓
Show form:
  - Region (Jakarta Pusat, Surabaya, etc.)
  - Project Type (Perumahan, Komersial, etc.)
  - Notes (optional)
  ↓
Submit request
  ↓
Admin processes (manual QGIS work)
  ↓
User gets notification when approved
```

**UI Components Needed:**
- ✅ Subscription plan cards
- ✅ Upgrade modal with form
- ✅ Usage indicator (e.g., "3/5 prompts used")
- ✅ Notification when request approved

---

## 🗺️ Projects & Layers

### **Project Data Structure**

```typescript
interface Project {
  id: string;  // UUID
  workspace_id: string;  // ✅ NEW! (was organization_id)
  created_by: string;  // UUID
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
}
```

**Breaking Change:**
- ✅ `organization_id` → `workspace_id`

### **Layer Data Structure**

```typescript
interface Layer {
  id: string;
  name: string;
  type: 'vector' | 'raster';
  region: string;  // ✅ NEW! "Pekanbaru", "Jakarta Pusat"
  subscription_level: 'free' | 'basic' | 'professional';  // ✅ NEW!
  source?: string;  // URL or file path
  created_at: string;
  updated_at: string;
}
```

**Layer Access Logic:**
```typescript
// User can only access layers matching their subscription level
function getAvailableLayers(userSubscription: string, allLayers: Layer[]) {
  const hierarchy = { free: 0, basic: 1, professional: 2 };
  return allLayers.filter(layer => 
    hierarchy[layer.subscription_level] <= hierarchy[userSubscription]
  );
}

// Example:
// Free user → only "free" layers (Peta Pekanbaru)
// Basic user → "free" + "basic" layers
// Professional user → all layers
```

### **Project-Layer Relationship**

```typescript
// POST /projects/{project_id}/layers
{
  layer_id: string;
}

// GET /projects/{project_id}/layers
// Returns array of layers assigned to this project
```

**UI Flow:**
```
User creates project
  ↓
Show available layers (filtered by subscription)
  ↓
User selects layers to add
  ↓
Layers appear on map
  ↓
User can chat AI about selected layers
```

---

## 🤖 AI Prompt Tracking

### **AI Prompt Log Structure**

```typescript
interface AIPromptLog {
  id: string;
  user_id: string;
  workspace_id: string;  // ✅ NEW! For usage tracking
  project_id: string;
  prompt: string;
  response: string;
  created_at: string;
}
```

**Usage Tracking:**
```typescript
// GET /workspaces/{workspace_id}/usage
{
  prompts_used_this_month: number;
  prompts_limit: number;  // -1 = unlimited
  projects_count: number;
  projects_limit: number;
  members_count: number;
  members_limit: number;
}
```

**UI Display:**
```tsx
function UsageIndicator({ usage }) {
  const percentage = (usage.prompts_used / usage.prompts_limit) * 100;
  
  return (
    <div>
      <p>AI Prompts: {usage.prompts_used} / {usage.prompts_limit === -1 ? '∞' : usage.prompts_limit}</p>
      <ProgressBar value={percentage} />
      {percentage >= 80 && <Alert>Limit hampir habis! Upgrade untuk lebih banyak prompts.</Alert>}
    </div>
  );
}
```

---

## 📝 Complete TypeScript Interfaces

```typescript
// types/api.ts

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'developer';
  avatar_url?: string;
  is_verified: boolean;
  auth_provider: 'local' | 'google';
}

export interface Workspace {
  id: string;
  name: string;
  owner_id: string;
  subscription_id?: string;
  created_at: string;
  updated_at: string;
}

export interface WorkspaceMember {
  id: string;
  workspace_id: string;
  user_id: string;
  role: 'owner' | 'admin' | 'member';
  joined_at: string;
  user?: User;  // Populated in some endpoints
}

export interface Subscription {
  id: string;
  name: 'Free' | 'Basic' | 'Professional';
  max_prompts_per_month: number;
  max_projects: number;
  max_members: number;
  max_custom_maps: number;
  price_per_month: number;
  features: {
    custom_maps: boolean;
    advanced_ai: boolean;
  };
}

export interface Project {
  id: string;
  workspace_id: string;
  created_by: string;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface Layer {
  id: string;
  name: string;
  type: 'vector' | 'raster';
  region: string;
  subscription_level: 'free' | 'basic' | 'professional';
  source?: string;
  created_at: string;
  updated_at: string;
}

export interface SubscriptionRequest {
  id: string;
  user_id: string;
  workspace_id: string;
  project_id?: string;
  region_requested: string;
  project_type: string;
  notes?: string;
  status: 'pending' | 'processing' | 'approved' | 'rejected';
  created_at: string;
  updated_at: string;
}
```

---

## 🔧 API Client Example

```typescript
// lib/api.ts

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

class ApiClient {
  private getHeaders() {
    const token = localStorage.getItem('access_token');
    return {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    };
  }

  async request(endpoint: string, options?: RequestInit) {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers: this.getHeaders()
    });

    if (response.status === 401) {
      // Token expired, try refresh
      await this.refreshToken();
      // Retry request
      return this.request(endpoint, options);
    }

    return response.json();
  }

  async refreshToken() {
    const refreshToken = localStorage.getItem('refresh_token');
    const response = await fetch(`${API_BASE}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refreshToken })
    });
    const data = await response.json();
    localStorage.setItem('access_token', data.access_token);
  }

  // Auth
  async login(email: string, password: string) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
  }

  async register(name: string, email: string, password: string) {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password })
    });
  }

  async getCurrentUser(): Promise<User> {
    return this.request('/auth/me');
  }

  // Workspaces
  async getWorkspaces(): Promise<Workspace[]> {
    return this.request('/workspaces');
  }

  async createWorkspace(name: string): Promise<Workspace> {
    return this.request('/workspaces', {
      method: 'POST',
      body: JSON.stringify({ name })
    });
  }

  async inviteMember(workspaceId: string, email: string, role: string) {
    return this.request(`/workspaces/${workspaceId}/invite`, {
      method: 'POST',
      body: JSON.stringify({ email, role })
    });
  }

  // Projects
  async getProjects(workspaceId: string): Promise<Project[]> {
    return this.request(`/workspaces/${workspaceId}/projects`);
  }

  async createProject(workspaceId: string, name: string, description?: string) {
    return this.request('/projects', {
      method: 'POST',
      body: JSON.stringify({ workspace_id: workspaceId, name, description })
    });
  }

  // Layers
  async getAvailableLayers(): Promise<Layer[]> {
    return this.request('/layers');
  }

  async assignLayerToProject(projectId: string, layerId: string) {
    return this.request(`/projects/${projectId}/layers`, {
      method: 'POST',
      body: JSON.stringify({ layer_id: layerId })
    });
  }
}

export const api = new ApiClient();
```

---

## ✅ Migration Checklist

### **1. Update Type Definitions**
- [ ] Change all `id: number` → `id: string` (UUID)
- [ ] Rename `full_name` → `name`
- [ ] Add new User fields (`avatar_url`, `is_verified`, `auth_provider`)
- [ ] Create Workspace, WorkspaceMember, Subscription interfaces
- [ ] Update Project interface (`organization_id` → `workspace_id`)
- [ ] Update Layer interface (add `region`, `subscription_level`)

### **2. Update Authentication**
- [ ] Store `refresh_token` from login/register
- [ ] Implement auto-refresh logic
- [ ] Add logout functionality
- [ ] Implement Google OAuth (optional)

### **3. Implement Workspace Features**
- [ ] Workspace selector UI
- [ ] Team members list
- [ ] Invite member modal
- [ ] Accept invitation page

### **4. Implement Subscription Features**
- [ ] Subscription plan cards
- [ ] Upgrade modal
- [ ] Usage indicators
- [ ] Subscription request form

### **5. Update Project/Layer Logic**
- [ ] Filter layers by subscription level
- [ ] Layer selection for projects
- [ ] Update project creation to use `workspace_id`

### **6. Testing**
- [ ] Test registration flow
- [ ] Test workspace creation
- [ ] Test team invitation
- [ ] Test subscription upgrade request
- [ ] Test layer access based on subscription

---

## 🚀 Quick Start

```bash
# 1. Update types
cp types/api.ts.example types/api.ts

# 2. Update API client
cp lib/api.ts.example lib/api.ts

# 3. Install Google OAuth (if needed)
npm install @react-oauth/google

# 4. Update environment variables
# .env.local
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-client-id

# 5. Test backend connection
npm run dev
```

---

## 📞 Support

Jika ada pertanyaan atau butuh klarifikasi, hubungi backend team atau lihat dokumentasi lengkap di:
- [workspace_refactoring.md](workspace_refactoring.md)
- [google_oauth_setup.md](google_oauth_setup.md)
