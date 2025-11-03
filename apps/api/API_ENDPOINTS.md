# Greenwich SmartFAQ – API Endpoints

**SIGN DESCRIPTION**

| ✅ | Implemented |
| ❌ | Not Implemented |

---

## Group APIs: `/api`

---

### **auth**
Authentication API for users (Admin, Student Affairs Staff)

| No | Implemented | Method | Path | Permission | Description | Related FR |
|----|--------------|--------|------|-------------|--------------|-------------|
| 1 | ✅ | POST | `/auth/login` | Admin, Staff | Authenticate and issue JWT | FR-001 |
| 2 | ✅ | GET | `/auth/me` | Admin, Staff | Get current user info | FR-002 / FR-004 |
| 3 | ❌ | POST | `/auth/logout` | Admin, Staff | Log out from current session | FR-004 |
| 4 | ❌ | POST | `/auth/refresh` | Admin, Staff | Refresh expired JWT token | FR-004 |
| 5 | ❌ | POST | `/auth/forgot-password` | Admin, Staff | Send password reset link | FR-003 |
| 6 | ❌ | POST | `/auth/reset-password` | Admin, Staff | Reset password using token | FR-003 |
| 7 | ❌ | POST | `/auth/change-password` | Admin, Staff | Change password while logged in | FR-003 |
| 8 | ❌ | GET | `/auth/users` | Super Admin | Retrieve all user accounts | FR-039 |
| 9 | ❌ | POST | `/auth/users` | Super Admin | Create new user account | FR-039 |
| 10 | ❌ | PUT | `/auth/users/{id}` | Super Admin | Update user information | FR-039 |
| 11 | ❌ | DELETE | `/auth/users/{id}` | Super Admin | Deactivate or delete user | FR-039 |

---

### **docs**
Document Management API for Admin and Staff

| No | Implemented | Method | Path | Permission | Description | Related FR |
|----|--------------|--------|------|-------------|--------------|-------------|
| 1 | ✅ | POST | `/docs/upload` | Admin, Staff | Upload documents (TXT, DOCX, PDF, image) | FR-006 – FR-008 |
| 2 | ✅ | GET | `/docs` | Admin, Staff | List and filter documents | FR-009 |
| 3 | ❌ | GET | `/docs/{id}` | Admin, Staff | Retrieve document details and metadata | FR-008 |
| 4 | ❌ | PUT | `/docs/{id}` | Admin, Staff | Update document or upload new version | FR-010 |
| 5 | ❌ | DELETE | `/docs/{id}` | Admin, Staff | Delete or archive document | FR-011 |
| 6 | ❌ | GET | `/docs/{id}/versions` | Admin, Staff | Retrieve document version history | FR-010 |
| 7 | ❌ | PUT | `/docs/{id}/status` | Admin, Staff | Change document status (Active/Draft/Archived) | FR-012 |

---

### **chat**
Chatbot Engine (RAG Pipeline) API for Students

| No | Implemented | Method | Path | Permission | Description | Related FR |
|----|--------------|--------|------|-------------|--------------|-------------|
| 1 | ✅ | POST | `/chat/query` | Public | Ask question and get AI-generated answer | FR-013 – FR-019 |
| 2 | ✅ | GET | `/chat/history` | Public | Retrieve chat history for current session | FR-017 / FR-028 |
| 3 | ✅ | POST | `/chat/feedback` | Public | Submit thumbs up/down feedback | FR-029 / FR-037 |
| 4 | ✅ | POST | `/chat/new-session` | Public | Start a new chat conversation | FR-017 |
| 5 | ✅ | GET | `/chat/sources/{chatId}` | Admin, Staff | Retrieve document sources used in a chat | FR-019 |
| 6 | ✅ | GET | `/chat/confidence/{chatId}` | Admin, Staff | Get confidence score for an answer | FR-016 |

---

### **fallback**
Smart Fallback Mechanism API

| No | Implemented | Method | Path | Permission | Description | Related FR |
|----|--------------|--------|------|-------------|--------------|-------------|
| 1 | ✅ | POST | `/fallback/trigger` | Admin, Staff | Trigger fallback event | FR-020 – FR-024 |
| 2 | ❌ | GET | `/fallback/logs` | Admin, Staff | Retrieve fallback logs | FR-023 |
| 3 | ❌ | PUT | `/fallback/{id}/resolve` | Admin, Staff | Mark fallback question as resolved | FR-023 |
| 4 | ❌ | GET | `/fallback/config` | Admin, Staff | Get fallback configuration | FR-021 |
| 5 | ❌ | PUT | `/fallback/config` | Admin, Staff | Update fallback configuration (channels, thresholds) | FR-021 |

---

### **admin**
Admin Dashboard & Monitoring API

| No | Implemented | Method | Path | Permission | Description | Related FR |
|----|--------------|--------|------|-------------|--------------|-------------|
| 1 | ✅ | GET | `/admin/metrics` | Admin, Staff | Retrieve dashboard KPIs and trends | FR-033 |
| 2 | ✅ | GET | `/admin/logs` | Admin, Staff | Retrieve chatbot query logs | FR-034 |
| 3 | ❌ | GET | `/admin/faq-report` | Admin, Staff | Get frequently asked questions report | FR-035 |
| 4 | ❌ | GET | `/admin/unanswered` | Admin, Staff | Retrieve unanswered question report | FR-036 |
| 5 | ❌ | GET | `/admin/feedback` | Admin, Staff | Analyze user feedback | FR-037 |
| 6 | ❌ | GET | `/admin/settings` | Admin, Staff | View system configurations | FR-038 |
| 7 | ❌ | PUT | `/admin/settings` | Admin, Staff | Update system configurations | FR-038 |

---

### **languages**
Multi-Language API

| No | Implemented | Method | Path | Permission | Description | Related FR |
|----|--------------|--------|------|-------------|--------------|-------------|
| 1 | ❌ | GET | `/languages` | Admin, Staff | Get supported languages | FR-049 |
| 2 | ❌ | PUT | `/languages/config` | Admin, Staff | Update default and active languages | FR-050 |
| 3 | ❌ | POST | `/translate` | Admin, Staff | Translate text or document between languages | FR-051 |

---

### **integrations**
External Channel Integration API

| No | Implemented | Method | Path | Permission | Description | Related FR |
|----|--------------|--------|------|-------------|--------------|-------------|
| 1 | ❌ | POST | `/integrations/facebook/webhook` | Public | Receive messages from Facebook Messenger | FR-054 |
| 2 | ❌ | POST | `/integrations/zalo/webhook` | Public | Receive messages from Zalo Official Account | FR-055 |
| 3 | ❌ | GET | `/integrations/config` | Admin, Staff | Get external integration configuration | FR-054 / FR-055 |
| 4 | ❌ | PUT | `/integrations/config` | Admin, Staff | Update tokens or connection settings | FR-054 / FR-055 |

---

### **system**
System Utilities API

| No | Implemented | Method | Path | Permission | Description | Related FR |
|----|--------------|--------|------|-------------|--------------|-------------|
| 1 | ❌ | GET | `/health` | Public | System health check | NFR-001 |
| 2 | ❌ | GET | `/logs` | Admin, Staff | Retrieve application logs | NFR-018 |
| 3 | ❌ | GET | `/backup/status` | Admin, Staff | Check latest backup status | NFR-007 |
| 4 | ❌ | POST | `/backup/restore` | Super Admin | Restore system from previous backup | OR-007 |

---

_Last Updated: November 2025_

