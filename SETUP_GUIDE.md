# Supabase Authentication Setup Guide

## Prerequisites
- A Supabase account (sign up at https://supabase.com)
- Node.js installed on your system

## Setup Instructions

### 1. Create a Supabase Project
1. Go to https://app.supabase.com
2. Click "New Project"
3. Fill in your project details and click "Create new project"
4. Wait for your project to be ready (this may take a few minutes)

### 2. Get Your Supabase Credentials
1. In your Supabase project dashboard, go to **Project Settings** (gear icon)
2. Click on **API** in the left sidebar
3. You'll see two important values:
   - **Project URL** (looks like: `https://xxxxxxxxxxxxx.supabase.co`)
   - **anon/public key** (a long string starting with `eyJ...`)

### 3. Configure Environment Variables
1. Create a file named `.env.local` in the root of your project
2. Add the following content (replace with your actual values):

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
```

### 4. Enable Email Authentication in Supabase
1. In your Supabase dashboard, go to **Authentication**
2. Click on **Providers** in the left sidebar
3. Make sure **Email** is enabled (it should be enabled by default)
4. You can customize email templates in **Authentication > Email Templates**

### 5. Configure Email Settings (Optional but Recommended)
By default, Supabase uses a limited email service. For production, you should:
1. Go to **Project Settings > Authentication**
2. Scroll down to **SMTP Settings**
3. Configure your own SMTP provider (SendGrid, AWS SES, etc.)

### 6. Run Your Application
1. Install dependencies (if not already done):
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```

3. Open http://localhost:3000 in your browser

## How It Works

### Authentication Flow
1. **Home Page (`/`)**: Automatically redirects to `/login` if not authenticated, or `/dashboard` if authenticated
2. **Login Page (`/login`)**: Allows users to sign in or sign up
3. **Dashboard (`/dashboard`)**: Protected page only accessible to authenticated users

### Features Implemented
- ✅ Email/Password authentication
- ✅ User registration with email verification
- ✅ Secure login
- ✅ Protected routes
- ✅ Session management
- ✅ Sign out functionality
- ✅ Beautiful, modern UI with Tailwind CSS

## Testing

### Create a Test Account
1. Go to http://localhost:3000
2. You'll be redirected to the login page
3. Click "Don't have an account? Sign Up"
4. Enter an email and password (min 6 characters)
5. Click "Sign Up"

### Email Verification
- **Development Mode**: Supabase may auto-confirm emails in development
- **Production Mode**: Users will receive a verification email
- You can check email confirmation status in the Supabase dashboard under **Authentication > Users**

### Access Protected Dashboard
1. After signing up or logging in, you'll be redirected to `/dashboard`
2. You'll see your account information and a welcome message
3. Try signing out and manually navigating to `/dashboard` - you'll be redirected to login

## Project Structure

```
my-app/
├── lib/
│   └── supabaseClient.ts          # Supabase client configuration
├── src/
│   ├── app/
│   │   ├── dashboard/
│   │   │   └── page.tsx           # Protected dashboard page
│   │   ├── login/
│   │   │   └── page.tsx           # Login/Signup page
│   │   ├── layout.tsx             # Root layout with AuthProvider
│   │   └── page.tsx               # Home page (redirects)
│   └── contexts/
│       └── AuthContext.tsx        # Authentication context & hooks
└── .env.local                     # Environment variables (create this!)
```

## Troubleshooting

### "Invalid API key" Error
- Make sure your `.env.local` file exists and has the correct values
- Restart your development server after creating/modifying `.env.local`
- Check that variable names start with `NEXT_PUBLIC_`

### "Email not confirmed" Warning
- In Supabase dashboard, go to **Authentication > Users**
- Find your user and click the "..." menu
- Select "Confirm email" to manually verify

### Sign Up Not Working
- Check Supabase dashboard under **Authentication > Users** to see if the user was created
- Check your browser console for error messages
- Verify your Supabase credentials are correct

### Redirect Loop
- Clear your browser cookies and cache
- Make sure you're not blocking cookies in your browser
- Check the browser console for authentication errors

## Next Steps

### Extend Your App
- Add password reset functionality
- Implement social authentication (Google, GitHub, etc.)
- Add user profile management
- Create role-based access control
- Add more protected pages

### Production Deployment
1. Add your production URL to Supabase:
   - Go to **Authentication > URL Configuration**
   - Add your production URL to "Site URL" and "Redirect URLs"

2. Configure proper SMTP settings for emails

3. Set environment variables in your deployment platform (Vercel, Netlify, etc.)

## Resources
- [Supabase Documentation](https://supabase.com/docs)
- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Auth with Next.js](https://supabase.com/docs/guides/auth/auth-helpers/nextjs)

