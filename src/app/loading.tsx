export default function Loading() {
  return (
    <main
      className="flex items-center justify-center min-h-screen p-4 md:p-8"
      aria-busy="true"
      aria-live="polite"
      data-testid="loading-page"
    >
      <div className="flex flex-col items-center gap-4 text-center">
        <div
          className="h-10 w-10 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent motion-reduce:animate-[spin_1.5s_linear_infinite]"
          aria-hidden="true"
        />
        <p className="text-sm text-muted-foreground">Loading…</p>
      </div>
    </main>
  );
}
