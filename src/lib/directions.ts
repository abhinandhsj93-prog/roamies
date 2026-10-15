import { Linking } from 'react-native';

export function walkingDirectionsUrl(destination: string) {
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}&travelmode=walking`;
}

export function openWalkingDirections(destination: string) {
  return Linking.openURL(walkingDirectionsUrl(destination));
}
