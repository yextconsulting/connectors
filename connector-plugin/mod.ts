import { TaskQueue } from "./TaskQueue.ts";

import { GetEntityCountTask } from "./tasks/GetEntityCount.ts";


export function exampleEntityFunction(nextPageToken?: string): Promise<string> {
	const queue = new TaskQueue([], nextPageToken || '');
	queue.add(new GetEntityCountTask('Insert your API key here'));
	return queue.run();
}
