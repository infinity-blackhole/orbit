import { log } from "@temporalio/activity";

export async function ping(): Promise<string> {
  log.info("activity ping");
  return "pong";
}
