import { Result } from "./workflow.ts"

export interface Prompt {
  type: "prompt";
  prompt: string;
  kind: "string" | "boolean";
  id: string;
}

export interface Reply {
  type: "reply";
  id: string;
  result: any;
}

export interface ResultMessage {
  type: "result";
  payload: Result;
}

export type ProtocolMessage = Prompt | Reply | ResultMessage;
