
import { Loader2, Sparkles } from 'lucide-react';

export default function Loading() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-muted/40 p-4 text-center">
      <div className="max-w-md w-full">
        <Sparkles className="mx-auto h-16 w-16 text-primary animate-pulse" />
        <h1 className="text-3xl font-bold mt-6 mb-2">Generating your form...</h1>
        <p className="text-muted-foreground text-lg mb-8">
          Our AI is crafting the perfect questions for you. Please wait a moment.
        </p>
        <div className="flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    </div>
  );
}
