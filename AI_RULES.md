# BizMart AI Assistant Rules

## Tech Stack (5-10 bullet points)

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS + shadcn/ui component library
- **State Management**: React Context (CartContext, AuthContext) + React Query (@tanstack/react-query)
- **Backend/Database**: Supabase (PostgreSQL) with realtime subscriptions
- **Routing**: React Router DOM v6
- **Icons**: Lucide React
- **Notifications**: Sonner (toast) + OneSignal (push notifications)
- **PWA**: Vite PWA plugin with Workbox
- **Forms**: React Hook Form + Zod validation
- **Utilities**: date-fns, clsx, tailwind-merge

## Library Usage Rules

### UI Components
- **ALWAYS** use shadcn/ui components from `@/components/ui/` (Button, Input, Card, etc.)
- **NEVER** create custom UI components that duplicate shadcn functionality
- **NEVER** edit files in `src/components/ui/` directly - they are prebuilt

### Styling
- **ALWAYS** use Tailwind CSS utility classes
- **NEVER** use CSS modules, styled-components, or inline styles
- **ALWAYS** use the `cn()` utility from `@/lib/utils` to merge classnames
- **NEVER** create separate CSS/SCSS files

### State & Data
- **ALWAYS** use React Query for server state (data from Supabase)
- **ALWAYS** use React Context for global client state (cart, auth)
- **NEVER** use Redux, Zustand, or other state libraries
- **ALWAYS** use Supabase client directly from `@/integrations/supabase/client`
- **NEVER** use axios or fetch for API calls (use Supabase or edge functions)

### Routing
- **ALWAYS** use React Router v6 hooks (useNavigate, useParams, useSearchParams)
- **ALWAYS** keep routes defined in `src/App.tsx`
- **NEVER** use conditional routing inside components - define all routes in App.tsx

### Forms
- **ALWAYS** use React Hook Form (`useForm`) with Zod resolvers
- **ALWAYS** use shadcn/ui form components (Form, FormField, FormItem, etc.)
- **NEVER** manage form state manually with useState

### Icons
- **ALWAYS** use Lucide React icons from `lucide-react`
- **NEVER** use other icon libraries (Font Awesome, Material Icons, etc.)

### Notifications
- **ALWAYS** use Sonner (`toast()` from `sonner`) for user feedback
- **ALWAYS** use OneSignal for push notifications via `@/lib/notifications.ts`
- **NEVER** use browser alert() or custom toast implementations

### File Structure
- **ALWAYS** put pages in `src/pages/`
- **ALWAYS** put reusable components in `src/components/`
- **ALWAYS** put hooks in `src/hooks/`
- **ALWAYS** put utilities in `src/lib/`
- **ALWAYS** keep components under 100 lines - split if larger
- **NEVER** add new components to existing files - create new files

### TypeScript
- **ALWAYS** define proper types/interfaces for props and data
- **ALWAYS** use `any` only for Supabase responses when types are complex
- **NEVER** use `as any` to bypass type errors without consideration

### Responsive Design
- **ALWAYS** design mobile-first (default styles for mobile, use breakpoints for larger screens)
- **ALWAYS** test in mobile viewport (375px width)
- **NEVER** use fixed widths that break on small screens

### Performance
- **ALWAYS** use `loading="lazy"` on images below the fold
- **ALWAYS** use React Query's `staleTime` to reduce unnecessary refetches
- **ALWAYS** use `useCallback` and `useMemo` for expensive operations
- **NEVER** cause infinite re-renders - check dependency arrays

### Supabase
- **ALWAYS** use the typed client from `@/integrations/supabase/client`
- **ALWAYS** use RPC functions for complex database operations
- **ALWAYS** use realtime subscriptions for live updates
- **NEVER** expose service role key in client code

### PWA
- **ALWAYS** use the PWA install prompt from `@/components/PWAInstallGate.tsx`
- **NEVER** modify the service worker directly - use Vite PWA plugin config

### Edge Functions
- **ALWAYS** place Supabase edge functions in `supabase/functions/`
- **ALWAYS** use Deno standard library for HTTP server
- **NEVER** use npm packages in edge functions unless absolutely necessary

### Code Quality
- **ALWAYS** follow existing code patterns and conventions
- **ALWAYS** use the same import order: React, third-party, then local
- **ALWAYS** use named exports for components and hooks
- **NEVER** leave console.log statements in production code
- **NEVER** use TODO comments - either implement or remove

### Git Workflow
- **ALWAYS** make small, focused commits
- **ALWAYS** test changes in the preview before considering them complete
- **NEVER** commit broken code or incomplete features

### Security
- **ALWAYS** validate user input on both client and server
- **ALWAYS** use Supabase RLS policies
- **NEVER** expose sensitive data in client-side code
- **ALWAYS** use environment variables for secrets (never commit .env)

### Mobile UX
- **ALWAYS** use touch-friendly button sizes (min 44px)
- **ALWAYS** prevent text selection on interactive elements
- **ALWAYS** use safe area insets for bottom navigation
- **NEVER** use hover states as the only interaction method

### Accessibility
- **ALWAYS** use semantic HTML elements
- **ALWAYS** add proper ARIA labels when needed
- **ALWAYS** ensure keyboard navigation works
- **NEVER** remove focus outlines without replacement

### Error Handling
- **ALWAYS** show user-friendly error messages via toasts
- **ALWAYS** let errors bubble to error boundaries
- **NEVER** use empty catch blocks - at least log the error
- **ALWAYS** provide retry mechanisms for failed operations

### Testing
- **ALWAYS** write tests for critical business logic
- **ALWAYS** place tests in `src/**/*.{test,spec}.{ts,tsx}`
- **NEVER** skip testing because "it works on my machine"

### Documentation
- **ALWAYS** add JSDoc comments for complex functions
- **ALWAYS** keep README.md updated with setup instructions
- **NEVER** commit code that isn't documented if it's non-obvious

### Dependencies
- **ALWAYS** check if a library is already installed before adding new dependencies
- **ALWAYS** prefer built-in browser APIs over libraries when possible
- **NEVER** add large dependencies for simple tasks
- **ALWAYS** use the versions already in package.json

### Deployment
- **ALWAYS** test the build locally (`npm run build`) before deploying
- **ALWAYS** check that environment variables are set in production
- **NEVER** commit build artifacts or node_modules