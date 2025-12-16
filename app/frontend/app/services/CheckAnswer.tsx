import api from './api';

const CheckAnswer = async (data: string, questionIndex: number) => {
  const x = { answer: data, question_index: questionIndex };

  try {
    const response = await api.post('/questions/check', x);

    return response;
  } catch (error) {
    console.error('Error:', error);
  }
};
export default CheckAnswer;
