import {
	DeleteMessageBatchCommand,
	DeleteMessageCommand,
	ReceiveMessageCommand,
	SendMessageBatchCommand,
	SendMessageCommand
} from '@aws-sdk/client-sqs';
import { SQSMock } from './SQSMock';
import { timestampId } from './timestampId';

const sqs = new SQSMock();

const QueueUrl = 'test';

afterEach(async () => {
	await sqs.purgeQueue({ QueueUrl }).promise();
});

it('sends message to queue', async () => {
	const result = await sqs
		.sendMessage({
			QueueUrl,
			MessageBody: 'test'
		})
		.promise();

	expect(result.MessageId).toBeDefined();
});

it('sends message to queue (v3)', async () => {
	const result = await sqs.send(
		new SendMessageCommand({
			QueueUrl,
			MessageBody: 'test'
		})
	);

	expect(result.MessageId).toBeDefined();
});

it('sends batch of messages to queue', async () => {
	const result = await sqs
		.sendMessageBatch({
			QueueUrl,
			Entries: [
				{
					Id: timestampId(),
					MessageBody: 'test'
				},
				{
					Id: timestampId(),
					MessageBody: 'test'
				},
				{
					Id: timestampId(),
					MessageBody: 'test'
				}
			]
		})
		.promise();

	expect(result.Successful.length).toBe(3);
});

it('sends batch of messages to queue (v3)', async () => {
	const result = await sqs.send(
		new SendMessageBatchCommand({
			QueueUrl,
			Entries: [
				{
					Id: timestampId(),
					MessageBody: 'test'
				},
				{
					Id: timestampId(),
					MessageBody: 'test'
				},
				{
					Id: timestampId(),
					MessageBody: 'test'
				}
			]
		})
	);

	expect(result.Successful?.length).toBe(3);
});

it('receives a message from queue', async () => {
	await sqs
		.sendMessage({
			QueueUrl,
			MessageBody: 'test'
		})
		.promise();

	const result = await sqs
		.receiveMessage({
			QueueUrl
		})
		.promise();

	expect(result.Messages!.length).toBe(1);
});

it('receives a message from queue (v3)', async () => {
	await sqs.send(
		new SendMessageCommand({
			QueueUrl,
			MessageBody: 'test'
		})
	);

	const result = await sqs.send(
		new ReceiveMessageCommand({
			QueueUrl
		})
	);

	expect(result.Messages!.length).toBe(1);
});

it('treats queueUrls uniquely', async () => {
	await sqs
		.sendMessage({
			QueueUrl,
			MessageBody: 'test'
		})
		.promise();

	await sqs
		.sendMessage({
			QueueUrl: 'test2',
			MessageBody: 'test'
		})
		.promise();

	const result = await sqs
		.receiveMessage({
			QueueUrl
		})
		.promise();

	expect(result.Messages!.length).toBe(1);
});

it('receives many messages from queue', async () => {
	await sqs
		.sendMessageBatch({
			QueueUrl,
			Entries: [
				{
					Id: timestampId(),
					MessageBody: 'test'
				},
				{
					Id: timestampId(),
					MessageBody: 'test'
				},
				{
					Id: timestampId(),
					MessageBody: 'test'
				}
			]
		})
		.promise();

	const result = await sqs
		.receiveMessage({
			QueueUrl,
			MaxNumberOfMessages: 3
		})
		.promise();

	expect(result.Messages!.length).toBe(3);

	const result2 = await sqs
		.receiveMessage({
			QueueUrl,
			MaxNumberOfMessages: 1
		})
		.promise();

	expect(result2.Messages!.length).toBe(1);

	const result3 = await sqs
		.receiveMessage({
			QueueUrl,
			MaxNumberOfMessages: 10
		})
		.promise();

	expect(result3.Messages!.length).toBe(3);
});

it('deletes a message from queue', async () => {
	await sqs
		.sendMessage({
			QueueUrl,
			MessageBody: 'test'
		})
		.promise();

	const result = await sqs
		.receiveMessage({
			QueueUrl
		})
		.promise();

	expect(result.Messages!.length).toBe(1);

	await sqs
		.deleteMessage({
			QueueUrl,
			ReceiptHandle: result.Messages![0].ReceiptHandle
		})
		.promise();

	const result2 = await sqs
		.receiveMessage({
			QueueUrl
		})
		.promise();

	expect(result2.Messages).toBeUndefined();
});

it('deletes a message from queue (v3)', async () => {
	await sqs.send(
		new SendMessageCommand({
			QueueUrl,
			MessageBody: 'test'
		})
	);

	const result = await sqs.send(
		new ReceiveMessageCommand({
			QueueUrl
		})
	);

	expect(result.Messages!.length).toBe(1);

	await sqs.send(
		new DeleteMessageCommand({
			QueueUrl,
			ReceiptHandle: result.Messages![0].ReceiptHandle
		})
	);

	const result2 = await sqs.send(
		new ReceiveMessageCommand({
			QueueUrl
		})
	);

	expect(result2.Messages).toBeUndefined();
});

it('deletes a batch of messages from queue', async () => {
	await sqs
		.sendMessageBatch({
			QueueUrl,
			Entries: [
				{
					Id: timestampId(),
					MessageBody: 'test'
				},
				{
					Id: timestampId(),
					MessageBody: 'test'
				},
				{
					Id: timestampId(),
					MessageBody: 'test'
				}
			]
		})
		.promise();

	const result = await sqs
		.receiveMessage({
			QueueUrl,
			MaxNumberOfMessages: 10
		})
		.promise();

	expect(result.Messages!.length).toBe(3);

	await sqs
		.deleteMessageBatch({
			QueueUrl,
			Entries: result.Messages!.map(message => ({
				Id: message.MessageId,
				ReceiptHandle: message.ReceiptHandle
			}))
		})
		.promise();

	const result2 = await sqs
		.receiveMessage({
			QueueUrl,
			MaxNumberOfMessages: 10
		})
		.promise();

	expect(result2.Messages).toBeUndefined();
});

it('deletes a batch of messages from queue (v3)', async () => {
	await sqs.send(
		new SendMessageBatchCommand({
			QueueUrl,
			Entries: [
				{
					Id: timestampId(),
					MessageBody: 'test'
				},
				{
					Id: timestampId(),
					MessageBody: 'test'
				},
				{
					Id: timestampId(),
					MessageBody: 'test'
				}
			]
		})
	);

	const result = await sqs.send(
		new ReceiveMessageCommand({
			QueueUrl,
			MaxNumberOfMessages: 10
		})
	);

	expect(result.Messages!.length).toBe(3);

	await sqs.send(
		new DeleteMessageBatchCommand({
			QueueUrl,
			Entries: result.Messages!.map(message => ({
				Id: message.MessageId,
				ReceiptHandle: message.ReceiptHandle
			}))
		})
	);

	const result2 = await sqs.send(
		new ReceiveMessageCommand({
			QueueUrl,
			MaxNumberOfMessages: 10
		})
	);

	expect(result2.Messages).toBeUndefined();
});
