import { ITask, TaskActions, State } from "../TaskQueue.ts"
import { YEXT_API_BASE } from "../consts.ts"

const TaskOneSymbol = Symbol();

interface TaskOneState {
	entityCount: number;
}

export class GetEntityCountTask implements ITask<State> {
	apiKey: string;

	static getCount(s: State): number {
		return s[TaskOneSymbol].entityCount;
	}

	constructor(apiKey: string) {
		this.apiKey = apiKey;
	}

	async action(s: State, {finish, addData}: TaskActions): Promise<State> {
    const entityCountResponse = await fetch(`${YEXT_API_BASE}entities?api_key=${this.apiKey}&v=20230101`)
		.then(r => r.json())
		.then(r => r.response);

		const newState: TaskOneState = {entityCount: entityCountResponse["count"]};
		s[TaskOneSymbol] = newState;
		console.log(`Retrieved ${GetEntityCountTask.getCount(s)} entities`);
		finish();
		addData([{'entityCount': GetEntityCountTask.getCount(s)}]);
		return s;
	}
}
