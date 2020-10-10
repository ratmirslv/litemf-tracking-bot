import fetch from 'node-fetch'
import cheerio from 'cheerio'

export type TrackRecord = {
	date: string
	description: string
	name?: string
}

export async function getTracking(trackingID: string): Promise<TrackRecord[]> {
	const response = await fetch(`https://litemf.com/ru/tracking/${trackingID}`)
	if (!response.ok) {
		throw new Error(`Request ${response.url} status ${response.status}`)
	}
	const html = await response.text()
	const $ = cheerio.load(html)

	const checkpoints = $('li.checkpoint')
		.toArray()
		.map((el) => ({
			date: $('.date', el).text(),
			description: $('.description', el).text(),
			name: $('.name', el).text(),
		}))

	return checkpoints
}
