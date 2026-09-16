import LoginForm from "./login-form";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const params = await searchParams;
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-xl font-semibold text-slate-900">Timereport</h1>
        <p className="mt-1 text-sm text-slate-500">Studio Savia — accedi al tuo account</p>
        <LoginForm callbackUrl={params.callbackUrl || "/"} />
      </div>
    </div>
  );
}
