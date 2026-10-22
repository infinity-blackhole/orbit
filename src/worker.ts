import { NativeConnection, Worker } from "@temporalio/worker";
import * as activities from "./activities.js";

async function run(): Promise<void> {
  const connection = await NativeConnection.connect({
    address: process.env.TEMPORAL_ADDRESS ?? "localhost:7233",
  });
  const worker = await Worker.create({
    connection,
    namespace: "default",
    taskQueue: "orbit",
    workflowsPath: new URL("./workflows.ts", import.meta.url).pathname,
    activities,
  });
  await worker.run();
}

run().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
