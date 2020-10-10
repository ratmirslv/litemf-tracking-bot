import { TelegrafContext } from 'telegraf/typings/context'
import { ChatModel } from '../models/Chat'

export async function del(ctx: TelegrafContext): Promise<unknown> {
	if (!ctx.chat || !ctx.message?.text) {
		return ctx.reply('?')
	}

	const [, trackingID] = ctx.message.text.split(' ')

	if (!/LP\d+/.test(trackingID)) {
		return ctx.replyWithMarkdown('Неверный формат. Пример: `/del LP123456`')
	}

	const savedChat = await ChatModel.findOne({ chatId: String(ctx.chat.id) })

	if (!savedChat) {
		return ctx.reply(`Посылка ${trackingID} не найдена`)
	}

	const updatedTrackings = savedChat.trackings.filter(
		(track) => track.trackingID !== trackingID,
	)

	if (updatedTrackings.length === savedChat.trackings.length) {
		return ctx.reply(`Посылка ${trackingID} не найдена`)
	}

	savedChat.trackings = updatedTrackings

	await savedChat.save()

	return ctx.reply(`Посылка ${trackingID} удалена из списка отслеживаемых`)
}
