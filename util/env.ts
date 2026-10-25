// index.ts imports this first: imports run before index.ts's own code, and some modules read env at import time
const REQUIRED = [
  "BASIC_AUTH_HASH",
  "DISCORD_TOKEN",
  "THREAD_ID",
  "DEEPL_API_KEY",
  "PUSHOVER_API_KEY",
  "PUSHOVER_USER_KEY",
];

const errors = REQUIRED.filter((k) => !Bun.env[k]).map((k) => `${k} is not set`);

// an unescaped `$` in .env gets expanded by Bun, which also breaks this prefix
if (Bun.env.BASIC_AUTH_HASH && !Bun.env.BASIC_AUTH_HASH.startsWith("$argon2")) {
  errors.push("BASIC_AUTH_HASH is not an argon2 hash, generate it with `bun run hash-password`");
}

if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}
