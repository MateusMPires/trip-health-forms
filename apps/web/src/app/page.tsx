// The form is only reachable via a trip-specific link (/viagem/{codigo}). The root has no form.
export default function Home() {
  return (
    <main className="mx-auto flex min-h-[70vh] w-full max-w-md flex-col items-center justify-center gap-3 px-4 text-center">
      <span className="rounded-full bg-primary-soft px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary">
        Viagem Missionária
      </span>
      <h1 className="text-xl font-semibold text-foreground">Acesse pelo link da sua viagem</h1>
      <p className="text-sm leading-relaxed text-muted">
        Para preencher a ficha do viajante, use o link com o código da viagem enviado pela equipe
        responsável.
      </p>
    </main>
  );
}
