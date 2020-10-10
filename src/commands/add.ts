import { TelegrafContext } from 'telegraf/typings/context'
import { ChatModel } from '../models/Chat'

export async function add(ctx: TelegrafContext): Promise<unknown> {
	if (!ctx.chat || !ctx.message?.text) {
		return ctx.reply('?')
	}

	const [, trackingID] = ctx.message.text.split(' ')

	if (!/LP\d+/.test(trackingID)) {
		return ctx.replyWithMarkdown('Неверный формат. Пример: `/add LP123456`')
	}

	const savedChat = await ChatModel.findOne({ chatId: String(ctx.chat.id) })

	if (savedChat) {
		if (savedChat.trackings.find((track) => track.trackingID === trackingID)) {
			return ctx.reply(`Посылка ${trackingID} уже отслеживается`)
		}

		if (savedChat.trackings.length >= 10) {
			return ctx.reply('Нельзя отслеживать более 10 посылок')
		}

		savedChat.trackings = [
			...savedChat.trackings,
			{ trackingID, createdAt: new Date(), track: [] },
		]

		await savedChat.save()
	} else {
		await ChatModel.create({
			chatId: String(ctx.chat.id),
			createdAt: new Date(),
			trackings: [{ trackingID, createdAt: new Date(), track: [] }],
		})
	}

	return ctx.reply(`Посылка ${trackingID} добавлена в список отслеживаемых`)
}
