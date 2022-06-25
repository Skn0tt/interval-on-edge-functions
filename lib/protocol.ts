import type { Result } from "./workflow.ts";
export interface PromptMessage {
  type: "prompt";
  prompt: string;
  kind: "string" | "boolean";
  id: string;
}

export interface ResultMessage {
  type: "result";
  payload: Result;
}

export type ProtocolMessage = PromptMessage | ResultMessage;
