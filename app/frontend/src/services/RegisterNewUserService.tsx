import api from './api';

const RegisterNewUserService = async (data: {
  email: string;
  password: string;
  confirm_password: string;
  name: string;
}) => {
  console.log(data);
  try {
    const response = await api.post('/auth/register', data);
    return response;
  } catch (error: any) {
    console.error('Error:', error);
    return error.response ?? { status: 0, data: { error: 'Sem conexão com o servidor.' } };
  }
};
export default RegisterNewUserService;
