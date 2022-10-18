# sqs-mock

A mock of the aws-sdk SQS client which uses an in-memory queue. API and paramters are the same as the SQS client and so can be switched in place of it.

See documentation for aws-sdk usage [here](https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/SQS.html).

Functional mocked methods:

- sendMessage
- sendMessageBatch
- receiveMessage
- deleteMesssage
- deleteMessageBatch
- purgeQueue

Other methods are not functional and will error if used.

## Usage

### Set your sqs client to be the mock with a testing flag.

```js
import { SQS } from 'aws-sdk'
import { SQSMock } from 'sqs-mock'

export const sqs = process.env.TESTING === 'true'
 ? new SQSMock() as any as SQS
 : new SQS()
```

### Use SQSMock client in tests

```js
import { sqs } from './sqs'

const QueueUrl = 'test'

afterEach(async () => {
 await sqs.purgeQueue({
  QueueUrl
 }).promise()
})

it('adds, receives then deletes message in queue', async () => {
 await sqs
  sendMessage({
   QueueUrl,
   MessageBody: 'test'
  })
  promise();

 const result = await sqs
  receiveMessage({
   QueueUrl
  })
  promise();

 expect(result.Messages!.length).toBe(1);

 await sqs
  deleteMessage({
   QueueUrl,
   ReceiptHandle: result.Messages![0].ReceiptHandle
  })
  promise();

 const result2 = await sqs
  receiveMessage({
   QueueUrl
  })
  promise();

 expect(result2.Messages).toBeUndefined();
})
```
