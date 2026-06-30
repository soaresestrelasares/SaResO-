export function AppLoading() {
  return (
    <main className="app-loading" data-app-loading role="status" aria-live="polite">
      <span className="app-loading__indicator" aria-hidden="true" />
      <span>Loading application...</span>
    </main>
  );
}
