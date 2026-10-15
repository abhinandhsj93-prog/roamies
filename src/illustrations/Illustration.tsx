import { SvgXml } from 'react-native-svg';

import { IllustrationId, illustrations } from './illustrations';

type Props = {
  id: IllustrationId;
  width: number | `${number}%`;
  height: number | `${number}%`;
  // Same meaning as the SVG attribute; the designs use "xMidYMid slice" for cropped thumbnails.
  preserveAspectRatio?: string;
  accessibilityLabel?: string;
};

export function Illustration({ id, width, height, preserveAspectRatio, accessibilityLabel }: Props) {
  const { viewBox, body } = illustrations[id];
  const xml = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}"${
    preserveAspectRatio ? ` preserveAspectRatio="${preserveAspectRatio}"` : ''
  }>${body}</svg>`;
  return (
    <SvgXml
      xml={xml}
      width={width}
      height={height}
      accessible={!!accessibilityLabel}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole={accessibilityLabel ? 'image' : undefined}
    />
  );
}
