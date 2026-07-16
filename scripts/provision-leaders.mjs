// One-off admin script: create the leaders' auth users so they can log in via
// email OTP (login is restricted to pre-existing users — shouldCreateUser:false).
//
// Zero dependencies: uses the Supabase Admin REST API with global fetch (Node 18+).
// The handle_new_user trigger provisions each public.profiles row automatically;
// leaders still join their trips via join_trip(code) inside the app.
//
// Run (Node 20+ loads the root .env for you):
//   node --env-file=.env scripts/provision-leaders.mjs [path/to/leaders.txt]
//
// leaders.txt: one e-mail per line; blank lines and lines starting with # are ignored.
// The default file (scripts/leaders.txt) is gitignored — it is operational data.
//
// Requires in .env: SUPABASE_SERVICE_ROLE_KEY and either SUPABASE_URL or
// SUPABASE_PROJECT_REF (the URL is derived as https://<ref>.supabase.co).
import { readFileSync } from 'node:fs';

const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const projectRef = process.env.SUPABASE_PROJECT_REF;
const supabaseUrl =
  process.env.SUPABASE_URL ?? (projectRef ? `https://${projectRef}.supabase.co` : undefined);

if (!serviceRoleKey || !supabaseUrl) {
  console.error(
    'Faltam variáveis: defina SUPABASE_SERVICE_ROLE_KEY e SUPABASE_URL (ou SUPABASE_PROJECT_REF) no .env.',
  );
  process.exit(1);
}

const listPath = process.argv[2] ?? 'scripts/leaders.txt';

let emails;
try {
  emails = readFileSync(listPath, 'utf8')
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !line.startsWith('#'));
} catch {
  console.error(`Não consegui ler a lista de e-mails em "${listPath}".`);
  process.exit(1);
}

if (emails.length === 0) {
  console.error(`Nenhum e-mail encontrado em "${listPath}".`);
  process.exit(1);
}

async function createUser(email) {
  const response = await fetch(`${supabaseUrl}/auth/v1/admin/users`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
    },
    // email_confirm:true marks the address valid without a password (passwordless login).
    body: JSON.stringify({ email, email_confirm: true }),
  });

  if (response.ok) return 'created';

  const body = await response.json().catch(() => ({}));
  const code = body.error_code ?? body.code ?? '';
  const message = (body.msg ?? body.message ?? '').toLowerCase();
  if (code === 'email_exists' || message.includes('already been registered')) return 'exists';

  throw new Error(`${response.status} ${body.msg ?? body.message ?? 'erro desconhecido'}`);
}

let created = 0;
let existing = 0;
let failed = 0;

for (const email of emails) {
  try {
    const result = await createUser(email);
    if (result === 'created') {
      created += 1;
      console.log(`✓ criado: ${email}`);
    } else {
      existing += 1;
      console.log(`• já existia: ${email}`);
    }
  } catch (error) {
    failed += 1;
    console.error(`✗ falhou: ${email} — ${error.message}`);
  }
}

console.log(`\nResumo: ${created} criados, ${existing} já existiam, ${failed} falharam (de ${emails.length}).`);
process.exit(failed > 0 ? 1 : 0);
