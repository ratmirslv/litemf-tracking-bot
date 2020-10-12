import { TelegrafContext } from 'telegraf/typings/context'

import { ChatModel } from '../models/Chat'

export async function add(ctx: TelegrafContext): Promise<unknown> {
	if (!ctx.chat || !ctx.message?.text) {
		return ctx.reply('?')
	}

	const trackingID = ctx.message.text.trim()

	const savedChat = await ChatModel.findOne({ chatId: String(ctx.chat.id) })

	const newTracking = { trackingID, createdAt: new Date(), isCompleted: false, track: [] }

	if (savedChat) {
		if (savedChat.trackings.find((track) => track.trackingID === trackingID)) {
			return ctx.reply(`Посылка ${trackingID} уже отслеживается`)
		}

		if (savedChat.trackings.length >= 10) {
			return ctx.reply('Нельзя отслеживать более 10 посылок')
		}

		savedChat.trackings = [...savedChat.trackings, newTracking]

		await savedChat.save()
	} else {
		await ChatModel.create({
			chatId: String(ctx.chat.id),
			createdAt: new Date(),
			trackings: [newTracking],
		})
	}

	return ctx.reply(`Посылка ${trackingID} добавлена в список отслеживаемых`)
}
