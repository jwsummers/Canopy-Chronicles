import * as SecureStore from 'expo-secure-store';

const CREDENTIALS_KEY = 'userCredentials';

export const saveCredentials = async (email, password) => {
  const credentials = JSON.stringify({ email, password });
  try {
    await SecureStore.setItemAsync(CREDENTIALS_KEY, credentials);
    console.log('Credentials saved successfully');
  } catch (error) {
    console.error('Error saving credentials:', error);
  }
};

export const getSavedCredentials = async () => {
  try {
    const credentials = await SecureStore.getItemAsync(CREDENTIALS_KEY);
    return credentials ? JSON.parse(credentials) : null;
  } catch (error) {
    console.error('Error retrieving credentials:', error);
    return null;
  }
};
