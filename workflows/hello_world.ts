import { Workflow } from "../lib/index.ts";

export const hello_world: Workflow = async (io, ctx) => {
  const name = await io.string("What's your name?");

  return {
    success: true,
    message: `Hello, ${name}!`,
  };
};
