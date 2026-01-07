---
description: How to add a new theme to StreamTheme
---

# How to Add a New Theme

Follow this 3-step process to add a new theme to the platform.

## 1. Duplicate & Rename Theme (Client)
1. Navigate to `client/src/themes`.
2. Copy an existing theme folder (e.g., `MasterStandard`).
3. Rename the folder to your new theme name (e.g., `MyNewTheme`).
4. **IMPORTANT**: Open `client/src/themes/MyNewTheme/index.ts` and update the `id` and `name`.
   ```typescript
   const MyNewTheme: ThemeModule = {
       id: 'my-new-theme', // Must be unique (lowercase, hyphens)
       name: 'My New Theme',
       // ...
   };
   export default MyNewTheme;
   ```

## 2. Register Theme (Client)
1. Open `client/src/themes/registry.ts`.
2. Import your new theme.
3. Add it to the `themes` export.
   ```typescript
   import MyNewTheme from './MyNewTheme';
   
   export const themes: Record<string, ThemeModule> = {
       // ...
       'my-new-theme': MyNewTheme,
   };
   ```

## 3. Register Layout (Server)
To make the theme visible in the dashboard, it must be added to the database.
We have created a helper script to do this automatically.

1. Open a terminal in the `server` directory.
2. Run the registration script:
   ```powershell
   node scripts/register-theme.js
   ```
3. Enter the requested details (ID, Name, Price).
   - **ID**: Must match the `id` you used in Step 1 (e.g., `my-new-theme`).

## 4. Verify
1. Go to the User Dashboard.
2. The new theme should now appear in the list.
