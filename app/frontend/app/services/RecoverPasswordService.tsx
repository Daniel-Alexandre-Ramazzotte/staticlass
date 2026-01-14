import api from './api';

const RecoverPasswordService = async (data: { email: string }) => {
  console.log(data);
  try {
    const response = await api.post('/auth/password-reset', data);
    return response;
  } catch (error) {
    console.error('Error:', error);
  }
};
export default RecoverPasswordService;
