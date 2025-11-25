# Quick Deploy to Cloudflare Pages

## 🚀 Deploy Ngay (3 bước)

```bash
# 1. Install Wrangler (nếu chưa có)
npm install -g wrangler

# 2. Login Cloudflare
wrangler login

# 3. Deploy cả 2 apps
./scripts/deploy-cloudflare.sh all
```

## 📦 Deploy Riêng Lẻ

```bash
# Chỉ deploy Admin
./scripts/deploy-cloudflare.sh admin

# Chỉ deploy Student  
./scripts/deploy-cloudflare.sh student
```

## 🌐 URLs Sau Khi Deploy

**Cloudflare Pages URLs (auto):**
- Admin: `https://smartfaq-admin.pages.dev`
- Student: `https://smartfaq-student.pages.dev`

**Custom Domains (cần setup):**
- Admin: `https://admin.smartfaq.dev.devplus.edu.vn`
- Student: `https://chat.smartfaq.dev.devplus.edu.vn`

## 📖 Hướng Dẫn Chi Tiết

Xem [CLOUDFLARE_DEPLOYMENT.md](./CLOUDFLARE_DEPLOYMENT.md) để biết:
- Setup GitHub Auto-Deploy
- Cấu hình environment variables
- Custom domains
- Troubleshooting

## ✅ Pre-Deploy Checklist

- [ ] Đã build thành công local: `yarn build`
- [ ] Đã update `.env.production` với API URL đúng
- [ ] Đã login Cloudflare: `wrangler whoami`
- [ ] Đã test API endpoint hoạt động

## 🐛 Troubleshooting Nhanh

**Build failed?**
```bash
cd apps/web-admin && yarn install && yarn build
cd apps/web-student && yarn install && yarn build
```

**Wrangler not found?**
```bash
npm install -g wrangler
```

**Not logged in?**
```bash
wrangler login
```
