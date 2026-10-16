import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex flex-col min-h-screen items-center justify-center px-4">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-foreground">404</h1>
        <p className="mt-2 text-lg text-muted-foreground">Page not found</p>
        <p className="mt-4 max-w-md mx-auto text-muted-foreground">
          The page you&rsquo;re looking for doesn&rsquo;t exist. Head back to the dashboard or home.
        </p>
        <div className="mt-8 flex gap-3">
          <Link href="/" className="flex items-center justify-center rounded-md border border-input bg-primary px-5 py-3 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary/90">
            Go home
          </Link>
          <Link href="/dashboard" className="flex items-center justify-center rounded-md border border-input bg-secondary px-5 py-3 text-sm font-medium text-secondary-foreground shadow-sm hover:bg-secondary/80">
            Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
