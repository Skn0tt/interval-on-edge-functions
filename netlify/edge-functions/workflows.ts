import { serve } from "../../lib/index.ts";
import { hello_world } from "../../workflows/hello_world.ts";

export default serve({
  hello_world,
});
