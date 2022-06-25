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
      const eventSource = new EventSource(
        `${this.endpoint}?workflow=${workflowName}`
      );

      const sendReply = (promptId: string, result: any) =>
        fetch(
          `${this.endpoint}?promptId=${promptId}&result=${btoa(
            JSON.stringify(result)
          )}`
        );

      eventSource.onmessage = async (event) => {
        const message = JSON.parse(event.data) as ProtocolMessage;
        switch (message.type) {
          case "prompt":
            const method = promptUI[message.kind];
            const answer = await method(message.prompt);
            await sendReply(message.id, answer);
            return;
          case "result":
            resolve(message.payload);
            return;
        }
      };
    });
  }
}
