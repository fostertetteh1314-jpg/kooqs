export default function Loading() {
  return (
    <div className="min-h-screen bg-kooqs-dark animate-pulse">
      {/* Navbar */}
      <div className="sticky top-0 z-40 h-16 border-b border-kooqs-border bg-kooqs-dark/80 flex items-center px-4 sm:px-6 gap-3">
        <div className="w-10 h-10 rounded-full bg-kooqs-muted" />
        <div className="w-28 h-5 rounded bg-kooqs-muted hidden sm:block" />
      </div>

      {/* Hero */}
      <div className="border-b border-kooqs-border py-12 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="flex-1 space-y-4 text-center md:text-left">
              <div className="w-36 h-6 rounded-full bg-kooqs-muted mx-auto md:mx-0" />
              <div className="w-56 h-10 rounded bg-kooqs-muted mx-auto md:mx-0" />
              <div className="w-40 h-10 rounded bg-kooqs-muted mx-auto md:mx-0" />
              <div className="w-72 h-4 rounded bg-kooqs-muted/60 mx-auto md:mx-0" />
              <div className="flex gap-3 justify-center md:justify-start mt-4">
                <div className="w-32 h-11 rounded-2xl bg-kooqs-muted" />
                <div className="w-28 h-11 rounded-2xl bg-kooqs-muted/60" />
              </div>
            </div>
            <div className="w-64 h-64 rounded-2xl bg-kooqs-muted flex-shrink-0" />
          </div>
        </div>
      </div>

      {/* Menu */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
        <div className="flex gap-3 mb-8 overflow-hidden">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="w-24 h-9 rounded-full bg-kooqs-muted flex-shrink-0" />
          ))}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="rounded-2xl bg-kooqs-card border border-kooqs-border p-4 space-y-3">
              <div className="w-full h-40 rounded-xl bg-kooqs-muted" />
              <div className="w-32 h-5 rounded bg-kooqs-muted" />
              <div className="w-48 h-3 rounded bg-kooqs-muted/60" />
              <div className="flex justify-between items-center pt-1">
                <div className="w-16 h-6 rounded bg-kooqs-muted" />
                <div className="w-24 h-9 rounded-xl bg-kooqs-muted" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
