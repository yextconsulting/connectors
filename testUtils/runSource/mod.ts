type ConnectorSource = (nextPageToken: string) => string | Promise<string>

export interface SourceResponse<T extends object> {
  nextPageToken?: string;
  data: T;
}

type ConnectorOptions<T extends object> = {
  onSourceInvocation: (response: SourceResponse<T>) => void;
}

function dataIsEmpty(data: object) {
  if (Array.isArray(data) && data.length === 0) return true;

  if (JSON.stringify(data) === '{}') return true;

  return false;
}

export async function runSource<T extends object>(connectorFunction: ConnectorSource, options?: ConnectorOptions<T>) {
  const data = [];
  let response;
  let nextPageToken = "";
  
  do {
    const responseJSON = await connectorFunction(nextPageToken ? JSON.stringify({pageToken: nextPageToken}) : "");
    if (typeof responseJSON !== 'string') {
      throw new Error(`Connector Source must return a JSON string, instead found ${typeof responseJSON}: ${responseJSON}`)
    }

    try {
      response = JSON.parse(responseJSON);
    } catch (e) {
      throw new Error(`Connector Source must return a JSON string, error parsing: ${e}`)
    }

    nextPageToken = response.nextPageToken;

    if (!dataIsEmpty(response.data)) {
      if (Array.isArray(response.data)) {
        data.push(...response.data)
      } else {
        data.push(response.data);
      }
    }

    options?.onSourceInvocation(response);
  } while (nextPageToken && !dataIsEmpty(response.data));

  return data
}