import { auth } from "../../utils/auth";

export default defineEventHandler((event) => {
  const webRequest = toWebRequest(event);

  console.log("webRequest", webRequest);

  return auth.handler(webRequest);
});
