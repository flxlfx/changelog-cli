# @flxlfx/changelog-cli

[![Version](https://img.shields.io/badge/version-0.0.1-blue.svg)](https://github.com/flxlfx/changelog-cli)

CLI interativa para automação de CHANGELOG.md com integração Jira API.

## Índice

- [Visão Geral](#visão-geral)
- [Instalação](#instalação)
- [Configuração](#configuração)
- [Uso](#uso)
- [Nomenclatura de Branches](#nomenclatura-de-branches)
- [Seções do CHANGELOG](#seções-do-changelog)
- [Arquitetura](#arquitetura)
- [Troubleshooting](#troubleshooting)
- [Requisitos](#requisitos)

## Visão Geral

Ferramenta que automatiza atualização de `CHANGELOG.md` seguindo [Keep a Changelog](https://keepachangelog.com/), integrando com Jira para buscar informações das issues automaticamente.

### Funcionalidades

- ✅ Configuração segura de credenciais (armazenadas em `~/.flxlfx/changelog-cli-config.json`)
- ✅ Detecção automática de issue ID na branch Git
- ✅ Entrada manual de issue ID (quando não estiver em branch com padrão)
- ✅ Busca automática de summary e URL da issue no Jira
- ✅ Suporte a 6 seções do CHANGELOG (Added, Changed, Deprecated, Removed, Fixed, Security)
- ✅ Validação de entrada com feedback imediato
- ✅ Tratamento de erros com mensagens claras
- ✅ Interface interativa com menu de seleção
- ✅ Detecção de duplicatas

## Instalação

### Desenvolvimento Local

```bash
bun install
bun run build
```

### Como Dependência

```bash
bun add @flxlfx/changelog-cli
```

### Executáveis

Após instalação/build, o binário fica disponível em:

```bash
# Localmente
./dist/cli.js

# Via package.json bin
jc-cli

# Desenvolvimento
bun run dev
```

## Configuração

### 1. Gerar API Token Jira

1. Acesse [Atlassian API Tokens](https://id.atlassian.com/manage-profile/security/api-tokens)
2. Clique em "Create API token"
3. Copie o token gerado

### 2. Configurar CLI

Execute o setup interativo:

```bash
bun run cli
```

A CLI solicitará:

| Campo          | Descrição                      | Exemplo                                                                 |
| -------------- | ------------------------------ | ----------------------------------------------------------------------- |
| **Email Jira** | Email da sua conta Atlassian   | `seu-email@empresa.com`                                                 |
| **API Token**  | Token gerado no passo 1        | `T0K3Nx4P1...`                                                          |
| **Base URL**   | URL da instância Jira          | `https://sua-empresa.atlassian.net`                                     |
| **Task Regex** | Pattern customizado (opcional) | `(?:feature\|bugfix)\/([A-Z]+-\d+)` <br> Deixe vazio para usar o padrão |

### 3. Arquivo de Configuração

As credenciais são salvas em:

```
~/.flxlfx/changelog-cli-config.json
```

Estrutura:

```json
{
  "JIRA_EMAIL": "seu-email@empresa.com",
  "JIRA_TOKEN": "ATATT3xFfGF0...",
  "JIRA_BASE_URL": "https://sua-empresa.atlassian.net",
  "TASK_REGEX": "(?:feature|bugfix)\\/([A-Z]+-\\d+)"
}
```

**Segurança:** Arquivo armazenado fora do repositório, com credenciais em formato JSON.

## Uso

### Modo Desenvolvimento

```bash
bun run dev
```

### Modo Produção

```bash
bun run cli
```

### Fluxo de Uso

1. **Menu Principal**

   - Atualizar CHANGELOG
   - Reconfigurar credenciais
   - Sair

2. **Atualizar CHANGELOG**
   - Escolhe modo de obtenção do issue ID (branch ou manual)
   - Seleciona seção do CHANGELOG
   - Busca dados no Jira
   - Adiciona entrada formatada ao CHANGELOG.md

### Exemplo de Uso

#### Via Branch

```bash
$ git checkout -b feature/ISSUE-1234-implements-code

$ bun run cli
? O que deseja fazer? Atualizar CHANGELOG
? Como deseja obter o issue ID? Extrair do branch atual
? Selecione a seção do CHANGELOG: Added - Nova funcionalidade

🔍 Buscando issue ISSUE-1234...

✅ Adicionado ao CHANGELOG.md [Added]:
   - [ISSUE-1234](https://empresa.atlassian.net/browse/ISSUE-1234) Implementar um código de exemplo
```

#### Via Entrada Manual

```bash
$ bun run cli
? O que deseja fazer? Atualizar CHANGELOG
? Como deseja obter o issue ID? Inserir manualmente
? Digite o issue ID (ex: ISSUE-1234): PROJ-5678
? Selecione a seção do CHANGELOG: Fixed - Correção de bug

🔍 Buscando issue PROJ-5678...

✅ Adicionado ao CHANGELOG.md [Fixed]:
   - [PROJ-5678](https://empresa.atlassian.net/browse/PROJ-5678) Corrigir erro no login
```

### Resultado no CHANGELOG.md

```markdown
## [Unreleased]

### Added

- [ISSUE-1234](https://empresa.atlassian.net/browse/ISSUE-1234) Implementar um código de exemplo
```

## Nomenclatura de Branches

**Nota:** Padrão opcional quando usando entrada manual de issue ID.

A CLI suporta o seguinte padrão de branches:

```
<tipo>/<ISSUE-NUMERO>-<descricao>
```

### Tipos Suportados

| Tipo          | Descrição                            |
| ------------- | ------------------------------------ |
| `feature`     | Nova funcionalidade                  |
| `bugfix`      | Correção de bug                      |
| `hotfix`      | Correção urgente em produção         |
| `task`        | Tarefa técnica                       |
| `chore`       | Manutenção/refatoração               |
| `release`     | Preparação de release                |
| `epic`        | Epic/conjunto de features            |
| `improvement` | Melhoria em funcionalidade existente |

### Exemplos Válidos

```bash
feature/GG-1234-login-oauth
bugfix/API-5678-corrigir-timeout
hotfix/CORE-999-sql-injection
task/DEV-456-atualizar-dependencias
```

### Regex de Detecção

**Padrão Default:**

```regex
(?:feature|hotfix|bugfix|task|chore|release|epic|improvement)\/([A-Z]+-\d+)
```

**Customização:**

Para usar um padrão diferente, configure `TASK_REGEX` no arquivo de configuração ou durante o setup. O regex deve capturar o issue ID no grupo 1.

**Exemplo:**

```json
{
  "TASK_REGEX": "(?:feat|fix)\\/([A-Z]{2,5}-\\d+)"
}
```

## Seções do CHANGELOG

Seguindo [Keep a Changelog](https://keepachangelog.com/):

| Seção          | Quando Usar                              |
| -------------- | ---------------------------------------- |
| **Added**      | Nova funcionalidade                      |
| **Changed**    | Mudança em funcionalidade existente      |
| **Deprecated** | Funcionalidade marcada como obsoleta     |
| **Removed**    | Funcionalidade removida                  |
| **Fixed**      | Correção de bug                          |
| **Security**   | Correção de vulnerabilidade de segurança |

### Formato de Entrada

```markdown
- [ISSUE-ID](URL-JIRA) Summary da Issue
```

## Arquitetura

### Estrutura de Arquivos

```
src/
├── cli.ts                  # CLI interativa, menus, comandos
├── config.ts               # Gerenciamento de configuração (~/.flxlfx)
├── env.ts                  # Schema de validação de environment (Zod)
├── update-changelog.ts     # Lógica de atualização do CHANGELOG
└── utils/
    └── adf-to-markdown.ts  # Conversão Atlassian Document Format
```

### Principais Funções

#### `src/cli.ts`

- `mainMenu()` - Menu principal da CLI
- `setupCommand()` - Configuração de credenciais
- `changelogCommand()` - Fluxo de atualização do CHANGELOG (extração automática ou entrada manual)
- `handleError()` - Tratamento centralizado de erros
- `isPromptCancelled()` - Detecção de cancelamento de prompts

#### `src/update-changelog.ts`

- `updateChangelog(section)` - Orquestra atualização
- `getBranchName()` - Extrai nome da branch via Git
- `fetchIssue(issueId, config)` - Busca dados no Jira API
- `updateChangelogFile(entry, issueId, section)` - Atualiza arquivo
- `ensureUnreleasedSection(lines)` - Garante seção [Unreleased]
- `ensureSection(lines, section)` - Cria seção se não existir

#### `src/config.ts`

- `loadConfig()` - Carrega configuração do disco
- `saveConfig(config)` - Salva configuração
- `validateConfig(config)` - Valida via Zod schema

### Fluxo de Dados

```
Branch Git/Entrada Manual → Issue ID → Jira API → Formatação → CHANGELOG.md
```

### Dependências

| Pacote              | Uso                      |
| ------------------- | ------------------------ |
| `@inquirer/prompts` | Interface interativa CLI |
| `zod`               | Validação de schemas     |
| `bun`               | Runtime e build          |

## Troubleshooting

### ⚠️ Branch não contém issue ID

**Problema:** Branch não segue padrão `<tipo>/<ISSUE-ID>`

**Solução 1:** Use entrada manual de issue ID na CLI

**Solução 2:** Renomeie a branch ou crie nova seguindo o padrão:

```bash
git checkout -b feature/ISSUE-1234-descricao
```

### ❌ Autenticação falhou

**Problema:** Credenciais Jira inválidas

**Solução:**

1. Verifique email e token em `~/.flxlfx/changelog-cli-config.json`
2. Gere novo API token em [Atlassian API Tokens](https://id.atlassian.com/manage-profile/security/api-tokens)
3. Execute reconfiguração: `bun run cli` → Reconfigurar

### ❌ Issue não encontrada

**Problema:** Issue ID não existe no Jira ou sem permissão

**Solução:**

1. Confirme que issue existe: `https://sua-empresa.atlassian.net/browse/ISSUE-ID`
2. Verifique permissões de acesso ao projeto
3. Confirme que Base URL está correta

### ❌ CHANGELOG.md não encontrado

**Problema:** Arquivo CHANGELOG.md não existe no diretório raiz

**Solução:** Crie o arquivo:

```bash
echo "# Changelog\n\n## [Unreleased]" > CHANGELOG.md
```

### ✓ Entry já existe no CHANGELOG.md

**Info:** Entrada já foi adicionada anteriormente. Nenhuma ação necessária.

## Requisitos

### Sistema

- **Bun** >= 1.3.2 (runtime e build)
- **Git** (instalado e repositório inicializado)
- **Node.js** >= 18 (para executar o binário compilado)
- **TypeScript** >= 5 (peer dependency)

### Jira

- Conta Atlassian com acesso ao projeto
- Permissão de leitura nas issues
- API Token ativo

### Repositório

- `CHANGELOG.md` na raiz do projeto
- Branch com nomenclatura padrão `<tipo>/<ISSUE-ID>` (opcional se usar entrada manual)

## Scripts Disponíveis

| Script                | Descrição                               |
| --------------------- | --------------------------------------- |
| `bun run build`       | Compila TypeScript → JavaScript (dist/) |
| `bun run dev`         | Executa CLI em modo desenvolvimento     |
| `bun run cli`         | Executa CLI compilada (produção)        |
| `bun run setup-hooks` | Configura Git hooks (se existirem)      |
