# 📖 Operating Instructions

This guide provides instructions on how to run CoursePilot for development/testing and how to build/deploy it for production hosting.

---

## 🛠️ Development & Testing

Use these steps to run the application locally for testing new features or viewing the planner.

### 1. Prerequisites
- **Node.js**: Version 20.x or higher.
- **Environment Variables**: Ensure you have a `.env.local` file in the root directory (see `README.md` for template).

### 2. Start the Development Server
Run the following command to start the Next.js development server with Turbopack:

```bash
npm run dev
```

- **Access**: [http://localhost:9002](http://localhost:9002)
- **Features**: Hot-reloading is enabled. Changes to components or styles will reflect immediately.

### 3. Start the AI Agent (Optional)
If you need to test the AI Consolidation Agent or use the Genkit Developer UI:

```bash
npm run genkit:dev
```

---

## 🚀 Building for hosting

Follow these steps to generate a production-ready bundle and run it.

### 1. Create a Production Build
This command compiles the TypeScript code, optimizes assets, and generates the Next.js production build.

```bash
npm run build
```

The output will be stored in the `.next` folder.

### 2. Run the Production Server
To test the production build locally or run it on a server:

```bash
npm run start
```

### 3. Deployment Notes
- **Static vs. Dynamic**: CoursePilot uses Server-Side Rendering (SSR) for data fetching from PocketBase/JSON. Ensure your hosting environment supports Node.js.
- **PocketBase**: If using PocketBase for persistence, ensure the `NEXT_PUBLIC_POCKETBASE_URL` in your environment points to your live instance.
- **Port Configuration**: By default, `npm run start` runs on port 3000. You can change this using the `-p` flag: `npx next start -p 8080`.

---

## 🧹 Maintenance Commands

- **Linting**: `npm run lint` (Checks for code quality issues).
- **Type Checking**: `npm run typecheck` (Runs TypeScript compiler check).
- **Data Migration**: `node migrate-to-pb.js` (Syncs local JSON data to a PocketBase instance).
