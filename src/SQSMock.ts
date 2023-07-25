import { InMemoryQueue } from './InMemoryQueue';
import { createHash } from 'crypto';
import EventEmitter from 'events';
import {
	DeleteMessageBatchCommand,
	DeleteMessageBatchCommandInput,
	DeleteMessageBatchCommandOutput,
	DeleteMessageCommand,
	DeleteMessageCommandInput,
	DeleteMessageCommandOutput,
	PurgeQueueCommand,
	PurgeQueueCommandInput,
	PurgeQueueCommandOutput,
	ReceiveMessageCommand,
	ReceiveMessageCommandInput,
	ReceiveMessageCommandOutput,
	SQSClientConfig,
	SendMessageBatchCommand,
	SendMessageBatchCommandInput,
	SendMessageBatchCommandOutput,
	SendMessageCommand,
	SendMessageCommandInput,
	SendMessageCommandOutput
} from '@aws-sdk/client-sqs';
import { timestampId } from './timestampId';
import { Command } from '@smithy/types';
import { SQS } from 'aws-sdk';

type Callback<D> = (error: unknown, data: D) => any;

export class SQSMock {
	#queues: {
		[x: string]: InMemoryQueue | undefined;
	} = {};

	constructor(public config?: SQS.ClientConfiguration | SQSClientConfig) {}

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

	send = async <InputType, OutputType>(command: Command<any, InputType, any, OutputType, any>): Promise<OutputType> => {
		if (command instanceof SendMessageCommand) return this.sendMessage(command.input).promise() as OutputType;
		if (command instanceof SendMessageBatchCommand) return this.sendMessageBatch(command.input).promise() as OutputType;
		if (command instanceof ReceiveMessageCommand) return this.receiveMessage(command.input).promise() as OutputType;
		if (command instanceof DeleteMessageCommand) return this.deleteMessage(command.input).promise() as OutputType;
		if (command instanceof DeleteMessageBatchCommand)
			return this.deleteMessageBatch(command.input).promise() as OutputType;
		if (command instanceof PurgeQueueCommand) return this.purgeQueue(command.input).promise() as OutputType;
		throw new Error('Unsupported command');
	};

	sendMessage = (input: SendMessageCommandInput, callback?: Callback<SendMessageCommandOutput>) => {
		if (!input.QueueUrl) throw new Error('QueueUrl is required');
		if (!input.MessageBody) throw new Error('MessageBody is required');

		const queue = this.#getOrCreateQueue(input.QueueUrl);

		const result = queue.add(input.MessageBody);

		const data = {
			$metadata: {
				requestId: timestampId()
			},
			MD5OfMessageBody: this.#md5(input.MessageBody),
			MessageId: result.messageId
		};

		if (callback) callback(null, data);
		return this.#eventEmitter(null, data);
	};

	sendMessageBatch = (input: SendMessageBatchCommandInput, callback?: Callback<SendMessageBatchCommandOutput>) => {
		if (!input.QueueUrl) throw new Error('QueueUrl is required');
		if (!input.Entries) throw new Error('Entries is required');

		const data = {
			$metadata: {
				requestId: timestampId()
			},
			Successful: input.Entries.map(entry => {
				if (!entry.MessageBody) throw new Error('MessageBody is required');

				const queue = this.#getOrCreateQueue(input.QueueUrl!);

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

	receiveMessage = (input: ReceiveMessageCommandInput, callback?: Callback<ReceiveMessageCommandOutput>) => {
		if (!input.QueueUrl) throw new Error('QueueUrl is required');

		const queue = this.#getOrCreateQueue(input.QueueUrl);

		const result = queue.receive(Math.min(input.MaxNumberOfMessages || 1, 10));

		if (result.length === 0) {
			const data = {
				Messages: undefined,
				$metadata: {
					requestId: timestampId()
				}
			};

			if (callback) callback(null, data);
			return this.#eventEmitter(null, data);
		} else {
			const data = {
				$metadata: {
					requestId: timestampId()
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

	deleteMessage = (input: DeleteMessageCommandInput, callback?: Callback<DeleteMessageCommandOutput>) => {
		if (!input.QueueUrl) throw new Error('QueueUrl is required');
		if (!input.ReceiptHandle) throw new Error('ReceiptHandle is required');

		const queue = this.#getOrCreateQueue(input.QueueUrl);

		queue.delete(input.ReceiptHandle);

		const data = {
			$metadata: {
				requestId: timestampId()
			}
		};

		if (callback) callback(null, data);
		return this.#eventEmitter(null, data);
	};

	deleteMessageBatch = (
		input: DeleteMessageBatchCommandInput,
		callback?: Callback<DeleteMessageBatchCommandOutput>
	) => {
		if (!input.QueueUrl) throw new Error('QueueUrl is required');
		if (!input.Entries) throw new Error('Entries is required');

		const data = {
			$metadata: {
				requestId: timestampId()
			},
			Successful: input.Entries.map(entry => {
				if (!entry.ReceiptHandle) throw new Error('ReceiptHandle is required');

				const queue = this.#getOrCreateQueue(input.QueueUrl!);

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

	purgeQueue = (input: PurgeQueueCommandInput, callback?: Callback<PurgeQueueCommandOutput>) => {
		if (!input.QueueUrl) throw new Error('QueueUrl is required');

		const queue = this.#getOrCreateQueue(input.QueueUrl);

		queue.reset();

		const data = {
			$metadata: {
				requestId: timestampId()
			}
		};

		if (callback) callback(null, data);
		return this.#eventEmitter(null, data);
	};
}
