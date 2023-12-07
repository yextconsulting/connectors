import {exampleEntityFunction} from "./connector-plugin/mod.ts";

type ConnectorSource = (nextPageToken: string) => Promise<string>

export async function run(connectorFunction: ConnectorSource) {
  const data = [];
  const responseJSON = await connectorFunction(JSON.stringify({}));
  let response = JSON.parse(responseJSON);
  data.push(...response.data);
  console.log("\nresponse size:", response.data.length)
  console.log("response next page token:", response.nextPageToken)

  while (response.nextPageToken) {
      const responseJSON = await connectorFunction(JSON.stringify({pageToken: response.nextPageToken}));
      response = JSON.parse(responseJSON);
      data.push(...response.data);
      console.log("\nresponse size:", response.data.length)
      console.log("response next page token:", response.nextPageToken)
  }

  console.log("end")
  console.log(data);
  console.log("total updates returned: ", data.length)
}

// deno run --allow-net test.ts
run(exampleEntityFunction)
