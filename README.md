# sqs-mock

A functional, in-memory mock of the SQS client from AWS-SDK. Queues are automatically created in-memory per QueueUrl provided.

See documentation for AWS SDK usage [here](https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/SQS.html).

### Functional Methods

- [x] Constructor
- [ ] addPermission
- [ ] changeMessageVisibility
- [ ] changeMessageVisibilityBatch
- [ ] createQueue
- [x] deleteMessage
- [x] deleteMessageBatch
- [ ] deleteQueue
- [ ] getQueueAttributes
- [ ] getQueueUrl
- [ ] listDeadLetterSourceQueues
- [ ] listQueues
- [ ] listQueueTags
- [x] purgeQueue
- [x] receiveMessage
- [ ] removePermission
- [x] sendMessage
- [x] sendMessageBatch
- [ ] setQueueAttributes
- [ ] tagQueue
- [ ] untagQueue

### Other Functionality

- [ ] Message timing (DelaySeconds, VisibilityTimeout)
- [ ] Message attributes and attribute querying (ApproximateNumberOfMessages, ApproximateNumberOfMessagesNotVisible, etc.)
- [ ] Queue attributes and management

---

## Usage

### Set your sqs client to be the mock with a testing flag.

```js
// sqs.js
import { SQS } from 'aws-sdk'
import { SQSMock } from 'sqs-mock'

export const sqs = process.env.NODE_ENV === 'production'
 ? new SQS()
 : new SQSMock() as any as SQS // cast SQSMock as SQS if using typescript
```

### Use SQSMock client in tests

```js
// test.js
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

---

## Contribution

I'm working on adding the rest of the methods in time. Feel free to contribute any missing ones. Please provide unit tests for added functionality.
