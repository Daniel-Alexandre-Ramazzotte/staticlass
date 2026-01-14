import api from './api';

const CheckLogin = async (data: { email: string; password: string }) => {
  console.log(data);
  try {
    const response = await api.post('/auth/login', data);
    if (response.status === 200) {
      return true;
    } else {
      return false;
    }
  } catch (error) {
    console.error('Error:', error);
  }
};
export default CheckLogin;
