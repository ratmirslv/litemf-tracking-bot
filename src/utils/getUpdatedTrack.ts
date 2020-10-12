import { isEqual } from 'lodash'

import { Chat } from '../models/Chat'

import { getTracking, TrackRecord } from './getTracking'

export async function getUpdatedTrack(
	chat: Chat,
	trackingID: string,
): Promise<TrackRecord[]> {
	const tracking = chat.trackings.find((track) => track.trackingID === trackingID)

	if (!tracking) {
		throw new Error(`Tracking ${trackingID} not found for chat ${chat._id}`)
	}

	const newTrack = await getTracking(tracking.trackingID)

	const oldTrack = tracking.track.map((el) => ({
		date: el.date,
		description: el.description,
		name: el.name,
	}))

	return isEqual(oldTrack, newTrack) ? [] : newTrack
}
