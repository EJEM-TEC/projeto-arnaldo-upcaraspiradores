# UpCarAspiradores - Mobile Application

This is a [Next.js](https://nextjs.org) project for the UpCarAspiradores mobile application, featuring intelligent vacuum cleaner management.

## Features

- **Mobile-First Design**: Responsive design optimized for mobile devices
- **Supabase Authentication**: Secure user authentication with Google OAuth and email/password
- **Homepage**: Main interface for vacuum cleaner number input and balance management
- **Lateral Menu**: Side navigation with user profile and menu options
- **Role-Based Access**: Different access levels for admin and client users
- **Protected Routes**: Middleware-based route protection

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Application Structure

- `/login-usuario` - User login page
- `/home` - Main homepage (protected, requires authentication)
- `/painel_de_controle` - Admin dashboard (admin only)
- `/signup-usuario` - User registration page

## Authentication Flow

1. Users access `/login-usuario` to authenticate
2. After successful login, users are redirected to `/home`
3. The homepage is protected by middleware and requires Supabase authentication
4. Users can access the lateral menu for navigation and account management

## Mobile Features

- **Vacuum Cleaner Input**: Users can enter vacuum cleaner numbers
- **Balance Display**: Shows current user balance
- **Lateral Menu**: Contains user profile, navigation options, and logout
- **Responsive Design**: Optimized for mobile devices with touch-friendly interface

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
