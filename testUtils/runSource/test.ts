import { assertEquals, assertRejects } from "https://deno.land/std@0.198.0/assert/mod.ts";
import { assertSpyCall, spy} from "https://deno.land/std@0.165.0/testing/mock.ts";
import { runSource } from "./mod.ts"

Deno.test("throws when source returns wrong type", () => {
  const run = async () => {
    //@ts-ignore intentionally wrong for test
    await runSource(() => 4)
  }
  assertRejects(run)
})

Deno.test("throws when source returns invalid json", () => {
  const run = async () => {
    await runSource(() => "{x")
  }
  assertRejects(run)
})

Deno.test("handles simple data case", async () => {
  const result = await runSource(() => JSON.stringify({data: {test: "123"}}))
  assertEquals(result, [{"test": "123"}])
})

Deno.test("handles list data case", async () => {
  const result = await runSource(() => JSON.stringify({data: [{test: "123"}]}))
  assertEquals(result, [{"test": "123"}])
})

Deno.test("exits early when no data is returned", async () => {
  const result = await runSource((pageToken: string) => {
    if (!pageToken) {
      return JSON.stringify({data: {}, nextPageToken: "1"})
    }

    return JSON.stringify({data: {test: "456"}})
  })
  
  assertEquals(result, [])
})

Deno.test("handles pagination", async () => {
  const result = await runSource((pageToken: string) => {
    if (!pageToken) {
      return JSON.stringify({data: {test: "123"}, nextPageToken: "1"})
    }

    return JSON.stringify({data: {test: "456"}})
  })
  assertEquals(result, [{"test": "123"}, {"test": "456"}])
})

Deno.test("calls callback function", async () => {
  const logSpy = spy(console, "log");
	await runSource<{test: string}>(() => JSON.stringify({data: {test: "123"}}),  {onSourceInvocation: (data) => {
    console.log(data.data.test)
  }});
  assertSpyCall(logSpy, 0, {
    args: ["123"]
  });
});