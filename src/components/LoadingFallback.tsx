import { LoaderCircle } from 'lucide-react';

/**
 * Loading fallback component for Suspense boundaries
 * Displays while lazy-loaded components are being fetched
 * 
 * @example
 * <Suspense fallback={<LoadingFallback />}>
 *   <LazyComponent />
 * </Suspense>
 */
export function LoadingFallback() {
  return (
    <div data-vid="2ay2oky" className="min-h-[60vh] flex items-center justify-center">
      <div data-vid="4fday6a" className="flex flex-col items-center gap-4">
        <LoaderCircle data-vid="fkdp66g" className="w-8 h-8 animate-spin text-primary" />
        <p data-vid="cj3vl9w" className="text-sm text-muted-foreground">Loading...</p>
      </div>
    </div>
  );
}

