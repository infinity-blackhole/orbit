import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { z } from "zod";

const refPattern = /^(?!.*\.\.)\S+$/;

export const buildSpecSchema = z.strictObject({
  name: z.string().regex(/^[a-z0-9][a-z0-9-]*$/),
  source: z.url(),
  ref: z.string().regex(refPattern, "malformed git ref"),
  output: z.string().min(1),
});

export type BuildSpec = z.infer<typeof buildSpecSchema>;

/** A spec that failed to load, naming the file and the reason. */
export class SpecError extends Error {
  constructor(
    readonly path: string,
    reason: string,
  ) {
    super(`${path}: ${reason}`);
    this.name = "SpecError";
  }
}

/** Parse one spec file's text into a BuildSpec. Throws SpecError with the file path and reason. */
export async function parseSpec(
  filePath: string,
  text: string,
): Promise<BuildSpec> {
  const { parse } = await import("yaml");
  let data: unknown;
  try {
    data = parse(text, { strict: false });
  } catch (err) {
    throw new SpecError(
      filePath,
      err instanceof Error ? err.message : String(err),
    );
  }
  const result = buildSpecSchema.safeParse(data);
  if (!result.success) {
    const issue = result.error.issues[0];
    const reason = issue
      ? `${issue.path.join(".") || "(root)"}: ${issue.message}`
      : result.error.message;
    throw new SpecError(filePath, reason);
  }
  return result.data;
}

const specExtensions = new Set([".yaml", ".yml"]);

/**
 * Load every BuildSpec declared in a directory of git-tracked spec files.
 * Throws SpecError on the first invalid file.
 */
export async function loadSpecs(dir: string): Promise<BuildSpec[]> {
  const entries = (await readdir(dir))
    .filter((name) => specExtensions.has(path.extname(name)))
    .sort();
  const specs: BuildSpec[] = [];
  for (const name of entries) {
    const filePath = path.join(dir, name);
    specs.push(await parseSpec(filePath, await readFile(filePath, "utf8")));
  }
  return specs;
}
