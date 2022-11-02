import { timestampId } from './timestampId';

export class InMemoryQueue {
	data: { [x: string]: any } = {};

	constructor() {}

	add = (message: unknown) => {
		const messageId = timestampId();

		this.data[messageId] = message;

		return {
			messageId,
			message
		};
	};

	receive = (quantity: number = 1) => {
		const messageIds = Object.keys(this.data).sort();

		const maxQuantity = Math.min(messageIds.length, quantity);

		const selectedMessageIds = messageIds.slice(0, maxQuantity);

		const messages = selectedMessageIds.map(messageId => ({
			messageId,
			message: this.data[messageId]
		}));

		return messages;
	};

	delete = (messageId: string) => {
		const { [messageId]: _, ...rest } = this.data;

		this.data = rest;
	};

	reset = () => {
		this.data = {};
	};
}
