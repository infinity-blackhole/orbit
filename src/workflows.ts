import {
	ApplicationFailure,
	condition,
	defineSignal,
	proxyActivities,
	setHandler,
} from "@temporalio/workflow";
import type * as activities from "./activities.js";

const healthcheck = defineSignal("healthcheck");

const { ping } = proxyActivities<typeof activities>({
	startToCloseTimeout: "30s",
});

/** Demo workflow proving the loop: waits for a healthcheck signal, runs one activity, returns its result. */
export async function demo(): Promise<string> {
	let healthy = false;
	setHandler(healthcheck, () => {
		healthy = true;
	});

	if (!(await condition(() => healthy, 30_000))) {
		throw ApplicationFailure.nonRetryable(
			"healthcheck signal not received within 30s",
		);
	}

	return ping();
}

export { healthcheck };
