# How to Add a New Theme to StreamTheme

Follow this step-by-step guide to create, register, and activate a new theme on the platform.

## Prerequisites
- Access to the codebase (`client` and `server` directories).
- Terminal access to run helper scripts.

---

## Step 1: Create the Theme (Client Side)

1.  **Duplicate an Existing Theme**:
    - Navigate to `client/src/themes`.
    - Copy an existing theme folder (e.g., `MasterStandard` or `PROCustom`).
    - Rename the folder to your new theme name (e.g., `CyberPunk`).

2.  **Update Theme Configuration**:
    - Open `client/src/themes/CyberPunk/index.ts`.
    - Update the `id` and `name` properties.
    ```typescript
    const CyberPunkTheme: ThemeModule = {
        id: 'cyberpunk-theme', // UNIQUE ID: Use lowercase and hyphens
        name: 'CyberPunk 2077',
        // ... update other properties as needed
    };
    export default CyberPunkTheme;
    ```

3.  **Customize the Theme**:
    - Edit `Theme.tsx`, `Configuration.tsx`, and `preview.png` within your new folder to define how the theme looks and behaves.

---

## Step 2: Register the Theme (Client Side)

1.  **Add to Registry**:
    - Open `client/src/themes/registry.ts`.
    - Import your new theme module.
    - Add it to the `themes` object.

    ```typescript
    import MasterStandard from './MasterStandard';
    import PROCustom from './PROCustom';
    import CyberPunkTheme from './CyberPunk'; // <--- Import

    export const themes: Record<string, ThemeModule> = {
        'master-standard': MasterStandard,
        'pro-custom': PROCustom,
        'cyberpunk-theme': CyberPunkTheme, // <--- Add to map
    };
    ```

---

## Step 3: Register in Database (Server Side)

The theme needs to be in the database to be visible in the user dashboard and store.

1.  **Run Registration Script**:
    - Open a terminal in the `server` directory.
    - Run the following command:
    ```powershell
    node scripts/register-theme.js
    ```

2.  **Follow Prompts**:
    - **Layout ID**: Must match the `id` from Step 1 (e.g., `cyberpunk-theme`).
    - **Layout Name**: Display name (e.g., `CyberPunk 2077`).
    - **Base Price**: Set the price in INR (e.g., `499` or `0` for free).
    - **Description**: A short marketing description.

---

## Step 4: Verify

1.  Restart the Client and Server if they were running.
2.  Go to the **Dashboard**.
3.  You should see your new theme listed.
4.  Try activating and configuring it to ensure everything works.
