import { Client, PromptUI } from "../lib/client";
import { Result } from "../lib/workflow";
import "water.css/out/water.css";
import sweetalert from "sweetalert";

const promptUI: PromptUI = {
  async boolean(question) {
    const result = await sweetalert(question, {
      buttons: ["No", "Yes"],
    });
    return Boolean(result);
  },
  async string(question) {
    const result = await sweetalert(question, {
      content: {
        element: "input",
      },
    });

    return result;
  },
};

function onResult(result: Result) {
  sweetalert(result.message, {
    icon: result.success ? undefined : "warning",
  });
}

async function setupUI() {
  const workflowListEl = document.getElementById(
    "workflow-list"
  ) as HTMLUListElement;

  const client = new Client("/workflows");
  const workflows = await client.workflows();

  workflowListEl.children.item(0)?.remove();
  for (const workflow of workflows) {
    const button = document.createElement("button");
    button.innerText = workflow.name;
    button.onclick = async () => {
      const result = await workflow.start(promptUI);
      onResult(result);
    };
    workflowListEl.appendChild(button);
  }
}

setupUI();
