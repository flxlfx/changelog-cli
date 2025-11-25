import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { z } from "zod";

const CONFIG_DIR = join(homedir(), ".flxlfx");
const CONFIG_FILE = join(CONFIG_DIR, "changelog-cli-config.json");

const configSchema = z.object({
  JIRA_EMAIL: z.email("Email inválido").min(1, "Email é obrigatório"),
  JIRA_TOKEN: z.string("Token inválido").min(1, "Token é obrigatório"),
  JIRA_BASE_URL: z.url("URL inválida").min(1, "URL é obrigatória"),
  TASK_REGEX: z.string().optional(),
});

export type Config = z.infer<typeof configSchema>;

export function validateConfig(config: unknown) {
  return configSchema.safeParse(config);
}

export function loadConfig(): Config {
  try {
    if (!existsSync(CONFIG_FILE)) {
      const defaultConfig: Config = {
        JIRA_EMAIL: "",
        JIRA_TOKEN: "",
        JIRA_BASE_URL: "",
        TASK_REGEX: undefined,
      };
      saveConfig(defaultConfig);
      return defaultConfig;
    }
    const data = JSON.parse(readFileSync(CONFIG_FILE, "utf-8"));
    return data as Config;
  } catch (error) {
    throw new Error(
      `Erro ao carregar configuração: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}

export function saveConfig(config: Config): void {
  try {
    if (!existsSync(CONFIG_DIR)) {
      mkdirSync(CONFIG_DIR, { recursive: true });
    }
    writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), {
      mode: 0o600,
    });
  } catch (error) {
    throw new Error(
      `Erro ao salvar configuração: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}
