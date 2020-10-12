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

	const chatsWithTrackings = await ChatModel.find({ ['trackings.isCompleted']: false })

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
				isCompleted: boolean
				latestTrack: TrackRecord
			}[] = []

			const inCompleteTrackings = chat.trackings.filter(
				(tracking) => !tracking.isCompleted,
			)

			for (const tracking of inCompleteTrackings) {
				const updatedTrack = await getUpdatedTrack(chat, tracking.trackingID)

				const [latestTrack] = updatedTrack

				if (latestTrack) {
					const isCompleted = latestTrack.description === 'Выдано'
					tracking.track = updatedTrack
					tracking.isCompleted = isCompleted

					updates.push({ trackingID: tracking.trackingID, latestTrack, isCompleted })
				}

				tracking.lastCheckAt = new Date()
			}

			await chat.save()

			return { chat, updates }
		}),
	)

	for (const result of results) {
		if (result.status === 'rejected') {
			// eslint-disable-next-line no-console
			console.log(`Error: ${result.reason}`)
			continue
		}

		const { chat, updates } = result.value

		for (const update of updates) {
			try {
				await bot.telegram.sendMessage(
					chat.chatId,
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

				if (update.isCompleted) {
					await bot.telegram.sendMessage(
						chat.chatId,
						`Завершено отслеживание посылки ${update.trackingID}`,
					)
				}
			} catch (err) {
				// eslint-disable-next-line no-console
				console.error(`Error sending to chat ${chat.chatId}`)
			}
		}
	}
}
