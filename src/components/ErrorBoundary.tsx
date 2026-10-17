import { useEffect, useState } from 'react';
import { useRouteError, isRouteErrorResponse, Link } from 'react-router';
import { TriangleAlert, Home, RefreshCw } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { autoReloadIfImportFailure, readSessionStorage } from './error-boundary.policy';

/**
 * Error Boundary component for React Router v7
 * Catches and displays errors that occur during routing or rendering
 * 
 * @example
 * // In router configuration
 * {
 *   path: '/',
 *   element: <Layout />,
 *   errorElement: <ErrorBoundary />,
 * }
 */
export function ErrorBoundary() {
  const error = useRouteError();
  const [reloading, setReloading] = useState(false);

  // A lazy route chunk that failed to load (expired preview session, stale
  // deploy) recovers with one document reload; the policy owns the loop guard.
  useEffect(() => {
    const storage = readSessionStorage();
    const now = Date.now();
    autoReloadIfImportFailure(error, storage, now, () => {
      setReloading(true);
      window.location.reload();
    });
  }, [error]);

  if (reloading) {
    return (
      <div data-vid="zn4rtgo" className="min-h-screen flex items-center justify-center bg-background p-4">
        <p data-vid="4uv15uj" className="text-sm text-muted-foreground">Reloading…</p>
      </div>
    );
  }

  let errorMessage: string;
  let errorStatus: number | undefined;

  if (isRouteErrorResponse(error)) {
    // Error from router (404, 500, etc.)
    errorMessage = error.statusText || error.data?.message || 'An error occurred';
    errorStatus = error.status;
  } else if (error instanceof Error) {
    // JavaScript error
    errorMessage = error.message;
  } else if (typeof error === 'string') {
    errorMessage = error;
  } else {
    errorMessage = 'Unknown error occurred';
  }

  return (
    <div data-vid="xux6hy6" className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card data-vid="vpvzqgj" className="max-w-lg w-full border-destructive/50">
        <CardHeader data-vid="27h9w18">
          <div data-vid="vrrji2g" className="flex items-center gap-4">
            <div data-vid="5wafw9u" className="p-3 rounded-full bg-destructive/10">
              <TriangleAlert data-vid="z7pzt8l" className="w-6 h-6 text-destructive" />
            </div>
            <div data-vid="unk1bew">
              <CardTitle data-vid="z3cfc1b" className="text-2xl">
                {errorStatus ? `Error ${errorStatus}` : 'Something went wrong'}
              </CardTitle>
              <CardDescription data-vid="10v5vc7">
                An unexpected error has occurred
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent data-vid="pdaarmz" className="space-y-4">
          <div data-vid="d25uxs7" className="bg-muted p-4 rounded-lg">
            <p data-vid="dbwl3ci" className="text-sm font-mono text-muted-foreground break-words">
              {errorMessage}
            </p>
          </div>

          <div data-vid="kfl4rks" className="flex flex-col sm:flex-row gap-2">
            <Button data-vid="nih6614" asChild className="flex-1">
              <Link data-vid="a204ni3" to="/">
                <Home data-vid="2vigzri" className="w-4 h-4 mr-2" />
                Go Home
              </Link>
            </Button>
            <Button data-vid="vga6tpy" 
              variant="outline" 
              onClick={() => window.location.reload()}
              className="flex-1"
            >
              <RefreshCw data-vid="p4d61zq" className="w-4 h-4 mr-2" />
              Reload Page
            </Button>
          </div>

          {import.meta.env.DEV && error instanceof Error && (
            <details data-vid="oqygwlf" className="mt-4">
              <summary data-vid="angyd8f" className="cursor-pointer text-sm text-muted-foreground hover:text-foreground">
                View stack trace (dev only)
              </summary>
              <pre data-vid="jfbjbsu" className="mt-2 text-xs bg-muted p-4 rounded-lg overflow-auto max-h-64">
                {error.stack}
              </pre>
            </details>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

