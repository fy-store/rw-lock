import { describe, it, expect } from 'vitest'
import { Lock } from '../src/index.js'

describe('new Lock()', () => {
	it('test exec()', async () => {
		const lock = new Lock()
		const resultList: any[] = []
		lock.exec('read', async () => {
			resultList.push(1)
		})

		lock.exec('read', async () => {
			resultList.push(2)
			expect(resultList).toEqual([1, 2])
		})

		lock.exec('write', async () => {
			expect(lock.isLock).toBe(true)
			return new Promise((resolve) => {
				setTimeout(() => {
					resultList.push(3)
					expect(resultList).toEqual([1, 2, 3])
					resolve(resultList)
				}, 10)
			})
		})

		// be subjected to the write locking, wait for the lock release
		await lock.exec('read', async () => {
			resultList.push(4)
			expect(resultList).toEqual([1, 2, 3, 4])
		})

		expect(lock.runningLength).toBe(0)
		expect(lock.waitLength).toBe(0)
		expect(lock.isLock).toBe(false)
	})
})
