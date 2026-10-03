import { Redirect } from 'expo-router';

/** Entry route: the real home screen lives in the (tabs) group. */
export default function Index() {
  return <Redirect href="/chats" />;
}
