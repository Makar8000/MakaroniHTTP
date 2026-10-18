// Usage: bun run hash-password
// Prompts for a username and password and prints a ready-to-paste .env line for BASIC_AUTH_HASH,
// Every `$` is escaped as `\$` because Bun expands `$var` in .env, even inside quotes.
import { input, password } from "@inquirer/prompts";

try {
  const user = await input({
    message: "Username:",
    validate: (v) => (v && !v.includes(":")) || "Required, and must not contain ':'",
  });
  const pass = await password({ message: "Password:", mask: true, validate: (v) => !!v || "Required" });
  console.log(`BASIC_AUTH_HASH=${(await Bun.password.hash(`${user}:${pass}`)).replaceAll("$", "\\$")}`);
} catch (err) {
  // Ctrl+C rejects with ExitPromptError; exit quietly
  if (err instanceof Error && err.name === "ExitPromptError") {
    process.exit(130);
  }
  throw err;
}
