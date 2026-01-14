# Frontend Migration Guide - Adaptasi Backend Cleanup

## 📋 Ringkasan Perubahan Backend

Backend telah dibersihkan dan **HANYA menyisakan fitur Authentication & Authorization**. Semua fitur bisnis (Workspace, Project, Layer, Subscription, dll) telah dihapus dari backend.

### ✅ Endpoint yang Masih Berfungsi (Real API)

#### Authentication Endpoints
```
POST   /api/v1/auth/register
POST   /api/v1/auth/login
POST   /api/v1/auth/oauth/google
POST   /api/v1/auth/refresh
POST   /api/v1/auth/logout
GET    /api/v1/auth/me
```

#### Admin Endpoints (RBAC)
```
GET    /api/v1/admin/users
GET    /api/v1/admin/users/{user_id}
GET    /api/v1/admin/statistics
PATCH  /api/v1/admin/users/{user_id}/role
PATCH  /api/v1/admin/users/{user_id}/status
DELETE /api/v1/admin/users/{user_id}
```

### ❌ Endpoint yang TIDAK Ada Lagi

Semua endpoint berikut **sudah dihapus** dari backend:
- `/api/v1/workspaces/*` - Workspace management
- `/api/v1/projects/*` - Project management
- `/api/v1/layers/*` - Layer management
- `/api/v1/features/*` - GIS features
- `/api/v1/subscriptions/*` - Subscription management
- `/api/v1/properties/*` - Property data
- `/api/v1/ai/*` - AI analysis

---

## 🎯 Strategi Frontend: Mock Data + Real Auth

Frontend akan berjalan dengan **2 mode**:

1. **Real API** - Untuk Authentication & Authorization
2. **Mock Data** - Untuk semua fitur bisnis (Workspace, Project, Layer, dll)

### Keuntungan Pendekatan Ini:

✅ Frontend tetap bisa dikembangkan dan ditest UI-nya
✅ Tidak perlu menghapus komponen/pages yang sudah dibuat
✅ Authentication bekerja dengan real backend
✅ Mudah diganti ke real API nanti ketika backend siap

---

## 🛠️ Langkah Implementasi Frontend

### Step 1: Buat Mock Data Service

Buat folder `src/lib/mocks/` atau `src/services/mocks/` dengan struktur:

```
src/lib/mocks/
├── workspaces.ts    # Mock workspace data
├── projects.ts      # Mock project data
├── layers.ts        # Mock layer data
├── subscriptions.ts # Mock subscription data
└── index.ts         # Export all mocks
```

#### Contoh: `src/lib/mocks/workspaces.ts`

```typescript
export const mockWorkspaces = [
  {
    id: "mock-workspace-1",
    name: "My Development Workspace",
    role: "owner",
    subscription_name: "Professional",
    member_count: 3,
    project_count: 5,
    created_at: "2024-01-01T00:00:00Z"
  },
  {
    id: "mock-workspace-2",
    name: "Team Collaboration",
    role: "member",
    subscription_name: "Basic",
    member_count: 8,
    project_count: 12,
    created_at: "2024-02-15T00:00:00Z"
  }
];

export const mockWorkspaceDetail = {
  id: "mock-workspace-1",
  name: "My Development Workspace",
  description: "Main workspace for development projects",
  owner: {
    id: "user-1",
    name: "Current User",
    email: "user@example.com"
  },
  subscription: {
    name: "Professional",
    max_projects: 50,
    max_members: 20
  },
  members: [
    { id: "1", name: "John Doe", email: "john@example.com", role: "admin" },
    { id: "2", name: "Jane Smith", email: "jane@example.com", role: "member" }
  ],
  projects: [
    { id: "proj-1", name: "GIS Project Alpha", layer_count: 5 },
    { id: "proj-2", name: "Urban Planning", layer_count: 8 }
  ]
};

// Functions to simulate API
export const getWorkspaces = async () => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 500));
  return { data: mockWorkspaces };
};

export const getWorkspaceById = async (id: string) => {
  await new Promise(resolve => setTimeout(resolve, 500));
  return { data: mockWorkspaceDetail };
};

export const createWorkspace = async (data: any) => {
  await new Promise(resolve => setTimeout(resolve, 500));
  return {
    data: {
      id: `mock-workspace-${Date.now()}`,
      ...data,
      created_at: new Date().toISOString()
    }
  };
};
```

