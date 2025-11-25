import { z } from "zod";

const envSchema = z.object({
  JIRA_EMAIL: z.email(),
  JIRA_TOKEN: z.string(),
  JIRA_BASE_URL: z.url(),
});

export const env = envSchema.parse(process.env);
