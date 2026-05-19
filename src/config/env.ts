import * as dotenv from 'dotenv';
import type { FrameworkConfig } from '../types';

dotenv.config();

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

function requireEnvInt(name: string): number {
  const raw = requireEnv(name);
  const parsed = parseInt(raw, 10);
  if (isNaN(parsed)) throw new Error(`Environment variable ${name} must be a number, got: "${raw}"`);
  return parsed;
}

export const config: FrameworkConfig = Object.freeze({
  d365Url: requireEnv('D365_URL'),
  d365Username: requireEnv('D365_USERNAME'),
  d365Password: requireEnv('D365_PASSWORD'),
  adoOrgUrl: requireEnv('ADO_ORG_URL'),
  adoProject: requireEnv('ADO_PROJECT'),
  adoPat: requireEnv('ADO_PAT'),
  adoPlanId: requireEnvInt('ADO_PLAN_ID'),
  adoSuiteId: requireEnvInt('ADO_SUITE_ID'),
});
