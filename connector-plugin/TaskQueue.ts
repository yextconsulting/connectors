export interface TaskActions {
	finish: () => void
	addData: (data: any[]) => void
}

export interface State {
	[key: Symbol]: Record<string, unknown>
}

export const initialState: State = {}

export interface ITask<State> {
	action(S: State, T: TaskActions): Promise<State>
}

export class TaskQueue<State> {
	queue: ITask<State>[] = [];
	state: State;
	data: any[] = [];
	startTime: Date;
	finishIndicators: boolean[];
	isNotFirstRun: boolean;

	constructor(ts: ITask<State>[], pageToken: string) {
		this.queue = ts
		this.startTime = new Date();
		const state = this.decodeNextPageToken(pageToken)?.state || initialState;
		const finishIndicators = this.decodeNextPageToken(pageToken)?.finishIndicators || []

		this.state = state
		this.finishIndicators = finishIndicators.length ? finishIndicators : ts.map(_ => false);
		this.isNotFirstRun = this.decodeNextPageToken(pageToken)?.isNotFirstRun || false
	}

	add(item: ITask<State>): void {
		this.queue.push(item);
		this.finishIndicators.push(false);
	}

	async run() {
		// make the first page always return immediately without doing anything and only actually start running tasks on the second invocation
		if (!this.isNotFirstRun) {
			let dummyData = [{
				"ID": 0,
			}];
			return this.encodeNextPageToken(true, dummyData);
		}

		const returnData: any = [];
		for (const [i, task] of this.queue.entries()) {
			// paginate
			while (!this.finishIndicators[i]) {
				this.state = await task.action(this.state, {
					finish: () => this.finishIndicators[i] = true,
					addData: (data) => returnData.push(...data),
				});

				// if not enough time left for next task
				// start the next connector rotation with info about present state
				if (timeToStop(this.startTime)) {
					let pageTokenData = returnData.length ? returnData : [{
						"ID": 0,
					}];
					return this.encodeNextPageToken(true, pageTokenData);
				}
			}
		}

		return JSON.stringify({
			data: returnData,
		})
	}

	encodeNextPageToken(isNotFirstRun: boolean, data: object): string {
		return JSON.stringify({
			data: data,
			nextPageToken: JSON.stringify({
				state: this.state,
				finishIndicators: this.finishIndicators,
				isNotFirstRun: isNotFirstRun,
			}),
		});
	}

	decodeNextPageToken(pageToken: string): any {
		return JSON.parse(JSON.parse(pageToken || '{}')?.pageToken || '{}');
	}
}

function timeToStop(start: Date): boolean {
	// each connector run is 30 seconds max, stop the current progress if it hits 23 seconds to be safe
	return ((new Date()).getTime() >= start.getTime() + (23*1000))
}
