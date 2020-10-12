import { chunk } from 'lodash'
import { BaseScene } from 'telegraf'

import { ChatModel } from '../models/Chat'

export const delPackageScene = new BaseScene('delPackage')

delPackageScene.enter(async (ctx) => {
	if (!ctx.chat || !ctx.message?.text) {
		return ctx.reply('?')
	}

	const savedChat = await ChatModel.findOne({ chatId: String(ctx.chat.id) })

	if (!savedChat || savedChat.trackings.length === 0) {
		await ctx.reply('Нет сохраненных отслеживаний')
		return ctx.scene.leave()
	}

	return ctx.reply('Выберите трекинг для удаления', {
		reply_markup: {
			one_time_keyboard: true,
			keyboard: chunk(
				savedChat.trackings.map((track) => ({ text: track.trackingID })),
				2,
			),
		},
	})
})

delPackageScene.hears(/^LP\d+\s*/, async (ctx) => {
	if (!ctx.chat || !ctx.message?.text) {
		return ctx.reply('?')
	}

	const trackingID = ctx.message.text.trim()

	const savedChat = await ChatModel.findOne({ chatId: String(ctx.chat.id) })

	if (!savedChat) {
		await ctx.reply(`Нет сохраненных отслеживаний`, {
			reply_markup: { remove_keyboard: true },
		})
		return ctx.scene.leave()
	}

	const updatedTrackings = savedChat.trackings.filter(
		(track) => track.trackingID !== trackingID,
	)

	if (updatedTrackings.length === savedChat.trackings.length) {
		await ctx.reply(`Посылка ${trackingID} не найдена`)
		return ctx.scene.reenter()
	}

	savedChat.trackings = updatedTrackings

	await savedChat.save()

	await ctx.reply(`Посылка ${trackingID} удалена из списка отслеживаемых`, {
		reply_markup: { remove_keyboard: true },
	})

	return ctx.scene.leave()
})
