# Poll App - Next.js 15 with TypeScript

A modern polling application built with Next.js 15, TypeScript, Tailwind CSS, and Supabase.

## 🏗️ Project Structure

```
poll-app/
├── app/                          # Next.js 13+ App Router
│   ├── api/                      # API Routes
│   │   ├── auth/                 # Authentication endpoints
│   │   └── polls/                # Poll-related endpoints
│   ├── auth/                     # Authentication pages
│   │   ├── login/
│   │   └── register/
│   ├── globals.css               # Global styles
│   ├── layout.tsx                # Root layout
│   └── page.tsx                  # Home page
├── components/                   # Reusable UI components
│   ├── auth/                     # Authentication components
│   │   ├── LoginForm.tsx
│   │   └── RegisterForm.tsx
│   ├── layout/                   # Layout components
│   │   └── Navbar.tsx
│   ├── polls/                    # Poll-related components
│   └── ui/                       # Shadcn/ui components
│       ├── button.tsx
│       ├── form.tsx
│       ├── input.tsx
│       └── label.tsx
├── context/                      # React Context providers
│   └── AuthContext.tsx
├── hooks/                        # Custom React hooks
│   ├── useLocalStorage.ts
│   └── usePolls.ts
├── lib/                          # Utility libraries
│   ├── supabaseClient.ts
│   └── utils.ts
├── middleware/                   # Next.js middleware (empty folder)
├── public/                       # Static assets
│   ├── images/
│   └── icons/
├── types/                        # TypeScript type definitions
│   └── index.ts
├── utils/                        # Utility functions
│   ├── date.ts
│   └── validation.ts
├── middleware.ts                 # Route protection middleware
├── next.config.js               # Next.js configuration
├── package.json                 # Dependencies
├── tailwind.config.js           # Tailwind CSS configuration
└── tsconfig.json                # TypeScript configuration
```

## 📁 Folder Descriptions

### `/app` - Next.js App Router
- **`/api`**: Server-side API routes for handling backend logic
- **`/auth`**: Authentication pages (login, register)
- **`layout.tsx`**: Root layout component with providers
- **`page.tsx`**: Home page component

### `/components` - UI Components
- **`/auth`**: Authentication-related components
- **`/layout`**: Layout components (navbar, footer, etc.)
- **`/polls`**: Poll-specific components
- **`/ui`**: Reusable UI components from Shadcn/ui

### `/context` - React Context
- Global state management using React Context API

### `/hooks` - Custom Hooks
- Reusable React hooks for common functionality
- `useLocalStorage`: Local storage management
- `usePolls`: Poll data management

### `/lib` - Libraries
- Third-party library configurations and utilities
- Supabase client setup

### `/types` - TypeScript Types
- Centralized type definitions for the entire application

### `/utils` - Utility Functions
- Pure utility functions for common operations
- Date formatting, validation, etc.

### `/public` - Static Assets
- Images, icons, and other static files

## 🚀 Getting Started

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   Create a `.env.local` file with your Supabase credentials:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

3. **Run the development server:**
   ```bash
   npm run dev
   ```

4. **Open your browser:**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🛠️ Tech Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Shadcn/ui
- **Database**: Supabase
- **Authentication**: Supabase Auth
- **State Management**: React Context API

## 📝 Features

- ✅ User authentication (login/register)
- ✅ Responsive navigation bar
- ✅ Type-safe development with TypeScript
- ✅ Modern UI with Tailwind CSS
- ✅ Component library with Shadcn/ui
- ✅ Route protection middleware
- ✅ Custom hooks for data management
- ✅ Utility functions for common operations
- ✅ Organized project structure

## 🔒 Route Protection

The application uses Next.js middleware for route protection:
- **Protected routes**: `/dashboard`, `/create`, `/profile`
- **Public routes**: `/`, `/auth/login`, `/auth/register`
- **API protection**: Authentication required for most API endpoints

## 📦 Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript compiler check

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.