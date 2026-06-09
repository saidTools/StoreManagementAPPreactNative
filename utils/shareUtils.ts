import { Platform } from 'react-native';

export const resolveShareUri = async (uri: string): Promise<string> => {
  if (Platform.OS !== 'android') return uri;
  const { File } = await import('expo-file-system');
  const file = new File(uri);
  return file.contentUri || uri;
};
