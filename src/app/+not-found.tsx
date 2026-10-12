import { Redirect } from 'expo-router';

// Unknown links (an old deep link, or a web preview served from another path) go to the start.
export default function NotFound() {
  return <Redirect href="/" />;
}
