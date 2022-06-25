import { Workflow, Result } from "./workflow.ts";
import { ProtocolMessage, Reply } from "./protocol.ts";

export class Session {
  constructor(
    private readonly workflow: Workflow,
    private readonly dispatch: (message: ProtocolMessage) => Promise<void>
  ) {}

  async handle(message: ProtocolMessage) {
    switch (message.type) {
      case "reply":
        this.reply(message);
        return;
      default:
        return;
    }
  }

  private readonly prompts = new Map<string, (result: any) => void>();

  async prompt(question: string, type: "boolean"): Promise<boolean>;
  async prompt(question: string, type: "string"): Promise<string>;
  async prompt<T>(question: string, kind: "boolean" | "string"): Promise<T> {
    return new Promise<T>(async (resolve) => {
      const id = crypto.randomUUID();
      this.prompts.set(id, resolve);
      await this.dispatch({
        type: "prompt",
        prompt: question,
        id,
        kind,
      });
    });
  }

  reply(message: Reply) {
    const prompt = this.prompts.get(message.id);
    if (!prompt) {
      return;
    }

    prompt(message.result);
  }

  async run(): Promise<Result> {
    const result = await this.workflow(
      {
        boolean: (q) => this.prompt(q, "boolean"),
        string: (q) => this.prompt(q, "string"),
      },
      {
        sessionId: "",
      }
    );
    await this.dispatch({
      type: "result",
      payload: result,
    });
    return result;
  }
}
