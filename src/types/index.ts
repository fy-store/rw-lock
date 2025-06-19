export interface Options {}

export type TaskType = 'read' | 'write'

export interface Task {
	type: TaskType
	cb: () => Promise<any>
	promise: Promise<any>
	resolve: (value: any) => void
	reject: (reason?: any) => void
}
