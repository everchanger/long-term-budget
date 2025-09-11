import { auth } from "~~/lib/auth";

export default defineEventHandler(async (event) => {
  console.log("got auth request", event.node.req.url);
  return auth.handler(toWebRequest(event));
});
