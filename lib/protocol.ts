export interface StartMessage {
  type: "start";
}

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

export interface Result {
  type: "result";
  payload: any;
}

export type ProtocolMessage = StartMessage | Prompt | Reply | Result;
