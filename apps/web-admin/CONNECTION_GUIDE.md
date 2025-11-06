# Hướng dẫn Kết nối Backend và Frontend

## Tổng quan

Frontend (web-admin) đã được cấu hình để kết nối với Backend API (FastAPI). 

## Các bước thiết lập

### 1. Tạo file `.env` trong thư mục `apps/web-admin/`

Tạo file `.env` với nội dung sau:

```env
# API Configuration
VITE_API_BASE_URL=http://localhost:8000
```

**Lưu ý:** 
- File `.env` đã có trong `.gitignore` nên không được commit
- Nếu bạn muốn thay đổi port của backend, cập nhật URL cho phù hợp

### 2. Đảm bảo Backend API đang chạy

Backend API chạy ở port `8000` (mặc định). Đảm bảo:
- Backend đã được khởi động
- CORS đã được cấu hình cho phép `http://localhost:5174` (frontend port)

Backend đã có CORS middleware cấu hình sẵn trong `apps/api/app/core/config.py`:
```python
cors_allow_origins: list[str] = Field(
    default=["http://localhost:5174", "http://localhost:5173"],
    alias="CORS_ALLOW_ORIGINS",
)
```

### 3. Khởi động Frontend

```bash
cd apps/web-admin
yarn dev
```

Frontend sẽ chạy ở `http://localhost:5174`

### 4. Kiểm tra kết nối

Mở browser console và kiểm tra:
- Không có lỗi CORS
- API calls thành công (status 200)
- Dữ liệu được load từ backend

## API Endpoints đã được tích hợp

### Documents API (`/api/docs/`)
- **GET** `/api/docs/` - Lấy danh sách documents
- **POST** `/api/docs/` - Upload files (FormData với key `files`)
- **GET** `/api/docs/{doc_id}` - Lấy chi tiết document
- **PUT** `/api/docs/{doc_id}` - Cập nhật document
- **DELETE** `/api/docs/{doc_id}` - Xóa document

### Chat API (`/api/chat/`)
- **POST** `/api/chat/session` - Tạo session mới
- **POST** `/api/chat/query` - Gửi câu hỏi
- **GET** `/api/chat/session/{session_id}` - Lấy lịch sử chat

### Admin API (`/api/admin/`)
- **GET** `/api/admin/metrics` - Lấy metrics

## Cấu trúc API Response

### Document Response
```typescript
{
  id: number;
  title: string;
  category: string | null;
  tags: string | null;
  language: string;
  status: string;
  current_version_id: number | null;
  created_at: string | null;
  versions?: Array<{
    id: number;
    version_no: number;
    file_path: string;
    file_size: number | null;
    format: string;
    created_at: string | null;
  }>;
}
```

## Troubleshooting

### Lỗi CORS
- Kiểm tra backend đã cho phép origin `http://localhost:5174`
- Kiểm tra biến môi trường `CORS_ALLOW_ORIGINS` trong backend

### Lỗi "Failed to fetch"
- Kiểm tra backend đang chạy ở port 8000
- Kiểm tra file `.env` có đúng `VITE_API_BASE_URL`
- Kiểm tra network tab trong browser DevTools

### Lỗi 404
- Kiểm tra endpoint URL có đúng format: `${API_BASE_URL}/api/docs/`
- Kiểm tra backend routes đã được đăng ký đúng

## Files đã được cập nhật

1. **`apps/web-admin/src/lib/knowledge-api.ts`**
   - Thay mock data bằng API calls thực
   - Thêm `uploadKnowledgeFiles()` để upload nhiều files
   - Map response từ backend sang frontend format

2. **`apps/web-admin/src/components/dashboard/UploadModal.tsx`**
   - Tích hợp `uploadKnowledgeFiles()` khi save
   - Lưu trữ File objects để upload
   - Xử lý lỗi và hiển thị thông báo

3. **`apps/web-admin/src/lib/api.ts`**
   - Đã có `API_BASE_URL` từ environment variable
   - `fetchMetrics()` đã được tích hợp

## Development Tips

- Luôn kiểm tra Network tab trong DevTools khi debug API calls
- Sử dụng backend Swagger UI tại `http://localhost:8000/docs/openapi` để test endpoints
- Console logs trong `knowledge-api.ts` sẽ giúp debug

