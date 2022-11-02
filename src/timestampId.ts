import { randomBytes } from 'crypto';

export const timestampId = () => {
	const timestamp = new Date().getTime();
	const randomString = randomBytes(4).toString('hex');

	const id = `${timestamp}-${randomString}`;

	return id;
};