#### Contoh: `src/lib/mocks/projects.ts`

```typescript
export const mockProjects = [
  {
    id: "mock-project-1",
    name: "Urban Planning Project",
    workspace_id: "mock-workspace-1",
    description: "City infrastructure mapping",
    layer_count: 12,
    created_at: "2024-03-01T00:00:00Z"
  },
  {
    id: "mock-project-2",
    name: "Environmental Analysis",
    workspace_id: "mock-workspace-1",
    description: "Forest coverage study",
    layer_count: 8,
    created_at: "2024-03-15T00:00:00Z"
  }
];

export const getProjects = async (workspaceId: string) => {
  await new Promise(resolve => setTimeout(resolve, 500));
  return { data: mockProjects.filter(p => p.workspace_id === workspaceId) };
};
```

#### Contoh: `src/lib/mocks/layers.ts`

```typescript
export const mockLayers = [
  {
    id: "layer-1",
    name: "Building Footprints",
    type: "polygon",
    feature_count: 1543,
    visible: true,
    project_id: "mock-project-1"
  },
  {
    id: "layer-2",
    name: "Road Network",
    type: "line",
    feature_count: 892,
    visible: true,
    project_id: "mock-project-1"
  },
  {
    id: "layer-3",
    name: "Points of Interest",
    type: "point",
    feature_count: 234,
    visible: false,
    project_id: "mock-project-1"
  }
];

export const getLayers = async (projectId: string) => {
  await new Promise(resolve => setTimeout(resolve, 300));
  return { data: mockLayers.filter(l => l.project_id === projectId) };
};
```

---

### Step 2: Buat Service Adapter dengan Feature Flag

Buat file `src/lib/api/config.ts`:

```typescript
// Feature flags untuk toggle antara mock dan real API
export const API_CONFIG = {
  USE_MOCK_WORKSPACE: true,   // Set true untuk mock
  USE_MOCK_PROJECT: true,
  USE_MOCK_LAYER: true,
  USE_MOCK_SUBSCRIPTION: true,
  USE_REAL_AUTH: true,         // Selalu true untuk auth
};
```

Buat wrapper service di `src/lib/api/workspace-service.ts`:

```typescript
import { API_CONFIG } from './config';
import * as mockWorkspace from '@/lib/mocks/workspaces';
import { apiClient } from './client'; // Real API client

export const workspaceService = {
  getAll: async () => {
    if (API_CONFIG.USE_MOCK_WORKSPACE) {
      return mockWorkspace.getWorkspaces();
    }
    // Real API (akan digunakan nanti)
    return apiClient.get('/api/v1/workspaces');
  },

  getById: async (id: string) => {
    if (API_CONFIG.USE_MOCK_WORKSPACE) {
      return mockWorkspace.getWorkspaceById(id);
    }
    return apiClient.get(`/api/v1/workspaces/${id}`);
  },

  create: async (data: any) => {
    if (API_CONFIG.USE_MOCK_WORKSPACE) {
      return mockWorkspace.createWorkspace(data);
    }
    return apiClient.post('/api/v1/workspaces', data);
  }
};
```

---

### Step 3: Update Komponen untuk Menggunakan Service

Di komponen React/Next.js, gunakan service adapter:

```typescript
// app/dashboard/workspaces/page.tsx
import { workspaceService } from '@/lib/api/workspace-service';

export default function WorkspacesPage() {
  const [workspaces, setWorkspaces] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadWorkspaces();
  }, []);

  async function loadWorkspaces() {
    try {
      const { data } = await workspaceService.getAll();
      setWorkspaces(data);
    } catch (error) {
      console.error('Error loading workspaces:', error);
    } finally {
      setLoading(false);
    }
  }

  // Rest of component...
}
```

