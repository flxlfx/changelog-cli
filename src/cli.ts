#!/usr/bin/env node
import { input, select } from "@inquirer/prompts";
import { loadConfig, saveConfig, validateConfig } from "./config";
import { updateChangelog, type ChangelogSection } from "./update-changelog";

async function setupCommand() {
  try {
    const currentConfig = loadConfig();

    console.log("\n🔧 Configuração Jira\n");

    const email = await input({
      message: "Email Jira:",
      default: currentConfig.JIRA_EMAIL,
      validate: (value) => {
        if (!value.trim()) return "Email é obrigatório";
        if (!value.includes("@")) return "Email inválido";
        return true;
      },
    });

    const token = await input({
      message: "API Token:",
      default: currentConfig.JIRA_TOKEN,
      validate: (value) => (value.trim() ? true : "Token é obrigatório"),
    });

    const baseUrl = await input({
      message: "Base URL:",
      default:
        currentConfig.JIRA_BASE_URL || "https://your-domain.atlassian.net",
      validate: (value) => {
        if (!value.trim()) return "URL é obrigatória";
        try {
          new URL(value);
          return true;
        } catch {
          return "URL inválida";
        }
      },
    });

    const taskRegex = await input({
      message: "Task Regex (opcional):",
      default: currentConfig.TASK_REGEX || "",
      validate: (value) => {
        if (!value.trim()) return true;
        try {
          new RegExp(value);
          return true;
        } catch {
          return "Regex inválida";
        }
      },
    });

    const config = {
      JIRA_EMAIL: email,
      JIRA_TOKEN: token,
      JIRA_BASE_URL: baseUrl,
      TASK_REGEX: taskRegex.trim() || undefined,
    };

    const validation = validateConfig(config);
    if (!validation.success) {
      console.error(
        "\n❌ Erro de validação:",
        validation.error.issues[0]?.message
      );
      process.exit(1);
    }

    saveConfig(config);
    console.log("\n✅ Configuração salva com sucesso!\n");
  } catch (error) {
    handleError(error);
  }
}

async function changelogCommand() {
  try {
    const useManualId = await select({
      message: "Como deseja obter o issue ID?",
      choices: [
        { name: "Extrair do branch atual", value: false },
        { name: "Inserir manualmente", value: true },
      ],
    });

    let manualIssueId: string | undefined;

    if (useManualId) {
      manualIssueId = await input({
        message: "Digite o issue ID (ex: ISSUE-1234):",
        validate: (value) => {
          if (!value.trim()) return "Issue ID é obrigatório";
          if (!/^[A-Z]+-\d+$/.test(value.trim())) {
            return "Formato inválido. Use: ISSUE-123";
          }
          return true;
        },
      });
      manualIssueId = manualIssueId.trim();
    }

    const section = await select<ChangelogSection>({
      message: "Selecione a seção do CHANGELOG:",
      choices: [
        { name: "Added - Nova funcionalidade", value: "Added" },
        {
          name: "Changed - Mudança em funcionalidade existente",
          value: "Changed",
        },
        {
          name: "Deprecated - Funcionalidade marcada como obsoleta",
          value: "Deprecated",
        },
        { name: "Removed - Funcionalidade removida", value: "Removed" },
        { name: "Fixed - Correção de bug", value: "Fixed" },
        { name: "Security - Correção de vulnerabilidade", value: "Security" },
      ],
    });

    await updateChangelog(section, manualIssueId);
  } catch (error) {
    handleError(error);
  }
}

async function mainMenu() {
  try {
    const config = loadConfig();
    const validation = validateConfig(config);

    if (!validation.success) {
      console.log("\n⚠️  Configuração não encontrada ou inválida\n");
      await setupCommand();
      return;
    }

    const action = await select({
      message: "O que deseja fazer?",
      choices: [
        { name: "Atualizar CHANGELOG", value: "changelog" },
        { name: "Reconfigurar", value: "setup" },
        { name: "Sair", value: "exit" },
      ],
    });

    switch (action) {
      case "changelog":
        await changelogCommand();
        break;
      case "setup":
        await setupCommand();
        break;
      case "exit":
        console.log("\n👋 Até logo!\n");
        process.exit(0);
    }
  } catch (error) {
    handleError(error);
  }
}

function handleError(error: unknown) {
  if (isPromptCancelled(error)) {
    console.log("\n\n❌ Operação cancelada\n");
    process.exit(0);
  }

  console.error(
    "\n❌ Erro:",
    error instanceof Error ? error.message : String(error),
    "\n"
  );
  process.exit(1);
}

function isPromptCancelled(error: unknown): boolean {
  return (
    error instanceof Error &&
    (error.message.includes("User force closed") ||
      error.message.includes("canceled") ||
      error.name === "ExitPromptError")
  );
}

process.on("SIGINT", () => {
  console.log("\n\n❌ Operação cancelada\n");
  process.exit(0);
});

process.on("unhandledRejection", (error) => {
  handleError(error);
});

mainMenu().catch(handleError);
