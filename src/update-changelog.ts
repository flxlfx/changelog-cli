import { execSync } from "child_process";
import { existsSync, readFileSync, writeFileSync } from "fs";
import { loadConfig, validateConfig } from "./config";

export type ChangelogSection =
  | "Added"
  | "Changed"
  | "Deprecated"
  | "Removed"
  | "Fixed"
  | "Security";

export async function updateChangelog(
  section: ChangelogSection,
  manualIssueId?: string
): Promise<void> {
  const config = loadConfig();
  const validation = validateConfig(config);

  if (!validation.success) {
    throw new Error("Configuração inválida. Execute o setup primeiro.");
  }

  let issueId: string;

  if (manualIssueId) {
    issueId = manualIssueId;
  } else {
    const branchName = getBranchName();
    const taskRegex = config.TASK_REGEX
      ? new RegExp(config.TASK_REGEX)
      : /(?:feature|hotfix|bugfix|task|chore|release|epic|improvement)\/([A-Z]+-\d+)/;

    const issueMatch = branchName.match(taskRegex);

    if (!issueMatch || !issueMatch[1]) {
      console.log("\n⚠️  Branch não contém issue ID no formato esperado\n");
      return;
    }

    issueId = issueMatch[1];
  }

  console.log(`\n🔍 Buscando issue ${issueId}...`);

  const issueData = await fetchIssue(issueId, config);
  const newEntry = `- [${issueId}](${issueData.url}) ${issueData.summary}`;

  updateChangelogFile(newEntry, issueId, section);
}

function getBranchName(): string {
  try {
    return execSync("git branch --show-current", { encoding: "utf-8" }).trim();
  } catch (error) {
    throw new Error(
      `Erro ao obter branch: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}

async function fetchIssue(
  issueId: string,
  config: { JIRA_EMAIL: string; JIRA_TOKEN: string; JIRA_BASE_URL: string }
) {
  try {
    const response = await fetch(
      `${config.JIRA_BASE_URL}/rest/api/3/issue/${issueId}`,
      {
        headers: {
          Authorization: `Basic ${Buffer.from(
            `${config.JIRA_EMAIL}:${config.JIRA_TOKEN}`
          ).toString("base64")}`,
          Accept: "application/json",
        },
      }
    );

    if (response.status === 401) {
      throw new Error("Autenticação falhou. Verifique email e token.");
    }

    if (response.status === 404) {
      throw new Error(`Issue ${issueId} não encontrada.`);
    }

    if (!response.ok) {
      throw new Error(`Erro HTTP ${response.status}: ${response.statusText}`);
    }

    const data = (await response.json()) as any;
    const summary = data.fields?.summary || "";

    if (!summary) {
      throw new Error("Issue não possui summary");
    }

    return {
      summary,
      url: `${config.JIRA_BASE_URL}/browse/${issueId}`,
    };
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error(`Erro ao buscar issue: ${String(error)}`);
  }
}

function updateChangelogFile(
  newEntry: string,
  issueId: string,
  section: ChangelogSection
): void {
  const changelogPath = "CHANGELOG.md";

  if (!existsSync(changelogPath)) {
    throw new Error("CHANGELOG.md não encontrado");
  }

  let changelog = readFileSync(changelogPath, "utf-8");

  if (changelog.includes(newEntry)) {
    console.log(`\n✓ Entry já existe no CHANGELOG.md\n`);
    return;
  }

  let lines = changelog.split("\n");
  lines = ensureUnreleasedSection(lines);

  let sectionLineIndex = findSectionIndex(lines, section);

  if (sectionLineIndex === -1) {
    lines = ensureSection(lines, section);
    sectionLineIndex = findSectionIndex(lines, section);

    if (sectionLineIndex === -1) {
      throw new Error(`Erro ao criar seção ### ${section} no CHANGELOG.md`);
    }
  }

  const insertIndex = sectionLineIndex + 2;
  lines.splice(insertIndex, 0, newEntry);

  const nextLineIndex = insertIndex + 1;
  if (
    nextLineIndex < lines.length &&
    lines[nextLineIndex] !== "" &&
    lines[nextLineIndex]?.startsWith("##")
  ) {
    lines.splice(nextLineIndex, 0, "");
  }

  writeFileSync(changelogPath, lines.join("\n"));
  console.log(
    `\n✅ Adicionado ao CHANGELOG.md [${section}]:\n   ${newEntry}\n`
  );
}

function ensureUnreleasedSection(lines: string[]): string[] {
  const unreleasedIndex = lines.findIndex((line) =>
    line?.includes("## [Unreleased]")
  );

  if (unreleasedIndex !== -1) {
    return lines;
  }

  const firstVersionIndex = lines.findIndex((line) =>
    line.match(/^## \[\d+\.\d+\.\d+\]/)
  );

  const insertIndex = firstVersionIndex !== -1 ? firstVersionIndex : 0;
  lines.splice(insertIndex, 0, "## [Unreleased]", "");

  return lines;
}

function ensureSection(lines: string[], section: ChangelogSection): string[] {
  const unreleasedIndex = lines.findIndex((line) =>
    line?.includes("## [Unreleased]")
  );

  if (unreleasedIndex === -1) {
    return lines;
  }

  let insertIndex = unreleasedIndex + 1;

  for (let i = unreleasedIndex + 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line) continue;

    if (line.startsWith("## [")) {
      insertIndex = i;
      break;
    }

    if (line.startsWith("### ")) {
      insertIndex = i + 1;
    }
  }

  if (insertIndex === unreleasedIndex + 1 && lines[insertIndex] === "") {
    insertIndex++;
  }

  lines.splice(insertIndex, 0, `### ${section}`, "");

  return lines;
}

function findSectionIndex(lines: string[], section: ChangelogSection): number {
  let inUnreleased = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line) continue;

    if (line.includes("## [Unreleased]")) {
      inUnreleased = true;
    } else if (inUnreleased && line === `### ${section}`) {
      return i;
    } else if (inUnreleased && line.startsWith("## [")) {
      break;
    }
  }

  return -1;
}
