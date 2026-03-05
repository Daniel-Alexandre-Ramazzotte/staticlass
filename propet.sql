create database teste_db8;
use teste_db8;
-- O que falta fazer
-- Criar tabela de imagens que tenha ID_questao e ID_sequencial, este id sequencial deve dizer a ordem que as imagens devem aparecer . Essa tabela de imagens serve para uma questao poder ter n imagens atribuidas a ela
-- 


-- Tabela de Questoes
CREATE TABLE questions (
    id INT PRIMARY KEY UNIQUE,
    issue TEXT NOT NULL,

    answer_a VARCHAR(100) NOT NULL,
    answer_b VARCHAR(100) NOT NULL,
    answer_c VARCHAR(100) NOT NULL,
    answer_d VARCHAR(100) NOT NULL,
    answer_e VARCHAR(100) NOT NULL,

    id_professor CHAR(36)
        CHARACTER SET utf8mb4
        COLLATE utf8mb4_unicode_ci
        NULL,

    correct_answer ENUM('A', 'B', 'C', 'D', 'E') NOT NULL,
    solution TEXT NOT NULL,
    image_q VARCHAR(100) NULL,
    image_s VARCHAR(100) NULL,
	
    id_subject INT,
    
    CONSTRAINT fk_id_subject
		FOREIGN KEY (id_subject)
        REFERENCES subjects(id),
    
    CONSTRAINT fk_questions_professor
        FOREIGN KEY (id_professor)
        REFERENCES users(id)
)
ENGINE=InnoDB
DEFAULT CHARSET=utf8mb4
COLLATE=utf8mb4_unicode_ci;




-- Tabela de usuarios
create TABLE users(
	id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(100) NOT NULL,
    
    score INT UNSIGNED NOT NULL DEFAULT 0,
    
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_login DATETIME NULL,
    active TINYINT DEFAULT 1,
    role ENUM('aluno', 'professor', 'admin') DEFAULT 'aluno' NOT NULL
)
ENGINE=InnoDB
DEFAULT CHARSET=utf8mb4
COLLATE=utf8mb4_unicode_ci;

-- Tabela de Historico de scores
CREATE TABLE historico_score (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    usuario_id CHAR(36) NOT NULL,
    valor INT NOT NULL, 
    motivo VARCHAR(255) NOT NULL,
    criado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
)
ENGINE=InnoDB
DEFAULT CHARSET=utf8mb4
COLLATE=utf8mb4_unicode_ci;

CREATE TABLE subjects (
	id INT AUTO_INCREMENT PRIMARY KEY,
    subject_name VARCHAR(100) NOT NULL

);

INSERT IGNORE INTO subjects(subject_name) VALUES ("Estatística Básica"), ("Probabilidade"), ("Inferência Estatística");


DESC subjects;


UPDATE users
SET role = 'professor'
WHERE email = 'professor123@aasa.com';





select * from questions;
select * from subjects;
select * from users;	

