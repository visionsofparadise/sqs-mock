import { InMemoryQueue } from './InMemoryQueue';
import { createHash } from 'crypto';
import EventEmitter from 'events';
import { SQS } from 'aws-sdk';
import { timestampId } from './timestampId';

type Callback<D> = (error: unknown, data: D) => any;

export class SQSMock {
	#queues: {
		[x: string]: InMemoryQueue | undefined;
	} = {};

	constructor(public clientConfig?: SQS.ClientConfiguration) {}

	#md5(string: string) {
		return createHash('md5').update(string, 'utf8').digest('hex');
	}

	#eventEmitter<D>(error: unknown, data: D) {
		const eventEmitter = new EventEmitter();

		const promiseEventEmitter = Object.assign(eventEmitter, {
			promise: () => {
				if (error) return Promise.reject(error);
				return Promise.resolve(data);
			}
		});

		return promiseEventEmitter;
	}

	#getOrCreateQueue(queueUrl: string) {
		let queue = this.#queues[queueUrl];

		if (!queue) {
			const newQueue = new InMemoryQueue();

			this.#queues[queueUrl] = newQueue;
			queue = newQueue;
		}

		return queue;
	}

	sendMessage = (params: SQS.SendMessageRequest, callback?: Callback<SQS.SendMessageResult>) => {
		const queue = this.#getOrCreateQueue(params.QueueUrl);

		const result = queue.add(params.MessageBody);

		const data = {
			ResponseMetadata: {
				RequestId: timestampId()
			},
			MD5OfMessageBody: this.#md5(params.MessageBody),
			MessageId: result.messageId
		};

		if (callback) callback(null, data);
		return this.#eventEmitter(null, data);
	};

	sendMessageBatch = (params: SQS.SendMessageBatchRequest, callback?: Callback<SQS.SendMessageBatchResult>) => {
		const data = {
			ResponseMetadata: {
				RequestId: timestampId()
			},
			Successful: params.Entries.map(entry => {
				const queue = this.#getOrCreateQueue(params.QueueUrl);

				const result = queue.add(entry.MessageBody);

				return {
					Id: entry.Id,
					MessageId: result.messageId,
					MD5OfMessageBody: this.#md5(entry.MessageBody)
				};
			}),
			Failed: []
		};

		if (callback) callback(null, data);
		return this.#eventEmitter(null, data);
	};

	receiveMessage = (params: SQS.ReceiveMessageRequest, callback?: Callback<SQS.ReceiveMessageResult>) => {
		const queue = this.#getOrCreateQueue(params.QueueUrl);

		const result = queue.receive(Math.min(params.MaxNumberOfMessages || 1, 10));

		if (result.length === 0) {
			const data = {
				Messages: undefined,
				ResponseMetadata: {
					RequestId: timestampId()
				}
			};

			if (callback) callback(null, data);
			return this.#eventEmitter(null, data);
		} else {
			const data = {
				ResponseMetadata: {
					RequestId: timestampId()
				},
				Messages: result.map(entry => ({
					MessageId: entry.messageId,
					ReceiptHandle: entry.messageId,
					MD5OfBody: this.#md5(entry.message),
					Body: entry.message,
					Attributes: {},
					MessageAttributes: {},
					MD5OfMessageAttributes: 'test'
				}))
			};

			if (callback) callback(null, data);
			return this.#eventEmitter(null, data);
		}
	};

	deleteMessage = (
		params: SQS.DeleteMessageRequest,
		callback?: Callback<{ ResponseMetadata: { RequestId: string } }>
	) => {
		const queue = this.#getOrCreateQueue(params.QueueUrl);

		queue.delete(params.ReceiptHandle);

		const data = {
			ResponseMetadata: {
				RequestId: 'SimplyImitatedSQS-RequestId'
			}
		};

		if (callback) callback(null, data);
		return this.#eventEmitter(null, data);
	};

	deleteMessageBatch = (params: SQS.DeleteMessageBatchRequest, callback?: Callback<SQS.DeleteMessageBatchResult>) => {
		const data = {
			ResponseMetadata: {
				RequestId: timestampId()
			},
			Successful: params.Entries.map(entry => {
				const queue = this.#getOrCreateQueue(params.QueueUrl);

				queue.delete(entry.ReceiptHandle);

				return {
					Id: entry.Id
				};
			}),
			Failed: []
		};

		if (callback) callback(null, data);
		return this.#eventEmitter(null, data);
	};

	purgeQueue = (params: SQS.PurgeQueueRequest, callback?: Callback<{}>) => {
		const queue = this.#getOrCreateQueue(params.QueueUrl);

		queue.reset();

		if (callback) callback(null, {});
		return this.#eventEmitter(null, {});
	};
}
