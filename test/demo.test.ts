import { TestWorkflowEnvironment } from "@temporalio/testing";
import { Worker } from "@temporalio/worker";
import { describe, expect, it } from "vitest";
import * as activities from "../src/activities.js";
import { demo, healthcheck } from "../src/workflows.js";

describe("demo workflow", () => {
  it("waits for the healthcheck signal then pings through the activity", async () => {
    const env = await TestWorkflowEnvironment.createTimeSkipping();
    try {
      const { client, nativeConnection } = env;
      const worker = await Worker.create({
        connection: nativeConnection,
        namespace: "default",
        taskQueue: "orbit-test",
        workflowsPath: new URL("../src/workflows.ts", import.meta.url).pathname,
        activities,
      });

      const run = (async () => {
        const handle = await client.workflow.start(demo, {
          workflowId: "demo-1",
          taskQueue: "orbit-test",
        });
        await handle.signal(healthcheck);
        const result = await handle.result();
        expect(result).toBe("pong");
      })();

      await worker.runUntil(run);
    } finally {
      await env.teardown();
    }
  });
});
