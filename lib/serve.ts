import { Workflow } from "./workflow.ts";
import { Session } from "./session.ts";
import { ProtocolMessage } from "./protocol.ts";
import { EdgeFunction } from "netlify:edge";

export function serve(workflows: Record<string, Workflow>): EdgeFunction {
  return async function (request) {
    const url = new URL(request.url);

    const promptId = url.searchParams.get("promptId");
    if (promptId) {
      const resultB64 = url.searchParams.get("result");
      if (!resultB64) {
        throw new Error("parameter `result` is required");
      }
      const result = JSON.parse(atob(resultB64));
      Session.submitPromptResult(promptId, result);
      return new Response(undefined, { status: 202 });
    }

    const workflowName = url.searchParams.get("workflow");
    if (!workflowName) {
      return new Response(JSON.stringify(Object.keys(workflows)), {
        headers: {
          "Content-Type": "application/json",
        },
      });
    }

    const workflow = workflows[workflowName];
    if (!workflow) {
      return new Response(null, {
        status: 404,
      });
    }

    let session: Session | undefined = undefined;

    const body = new ReadableStream({
      async start(controller) {
        async function send(message: ProtocolMessage) {
          const json = JSON.stringify(message);
          const msg = new TextEncoder().encode(`data: ${json}\r\n`);
          controller.enqueue(msg);
        }

        session = new Session(workflow, send);
        const result = await session.run();
        await send({
          type: "result",
          payload: result,
        });
      },
      cancel() {
        session?.cancel();
      },
    });

    return new Response(body, {
      headers: {
        "content-type": "text/event-stream",
      },
    });
  };
}
