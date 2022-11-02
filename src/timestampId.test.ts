import { timestampId } from './timestampId';

it('creates a random string', () => {
	const id = timestampId();

	expect(typeof id).toBe('string');
});

it('ids are time sortable', async () => {
	jest.useRealTimers();

	const id1 = timestampId();

	await new Promise(resolve => setTimeout(resolve, 10));

	const id2 = timestampId();

	await new Promise(resolve => setTimeout(resolve, 10));

	const id3 = timestampId();

	const idArray = [id2, id3, id1];

	const sortedIdArray = idArray.sort();

	expect(sortedIdArray[0]).toBe(id1);
	expect(sortedIdArray[1]).toBe(id2);
	expect(sortedIdArray[2]).toBe(id3);
});
