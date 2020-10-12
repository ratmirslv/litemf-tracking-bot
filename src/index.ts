import 'dotenv-safe/config'

import ms from 'ms'
import mongoose from 'mongoose'
import { Telegraf, Stage, session } from 'telegraf'
import { TelegrafContext } from 'telegraf/typings/context'
import { checkUpdates } from './utils/checkUpdates'
import * as commands from './commands'
import { SceneContext } from 'telegraf/typings/stage'
import { delPackageScene } from './scenes/delPackageScene'

interface Context extends TelegrafContext {
	scene: SceneContext<this>
}

async function main() {
	const bot = new Telegraf<Context>(process.env.BOT_TOKEN)

	const stage = new Stage([delPackageScene], { ttl: 10 })

	bot.use(session())

	bot.use(stage.middleware())

	bot.help(commands.help)

	bot.start(commands.help)

	bot.catch((err: Error, ctx: TelegrafContext) => {
		// eslint-disable-next-line no-console
		console.log(`Ooops, encountered an error for ${ctx.updateType}`, err)
		return ctx.replyWithMarkdown(
			process.env.NODE_ENV === 'production'
				? 'Ой ошибка...'
				: `\`\`\`\n${err.stack || err.message}\n\`\`\``,
		)
	})

	bot.command('list', commands.list)

	bot.hears(/^LP\d+\s*/, commands.add)

	bot.command('del', (ctx) => ctx.scene.enter(delPackageScene.id))

	bot.command('status', commands.status)

	await bot.launch()

	await mongoose.connect(process.env.MONGODB_URI, {
		useCreateIndex: true,
		useNewUrlParser: true,
		useUnifiedTopology: true,
		useFindAndModify: false,
	})

	// eslint-disable-next-line no-console
	console.log('Bot started...')

	// eslint-disable-next-line no-console
	const safeCheck = () => checkUpdates(bot).catch(console.error.bind(console))

	setInterval(safeCheck, ms('15m'))

	safeCheck()
}

main()

process.on('unhandledRejection', (err) => {
	throw err
})
