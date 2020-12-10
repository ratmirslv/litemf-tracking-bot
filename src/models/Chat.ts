import { Schema, Document, model, Model } from 'mongoose'

export interface Chat extends Document {
	createdAt: Date
	chatId: string
	trackings: {
		trackingID: string
		createdAt: Date
		lastCheckAt?: Date
		isCompleted: boolean
		track: {
			date: string
			description: string
			name?: string
		}[]
	}[]
}

export const ChatModel: Model<Chat> = model<Chat>(
	'Chat',
	new Schema({
		createdAt: { type: Date, required: true },
		chatId: { type: String, required: true },
		trackings: [
			{
				trackingID: { type: String, trim: true, required: true },
				isCompleted: { type: Boolean, required: true },
				createdAt: { type: Date, required: true },
				lastCheckAt: { type: Date },
				track: [
					{
						date: { type: String, required: true },
						description: { type: String, required: true },
						name: { type: String },
					},
				],
			},
		],
	}),
)
