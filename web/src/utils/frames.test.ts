import { parseFrame } from './frames';

describe('parseFrame', () => {
  it('parses a valid message frame', () => {
    const raw = JSON.stringify({ type: 'message_received', id: '1', from: 'bob', content: 'yo', ts: 5 });
    expect(parseFrame(raw)).toEqual({ type: 'message_received', id: '1', from: 'bob', content: 'yo', ts: 5 });
  });

  it.each([
    ['not json', 'nope'],
    ['unknown type', JSON.stringify({ type: 'wat' })],
    ['missing fields', JSON.stringify({ type: 'message_received', id: '1' })],
    ['bad status', JSON.stringify({ type: 'delivery_status', id: '1', status: 'maybe' })],
    ['array', '[]'],
    ['binary', new ArrayBuffer(2)],
  ])('rejects %s', (_label, input) => {
    expect(parseFrame(input)).toBeNull();
  });
});
