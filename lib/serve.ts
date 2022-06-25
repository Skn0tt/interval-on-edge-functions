import { Workflow } from "./workflow.ts";
import { Session } from "./session.ts";
import { ProtocolMessage } from "./protocol.ts";
import { EdgeFunction } from "netlify:edge";

export function serve(workflows: Record<string, Workflow>): EdgeFunction {
  return async function (request) {
    const workflowName = new URL(request.url).searchParams.get("workflow");
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

    const sessionId = crypto.randomUUID();
    const simpleMQEndpoint = Deno.env.get("SIMPLEMQ_WS_ENDPOINT");
    if (!simpleMQEndpoint) {
      throw new Error("SIMPLEMQ_WS_ENDPOINT env var needs to be set");
    }

    const sock = new WebSocket(simpleMQEndpoint);
    sock.onopen = () => {
      sock.send(sessionId);
    };

    const session = new Session(sessionId, workflow, async (message) => {
      sock.send(JSON.stringify(message));
    });

    sock.onmessage = async (event) => {
      const payload = JSON.parse(event.data) as ProtocolMessage;
      await session.handle(payload);
    };

    return new Response(
      JSON.stringify({
        endpoint: simpleMQEndpoint,
        sessionId,
      }),
      {
        headers: {
          "content-type": "application/json",
        },
      }
    );
  };
}
