import api from './api';

export const CheckAnswer = async (data: string, questionId: number) => {
  const x = { answer: data, question_id: questionId };

  try {
    const response = await api.post('/questions/check', x);
    return response;
  } catch (error) {
    console.error('Error:', error);
  }
};
