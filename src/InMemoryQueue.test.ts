import { InMemoryQueue } from './InMemoryQueue';

const inMemoryQueue = new InMemoryQueue();

afterEach(() => {
	inMemoryQueue.reset();
});

it('adds a message to queue', () => {
	inMemoryQueue.add('test');

	expect(Object.keys(inMemoryQueue.data).length).toBe(1);
});

it('adds some messages to queue', () => {
	inMemoryQueue.add('test');
	inMemoryQueue.add('test');
	inMemoryQueue.add('test');
	inMemoryQueue.add('test');
	inMemoryQueue.add('test');

	expect(Object.keys(inMemoryQueue.data).length).toBe(5);
});

it('receives a message', () => {
	inMemoryQueue.add('test');

	const messages = inMemoryQueue.receive();

	expect(messages.length).toBe(1);
	expect(messages[0].message).toBe('test');
});

it('receives some messages', () => {
	inMemoryQueue.add('test');
	inMemoryQueue.add('test');
	inMemoryQueue.add('test');
	inMemoryQueue.add('test');
	inMemoryQueue.add('test');

	const messages = inMemoryQueue.receive(3);

	expect(messages.length).toBe(3);
});

it('receives no messages when none added', () => {
	const messages = inMemoryQueue.receive();

	expect(messages.length).toBe(0);

	const messages2 = inMemoryQueue.receive(5);

	expect(messages2.length).toBe(0);
});

it('deletes a message', () => {
	inMemoryQueue.add('test');

	const messages = inMemoryQueue.receive();

	expect(messages.length).toBe(1);

	inMemoryQueue.delete(messages[0].messageId);

	const messages2 = inMemoryQueue.receive();

	expect(messages2.length).toBe(0);
});

it('deletes some messages', () => {
	inMemoryQueue.add('test');
	inMemoryQueue.add('test');
	inMemoryQueue.add('test');
	inMemoryQueue.add('test');
	inMemoryQueue.add('test');

	const messages = inMemoryQueue.receive(3);

	expect(messages.length).toBe(3);

	messages.map(message => {
		inMemoryQueue.delete(message.messageId);
	});

	const messages2 = inMemoryQueue.receive(5);

	expect(messages2.length).toBe(2);
});
