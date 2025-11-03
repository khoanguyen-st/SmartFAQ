# SmartFAQ Web Admin

Admin dashboard cho SmartFAQ system.

## Tech Stack

- **React 19** - UI Framework
- **TypeScript** - Type Safety
- **Vite** - Build Tool & Dev Server
- **TailwindCSS** - Utility-first CSS Framework
- **React Router** - Client-side Routing
- **Recharts** - Charts & Data Visualization

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
# Chạy dev server tại http://localhost:5174
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
├── components/       # React components
│   ├── dashboard/   # Dashboard-specific components
│   ├── logs/        # Logs page components
│   └── settings/    # Settings page components
├── hooks/           # Custom React hooks
├── lib/             # Utilities & helpers
│   ├── api.ts      # API client
│   └── utils.ts    # Common utilities (cn function)
├── pages/           # Page components
├── App.tsx          # Root component
├── main.tsx         # Entry point
└── styles.css       # Global styles với Tailwind
```

## Tailwind CSS Usage

Dùng utility classes của Tailwind:

```tsx
// Ví dụ button component
<button className="bg-primary-600 hover:bg-primary-700 rounded-full px-6 py-2 text-white">
  Click me
</button>;

// Sử dụng cn() helper để merge classes
import { cn } from "@/lib/utils";

<div className={cn("base-class", isActive && "active-class", className)}>
  Content
</div>;
```

## Path Aliases

Project sử dụng path alias `@/` để import:

```tsx
// Thay vì
import { api } from "../../../lib/api";

// Dùng
import { api } from "@/lib/api";
```

## Environment Variables

Tạo file `.env.local` nếu cần:

```env
VITE_API_URL=http://localhost:8000
```

## License

Private
