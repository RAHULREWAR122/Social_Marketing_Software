export default function AutomationsPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Automations</h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Trigger-based journeys across email and WhatsApp.
        </p>
      </div>

      <section className="rounded-xl border border-black/[.08] bg-white p-8 text-center dark:border-white/[.145] dark:bg-zinc-950">
        <h2 className="text-lg font-semibold">Coming soon</h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-zinc-600 dark:text-zinc-400">
          Automations (e.g. &ldquo;wait 2 days after a new contact, then send a WhatsApp follow-up&rdquo;) build on
          top of the campaign engine we just shipped for Email and WhatsApp. This module comes after that
          foundation is solid.
        </p>
      </section>
    </div>
  );
}
