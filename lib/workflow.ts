export interface IO {
  string(prompt: string): Promise<string>
  bool(prompt: string): Promise<boolean>
}

export interface Context {
  sessionId: string;
}

export interface Result {
  message: string;
  success: boolean;
}

export type Workflow = (io: IO, ctx: Context) => Promise<Result>
