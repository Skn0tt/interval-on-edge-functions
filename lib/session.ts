import { Workflow } from "./workflow.ts";
import { PromptMessage } from "./protocol.ts";

export class Session {
  constructor(
    private readonly workflow: Workflow,
    private readonly sendPrompt: (message: PromptMessage) => Promise<void>
  ) {}

  static submitPromptResult(promptId: string, result: any) {
    const channel = new BroadcastChannel(promptId);
    channel.postMessage(result);
  }

  private channels = new Set<BroadcastChannel>();

  private async prompt(question: string, type: "boolean"): Promise<boolean>;
  private async prompt(question: string, type: "string"): Promise<string>;
  private async prompt<T>(
    question: string,
    kind: "boolean" | "string"
  ): Promise<T> {
    return new Promise<T>(async (resolve) => {
      const promptId = crypto.randomUUID();
      this.sendPrompt({
        type: "prompt",
        id: promptId,
        kind,
        prompt: question,
      });

      const channel = new BroadcastChannel(promptId);
      channel.addEventListener("message", (event) => {
        const result = event.data as T;
        resolve(result);
        channel.close();
        this.channels.delete(channel);
      });
      this.channels.add(channel);
    });
  }

  private readonly abortController = new AbortController();

  async run() {
    return await this.workflow(
      {
        boolean: (q) => this.prompt(q, "boolean"),
        string: (q) => this.prompt(q, "string"),
      },
      {
        abortController: this.abortController,
      }
    );
  }

  cancel() {
    this.abortController.abort();
    this.channels.forEach((channel) => channel.close());
  }
}
