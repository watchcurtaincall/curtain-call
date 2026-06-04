# Curtain Call

A theatre discovery, ticketing, and analytics platform.

## Packaging & Portability
This project is built using Next.js, Supabase, and Tailwind CSS. It is packaged to be fully portable. If you switch to a new laptop, simply clone the repository and follow the instructions below to get your local environment running identically to production.

## Prerequisites
- **Node.js**: v24.x or higher (we recommend using `nvm` to manage Node versions)
- **Git**: Installed and configured

## 🚀 Quick Start Guide

### 1. Clone the Repository
Clone the project from GitHub and navigate into the directory:
```bash
git clone https://github.com/watchcurtaincall/curtain-call.git
cd curtain-call
```

### 2. Install Dependencies
Install all required Node modules exactly as specified in the lockfile:
```bash
npm ci
```
*(Note: `npm ci` is preferred over `npm install` because it strictly installs exact versions from `package-lock.json`, preventing breaks on a new machine).*

### 3. Setup Environment Variables
To connect to the database and third-party APIs (Supabase, Paystack, Brevo, Gemini), you need an environment file.

1. Copy the example file to create your local environment:
   ```bash
   cp .env.example .env.local
   ```
2. Open `.env.local` in your editor and fill in the missing keys. (You can securely retrieve these from your Vercel Dashboard -> Settings -> Environment Variables, or from your original machine).

### 4. Run the Development Server
Once dependencies are installed and the `.env.local` is populated, start the Next.js development server:
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## 🗄️ Database Setup (Supabase)
The database schema and policies are fully managed in Supabase. Because the platform relies on Supabase as the backend, simply connecting via the `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` in your `.env.local` will automatically sync your local app with the live database schema. 

*(If you ever need to recreate the database from scratch, you can run the SQL snippets stored in the root directory like `supabase_schema.sql` and `quiz_schema.sql` directly in the Supabase SQL Editor).*

## 🧪 Quality Assurance Commands
Before pushing code, you can verify that everything is stable:
- **Type Checking & Production Build**: `npm run build`
- **Static Analysis (ESLint)**: `npm run lint`

## Deployment
This project is configured for one-click deployment on **Vercel**. Pushing to the `main` branch on GitHub will automatically trigger a production build.
