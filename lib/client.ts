import type { Result } from "./workflow.ts";
import type { ProtocolMessage } from "./protocol.ts";

export interface PromptUI {
  string(question: string): Promise<string>;
  boolean(question: string): Promise<boolean>;
}

export interface Workflow {
  name: string;
  start(promptUI: PromptUI): Promise<Result>;
}

export class SessionState {
  public result?: Result;
  constructor(public readonly id: string) {}

  setResult(value: Result) {
    this.result = value;
    for (const listener of this.listeners) {
      listener(value);
    }
  }

  private readonly listeners: ((result: Result) => void)[] = [];
  onResult(listener: (result: Result) => void) {
    this.listeners.push(listener);
  }
}

export class Client {
  constructor(private readonly endpoint: string) {}

  async workflows(): Promise<Workflow[]> {
    const response = await fetch(this.endpoint);
    const workflowNames = (await response.json()) as string[];

    return workflowNames.map((name) => ({
      name,
      start: (promptUI) => this.start(name, promptUI),
    }));
  }

  private async start(
    workflowName: string,
    promptUI: PromptUI
  ): Promise<Result> {
    return new Promise<Result>((resolve) => {
      const url = new URL(this.endpoint, location as any);
      url.searchParams.set("name", workflowName);
      url.protocol = url.protocol.replace("http", "ws");
      const socket = new WebSocket(url.toString());
      function dispatch(message: ProtocolMessage) {
        socket.send(JSON.stringify(message));
      }

      socket.onmessage = async (event) => {
        const message = JSON.parse(event.data) as ProtocolMessage;

        switch (message.type) {
          case "prompt":
            const method = promptUI[message.kind];
            const answer = await method(message.prompt);
            dispatch({
              type: "reply",
              id: message.id,
              result: answer,
            });
            return;
          case "result":
            resolve(message.payload);
            return;
        }
      };
    });
  }
}
