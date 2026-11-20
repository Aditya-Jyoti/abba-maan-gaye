// Creates an editor account, or resets an existing editor's password.
//
//   node scripts/create-user.mjs <email> "<name>"
//   node scripts/create-user.mjs <email> --reset-password
//
// The password is read from the NEW_PASSWORD environment variable, or asked for.
import { createInterface } from "node:readline";
import postgres from "postgres";
import { hashPassword, MIN_PASSWORD_LENGTH } from "../src/lib/auth/password.mjs";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL is not set");
  process.exit(1);
}

const args = process.argv.slice(2);
const reset = args.includes("--reset-password");
const [emailArg, nameArg] = args.filter((a) => !a.startsWith("--"));
const email = emailArg?.trim().toLowerCase();
if (!email || !email.includes("@") || (!reset && !nameArg?.trim())) {
  console.error('Usage: create-user.mjs <email> "<name>"\n       create-user.mjs <email> --reset-password');
  process.exit(1);
}

function ask(question) {
  return new Promise((resolve) => {
    const rl = createInterface({ input: process.stdin, output: process.stdout, terminal: true });
    // Hide what's typed.
    rl._writeToOutput = (s) => rl.output.write(s.startsWith(question) ? s : "");
    rl.question(question, (answer) => {
      rl.output.write("\n");
      rl.close();
      resolve(answer);
    });
  });
}

async function readPassword() {
  if (process.env.NEW_PASSWORD) return process.env.NEW_PASSWORD;
  if (!process.stdin.isTTY) {
    console.error("No terminal to ask for a password; set NEW_PASSWORD instead.");
    process.exit(1);
  }
  const first = await ask("Password: ");
  const second = await ask("Repeat password: ");
  if (first !== second) {
    console.error("Passwords don't match.");
    process.exit(1);
  }
  return first;
}

const sql = postgres(url, { max: 1, onnotice: () => {} });
try {
  const [existing] = await sql`select id from users where email = ${email}`;
  if (reset && !existing) throw new Error(`No editor with email ${email}`);
  if (!reset && existing) throw new Error(`${email} already exists (use --reset-password to change it)`);

  const password = await readPassword();
  if (password.length < MIN_PASSWORD_LENGTH) {
    throw new Error(`Use at least ${MIN_PASSWORD_LENGTH} characters.`);
  }
  const hash = await hashPassword(password);

  if (reset) {
    await sql.begin(async (tx) => {
      await tx`update users set password_hash = ${hash}, updated_at = now() where id = ${existing.id}`;
      // Sign them out everywhere.
      await tx`delete from sessions where user_id = ${existing.id}`;
    });
    console.log(`Password updated for ${email}`);
  } else {
    await sql`insert into users (email, name, password_hash) values (${email}, ${nameArg.trim()}, ${hash})`;
    console.log(`Created editor ${email}`);
  }
} catch (err) {
  console.error(err instanceof Error ? err.message : err);
  process.exitCode = 1;
} finally {
  await sql.end();
}
