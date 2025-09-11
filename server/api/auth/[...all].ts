import { auth } from "@s/utils/auth";

export default defineEventHandler(async (event) => {
  console.log("got auth request", event.node.req.url);
  return auth.handler(toWebRequest(event));
});
