import { Workflow, Result } from "./workflow.ts";

interface StartMessage {
  type: "start";
}

interface Prompt {
  type: "prompt";
  prompt: string;
  kind: "string" | "boolean";
  id: string;
}

interface Reply {
  type: "reply";
  id: string;
  result: any;
}

export type ProtocolMessage = StartMessage | Prompt | Reply;

export class Session {
  public result?: Result;

  constructor(
    private readonly sessionId: string,
    private readonly workflow: Workflow,
    private readonly dispatch: (message: ProtocolMessage) => Promise<void>
  ) {}

  async handle(message: ProtocolMessage) {
    switch (message.type) {
      case "start":
        this.start();
        return;
      case "reply":
        this.reply(message);
        return;
      default:
        console.error("not handled: ", message);
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

  start() {
    this.workflow(
      {
        bool: (q) => this.prompt(q, "boolean"),
        string: (q) => this.prompt(q, "string"),
      },
      {
        sessionId: this.sessionId,
      }
    )
      .then((result) => {
        this.result = result;
      })
      .catch((failure) => {
        console.error(failure);
      });
  }
}
