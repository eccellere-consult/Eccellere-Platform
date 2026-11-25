/**
 * Server-only wiring for the AI Control Tower (see ./hook.ts for what is reported and why it is safe).
 * Settings (set on the host, never in the code): AIOPS_ENDPOINT and AIOPS_KEY. Without both, this does nothing.
 */
import { createControlTower } from "./client";
import { makeAiopsReporter } from "./hook";

export const aiops = makeAiopsReporter({ env: process.env, create: createControlTower });