---

### Step 4: Pastikan Auth Menggunakan Real API

File `src/lib/api/auth-service.ts` harus **SELALU** menggunakan real API:

```typescript
import { apiClient } from './client';

export const authService = {
  register: async (email: string, password: string, name: string) => {
    return apiClient.post('/api/v1/auth/register', { email, password, name });
  },

  login: async (email: string, password: string) => {
    return apiClient.post('/api/v1/auth/login', { email, password });
  },

  loginWithGoogle: async (idToken: string) => {
    return apiClient.post('/api/v1/auth/oauth/google', { id_token: idToken });
  },

  getCurrentUser: async () => {
    return apiClient.get('/api/v1/auth/me');
  },

  refreshToken: async (refreshToken: string) => {
    return apiClient.post('/api/v1/auth/refresh', { refresh_token: refreshToken });
  },

  logout: async (refreshToken: string) => {
    return apiClient.post('/api/v1/auth/logout', { refresh_token: refreshToken });
  }
};
```

---

### Step 5: Update Admin Dashboard (Real API)

Admin dashboard juga menggunakan **real API**:

```typescript
// app/admin/users/page.tsx
import { adminService } from '@/lib/api/admin-service';

export default function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [statistics, setStatistics] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [usersRes, statsRes] = await Promise.all([
        adminService.getUsers(),
        adminService.getStatistics()
      ]);
      
      setUsers(usersRes.data);
      setStatistics(statsRes.data);
    } catch (error) {
      console.error('Error loading admin data:', error);
    }
  }

  // ...
}
```

File `src/lib/api/admin-service.ts`:

```typescript
export const adminService = {
  getUsers: () => apiClient.get('/api/v1/admin/users'),
  
  getUserById: (id: string) => apiClient.get(`/api/v1/admin/users/${id}`),
  
  getStatistics: () => apiClient.get('/api/v1/admin/statistics'),
  
  updateUserRole: (userId: string, role: string) => 
    apiClient.patch(`/api/v1/admin/users/${userId}/role`, { role }),
  
  updateUserStatus: (userId: string, isActive: boolean) => 
    apiClient.patch(`/api/v1/admin/users/${userId}/status`, { is_active: isActive }),
  
  deleteUser: (userId: string) => 
    apiClient.delete(`/api/v1/admin/users/${userId}`)
};
```

---

### Step 6: Update `.env.local` di Frontend

Pastikan environment variables sudah sesuai:

```env
# Backend API URL
NEXT_PUBLIC_API_URL=http://localhost:8000

# Google OAuth
NEXT_PUBLIC_GOOGLE_CLIENT_ID=940830341579-0fcheup5gm7naos0cubblmueftb6viqp.apps.googleusercontent.com

# Feature Flags (optional, bisa juga di config.ts)
NEXT_PUBLIC_USE_MOCK_DATA=true
```

---

## 📊 Struktur Akhir Frontend

```
frontend/
├── src/
│   ├── app/
│   │   ├── login/                 # ✅ Real Auth
│   │   ├── register/              # ✅ Real Auth
│   │   ├── dashboard/
│   │   │   ├── workspaces/        # 🎭 Mock Data
│   │   │   ├── projects/          # 🎭 Mock Data
│   │   │   └── layers/            # 🎭 Mock Data
│   │   └── admin/
│   │       └── users/             # ✅ Real API
│   │
│   ├── lib/
│   │   ├── api/
│   │   │   ├── client.ts          # Axios/Fetch config
│   │   │   ├── config.ts          # Feature flags
│   │   │   ├── auth-service.ts    # ✅ Real Auth API
│   │   │   ├── admin-service.ts   # ✅ Real Admin API
│   │   │   ├── workspace-service.ts # 🎭 Mock wrapper
│   │   │   ├── project-service.ts   # 🎭 Mock wrapper
│   │   │   └── layer-service.ts     # 🎭 Mock wrapper
│   │   │
│   │   └── mocks/
│   │       ├── workspaces.ts      # Mock data & functions
│   │       ├── projects.ts
│   │       ├── layers.ts
│   │       └── subscriptions.ts
│   │
│   └── components/
│       ├── auth/                  # Auth components
│       ├── admin/                 # Admin components
│       └── dashboard/             # Dashboard components
│
└── .env.local                     # Environment config
```

