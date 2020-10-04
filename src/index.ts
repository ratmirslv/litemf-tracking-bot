import 'dotenv-safe/config'

import ms from 'ms'
import mongoose from 'mongoose'
import { Telegraf } from 'telegraf'
import { formatDistanceToNow } from 'date-fns'
import { ru } from 'date-fns/locale'
import { TelegrafContext } from 'telegraf/typings/context'
import { Chat, ChatModel } from './models/Chat'
import { checkUpdates } from './utils/checkUpdates'

const helpText = [
	'Привет!',
	'Я бот отслеживания посылок. Вот, что я умею:',
	'/add LPxxxx - добавить новую посылку',
	'/del LPxxxx - удалить посылку',
	'/list - список отслеживаемых посылок',
].join('\n')

async function main() {
	const bot = new Telegraf(process.env.BOT_TOKEN!)

	const isChatAlive = (chatId: string | number): Promise<boolean> =>
		bot.telegram
			.sendChatAction(chatId, 'typing')
			.then(() => true)
			.catch(() => false)

	bot.help((ctx) => ctx.reply(helpText))

	bot.start((ctx) => ctx.reply(helpText))

	bot.catch((err: Error, ctx: TelegrafContext) => {
		// eslint-disable-next-line no-console
		console.log(`Ooops, encountered an error for ${ctx.updateType}`, err)
		return ctx.replyWithMarkdown(
			process.env.NODE_ENV === 'production'
				? 'Ой ошибка...'
				: `\`\`\`\n${err.stack || err.message}\n\`\`\``,
		)
	})

	bot.command('list', async (ctx) => {
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
	})

	bot.command('add', async (ctx) => {
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
	})

	bot.command('del', async (ctx) => {
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
	})

	bot.command('status', async (ctx) => {
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
	})

	await bot.launch()

	await mongoose.connect(process.env.MONGODB_URI!, {
		useCreateIndex: true,
		useNewUrlParser: true,
		useUnifiedTopology: true,
		useFindAndModify: false,
	})

	// eslint-disable-next-line no-console
	console.log('Bot started...')

	async function check() {
		try {
			const chats = await ChatModel.find()

			const aliveChats: Chat[] = []

			for (const chat of chats) {
				const isAlive = await isChatAlive(chat.chatId)
				if (isAlive) {
					aliveChats.push(chat)
				}
			}

			const checkResults = await checkUpdates(aliveChats)

			for (const checkResult of checkResults) {
				await bot.telegram.sendMessage(
					checkResult.chatId,
					[
						checkResult.trackingId,
						checkResult.latestTrack.date,
						checkResult.latestTrack.description,
						checkResult.latestTrack.name,
					]
						.filter(Boolean)
						.join('\n'),
				)
			}
		} catch (err) {
			// eslint-disable-next-line no-console
			console.error(err)
		}
	}

	setInterval(check, ms('15m'))

	check()
}

main()

process.on('unhandledRejection', (err) => {
	throw err
})
