# SmartFAQ Web Student

Student interface cho SmartFAQ system - Chat với AI assistant.

## Tech Stack

- **React 19** - UI Framework
- **TypeScript** - Type Safety
- **Vite** - Build Tool & Dev Server
- **TailwindCSS** - Utility-first CSS Framework
- **React Router** - Client-side Routing
- **i18next** - Internationalization
- **Zod** - Schema Validation

## Getting Started

### Prerequisites

- Node.js >= 18
- **Yarn >= 1.22.0** (required - this project uses Yarn only)

⚠️ **Do NOT use npm or pnpm.** This project enforces Yarn usage.

### Installation

```bash
# Cài đặt dependencies (SỬ DỤNG YARN)
yarn install

# Hoặc shorthand
yarn
```

### Development

```bash
# Chạy dev server tại http://localhost:5173
yarn dev
```

### Build

```bash
# Build cho production
yarn build

# Preview production build
yarn preview
```

### Code Quality

```bash
# Lint code
yarn lint

# Format code với Prettier
yarn format
```

## Project Structure

```
src/
├── components/      # React components
├── hooks/          # Custom React hooks
│   └── useChat.ts # Chat logic hook
├── lib/            # Utilities & helpers
│   ├── i18n.tsx   # i18n configuration
│   └── utils.ts   # Common utilities (cn function)
├── pages/          # Page components
│   └── Chat.tsx   # Main chat page
├── App.tsx         # Root component
├── main.tsx        # Entry point
└── styles.css      # Global styles với Tailwind
```

## Tailwind CSS Usage

Dùng utility classes của Tailwind:

```tsx
// Ví dụ message bubble
<div className="bg-primary-600 max-w-[75%] rounded-2xl px-4 py-3 text-white shadow-lg">
  Message content
</div>;

// Sử dụng cn() helper để merge classes
import { cn } from "@/lib/utils";

<div className={cn("flex flex-col gap-1", isUser && "items-end", className)}>
  Content
</div>;
```

## Path Aliases

Project sử dụng path alias `@/` để import:

```tsx
// Thay vì
import { useChat } from "../hooks/useChat";

// Dùng
import { useChat } from "@/hooks/useChat";
```

## Internationalization (i18n)

App hỗ trợ đa ngôn ngữ (vi, en):

```tsx
import { useTranslation } from "react-i18next";

function Component() {
  const { t, i18n } = useTranslation();

  return (
    <div>
      <p>{t("greeting")}</p>
      <button onClick={() => i18n.changeLanguage("vi")}>Tiếng Việt</button>
    </div>
  );
}
```

## Environment Variables

Tạo file `.env.local` nếu cần:

```env
VITE_API_URL=http://localhost:8000
```

## License

Private
