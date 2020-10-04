import { isEqual } from 'lodash'
import { Chat } from '../models/Chat'
import { getTracking } from './getTracking'

type CheckResult = {
	chatId: string
	trackingId: string
	latestTrack: { date: string; description: string; name: string }
}

export async function checkUpdates(chats: Chat[]): Promise<CheckResult[]> {
	const data: CheckResult[] = []

	for (const chat of chats) {
		for (const tracking of chat.trackings) {
			const newTrack = await getTracking(tracking.trackingID)

			const oldTrack = tracking.track.map((el) => ({
				date: el.date,
				description: el.description,
				name: el.name,
			}))

			if (!isEqual(oldTrack, newTrack)) {
				tracking.track = newTrack

				const latestTrack = newTrack[0]

				if (latestTrack) {
					data.push({
						chatId: chat.chatId,
						trackingId: tracking.trackingID,
						latestTrack,
					})
				}
			}

			tracking.lastCheckAt = new Date()
		}

		await chat.save()
	}

	return data
}
