import api from './api';

const CheckLogin = async (data: { email: string; password: string }) => {
  console.log(data);
  try {
    const response = await api.post('/auth/login', data);
    return response;
  } catch (error) {
    console.error('Error:', error);
  }
};
export default CheckLogin;
