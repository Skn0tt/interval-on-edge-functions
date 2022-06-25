import { Workflow } from "./workflow.ts";
import { Session } from "./session.ts";
import { ProtocolMessage } from "./protocol.ts";
import { EdgeFunction } from "netlify:edge";

export function serve(workflows: Record<string, Workflow>): EdgeFunction {
  return async function (request) {
    const workflowName = new URL(request.url).searchParams.get("name");
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

    const { response, socket } = Deno.upgradeWebSocket(request);

    socket.onopen = async () => {
      const session = new Session(workflow, async (message) => {
        socket.send(JSON.stringify(message));
      });

      socket.onmessage = async (event) => {
        const payload = JSON.parse(event.data) as ProtocolMessage;
        await session.handle(payload);
      };

      await session.run();
      socket.close();
    };

    return response;
  };
}
