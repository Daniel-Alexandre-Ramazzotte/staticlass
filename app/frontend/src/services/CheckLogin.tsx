import api from './api';

const CheckLogin = async (data: { email: string; password: string }) => {
  try {
    const response = await api.post('/auth/login', data);
    return response;
  } catch (error: any) {
    return error.response;
  }
};
export default CheckLogin;
