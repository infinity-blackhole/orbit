import { describe, expect, it } from "vitest";
import { loadSpecs, parseSpec, SpecError } from "../../src/spec/loader.js";

const validYaml = (name: string) => `name: ${name}
source: https://github.com/shikanime-labs/orbit.git
ref: refs/heads/main
output: ghcr.io/shikanime-labs/${name}:latest
`;

describe("parseSpec", () => {
  it("parses a valid spec to the typed shape", async () => {
    const spec = await parseSpec("test.yaml", validYaml("hello"));
    expect(spec).toEqual({
      name: "hello",
      source: "https://github.com/shikanime-labs/orbit.git",
      ref: "refs/heads/main",
      output: "ghcr.io/shikanime-labs/hello:latest",
    });
  });

  it("errors on a missing required field", async () => {
    const err = await parseSpec(
      "bad.yaml",
      "name: hello\nref: refs/heads/main\n",
    ).catch((e: unknown) => e);
    expect(err).toBeInstanceOf(SpecError);
    expect((err as SpecError).path).toBe("bad.yaml");
    expect((err as SpecError).message).toContain("source");
  });

  it("errors on an unknown field", async () => {
    const err = await parseSpec(
      "bad.yaml",
      `${validYaml("hello")}surprise: true\n`,
    ).catch((e: unknown) => e);
    expect(err).toBeInstanceOf(SpecError);
    expect((err as SpecError).message).toContain("surprise");
  });

  it("errors on a malformed ref", async () => {
    const err = await parseSpec(
      "bad.yaml",
      validYaml("hello").replace("refs/heads/main", "main..other"),
    ).catch((e: unknown) => e);
    expect(err).toBeInstanceOf(SpecError);
    expect((err as SpecError).message).toContain("malformed git ref");
  });

  it("errors on broken YAML with the file path and line", async () => {
    const err = await parseSpec("broken.yaml", "name: [unclosed\n").catch(
      (e: unknown) => e,
    );
    expect(err).toBeInstanceOf(SpecError);
    expect((err as SpecError).path).toBe("broken.yaml");
    expect((err as SpecError).message).toMatch(/line \d+/);
  });
});

describe("loadSpecs", () => {
  it("returns exactly the fixture's specs, sorted", async () => {
    const specs = await loadSpecs(
      new URL("../../testdata/specs", import.meta.url).pathname,
    );
    expect(specs.map((s) => s.name)).toEqual(["hello", "world"]);
  });
});