-- Questoes com imagem
INSERT IGNORE INTO questions(id, issue, answer_a, answer_b, answer_c, answer_d, answer_e, correct_answer, solution, image_q, image_s, id_subject) 
VALUES 
    (1,"(Enem PPL 2022 — reaplicação) Até a Copa de 2010, apenas sete jogadores haviam conseguido o feito de marcar 8 ou mais gols em uma mesma edição da Copa do Mundo. O quadro apresenta os anos das edições da Copa nas quais ocorreram esses feitos, quais foram os jogadores que os realizaram e os respectivos números de gols marcados por cada um deles.(IMAGEM)Para facilitar a análise sobre a quantidade de gols marcados por esses artilheiros nas referidas copas, foi calculada a mediana da distribuição dos números de gols marcados por eles nas sete copas especificadas no quadro.A mediana dessa distribuição é igual a", "9", "9.7", "10", "10.2", "13", "A", "Para encontrar a mediana, colocaremos os dados em ordem:8 8 9 9 10 11 13 Sabemos que a mediana é o termo que está posicionado no centro. Como há 7 elementos, a mediana é o 4º valor: 8 8 9 9 10 11 13 Assim, a mediana desse conjunto de dados é 9.", "uploads/q1.png", NULL),
    (2,"(Enem PPL 2010) Em uma corrida de regularidade, a equipe campeã é aquela em que o tempo dos participantes mais se aproxima do tempo fornecido pelos organizadores em cada etapa. Um campeonato foi organizado em 5 etapas, e o tempo médio de prova indicado pelos organizadores foi de 45 minutos por prova. No quadro, estão representados os dados estatísticos das 5 equipes mais bem classificadas. Dados estatísticos das equipes mais bem classificadas (em minutos): (IMAGEM) Utilizando os dados estatísticos do quadro, a campeã foi a equipe", "I", "II", "III", "IV", "V", "C", "Sabemos que quanto menor é o desvio padrão, mais regulares são os dados. Note que todas possuem a mesma média, entretanto a equipe III é a que tem o menor desvio padrão. Logo, essa é a equipe que possui o tempo mais próximo da meta.", "uploads/q2.png", NULL),
    (3,"(UFT-TO) A nota final para uma disciplina de uma instituição de ensino superior é a média ponderada das notas A, B e C, cujos pesos são 1, 2 e 3, respectivamente. Paulo obteve A = 3,0 e B = 6,0. Quanto ele deve obter em C para que sua nota final seja 6,0?", "7", "8", "9", "10", "12", "A", "Seja x a terceira nota, temos que: (IMAGEM)", NULL, "uploads/r3.png"),
    (4,"(Enem 2015) Uma pessoa, ao fazer uma pesquisa com alguns alunos de um curso, coletou as idades dos entrevistados e organizou esses dados em um gráfico.(IMAGEM)Qual a moda das idades, em anos, dos entrevistados?", "9", "12", "13", "15", "21", "A","A moda é o valor com maior frequência, ou seja, o valor que mais ocorreu. Analisando o gráfico, vemos que o valor que possui a maior ocorrência é a idade de 9 anos, que apareceu 21 vezes. Sendo assim, a moda desse conjunto é 9.", "uploads/q4.png", NULL),
    (5,"Buscando fazer uma renda extra, Fabrício decidiu fazer bolo no pote em sua casa para vender na escola. Antes de começar a produzir, ele resolveu fazer uma pesquisa de campo para entender qual seriam os sabores preferidos dos seus clientes. Considerando que os potenciais clientes eram os 400 estudantes matriculados e os 22 funcionários da escola, Fabrício foi até lá para realizar a sua pesquisa e obteve a seguinte resposta:(IMAGEM)Analisando as respostas coletadas, podemos afirmar que:", "A pesquisa foi realizada com uma amostra de 422 pessoas.", "A pesquisa foi realizada com uma população de 210 pessoas.", "A pesquisa foi realizada com uma amostra de 210 pessoas.", "A pesquisa foi realizada com uma população de 400 pessoas.", "A pesquisa foi realizada com uma população de 220 pessoas.", "C", "A população abarca os estudantes e os funcionários, logo ela corresponde a 400 + 22 = 422 pessoas. Já a amostra é composta pelas pessoas que foram abordadas, que é igual a 35 + 40 + 65 + 48 + 22 = 210. Concluímos, então, que a pesquisa foi realizada com uma amostra de 210 pessoas.", "uploads/q5.png", NULL),
	(8, "Durante a organização das eleições para diretor escolar, os estudantes fizeram uma pesquisa sobre a intenção de voto dos alunos entre os candidatos A, B e C. Os resultados obtidos estão na tabela a seguir:(IMAGEM)Sabendo que na escola há 607 votantes e que as pessoas restantes não estavam na escola no dia da pesquisa, a porcentagem de pessoas não alcançadas nessa pesquisa é de aproximadamente:", "83%", "72%", "8.3%", "7.2%", "6%", "C", "Primeiramente, calcularemos a quantidade de respostas obtidas: 120 + 325 + 112 = 557 Agora, calcularemos a diferença: 607 – 557 = 50 Calculando a divisão, temos que: 50 : 600 = 0,08333... Transformando em porcentagem, temos que 0,0833... ≈  8,3%.", "uploads/q8.png", NULL),
    (9, "O gráfico a seguir mostra a quantidade de irmãos que cada aluno do 2º ano A tinha. Os alunos que eram filhos únicos não participaram da pesquisa. Ao analisar o gráfico, o professor percebeu que os estudantes se esqueceram de colocar as porcentagens referentes a cada um dos valores. (IMAGEM) Ainda que o gráfico não tenha as porcentagens, analisando-o é possível concluir que:", "Menos da metade dos estudantes pesquisados tem 2 irmãos ou mais.", "Menos da metade dos estudantes pesquisados possui no máximo 2 irmãos.", "A maior parte dos estudantes pesquisados possui exatamente 1 irmão.", "Mais da metade dos estudantes pesquisados tem 3 irmãos ou mais.", "Mais da metade dos estudantes pesquisados possui pelo menos 2 irmãos.", "E", "Analisando os arcos, é possível concluir que mais da metade dos estudantes pesquisados possui pelo menos 2 irmãos. Note que os arcos em azul, verde, amarelo e laranja representam quem tem 2 irmãos ou mais e compreendem mais da metade do gráfico.", "uploads/q9.png", NULL),
    (10, "Durante uma pesquisa feita por um petshop, o atendente da loja realizava duas perguntas para cada um dos clientes atendidos naquele dia: Quais são as espécies de seus animais de estimação?Quantos animais de estimação de cada espécie você tem?O resultado da pesquisa foi representado no gráfico a seguir: (IMAGEM) Após analisar o gráfico, julgue como verdadeira ou falsa cada uma das afirmativas a seguir: I – Podemos inferir que a pesquisa foi respondida por 45 clientes. II – O animal mais frequente é o cachorro, que representa aproximadamente 47% dos animais. III – Há somente 3 animais diferentes de gato, cachorro e peixe. Marque a alternativa correta:", "Todas as afirmativas são verdadeiras.", "Somente a afirmativa I é falsa", "Somente a afirmativa II é falsa", "Somente a afirmativa III é falsa.", "Todas as afirmativas são falsas", "B", "I – Falsa Um mesmo cliente pode ter mais de um animal, e eles foram contabilizados. II – Verdadeira Quando dividimos 21 por 45, temos que: 21 : 45 = 0,47 = 47% III – Verdadeira Analisando o gráfico, vemos que na barra que indica “outros” há 3 animais.", "uploads/q10.png", NULL),
    (12, "Os valores dos salários dos funcionários de uma empresa estão representados na tabela a seguir:(IMAGEM)Analisando a tabela de salários dos funcionários da empresa, podemos afirmar que:", "A moda salarial dessa empresa é R$ 3.525,00, que é o salário dos consultores.", "A mediana dos salários é de R$ 6.391,40.", "A maioria dos funcionários ganha abaixo de R$ 3.525,00.", "A moda salarial dessa empresa é o conjunto {2, 4}.", "A média salarial dessa empresa é R$ 3.525,00.", "A", "O cargo que possui a maior quantidade de funcionários é o de consultor, logo a moda será o salário de um consultor, que é de R$ 3.525,00.", "uploads/q12.png", NULL),
	(6,"Dados os números 10, 6, 4, 3 e 9, cinco números de uma lista de 8 números inteiros, o menor valor possível para a mediana desse conjunto é:", "3", "3.5", "4", "6", "10", "B", "Para encontrar a mediana, colocaremos os dados em ordem:8 8 9 9 10 11 13 Sabemos que a mediana é o termo que está posicionado no centro. Como há 7 elementos, a mediana é o 4º valor:8 8 9 9 10 11 13 Assim, a mediana desse conjunto de dados é 9.",NULL, NULL),
	(14, "No lançamento de dois dados, qual é o número total de possibilidades de resultados e qual é a probabilidade de obtermos soma igual a 8?", "36 e 5%", "36 e 14%", "6 e 5%", "5 e 6%", "36 e 6%", "B", "Primeiramente, vamos descobrir o número total de possibilidades, pois ele será usado para descobrirmos a probabilidade de obter soma 8: São dois dados com seis resultados possíveis cada. As combinações entre esses resultados podem ser calculadas multiplicando-se o número de resultados do primeiro pelo do segundo: 6·6 = 36 Também poderíamos ter escrito todas as possibilidades e contado-as, mas esse procedimento gasta mais tempo. Portanto, o número total de possibilidades de resultados é 36. Para calcular a probabilidade de sair soma 8, devemos procurar as possibilidades de obter tal soma. São elas: 2,6; 3,5; 4,4; 5,3 e 6,2 Sendo 5 o número de possibilidades de obter soma 8, divida esse número pelo número total de possibilidades de resultados:",NULL, NULL),
	(15, "Qual é a probabilidade de, no lançamento de 4 moedas, obtermos cara em todos os resultados?", "2%", "2.2%", "6.2%", "4%", "4.2%", "C", "Primeiramente, é necessário encontrar o número total de possibilidades de resultados: 2·2·2·2 = 16 Posteriormente, devemos encontrar o número de possibilidades de obter cara em todos os resultados. Na realidade, só existe uma possibilidade de que isso aconteça. Por fim, basta dividir o segundo pelo primeiro: 1/16 = 0,0625 Multiplicando 6,25 por 100, para obter um percentual, teremos: 6,25%",NULL, NULL),
	(16, "Duas moedas e dois dados, todos diferentes entre si, foram lançados simultaneamente. Qual é o número de possibilidades de resultados para esse experimento?", "146", "142", "133", "144", "155", "D", "Para calcular o número de possibilidades de resultados de um experimento nesses moldes, multiplique o número de resultados possíveis de cada objeto em observação. No caso de cada moeda, 2 resultados, e de cada dado, 6 resultados: 2·2·6·6 = 4·36 = 144",NULL, NULL),
	(17, "Qual é o número total de possibilidades de resultado no lançamento de 5 moedas?", "2", "5", "10", "24", "32", "E", "O número total de resultados que pode ser obtido no lançamento de duas moedas é encontrado multiplicando-se a quantidade de resultados da primeira moeda pela quantidade da segunda e assim por diante. Observe: 2·2·2·2·2 = 32 Portanto, são 32 possibilidades diferentes.",NULL, NULL),
	(18, "Considere que existe uma urna na qual foram colocadas 200 esferas de plásticos, e cada uma delas possui um pedaço de papel no seu interior. As esferas são coloridas, sendo uma de cada cor. Os pedaços de papel, então, trazem números de 1 a 200, diferentes a cada esfera. Qual das alternativas apresenta a probabilidade de que, ao sortear uma dessas esferas, ela tenha um número divisível por 3 e por 5 ao mesmo tempo?", "13.0%", "6.5%", "3.25%", "9.75%", "9%", "B", "Para saber quantos divisores de 3 e 5 têm entre 1 a 200, primeiro temos que achar o divido comum: -MMC de 3 e 5 = 15 Sabendo o fator comum, basta dividi-lo pela quantidade: 200/15 = 13 divisores comum Probabilidade: Quero/Total; P = 13/200 {divide por dois para ciar na base 10}; P = 6,5/100; P = 6,5 %",NULL, NULL),
	(19, "(Espcex (Aman)) Numa sala existem duas caixas com bolas amarelas e verdes. Na caixa 1, há 3 bolas amarelas e 7 bolas verdes. Na caixa 2, há 5 bolas amarelas e 5 bolas verdes. De forma aleatória, uma bola é extraída da caixa 1, sem que se saiba a sua cor, e é colocada na caixa 2. Após esse procedimento, a probabilidade de extrair uma bola amarela da caixa 2 é igual a:", "49/110", "51/110", "53/110", "57/110", "61/110", "C", 'Temos dois casos a considerar: i) retirada de uma bola amarela da caixa 1 e de outra amarela da caixa 2 Neste caso temos que a probabilidade de retirar uma bola amarela da primeira caixa é 3/10 e da segunda caixa é 6/11. Como neste caso estamos utilizando a conjunção "E" multiplicamos ambos os resultados: 3/10 · 6/11 ii) retirada de uma bola verde da caixa 1 e de uma amarela da caixa 2 Neste caso temos que a probabilidade de retirar uma bola verde da primeira caixa é 7/10 e retirar da segunda caixa uma bola amarela é 5/11. Como neste caso estamos utilizando a conjunção "E" multiplicamos ambos os resultados: 7/10 · 5/11 Desse modo, devemos somar ambos os resultados pois queremos um "OU" outro, a resposta é dada por: 3/10 · 6/11 + 7/10 · 5/11 = 53/110',NULL, NULL),
	(20, "(Enem PPL) Para um docente estrangeiro trabalhar no Brasil, ele necessita validar o seu diploma junto ao Ministério da Educação. Num determinado ano, somente para estrangeiros que trabalharão em universidades dos estados de São Paulo e Rio de Janeiro, foram validados os diplomas de 402 docentes estrangeiros. Na tabela, está representada a distribuição desses docentes estrangeiros, por países de origem, para cada um dos dois estados. A probabilidade de se escolher, aleatoriamente, um docente espanhol, sabendo-se que ele trabalha em uma universidade do estado de São Paulo é", "60/402", "60/239", "60/100", "100/239", "279/402", "B", 'Perceba que queremos saber a probabilidade de ser um espanhol sabendo que ele trabalha em uma universidade de São Paulo. Se A é o evento "docente espanhol" e B é o evento "trabalha em uma universidade do estado de São Paulo", então queremos calcular P(A|B). Sabendo pela tabela, que o número de professores espanhóis que lecionam em São Paulo é: n(A ∩ B) = 60 Além disso, sabemos que o número de professores estrangeiros que trabalham em São Paulo é n(B)= 239. Dado a fórmula de probabilidade condicional sabemos que: P(A|B)=(n(A ∩ B))/(n(B)) = 60/239',NULL, NULL),
	(21, '(UFPR) Um kit para impressão vem com oito cartuchos de tinta, de formato idêntico, para impressora. Nesse kit há dois cartuchos de cada uma das quatro cores diferentes necessárias para uma impressora caseira (ciano, magenta, amarelo e preto). Escolhendo aleatoriamente dois cartuchos desse kit, qual a probabilidade de se obter duas cores distintas?', '6,7', '1/12', '15/56', '1/48', '1/64', 'A', 'Como são dois cartuchos de cada uma das quatro cores, não importa qual o cartucho pegar, a probabilidade de pegar outro cartucho da mesma cor é 1/7, pois há apenas mais um cartucho daquela cor dentre os 7 cartuchos que restaram. Desse modo, a probabilidade de pegar dois cartuchos de cores distintas é o complementar, ou seja 1 - 1/7 = 6/7',NULL, NULL),
	(22, 'Um morador de uma região metropolitana tem 50% de probabilidade de atrasar-se para o trabalho quando chove na região. Caso não chova, sua probabilidade de atraso é de 25%. Para um determinado dia, o serviço de meteorologia estima em 30% de probabilidade da ocorrência de chuva nessa região. Qual é a probabilidade de esse morador se atrasar para o serviço no dia para o, qual foi dada a estimativa de chuva?', '0,075', '0,15', '0,325', '0,6', '0,8','C','P(A) = probabilidade de chover no dia * probabilidade de se atrasar quando chove + probabilidade de não chover no dia * probabilidade de não se atrasar quando chove. Aplicando as porcentagens em decimais temos: P(A) = 0,30 * 0,50 + 0,70 * 0,25 P(A) = 0,15 + 0,175 P(A) = 0,325',NULL, NULL),
	(23, 'Todo o país passa pela primeira fase da campanha de vacinação contra a gripe suína (H1N1). Segundo um médico infectologista do Instituto Emílio Ribas, de São Paulo, a imunização “deve mudar”, no país, a história da epidemia. Com a vacina, de acordo com ele, o Brasil tem a chance de barrar uma tendência do crescimento da doença, que já matou 17 mil no mundo. A tabela apresenta dados específicos de um único posto de vacinação. Escolhendo-se aleatoriamente uma pessoa atendida nesse posto de vacinação, a probabilidade de ela ser portadora de doença crônica é', '8%', '9%', '11%', '12%', '22%', 'C','A tabela nos traz todas as informações importantes, que são o total de pessoas vacinadas (nosso n(U)) e o espaço amostral de casos favoráveis (aqui, nos interessamos pelo número de pessoas vacinadas com doenças crônicas, ou seja, 22). Assim: P(A) = 22/200 P(A) = 11/100',NULL, NULL),
	(24, 'No próximo final de semana, um grupo de alunos participará de uma aula de campo. Em dias chuvosos, aulas de campo não podem ser realizadas. A ideia é que essa aula seja no sábado, mas, se estiver chovendo no sábado, a aula será adiada para o domingo. Segundo a meteorologia, a probabilidade de chover no sábado é de 30% e a de chover no domingo é de 25%. A probabilidade de que a aula de campo ocorra no domingo é de:', '5,00%', '7,50%', '22,50%', '30,00%','75,00%', "C", 'Para que a aula aconteça no domingo, é preciso que chova no sábado e não chova no domingo. Esse “e” nos mostra que é preciso encontrar o produto entre essas probabilidades. A fórmula muda um pouco: P(A∩B) = P(A) x P(B) Já sabemos qual é o nosso P(A), a probabilidade de chover no sábado, que é de 30% ou 0,3. Também sabemos que a chance de chover no domingo é de 25%, o que nos leva a calcular nosso evento B favorável, a probabilidade de não chover no domingo: 100% - 25% = 75%. Nosso P(B), então, é de 75% ou 0,75. Então, o cálculo será: P(A∩B) = 0,3 x 0,75 P (A∩B) = 0,225 = 22,5%',NULL, NULL)
	;

	
