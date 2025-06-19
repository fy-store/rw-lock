import type { Options, Task, TaskType } from './types/index.js'

const types: TaskType[] = ['read', 'write']

export class Lock {
	#lock = false
	#runningLength = 0
	#tasks: Task[] = []

	/**
	 * wirte locking
	 */
	get isLock() {
		return this.#lock
	}

	/**
	 * running tasks length
	 */
	get runningLength() {
		return this.#runningLength
	}

	/**
	 * wait run tasks length
	 */
	get waitLength() {
		return this.#tasks.length
	}

	constructor(options?: Options) {}

	/**
	 * Promise.try Polyfill
	 */
	try<T extends (...args: any[]) => any>(fn: T): Promise<Awaited<ReturnType<T>>> {
		return new Promise((resolve, reject) => {
			try {
				resolve(fn())
			} catch (error) {
				reject(error)
			}
		})
	}

	/**
	 * execute a task
	 * @param type task type, support 'read' and 'write'
	 * - read task with parallel execute
	 * - write task shall clog after tasks, until write task finished
	 * @param task
	 * @returns task return value
	 */
	async exec<T extends (...args: any[]) => any>(type: TaskType, task: T): Promise<Awaited<ReturnType<T>>> {
		if (!types.includes(type)) {
			throw new TypeError(`Invalid task type: ${String(type)} , allowed types are: ${types.join(', ')}`)
		}
		if (typeof task !== 'function') {
			throw new TypeError(`task allowed only as function`)
		}

		const { promise, resolve, reject } = Promise.withResolvers<Awaited<ReturnType<T>>>()
		const info: Task = { type, cb: task, promise, resolve, reject }
		this.#tasks.push(info)
		Promise.resolve().then(() => this.#runTasks())
		return promise
	}

	#runTasks() {
		while (this.#tasks.length) {
			if (this.#lock) return
			if (this.#tasks[0].type === 'read') {
				this.#runningLength++
				const task = this.#tasks.shift() as Task
				this.try(task.cb)
					.then((result) => {
						task.resolve(result)
					})
					.catch((error) => {
						task.reject(error)
					})
					.finally(() => {
						this.#runningLength--
						if (!this.#lock) {
							this.#runTasks()
						}
					})
			} else {
				if (this.#runningLength > 0) return
				this.#lock = true
				const task = this.#tasks.shift() as Task
				this.try(task.cb)
					.then((result) => {
						task.resolve(result)
					})
					.catch((error) => {
						task.reject(error)
					})
					.finally(() => {
						this.#lock = false
						this.#runningLength--
						this.#runTasks()
					})
			}
		}
	}
}
