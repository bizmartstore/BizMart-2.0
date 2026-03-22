# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## OneSignal Push Notifications Setup

This project uses OneSignal Web SDK v16 for push notifications.

### Environment Variables

Set these in your `.env` file:

```
VITE_ONESIGNAL_APP_ID=your_app_id
VITE_ONESIGNAL_REST_API_KEY=your_rest_api_key
```

### Configuration

- OneSignal is initialized once on app load via `OneSignalProvider`
- External ID is set using `OneSignal.login(user.id)` after authentication
- Service worker conflicts are resolved by disabling Vite PWA service worker
- Push notifications target users via `include_external_user_ids`

### Troubleshooting

1. **"No recipients" error**: Ensure user has logged in and External ID is set in OneSignal dashboard
2. **SDK already initialized**: Only one instance of OneSignalProvider should exist
3. **Service worker conflicts**: Vite PWA service worker is disabled; OneSignal handles its own SW
4. **Mobile push not working**: Ensure PWA is installed and HTTPS is used

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)