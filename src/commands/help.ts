import { TelegrafContext } from 'telegraf/typings/context'

const helpText = [
	'Привет!',
	'Я бот отслеживания посылок. Вот, что я умею:',
	'/add LPxxxx - добавить новую посылку',
	'/del LPxxxx - удалить посылку',
	'/list - список отслеживаемых посылок',
	'/help - помощь',
].join('\n')

export const help = (ctx: TelegrafContext): Promise<unknown> => ctx.reply(helpText)
