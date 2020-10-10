import Telegraf from 'telegraf'
import { TelegrafContext } from 'telegraf/typings/context'
import { Chat, ChatModel } from '../models/Chat'
import { TrackRecord } from './getTracking'
import { getUpdatedTrack } from './getUpdatedTrack'

export async function checkUpdates<T extends TelegrafContext>(
	bot: Telegraf<T>,
): Promise<void> {
	const isChatAlive = (chatId: string | number): Promise<boolean> =>
		bot.telegram
			.sendChatAction(chatId, 'typing')
			.then(() => true)
			.catch(() => false)

	const chatsWithTrackings = await ChatModel.find({
		trackings: { $exists: true, $ne: [] },
	})

	const aliveChats: Chat[] = []

	for (const chat of chatsWithTrackings) {
		const isAlive = await isChatAlive(chat.chatId)

		if (isAlive) {
			aliveChats.push(chat)
		}
	}

	const results = await Promise.allSettled(
		aliveChats.map(async (chat) => {
			const updates: {
				trackingID: string
				latestTrack: TrackRecord
			}[] = []

			for (const tracking of chat.trackings) {
				const updatedTrack = await getUpdatedTrack(chat, tracking.trackingID)
				if (updatedTrack.length > 0) {
					tracking.track = updatedTrack

					const latestTrack = updatedTrack[0]

					if (latestTrack) {
						updates.push({
							trackingID: tracking.trackingID,
							latestTrack,
						})
					}
				}

				tracking.lastCheckAt = new Date()
			}

			await chat.save()

			return { chatId: chat.chatId, updates }
		}),
	)

	for (const result of results) {
		if (result.status === 'rejected') {
			// eslint-disable-next-line no-console
			console.log(`Error: ${result.reason}`)
			continue
		}

		const { chatId, updates } = result.value

		for (const update of updates) {
			await bot.telegram.sendMessage(
				chatId,
				[
					update.trackingID,
					update.latestTrack.date,
					update.latestTrack.description,
					update.latestTrack.name,
					`https://litemf.com/ru/tracking/${update.trackingID}`,
				]
					.filter(Boolean)
					.join('\n'),
				{ disable_web_page_preview: true },
			)
		}
	}
}
