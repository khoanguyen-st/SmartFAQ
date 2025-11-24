# 🚀 Cloudflare Pages Deployment Guide

Hướng dẫn deploy 2 web apps (web-admin và web-student) lên Cloudflare Pages.

## 📋 Yêu Cầu

- ✅ Node.js v22+
- ✅ Yarn v1.22+
- ✅ Tài khoản Cloudflare (miễn phí)
- ✅ Wrangler CLI (sẽ tự động cài đặt)

## 🎯 Phương Pháp Deploy

Có **3 cách** để deploy lên Cloudflare Pages:

### Phương Pháp 1: Deploy Tự Động Qua GitHub (Khuyến Nghị) 🌟

Đây là cách **dễ nhất và tự động** nhất - mỗi khi push code lên GitHub, Cloudflare tự động build và deploy.

#### Bước 1: Kết Nối GitHub với Cloudflare

1. Truy cập [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Vào **Workers & Pages** → **Create application** → **Pages**
3. Chọn **Connect to Git** → Authorize GitHub
4. Chọn repository: `khoanguyen-st/SmartFAQ`

#### Bước 2: Cấu Hình Build Settings cho Web Admin

**Project name:** `smartfaq-admin`

**Build configuration:**
- **Framework preset:** `Vite`
- **Build command:** `cd apps/web-admin && yarn install --frozen-lockfile && yarn build`
- **Build output directory:** `apps/web-admin/dist`
- **Root directory:** `/` (để trống)

**Environment variables:**
```bash
NODE_VERSION=22.16.0
YARN_VERSION=1.22.22
NPM_FLAGS=--frozen-lockfile
VITE_API_URL=https://api.smartfaq.dev.devplus.edu.vn
```

> ⚠️ **Quan trọng:** Phải thêm `YARN_VERSION=1.22.22` để tránh Cloudflare auto-upgrade lên Yarn v4!

**Branch configuration:**
- **Production branch:** `main` (hoặc `master`)
- **Preview branches:** `develop`, `staging`

#### Bước 3: Cấu Hình Build Settings cho Web Student

**Project name:** `smartfaq-student`

**Build configuration:**
- **Framework preset:** `Vite`
- **Build command:** `cd apps/web-student && yarn install --frozen-lockfile && yarn build`
- **Build output directory:** `apps/web-student/dist`
- **Root directory:** `/` (để trống)

**Environment variables:**
```bash
NODE_VERSION=22.16.0
YARN_VERSION=1.22.22
NPM_FLAGS=--frozen-lockfile
VITE_API_URL=https://api.smartfaq.dev.devplus.edu.vn
```

> ⚠️ **Quan trọng:** Phải thêm `YARN_VERSION=1.22.22` để tránh Cloudflare auto-upgrade lên Yarn v4!

#### Bước 4: Kích Hoạt Auto-Deploy

✅ Mỗi khi push code lên GitHub:
- Push lên `main` → Deploy production
- Push lên `develop` → Deploy preview

---

### Phương Pháp 2: Deploy Qua Script (Nhanh) ⚡

Sử dụng script có sẵn để deploy trực tiếp từ máy local.

#### Bước 1: Cài Đặt Wrangler CLI

```bash
npm install -g wrangler
```

#### Bước 2: Đăng Nhập Cloudflare

```bash
wrangler login
```

Browser sẽ mở và bạn authorize Wrangler.

#### Bước 3: Deploy

**Deploy cả 2 apps:**
```bash
./scripts/deploy-cloudflare.sh all
```

**Deploy riêng lẻ:**
```bash
./scripts/deploy-cloudflare.sh admin    # Chỉ deploy web-admin
./scripts/deploy-cloudflare.sh student  # Chỉ deploy web-student
```

Script sẽ tự động:
1. ✅ Check dependencies
2. ✅ Install packages
3. ✅ Build production
4. ✅ Deploy lên Cloudflare Pages

---

### Phương Pháp 3: Deploy Thủ Công (Chi Tiết) 🔧

Nếu muốn control từng bước.

#### Web Admin

```bash
# 1. Di chuyển vào thư mục
cd apps/web-admin

# 2. Tạo file environment (nếu chưa có)
cp .env.example .env.production
# Sửa VITE_API_URL trong .env.production

# 3. Install dependencies
yarn install --frozen-lockfile

# 4. Build
yarn build

# 5. Deploy
wrangler pages deploy dist --project-name=smartfaq-admin

# Quay về root
cd ../..
```

#### Web Student

```bash
# 1. Di chuyển vào thư mục
cd apps/web-student

# 2. Tạo file environment (nếu chưa có)
cp .env.example .env.production
# Sửa VITE_API_URL trong .env.production

# 3. Install dependencies
yarn install --frozen-lockfile

# 4. Build
yarn build

# 5. Deploy
wrangler pages deploy dist --project-name=smartfaq-student

# Quay về root
cd ../..
```

---

## 🔧 Environment Variables

Tạo file `.env.production` trong mỗi app với nội dung:

### apps/web-admin/.env.production
```bash
VITE_API_URL=https://api.smartfaq.dev.devplus.edu.vn
VITE_APP_NAME=SmartFAQ Admin
```

### apps/web-student/.env.production
```bash
VITE_API_URL=https://api.smartfaq.dev.devplus.edu.vn
VITE_APP_NAME=SmartFAQ Chat
```

> ⚠️ **Lưu ý:** Vite chỉ expose các biến bắt đầu bằng `VITE_` ra client-side.

---

## 🌐 Custom Domains

Sau khi deploy, cấu hình custom domains:

### Web Admin
1. Vào project `smartfaq-admin` → **Custom domains**
2. Add domain: `admin.smartfaq.dev.devplus.edu.vn`
3. Cloudflare sẽ tự động cấu hình SSL

### Web Student
1. Vào project `smartfaq-student` → **Custom domains**
2. Add domain: `chat.smartfaq.dev.devplus.edu.vn`
3. Cloudflare sẽ tự động cấu hình SSL

---

## 🔍 Verify Deployment

Sau khi deploy xong, test các URL:

```bash
# Web Admin
curl https://smartfaq-admin.pages.dev
curl https://admin.smartfaq.dev.devplus.edu.vn

# Web Student
curl https://smartfaq-student.pages.dev
curl https://chat.smartfaq.dev.devplus.edu.vn
```

---

## 🐛 Troubleshooting

### "Lockfile would have been modified" Error

**Nguyên nhân:** Cloudflare phát hiện Yarn v4 và auto-migrate, nhưng bị cấm sửa lockfile trong CI.

**Giải pháp:**
1. ✅ Thêm `"packageManager": "yarn@1.22.22"` vào root `package.json` (đã làm)
2. ✅ Thêm `YARN_VERSION=1.22.22` vào Cloudflare environment variables
3. ✅ Dùng `--frozen-lockfile` trong build command

### Build Failed: "Cannot find module 'vite'"

**Nguyên nhân:** Dependencies chưa được install trong build environment.

**Giải pháp:**
- Nếu dùng **GitHub Auto-Deploy:** Đảm bảo build command có `yarn install --frozen-lockfile`
- Nếu dùng **Wrangler:** Chạy `yarn install --frozen-lockfile` trước khi build

### CORS Errors

**Nguyên nhân:** API không cho phép request từ domain Cloudflare Pages.

**Giải pháp:** Update CORS settings trong API:

```python
# apps/api/app/main.py
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://admin.smartfaq.dev.devplus.edu.vn",
        "https://chat.smartfaq.dev.devplus.edu.vn",
        "https://smartfaq-admin.pages.dev",
        "https://smartfaq-student.pages.dev",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### Environment Variables Not Working

**Kiểm tra:**
1. ✅ Biến có prefix `VITE_` không?
2. ✅ Đã rebuild sau khi thêm biến?
3. ✅ Trong Cloudflare Dashboard: Settings → Environment variables

**Test:**
```typescript
// In browser console
console.log(import.meta.env.VITE_API_URL)
```

### Build Timeout

**Nguyên nhân:** Build mất quá lâu (timeout 20 phút trên plan free).

**Giải pháp:**
1. Optimize dependencies (đã làm - remove packages/*)
2. Use build cache (Cloudflare tự động)
3. Nếu vẫn lỗi: Deploy qua Wrangler CLI (không có timeout)

---

## 📊 Monitoring & Analytics

Cloudflare Pages cung cấp:
- ✅ **Build logs:** Xem chi tiết quá trình build
- ✅ **Analytics:** Page views, bandwidth, requests
- ✅ **Function metrics:** Nếu dùng Cloudflare Functions

Access tại: Dashboard → Pages → Your Project → Analytics

---

## 🔄 CI/CD Workflow (GitHub Actions - Optional)

Nếu muốn control CI/CD flow hơn, tạo `.github/workflows/deploy-cloudflare.yml`:

```yaml
name: Deploy to Cloudflare Pages

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  deploy-admin:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: 'yarn'
      
      - name: Install dependencies
        run: |
          cd apps/web-admin
          yarn install --frozen-lockfile
      
      - name: Build
        run: |
          cd apps/web-admin
          yarn build
        env:
          VITE_API_URL: https://api.smartfaq.dev.devplus.edu.vn
      
      - name: Deploy to Cloudflare Pages
        uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          command: pages deploy apps/web-admin/dist --project-name=smartfaq-admin

  deploy-student:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: 'yarn'
      
      - name: Install dependencies
        run: |
          cd apps/web-student
          yarn install --frozen-lockfile
      
      - name: Build
        run: |
          cd apps/web-student
          yarn build
        env:
          VITE_API_URL: https://api.smartfaq.dev.devplus.edu.vn
      
      - name: Deploy to Cloudflare Pages
        uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          command: pages deploy apps/web-student/dist --project-name=smartfaq-student
```

**Setup secrets trong GitHub:**
1. Vào repo → Settings → Secrets and variables → Actions
2. Add:
   - `CLOUDFLARE_API_TOKEN` (lấy từ Cloudflare Dashboard → API Tokens)
   - `CLOUDFLARE_ACCOUNT_ID` (lấy từ Cloudflare Dashboard → URL)

---

## 🎯 Khuyến Nghị

**Cho Production:**
1. ✅ Dùng **GitHub Auto-Deploy** (Phương pháp 1)
2. ✅ Setup custom domains ngay
3. ✅ Configure environment variables đúng
4. ✅ Enable preview deployments cho `develop` branch
5. ✅ Monitor analytics định kỳ

**Cho Development/Testing:**
1. ✅ Dùng **Deploy Script** (Phương pháp 2) - nhanh nhất
2. ✅ Test local trước: `yarn preview`

---

## 📚 Resources

- [Cloudflare Pages Docs](https://developers.cloudflare.com/pages/)
- [Wrangler CLI Docs](https://developers.cloudflare.com/workers/wrangler/)
- [Vite Build Docs](https://vitejs.dev/guide/build.html)
- [Cloudflare Pages Limits](https://developers.cloudflare.com/pages/platform/limits/)

---

## ✅ Quick Start (TL;DR)

```bash
# 1. Install Wrangler
npm install -g wrangler

# 2. Login
wrangler login

# 3. Deploy
./scripts/deploy-cloudflare.sh all

# Done! 🎉
```

Hoặc setup GitHub Auto-Deploy một lần và quên đi! 😎
