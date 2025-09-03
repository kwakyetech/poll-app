# Poll App

A modern polling application built with Next.js, TypeScript, and Supabase.

## 🚀 Quick Start

### Development Mode (No Supabase Setup Required)

The app includes a mock client for development purposes. You can test all functionality without setting up Supabase:

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start the development server:**
   ```bash
   npm run dev
   ```

3. **Test the routing:**
   - Visit `http://localhost:3000`
   - Click "Sign In" and use any email/password (mock authentication)
   - Navigate to Dashboard, Create Poll, and Browse Polls
   - All routes should work with sample data

### Production Mode (With Supabase)

For production use, you'll need to set up Supabase:

1. **Follow the setup guide in `SUPABASE_SETUP.md`**
2. **Create `.env.local` with your Supabase credentials**
3. **Run database migrations**
4. **Restart the development server**

## 🛠️ Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run db:setup` - Set up database (requires Supabase CLI)
- `npm run db:help` - Show database setup help

## 📁 Project Structure

```
poll-app/
├── app/                    # Next.js 13+ app directory
│   ├── api/               # API routes
│   ├── auth/              # Authentication pages
│   ├── dashboard/         # User dashboard
│   ├── polls/             # Poll management
│   └── layout.tsx         # Root layout
├── components/            # Reusable components
├── context/               # React context providers
├── lib/                   # Utility libraries
├── types/                 # TypeScript type definitions
└── supabase/              # Database migrations and setup
```

## 🔧 Features

- ✅ **User Authentication** - Sign up, sign in, sign out
- ✅ **Poll Creation** - Create polls with multiple options
- ✅ **Poll Management** - Dashboard for managing your polls
- ✅ **Voting System** - Vote on polls and see results
- ✅ **Responsive Design** - Works on all devices
- ✅ **Type Safety** - Full TypeScript support
- ✅ **Modern UI** - Built with Tailwind CSS and Radix UI

## 🧪 Testing Routing

The app includes comprehensive routing:

- **Home** (`/`) - Landing page with navigation
- **Login** (`/auth/login`) - User authentication
- **Register** (`/auth/register`) - User registration
- **Dashboard** (`/dashboard`) - User's poll management
- **Create Poll** (`/polls/create`) - New poll creation
- **Browse Polls** (`/polls`) - View all polls
- **Poll Detail** (`/polls/[id]`) - Individual poll view

## 🚨 Troubleshooting

### Routing Issues
- Ensure you're signed in (use mock auth in development)
- Check browser console for errors
- Verify all routes are accessible after authentication

### Mock Mode
- Mock client provides sample data for testing
- Authentication always succeeds with any credentials
- Sample poll data is displayed in dashboard and polls list

### Production Issues
- Check Supabase configuration in `.env.local`
- Verify database migrations have been run
- Check Supabase dashboard for errors

## 📚 Next Steps

1. **Set up Supabase** for real authentication and data persistence
2. **Customize the UI** to match your brand
3. **Add more features** like poll categories, user profiles, etc.
4. **Deploy to production** using Vercel, Netlify, or your preferred platform

---

Built with ❤️ using Next.js, TypeScript, and Supabase