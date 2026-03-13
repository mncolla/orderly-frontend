# Orderly Frontend

Frontend application for Orderly, built with React, Vite, TypeScript, and TanStack Query.

## Tech Stack

- **React 19** - UI library
- **Vite** - Build tool and dev server
- **TypeScript** - Type safety
- **TanStack Query** - Data fetching and state management
- **Fetch API** - HTTP client (custom wrapper)

## Project Structure

```
src/
├── components/      # Reusable React components
├── hooks/          # Custom React hooks (TanStack Query hooks)
├── services/       # API services and HTTP client
├── types/          # TypeScript type definitions
├── utils/          # Utility functions
├── App.tsx         # Main application component
└── main.tsx        # Entry point with QueryClient setup
```

## Getting Started

### Installation

```bash
npm install
```

### Environment Variables

Create a `.env` file based on `.env.example`:

```env
VITE_API_URL=http://localhost:3000/api
```

### Development

```bash
npm run dev
```

### Build

```bash
npm run build
```

### Preview

```bash
npm run preview
```

## API Integration

The project uses a custom API client wrapper around the Fetch API, located in [`src/services/api.ts`](src/services/api.ts).

Example service in [`src/services/exampleService.ts`](src/services/exampleService.ts) with corresponding TanStack Query hooks in [`src/hooks/useExampleItems.ts`](src/hooks/useExampleItems.ts).

### Creating New Services

1. Create a new service file in `src/services/`:

```typescript
// src/services/myService.ts
import { api } from './api';

export interface MyEntity {
  id: string;
  name: string;
}

export const myService = {
  async getAll(): Promise<MyEntity[]> {
    return api.get<MyEntity[]>('/my-endpoint');
  },
};
```

2. Create corresponding hooks in `src/hooks/`:

```typescript
// src/hooks/useMyService.ts
import { useQuery } from '@tanstack/react-query';
import { myService } from '../services/myService';

export function useMyEntities() {
  return useQuery({
    queryKey: ['my-entities'],
    queryFn: myService.getAll,
  });
}
```

3. Use the hook in your component:

```typescript
import { useMyEntities } from '../hooks/useMyService';

function MyComponent() {
  const { data, isLoading, error } = useMyEntities();

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error</div>;

  return <div>{/* Render data */}</div>;
}
```
