import uuid from 'react-native-uuid';

export const generateId = async (): Promise<string> => {
  const UUID = uuid.v4();
  return UUID as string;
};