---

## 🚀 Testing Checklist

### ✅ Yang Harus Bekerja dengan Real Backend:

- [ ] User Registration (`/api/v1/auth/register`)
- [ ] User Login with Email/Password (`/api/v1/auth/login`)
- [ ] Google OAuth Login (`/api/v1/auth/oauth/google`)
- [ ] Get Current User (`/api/v1/auth/me`)
- [ ] Token Refresh (`/api/v1/auth/refresh`)
- [ ] Logout (`/api/v1/auth/logout`)
- [ ] Admin: List Users (`/api/v1/admin/users`)
- [ ] Admin: User Statistics (`/api/v1/admin/statistics`)
- [ ] Admin: Update User Role
- [ ] Admin: Update User Status
- [ ] Admin: Delete User

### 🎭 Yang Menggunakan Mock Data:

- [ ] List Workspaces
- [ ] Create Workspace
- [ ] Workspace Detail
- [ ] List Projects
- [ ] Create Project
- [ ] List Layers
- [ ] Create Layer
- [ ] Subscription Info

---

## 💡 Tips untuk Development

1. **State Management**: Gunakan React Context atau Zustand untuk menyimpan mock data
2. **LocalStorage**: Mock data bisa disimpan di localStorage untuk persistence
3. **Toast Notifications**: Tampilkan pesan sukses saat CRUD mock data
4. **Loading States**: Tetap simulasikan loading untuk UX yang realistis
5. **Error Handling**: Mock error responses juga untuk testing

---

## 🔄 Migrasi ke Real API Nanti

Ketika backend sudah siap dengan fitur bisnis:

1. Update `API_CONFIG` di `config.ts`:
   ```typescript
   export const API_CONFIG = {
     USE_MOCK_WORKSPACE: false,  // ← Ubah ke false
     USE_MOCK_PROJECT: false,
     USE_MOCK_LAYER: false,
     USE_REAL_AUTH: true,
   };
   ```

2. Backend endpoints sudah siap
3. Frontend langsung connect ke real API
4. Mock code bisa tetap ada untuk testing

---

## 📝 Summary

- **Authentication & Admin**: Gunakan **Real Backend API** ✅
- **Workspace, Project, Layer, dll**: Gunakan **Mock Data** 🎭
- Frontend tetap bisa dikembangkan tanpa menunggu backend selesai
- Mudah switch ke real API nanti dengan feature flag
- User experience tetap smooth dengan loading & error states

**Semua perubahan dilakukan di frontend, backend tidak perlu diubah!**

---

## 4. Updates for Security Features (New)

### 4.1. HttpOnly Cookies
The backend now uses HttpOnly cookies for storing `access_token` and `refresh_token`.
- **Remove** any logic storing tokens in `localStorage`.
- Ensure your `axios` or `fetch` requests include `credentials: 'include'` (or `withCredentials: true` for axios).
- The `User` context should load the user via `/auth/me` which now reads the cookie automatically.

### 4.2. Rate Limiting
- Handle `429 Too Many Requests` responses globally.
- Show a user-friendly message: "Too many attempts. Please wait {retry_after} seconds."

### 4.3. Audit Logs (Admin)
- Admin dashboard should fetch logs from `GET /admin/audit-logs`.
- Display columns: Actor, Action, Resource, IP, Timestamp.

### 4.4. Session Management (User Settings)
- Create a "Security" or "Sessions" tab in User Settings.
- list sessions: `GET /auth/sessions` (returns list of devices).
- Revoke session: `DELETE /auth/sessions/{id}`.
- Revoke all: `DELETE /auth/sessions`.
- Display: Device Name (e.g., "Chrome on Windows"), IP, Last Active date.
