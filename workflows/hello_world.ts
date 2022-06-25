import { Workflow } from "../lib/index.ts";

export const hello_world: Workflow = async (io) => {
  const name = await io.string("What's your name?");

  const birthday = await io.boolean("Is it your birthday?");

  const message = birthday ? `Happy Birthday, ${name}!` : `Hello, ${name}!`;

  return {
    success: true,
    message,
  };
};
