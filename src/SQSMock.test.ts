import { id } from 'kuuid';
import { SQSMock } from './SQSMock';

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

it('sends batch of messages to queue', async () => {
	const result = await sqs
		.sendMessageBatch({
			QueueUrl,
			Entries: [
				{
					Id: id(),
					MessageBody: 'test'
				},
				{
					Id: id(),
					MessageBody: 'test'
				},
				{
					Id: id(),
					MessageBody: 'test'
				}
			]
		})
		.promise();

	expect(result.Successful.length).toBe(3);
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

it('receives many messages from queue', async () => {
	await sqs
		.sendMessageBatch({
			QueueUrl,
			Entries: [
				{
					Id: id(),
					MessageBody: 'test'
				},
				{
					Id: id(),
					MessageBody: 'test'
				},
				{
					Id: id(),
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

it('deletes a batch of messages from queue', async () => {
	await sqs
		.sendMessageBatch({
			QueueUrl,
			Entries: [
				{
					Id: id(),
					MessageBody: 'test'
				},
				{
					Id: id(),
					MessageBody: 'test'
				},
				{
					Id: id(),
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
