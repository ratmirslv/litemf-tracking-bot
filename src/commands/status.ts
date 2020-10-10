import { formatDistanceToNow } from 'date-fns'
import { ru } from 'date-fns/locale'
import { TelegrafContext } from 'telegraf/typings/context'
import { ChatModel } from '../models/Chat'

export async function status(ctx: TelegrafContext): Promise<unknown> {
	if (!ctx.chat) {
		return ctx.reply('?')
	}

	const chat = await ChatModel.findOne({ chatId: String(ctx.chat.id) })

	const latestCheck = chat?.trackings.find((track) => track.lastCheckAt)

	return ctx.reply(
		`Последняя проверка: ${
			latestCheck?.lastCheckAt
				? formatDistanceToNow(latestCheck?.lastCheckAt, { addSuffix: true, locale: ru })
				: 'никогда'
		}`,
	)
}
