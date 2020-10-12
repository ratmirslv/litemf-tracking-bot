import { TelegrafContext } from 'telegraf/typings/context'

const helpText = [
	'Привет!',
	'Я бот отслеживания посылок. Вот, что я умею:',
	'LPxxxxx - добавить новую посылку',
	'/del - удалить посылку',
	'/list - список отслеживаемых посылок',
	'/help - помощь',
	'/status - время последней проверки обновлений',
].join('\n')

export const help = (ctx: TelegrafContext): Promise<unknown> => ctx.reply(helpText)
