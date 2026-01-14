import api from './api';

const RegisterNewUserService = async (data: {
  email: string;
  password: string;
  name: string;
}) => {
  console.log(data);
  try {
    const response = await api.post('/auth/register', data);
    return response;
  } catch (error) {
    console.error('Error:', error);
  }
};
export default RegisterNewUserService;
