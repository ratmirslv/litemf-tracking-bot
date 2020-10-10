import { TelegrafContext } from 'telegraf/typings/context'
import { ChatModel } from '../models/Chat'

export async function list(ctx: TelegrafContext): Promise<unknown> {
	if (!ctx.chat) {
		return ctx.reply('?')
	}

	const savedChat = await ChatModel.findOne({ chatId: String(ctx.chat.id) })

	if (!savedChat || savedChat.trackings.length === 0) {
		return ctx.reply('Ничего нет')
	}

	return ctx.reply(
		[
			'Отслеживаемые посылки:',
			...savedChat.trackings.map((track) => `- ${track.trackingID}`),
		].join('\n'),
	)
}
