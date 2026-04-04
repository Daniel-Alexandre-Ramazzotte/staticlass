#!/usr/bin/env python3
"""
migrate_apostila.py — Importa questões da Apostila Estatística na Prática 2 para o banco staticlass.

Todas as questões possuem fonte em provas de concurso (source='concurso'),
exceto as sem atribuição (source='apostila').

Uso:
    cd app/backend
    python -m statl.migrate_apostila [--dry-run]
"""

import argparse
import os
from pathlib import Path
from dotenv import load_dotenv

_SCRIPT_DIR = Path(__file__).resolve().parent
load_dotenv(_SCRIPT_DIR.parent / ".env")

# ---------------------------------------------------------------------------
# Definição das questões
# Campos: issue, correct_answer, solution (opcional), difficulty, chapter_num,
#         source, alternatives: list of {letter, text}
# chapter_num: 1=Descritiva, 2=Probabilidade, 3=Inferência, 4=Regressão
# ---------------------------------------------------------------------------
QUESTIONS = [

    # ========================================================================
    # CAPÍTULO 2 — Tabelas de Frequência → Estatística Descritiva (cap 1)
    # ========================================================================
    {
        "issue": "(IMPARH – CGM Fortaleza, 2025)\n\nQual definição descreve corretamente a função de uma tabela de frequência?",
        "correct_answer": "A",
        "solution": "A tabela de frequência organiza os dados mostrando quantas vezes cada valor aparece no conjunto de dados.",
        "difficulty": 1,
        "chapter_num": 1,
        "source": "concurso",
        "alternatives": [
            {"letter": "A", "text": "Organizar dados mostrando quantas vezes cada valor aparece."},
            {"letter": "B", "text": "Calcular média e mediana."},
            {"letter": "C", "text": "Organizar variáveis qualitativas por ordem alfabética."},
            {"letter": "D", "text": "Calcular variância e desvio padrão."},
            {"letter": "E", "text": "Representar o valor absoluto de um conjunto."},
        ],
    },
    {
        "issue": "(FGV – 2012)\n\nUm pesquisador fez um conjunto de medidas em um laboratório e construiu uma tabela com as frequências relativas (em porcentagem) de cada medida:\n\n| Valor medido | Frequência relativa (%) |\n|---|---|\n| 1,0 | 30 |\n| 1,2 | 7,5 |\n| 1,3 | 45 |\n| 1,7 | 12,5 |\n| 1,8 | 5 |\n| Total | 100 |\n\nAssim, por exemplo, o valor 1,0 foi obtido em 30% das medidas realizadas. A menor quantidade possível de vezes que o pesquisador obteve o valor medido maior que 1,5 é:",
        "correct_answer": "B",
        "solution": "Valores maiores que 1,5 são 1,7 (12,5%) e 1,8 (5%), totalizando 17,5%. Para que a contagem seja inteira, o número mínimo de medidas n deve satisfazer n × 0,175 ∈ ℤ. O menor n que satisfaz isso é n = 40, resultando em 40 × 0,175 = 7 medidas.",
        "difficulty": 2,
        "chapter_num": 1,
        "source": "concurso",
        "alternatives": [
            {"letter": "A", "text": "6"},
            {"letter": "B", "text": "7"},
            {"letter": "C", "text": "8"},
            {"letter": "D", "text": "9"},
            {"letter": "E", "text": "10"},
        ],
    },
    {
        "issue": "No estudo da estatística, podemos afirmar que a frequência absoluta:",
        "correct_answer": "B",
        "solution": "A frequência absoluta é simplesmente o número de vezes que um mesmo dado se repetiu dentro do conjunto de dados.",
        "difficulty": 1,
        "chapter_num": 1,
        "source": "apostila",
        "alternatives": [
            {"letter": "A", "text": "é a razão entre o número de vezes que um mesmo dado se repetiu e o total de dados coletados."},
            {"letter": "B", "text": "é o número de vezes que um mesmo dado se repetiu dentro do conjunto."},
            {"letter": "C", "text": "é a chance de um determinado evento acontecer."},
            {"letter": "D", "text": "é a frequência de valores exatos dentro de uma pesquisa."},
            {"letter": "E", "text": "é o valor absoluto de um número natural."},
        ],
    },

    # ========================================================================
    # CAPÍTULO 3 — Gráficos → Estatística Descritiva (cap 1)
    # ========================================================================
    {
        "issue": "(FADESP - 2020 - UEPA - Técnico de Nível Superior - Estatística)\n\nO gráfico mais adequado para representar uma distribuição de frequência de uma variável nominal é:",
        "correct_answer": "B",
        "solution": "Para variáveis nominais (qualitativas), o gráfico de barras é o mais adequado, pois permite comparar categorias sem implicar ordem ou continuidade.",
        "difficulty": 1,
        "chapter_num": 1,
        "source": "concurso",
        "alternatives": [
            {"letter": "A", "text": "Histograma."},
            {"letter": "B", "text": "Diagrama de barras."},
            {"letter": "C", "text": "Polígono de frequências."},
            {"letter": "D", "text": "Polígono de frequências acumuladas."},
        ],
    },
    {
        "issue": "(CESGRANRIO – 2025 – BANESE – Técnico Bancário III)\n\nUm banco realizou um estudo interno para analisar o tempo médio de aprovação de diferentes tipos de crédito. Os resultados foram:\n\n| Tipo de Crédito | Tempo médio (dias úteis) |\n|---|---|\n| Empréstimo Pessoal | 3 |\n| Financiamento de Veículos | 5 |\n| Financiamento Imobiliário | 20 |\n| Crédito Educacional | 7 |\n| Crédito para Viagens | 5 |\n| Crédito Rural | 3 |\n\nA melhor forma de representar graficamente os dados da tabela é através de um:",
        "correct_answer": "C",
        "solution": "O gráfico de barras é o mais indicado para comparar valores entre categorias distintas (tipos de crédito), destacando diferenças como o prazo elevado do financiamento imobiliário.",
        "difficulty": 1,
        "chapter_num": 1,
        "source": "concurso",
        "alternatives": [
            {"letter": "A", "text": "Gráfico de linha"},
            {"letter": "B", "text": "Gráfico de dispersão"},
            {"letter": "C", "text": "Gráfico de barras"},
            {"letter": "D", "text": "Gráfico de setores"},
        ],
    },
    {
        "issue": "(FUNDATEC-RS – 2022)\n\nO gráfico abaixo representa um diagrama de caixa (box-plot) de uma variável quantitativa qualquer. Assinale a alternativa que melhor representa as letras A, B, C e D destacadas no gráfico, respectivamente.\n\n[Box-plot: A = ponto acima do bigode superior (outlier); B = limite superior da caixa; C = linha central da caixa; D = ponto abaixo do bigode inferior]",
        "correct_answer": "A",
        "solution": "No box-plot: A representa valores atípicos (outliers) acima do bigode superior; B é o 3º quartil (Q3, limite superior da caixa); C é o 2º quartil (mediana); D é o valor mínimo (extremidade inferior do bigode).",
        "difficulty": 2,
        "chapter_num": 1,
        "source": "concurso",
        "alternatives": [
            {"letter": "A", "text": "Valores atípicos – 3º quartil – 2º quartil – valor mínimo."},
            {"letter": "B", "text": "Valores atípicos – 4º quartil – mediana – 1º quartil."},
            {"letter": "C", "text": "Valores máximos – 3º quartil – média – valor mínimo."},
            {"letter": "D", "text": "Outliers – 2º quartil – mediana – valor mínimo."},
            {"letter": "E", "text": "Outliers – 4º quartil – 3º quartil – 1º quartil."},
        ],
    },
    {
        "issue": "(INAZ do Pará – 2025 – Adaptada)\n\nEm um estudo de desempenho acadêmico, foi utilizado um gráfico de barras para representar as médias de notas dos alunos em diferentes disciplinas. Um gráfico de setores foi utilizado para ilustrar a distribuição percentual de alunos aprovados, reprovados e em recuperação. As tabelas são usadas para organizar os dados brutos.\n\nAssinale a alternativa INCORRETA sobre o uso de gráficos e tabelas na representação de dados:",
        "correct_answer": "E",
        "solution": "A afirmativa E é incorreta: a interpretação de gráficos e tabelas SEMPRE deve levar em consideração o contexto dos dados. Ignorar o contexto pode levar a conclusões equivocadas.",
        "difficulty": 1,
        "chapter_num": 1,
        "source": "concurso",
        "alternatives": [
            {"letter": "A", "text": "O gráfico de barras é adequado para comparar dados categóricos, como as notas em diferentes disciplinas, pois facilita a visualização das diferenças entre as categorias."},
            {"letter": "B", "text": "As tabelas são eficazes para apresentar dados quantitativos de maneira precisa e organizada, permitindo uma comparação detalhada entre diferentes variáveis."},
            {"letter": "C", "text": "O gráfico de linha é a melhor escolha quando se quer representar a variação de dados ao longo do tempo, por exemplo, a evolução das notas de um aluno ao longo do semestre."},
            {"letter": "D", "text": "O gráfico de setores é ideal para mostrar a distribuição proporcional de diferentes categorias, como a porcentagem de alunos em aprovação, recuperação e reprovação."},
            {"letter": "E", "text": "A interpretação de gráficos e tabelas pode ser feita sem levar em consideração o contexto dos dados apresentados, desde que o gráfico esteja bem apresentado."},
        ],
    },
    {
        "issue": "(FGV – 2025 – SEFAZ-RS)\n\nAvalie se as afirmativas a seguir, relacionadas a histogramas, são verdadeiras (V) ou falsas (F):\n\n( ) Um histograma é construído a partir de dados qualitativos, representando a frequência absoluta ou relativa em barras de tamanhos proporcionais às frequências.\n\n( ) Em um histograma com classes de mesma amplitude, a área de cada barra é proporcional à frequência absoluta da respectiva classe.\n\n( ) Se uma curva de frequência associada a um histograma é simétrica e unimodal, a média, mediana e moda coincidem.\n\nAs afirmativas são, respectivamente:",
        "correct_answer": "D",
        "solution": "I: FALSA — histogramas são construídos a partir de dados QUANTITATIVOS, não qualitativos. II: VERDADEIRA — em classes de mesma amplitude, a área é proporcional à frequência. III: VERDADEIRA — em distribuições simétricas e unimodais, as três medidas de tendência central coincidem.",
        "difficulty": 2,
        "chapter_num": 1,
        "source": "concurso",
        "alternatives": [
            {"letter": "A", "text": "V – V – V"},
            {"letter": "B", "text": "V – F – V"},
            {"letter": "C", "text": "V – V – F"},
            {"letter": "D", "text": "F – V – V"},
            {"letter": "E", "text": "F – F – F"},
        ],
    },
    {
        "issue": "(INSTITUTO AOCP – 2024 – TRF)\n\nUm Gráfico em Setores Circulares representa o percentual de processos em uma determinada Vara Federal por tipo de crime:\n\n| Tipo de crime | Processos (%) |\n|---|---|\n| Corrupção ativa | 9,52 |\n| Corrupção passiva | 28,57 |\n| Peculato | 38,10 |\n| Lavagem de dinheiro | 23,81 |\n\nÉ correto afirmar que, no Gráfico em Setor, o ângulo do setor circular correspondente ao crime de peculato tem o valor em graus de:",
        "correct_answer": "A",
        "solution": "O ângulo do setor para peculato = 38,10% × 360° = 0,3810 × 360 = 137,16°.",
        "difficulty": 2,
        "chapter_num": 1,
        "source": "concurso",
        "alternatives": [
            {"letter": "A", "text": "137,160."},
            {"letter": "B", "text": "102,852."},
            {"letter": "C", "text": "140,135."},
            {"letter": "D", "text": "95,123."},
            {"letter": "E", "text": "150,342."},
        ],
    },

    # ========================================================================
    # CAPÍTULO 4 — Medidas de Posição e Dispersão → Descritiva (cap 1)
    # ========================================================================
    {
        "issue": "(FCC – 2025)\n\nUma população (P1) é formada pelos 40 salários dos funcionários em uma prefeitura que apresenta uma média salarial igual a 5 salários mínimos (SM) com um coeficiente de variação igual a 10%. Essa prefeitura decide abrir vaga para admissão de mais 10 funcionários ganhando, cada um, 5 SM formando uma nova população (P2) com 50 funcionários. A variância de P2, em (SM)² é igual a:",
        "correct_answer": "E",
        "solution": "P1: μ=5SM, CV=10% → σ₁=0,5SM → σ₁²=0,25(SM)². Os 10 novos funcionários ganham exatamente 5SM (variância=0). Variância de P2 = [40×0,25 + 10×0]/50 = 10/50 = 0,20 (SM)².",
        "difficulty": 3,
        "chapter_num": 1,
        "source": "concurso",
        "alternatives": [
            {"letter": "A", "text": "0,01"},
            {"letter": "B", "text": "0,25"},
            {"letter": "C", "text": "0,05"},
            {"letter": "D", "text": "0,35"},
            {"letter": "E", "text": "0,20"},
        ],
    },
    {
        "issue": "(FCC – 2025 – Adaptada)\n\nUm Analista de TI da prefeitura está avaliando os seguintes dados referentes às consultas realizadas nos postos de saúde do município ao longo de um ano:\n\n- Média: 350 consultas por mês\n- Mediana: 300 consultas por mês\n- Desvio padrão: 80 consultas\n- Coeficiente de variação (CV): 22,86%\n\nCom base nesses valores, qual das afirmativas é correta?",
        "correct_answer": "C",
        "solution": "CV = 22,86% < 30%, o que indica variabilidade BAIXA em relação à média (convencionalmente, CV < 30% = baixa variabilidade). As demais afirmativas são incorretas: o CV não indica altíssima variabilidade; o desvio padrão sozinho não é suficiente sem a média; e a diferença média–mediana pode ser relevante na análise exploratória.",
        "difficulty": 2,
        "chapter_num": 1,
        "source": "concurso",
        "alternatives": [
            {"letter": "A", "text": "O coeficiente de variação indica que os dados possuem altíssima variabilidade em relação à média."},
            {"letter": "B", "text": "O desvio padrão sozinho é suficiente para interpretar de forma completa a dispersão dos dados em relação à média."},
            {"letter": "C", "text": "O coeficiente de variação sugere que a variabilidade dos dados é baixa em relação à média."},
            {"letter": "D", "text": "A diferença entre a média e a mediana é irrelevante na análise exploratória de dados."},
        ],
    },
    {
        "issue": "(SELECON – 2025 – HEMOMINAS – Adaptada)\n\nDurante a análise hematológica de exame de rotina de um paciente de 45 anos, o técnico de laboratório observou que as medidas de dispersão dos glóbulos vermelhos apresentavam variações significativas. As medidas de dispersão são importantes para avaliar a consistência dos resultados laboratoriais. Nesse caso, deve-se utilizar para avaliar a variabilidade dos resultados dos exames de hematologia:",
        "correct_answer": "C",
        "solution": "O desvio padrão é a medida de dispersão que avalia a variabilidade dos resultados em relação à média. É a medida mais utilizada em contextos laboratoriais para verificar a consistência das medições.",
        "difficulty": 1,
        "chapter_num": 1,
        "source": "concurso",
        "alternatives": [
            {"letter": "A", "text": "Média aritmética"},
            {"letter": "B", "text": "Mediana"},
            {"letter": "C", "text": "Desvio padrão"},
            {"letter": "D", "text": "Moda"},
            {"letter": "E", "text": "Amplitude"},
        ],
    },
    {
        "issue": "(Instituto Consulplan – 2025 – HEMOBRÁS)\n\nDurante uma capacitação interna de uma empresa da área farmacêutica, foram apresentados os dados de desempenho de dois grupos:\n\nGrupo A: Média = 7,5; Desvio-padrão = 1,2; n = 20\nGrupo B: Média = 8,0; Desvio-padrão = 1,0; n = 30\n\nAnalise as afirmativas:\nI. O Grupo B apresenta maior coeficiente de variação das notas em relação ao Grupo A.\nII. A média ponderada, com relação ao número de participantes das notas dos dois grupos, é maior que 7,75.\nIII. A variância das notas do Grupo A é igual a 1,44.\nIV. O Grupo A possui maior concentração de notas em torno da média do que o Grupo B.\n\nEstá correto o que se afirma apenas em:",
        "correct_answer": "C",
        "solution": "I: CV_A = 1,2/7,5 = 16%; CV_B = 1,0/8,0 = 12,5% → Grupo A tem maior CV (FALSA). II: Média ponderada = (20×7,5 + 30×8,0)/50 = (150+240)/50 = 7,8 > 7,75 (VERDADEIRA). III: Variância A = 1,2² = 1,44 (VERDADEIRA). IV: Menor CV = maior concentração, mas CV_B < CV_A → Grupo B é mais concentrado (FALSA). Corretas: II e III.",
        "difficulty": 3,
        "chapter_num": 1,
        "source": "concurso",
        "alternatives": [
            {"letter": "A", "text": "I e II."},
            {"letter": "B", "text": "I e III."},
            {"letter": "C", "text": "II e III."},
            {"letter": "D", "text": "III e IV."},
            {"letter": "E", "text": "II e IV."},
        ],
    },
    {
        "issue": "(VUNESP – 2023)\n\nUm jogo educativo foi criado com um sistema de pontuação por moedas. Na confecção deste jogo há 2 moedas de 10 pontos, 4 moedas de 20 pontos, 7 moedas de 30 pontos, 6 moedas de 40 pontos e 1 moeda de 50 pontos, totalizando 20 moedas. A variância populacional da pontuação por moedas vale:",
        "correct_answer": "D",
        "solution": "Média = (2×10 + 4×20 + 7×30 + 6×40 + 1×50)/20 = (20+80+210+240+50)/20 = 600/20 = 30.\nVariância = [2×(10-30)² + 4×(20-30)² + 7×(30-30)² + 6×(40-30)² + 1×(50-30)²]/20 = [2×400 + 4×100 + 0 + 6×100 + 1×400]/20 = [800+400+0+600+400]/20 = 2200/20 = 110.",
        "difficulty": 2,
        "chapter_num": 1,
        "source": "concurso",
        "alternatives": [
            {"letter": "A", "text": "200"},
            {"letter": "B", "text": "220"},
            {"letter": "C", "text": "300"},
            {"letter": "D", "text": "110"},
            {"letter": "E", "text": "100"},
        ],
    },
    {
        "issue": "(CESGRANRIO – 2018)\n\nHá dez anos a média das idades, em anos completos, de um grupo de 526 pessoas era de 30 anos, com desvio padrão de 8 anos. Considerando-se que todas as pessoas desse grupo estão vivas, o quociente entre o desvio-padrão e a média das idades, em anos completos, hoje, é:",
        "correct_answer": "C",
        "solution": "Hoje, cada pessoa tem 10 anos a mais: média atual = 30 + 10 = 40 anos. O desvio padrão não muda com uma translação: σ = 8 anos. Quociente (CV) = 8/40 = 0,20.",
        "difficulty": 2,
        "chapter_num": 1,
        "source": "concurso",
        "alternatives": [
            {"letter": "A", "text": "0,45"},
            {"letter": "B", "text": "0,42"},
            {"letter": "C", "text": "0,20"},
            {"letter": "D", "text": "0,27"},
            {"letter": "E", "text": "0,34"},
        ],
    },
    {
        "issue": "(Enem – 2019)\n\nUm fiscal de certa empresa de ônibus registra o tempo, em minutos, que um motorista novato gasta para completar certo percurso. O Quadro 1 apresenta os tempos gastos pelo motorista ao realizar o mesmo percurso sete vezes:\n\n| 48 | 54 | 50 | 46 | 44 | 52 | 49 |\n\nO Quadro 2 apresenta uma classificação para a variabilidade do tempo, segundo o valor do desvio-padrão:\n\n| Variabilidade | Desvio padrão do tempo (min) |\n|---|---|\n| Extremamente baixa | 0 < σ ≤ 2 |\n| Baixa | 2 < σ ≤ 4 |\n| Moderada | 4 < σ ≤ 6 |\n| Alta | 6 < σ ≤ 8 |\n| Extremamente alta | σ > 8 |\n\nCom base nas informações, a variabilidade do tempo é:",
        "correct_answer": "B",
        "solution": "Média = (48+54+50+46+44+52+49)/7 = 343/7 = 49. Variância = [(48-49)²+(54-49)²+(50-49)²+(46-49)²+(44-49)²+(52-49)²+(49-49)²]/7 = [1+25+1+9+25+9+0]/7 = 70/7 = 10. σ = √10 ≈ 3,16. Como 2 < 3,16 ≤ 4, a variabilidade é Baixa.",
        "difficulty": 2,
        "chapter_num": 1,
        "source": "concurso",
        "alternatives": [
            {"letter": "A", "text": "Extremamente baixa."},
            {"letter": "B", "text": "Baixa."},
            {"letter": "C", "text": "Moderada."},
            {"letter": "D", "text": "Alta."},
            {"letter": "E", "text": "Extremamente alta."},
        ],
    },

    # ========================================================================
    # CAPÍTULO 5 — Técnicas de Amostragem → Descritiva (cap 1)
    # ========================================================================
    {
        "issue": "(CESPE – 2019 – IBGE – Adaptada)\n\nEm um levantamento de dados sobre a renda média familiar, decidiu-se utilizar amostragem aleatória simples. Assinale a alternativa que melhor descreve esse tipo de amostragem.",
        "correct_answer": "A",
        "solution": "A amostragem aleatória simples (AAS) é aquela em que cada elemento da população tem a mesma probabilidade de ser selecionado para a amostra.",
        "difficulty": 1,
        "chapter_num": 1,
        "source": "concurso",
        "alternatives": [
            {"letter": "A", "text": "Seleção em que cada elemento da população tem a mesma probabilidade de ser escolhido."},
            {"letter": "B", "text": "Seleção em que apenas um estrato é sorteado."},
            {"letter": "C", "text": "Seleção proporcional ao tamanho do elemento."},
            {"letter": "D", "text": "Seleção com base em conveniência."},
        ],
    },
    {
        "issue": "(FCC – 2018 – TRE-SP – Adaptada)\n\nEm uma pesquisa eleitoral, foram sorteados 200 eleitores de uma cidade com 10 mil eleitores. Qual é a fração amostral utilizada?",
        "correct_answer": "A",
        "solution": "Fração amostral = n/N = 200/10.000 = 0,02.",
        "difficulty": 1,
        "chapter_num": 1,
        "source": "concurso",
        "alternatives": [
            {"letter": "A", "text": "0,02"},
            {"letter": "B", "text": "0,20"},
            {"letter": "C", "text": "2,0"},
            {"letter": "D", "text": "20,0"},
        ],
    },
    {
        "issue": "(OBMEP – 2017 – Adaptada)\n\nUma escola possui 1.200 alunos distribuídos igualmente em 3 turnos. Para uma pesquisa sobre hábitos de leitura, um professor decidiu selecionar aleatoriamente 40 alunos de cada turno. Esse tipo de amostragem é:",
        "correct_answer": "C",
        "solution": "Como a população foi dividida em estratos (turnos) e o mesmo número de elementos foi selecionado de cada estrato (40 de cada turno), trata-se de amostragem estratificada com alocação igual.",
        "difficulty": 1,
        "chapter_num": 1,
        "source": "concurso",
        "alternatives": [
            {"letter": "A", "text": "Aleatória simples"},
            {"letter": "B", "text": "Estratificada proporcional"},
            {"letter": "C", "text": "Estratificada com alocação igual"},
            {"letter": "D", "text": "Por conglomerados"},
        ],
    },
    {
        "issue": "(CESGRANRIO – 2020 – BNDES – Adaptada)\n\nUma empresa deseja avaliar a satisfação de seus clientes, mas seleciona apenas os 50 primeiros que responderem a um e-mail. Esse tipo de amostragem é classificado como:",
        "correct_answer": "C",
        "solution": "A seleção dos 50 primeiros que responderem configura amostragem por conveniência, pois os elementos são escolhidos pela facilidade de acesso, sem aleatoriedade.",
        "difficulty": 1,
        "chapter_num": 1,
        "source": "concurso",
        "alternatives": [
            {"letter": "A", "text": "Aleatória simples"},
            {"letter": "B", "text": "Sistemática"},
            {"letter": "C", "text": "Por conveniência"},
            {"letter": "D", "text": "Estratificada"},
        ],
    },
    {
        "issue": "(FGV – 2021 – IBGE – Adaptada)\n\nUm pesquisador visita residências escolhendo sempre a 10ª casa a partir de um ponto inicial aleatório. Esse procedimento caracteriza uma amostragem:",
        "correct_answer": "A",
        "solution": "A escolha da 10ª casa a partir de um ponto inicial aleatório, seguindo um padrão fixo de intervalo, caracteriza a amostragem sistemática (intervalo k = 10).",
        "difficulty": 1,
        "chapter_num": 1,
        "source": "concurso",
        "alternatives": [
            {"letter": "A", "text": "Sistemática"},
            {"letter": "B", "text": "Aleatória simples"},
            {"letter": "C", "text": "Por conglomerados"},
            {"letter": "D", "text": "Intencional"},
        ],
    },
    {
        "issue": "(OBMEP – 2016 – Adaptada)\n\nUma urna contém 200 bolas numeradas de 1 a 200. Um aluno sorteia 20 bolas ao acaso, sem reposição, para estimar a média dos números. Esse processo é exemplo de:",
        "correct_answer": "C",
        "solution": "O sorteio de 20 bolas ao acaso sem reposição de uma população de 200 bolas é um exemplo clássico de amostragem aleatória simples.",
        "difficulty": 1,
        "chapter_num": 1,
        "source": "concurso",
        "alternatives": [
            {"letter": "A", "text": "Censo"},
            {"letter": "B", "text": "Amostragem sistemática"},
            {"letter": "C", "text": "Amostragem aleatória simples"},
            {"letter": "D", "text": "Amostragem por cotas"},
        ],
    },
    {
        "issue": "(FCC – 2019 – TRT-15 – Adaptada)\n\nAo dividir uma população em estratos homogêneos e selecionar aleatoriamente elementos de cada estrato em proporção ao seu tamanho, o método utilizado é:",
        "correct_answer": "B",
        "solution": "A seleção de elementos de cada estrato em proporção ao tamanho do estrato caracteriza a amostragem estratificada proporcional.",
        "difficulty": 1,
        "chapter_num": 1,
        "source": "concurso",
        "alternatives": [
            {"letter": "A", "text": "Amostragem sistemática"},
            {"letter": "B", "text": "Amostragem estratificada proporcional"},
            {"letter": "C", "text": "Amostragem por conglomerados"},
            {"letter": "D", "text": "Amostragem aleatória simples"},
        ],
    },
    {
        "issue": "(CESPE – 2018 – Polícia Federal – Adaptada)\n\nNa amostragem por conglomerados, a população é dividida em:",
        "correct_answer": "B",
        "solution": "Na amostragem por conglomerados, a população é dividida em subgrupos (conglomerados) que são internamente heterogêneos (refletem a diversidade da população) e homogêneos entre si. Alguns conglomerados são sorteados e todos os seus elementos são pesquisados.",
        "difficulty": 1,
        "chapter_num": 1,
        "source": "concurso",
        "alternatives": [
            {"letter": "A", "text": "Subgrupos heterogêneos internamente e homogêneos entre si."},
            {"letter": "B", "text": "Subgrupos homogêneos internamente e heterogêneos entre si."},
            {"letter": "C", "text": "Subgrupos idênticos em tamanho."},
            {"letter": "D", "text": "Elementos isolados e independentes."},
        ],
    },
    {
        "issue": "(OBMEP – 2018 – Adaptada)\n\nPara estimar o consumo médio de água por residência em uma cidade, um pesquisador escolhe aleatoriamente 5 quarteirões e mede o consumo de todas as casas desses quarteirões. Esse tipo de amostragem é:",
        "correct_answer": "C",
        "solution": "O pesquisador sorteou grupos (quarteirões = conglomerados) e pesquisou todos os elementos dentro dos grupos selecionados, caracterizando a amostragem por conglomerados.",
        "difficulty": 1,
        "chapter_num": 1,
        "source": "concurso",
        "alternatives": [
            {"letter": "A", "text": "Aleatória simples"},
            {"letter": "B", "text": "Estratificada"},
            {"letter": "C", "text": "Por conglomerados"},
            {"letter": "D", "text": "Sistemática"},
        ],
    },
    {
        "issue": "(CESGRANRIO – 2022 – Petrobras – Adaptada)\n\nUma pesquisa sobre uso de transporte público foi realizada em 15 municípios, sendo entrevistados todos os usuários em 3 municípios sorteados. Essa técnica é:",
        "correct_answer": "C",
        "solution": "Os municípios funcionam como conglomerados. Sortearam-se 3 conglomerados (municípios) e pesquisaram-se todos os elementos dentro deles. Isso é amostragem por conglomerados.",
        "difficulty": 1,
        "chapter_num": 1,
        "source": "concurso",
        "alternatives": [
            {"letter": "A", "text": "Amostragem por cotas"},
            {"letter": "B", "text": "Amostragem estratificada"},
            {"letter": "C", "text": "Amostragem por conglomerados"},
            {"letter": "D", "text": "Amostragem sistemática"},
        ],
    },
    {
        "issue": "(FCC – 2017 – TCE-SP – Adaptada)\n\nO erro amostral tende a diminuir quando:",
        "correct_answer": "B",
        "solution": "O erro amostral (diferença entre estatística amostral e parâmetro populacional) diminui à medida que o tamanho da amostra aumenta, pois amostras maiores representam melhor a população.",
        "difficulty": 1,
        "chapter_num": 1,
        "source": "concurso",
        "alternatives": [
            {"letter": "A", "text": "A amostra é não probabilística"},
            {"letter": "B", "text": "A amostra aumenta de tamanho"},
            {"letter": "C", "text": "A variabilidade dos dados aumenta"},
            {"letter": "D", "text": "O intervalo de confiança diminui"},
        ],
    },
    {
        "issue": "(OBMEP – 2019 – Adaptada)\n\nUm professor quer saber a média das idades de seus 300 alunos. Em vez de perguntar para todos, ele seleciona 30 alunos aleatoriamente e calcula a média de idades desse grupo. Esse grupo é chamado de:",
        "correct_answer": "C",
        "solution": "O grupo de 30 alunos selecionados é uma amostra: um subconjunto representativo da população de 300 alunos.",
        "difficulty": 1,
        "chapter_num": 1,
        "source": "concurso",
        "alternatives": [
            {"letter": "A", "text": "População"},
            {"letter": "B", "text": "Censo"},
            {"letter": "C", "text": "Amostra"},
            {"letter": "D", "text": "Unidade de observação"},
        ],
    },

    # ========================================================================
    # CAPÍTULO 6 — Probabilidade → Probabilidade (cap 2)
    # ========================================================================
    {
        "issue": "(FUNDAÇÃO SANTO ANDRÉ / IBFC – 2019 – Adaptada)\n\nEm uma cesta há cápsulas de café: 10 extraforte, 12 cappuccino e 8 suave. Qual a probabilidade de retirar uma cápsula de cappuccino ao acaso?",
        "correct_answer": "C",
        "solution": "Total = 10 + 12 + 8 = 30 cápsulas. P(cappuccino) = 12/30 = 2/5 = 0,40 = 40%.",
        "difficulty": 1,
        "chapter_num": 2,
        "source": "concurso",
        "alternatives": [
            {"letter": "A", "text": "50%"},
            {"letter": "B", "text": "20%"},
            {"letter": "C", "text": "40%"},
            {"letter": "D", "text": "30%"},
        ],
    },
    {
        "issue": "(CASAN / AOCP – 2016 – Adaptada)\n\nUm empresário escondeu seu dinheiro em um dos 4 pneus de um carro. Um ladrão escolhe um pneu ao acaso. Qual a probabilidade de ser o pneu correto?",
        "correct_answer": "C",
        "solution": "Há 1 pneu correto dentre 4. P = 1/4 = 0,25.",
        "difficulty": 1,
        "chapter_num": 2,
        "source": "concurso",
        "alternatives": [
            {"letter": "A", "text": "0,20"},
            {"letter": "B", "text": "0,23"},
            {"letter": "C", "text": "0,25"},
            {"letter": "D", "text": "0,27"},
            {"letter": "E", "text": "0,30"},
        ],
    },
    {
        "issue": "(COLÉGIO PEDRO II / AOCP – 2013 – Adaptada)\n\nEm um sorteio, você tem 4 cartões numerados com os números 1, 5, 7 e 9. Você retira dois cartões aleatoriamente e forma um número de dois dígitos com os números sorteados. Qual é a probabilidade de o número formado ser maior que 97?",
        "correct_answer": "A",
        "solution": "Os números de dois dígitos formados pelos dígitos {1,5,7,9} sem repetição são: 15, 17, 19, 51, 57, 59, 71, 75, 79, 91, 95, 97. Total = 12 números. Nenhum deles é maior que 97 (o máximo com esses dígitos é 97, que não é estritamente maior). P = 0/12 = 0%.",
        "difficulty": 2,
        "chapter_num": 2,
        "source": "concurso",
        "alternatives": [
            {"letter": "A", "text": "0%"},
            {"letter": "B", "text": "5%"},
            {"letter": "C", "text": "7%"},
            {"letter": "D", "text": "10%"},
            {"letter": "E", "text": "12%"},
        ],
    },
    {
        "issue": "(SEE-MG / IBFC – 2015 – Adaptada)\n\nQual é a probabilidade do despertador falhar, sabendo que a chance de funcionar é de 0,836?",
        "correct_answer": "D",
        "solution": "P(falhar) = 1 - P(funcionar) = 1 - 0,836 = 0,164.",
        "difficulty": 1,
        "chapter_num": 2,
        "source": "concurso",
        "alternatives": [
            {"letter": "A", "text": "1,0"},
            {"letter": "B", "text": "0,187"},
            {"letter": "C", "text": "0,152"},
            {"letter": "D", "text": "0,164"},
        ],
    },
    {
        "issue": "(Pref. Niterói-RJ / FGV – 2018 – Adaptada)\n\nUm jogador lança um dado duas vezes. Os eventos possíveis são:\nA = a soma dos valores dos dois lançamentos é 8\nB = a soma dos valores dos dois lançamentos é 10\nC = a soma dos valores dos dois lançamentos é 12\n\nQual é a ordem correta desses eventos, do menos provável ao mais provável?",
        "correct_answer": "E",
        "solution": "P(soma=8): (2,6),(3,5),(4,4),(5,3),(6,2) = 5/36. P(soma=10): (4,6),(5,5),(6,4) = 3/36. P(soma=12): (6,6) = 1/36. Ordem do menos ao mais provável: C(1/36), B(3/36), A(5/36).",
        "difficulty": 2,
        "chapter_num": 2,
        "source": "concurso",
        "alternatives": [
            {"letter": "A", "text": "A, B, C"},
            {"letter": "B", "text": "A, C, B"},
            {"letter": "C", "text": "B, C, A"},
            {"letter": "D", "text": "C, A, B"},
            {"letter": "E", "text": "C, B, A"},
        ],
    },
    {
        "issue": "(MPE-RJ / FGV – 2019 – Adaptada)\n\nEm um grupo com cinco pessoas A, B, C, D e E, serão escolhidas, ao acaso e sem reposição, duas pessoas para compor uma comissão. Qual é a probabilidade de que a dupla escolhida tenha pelo menos um entre A ou B e não contenha D?",
        "correct_answer": "C",
        "solution": "Total de pares = C(5,2) = 10. Pares sem D = C(4,2) = 6: {A,B},{A,C},{A,E},{B,C},{B,E},{C,E}. Pares sem D com pelo menos um de {A,B}: 5 (todos exceto {C,E}). P = 5/10 = 1/2 = 50%.",
        "difficulty": 2,
        "chapter_num": 2,
        "source": "concurso",
        "alternatives": [
            {"letter": "A", "text": "30%"},
            {"letter": "B", "text": "40%"},
            {"letter": "C", "text": "50%"},
            {"letter": "D", "text": "60%"},
            {"letter": "E", "text": "70%"},
        ],
    },
    {
        "issue": "(AL-RO / FGV – 2019 – Adaptada)\n\nEm uma mesa redonda estão sentadas 10 pessoas, entre elas Artur e Mário. No sentido horário, entre Artur e Mário há 3 pessoas; no sentido anti-horário, há 5 pessoas. Sorteia-se uma pessoa ao acaso dentre as 10. Qual a probabilidade de não ser Artur, nem Mário, nem qualquer vizinho imediato de Artur ou de Mário?",
        "correct_answer": "C",
        "solution": "Excluídos: Artur, Mário, 2 vizinhos de Artur, 2 vizinhos de Mário = 6 pessoas (todas distintas, pois há 3 e 5 pessoas entre eles, então os vizinhos não se sobrepõem). Restam 10 - 6 = 4 pessoas. P = 4/10 = 40%.",
        "difficulty": 3,
        "chapter_num": 2,
        "source": "concurso",
        "alternatives": [
            {"letter": "A", "text": "20%"},
            {"letter": "B", "text": "30%"},
            {"letter": "C", "text": "40%"},
            {"letter": "D", "text": "50%"},
            {"letter": "E", "text": "60%"},
        ],
    },
    {
        "issue": "(AL-RO / FGV – 2018)\n\nEm uma urna há 4 cartões amarelos e 6 cartões vermelhos, todos com o mesmo formato e tamanho. Retiram-se dois cartões ao acaso e sem reposição. Qual é a probabilidade de que os dois cartões retirados sejam vermelhos?",
        "correct_answer": "B",
        "solution": "P = C(6,2)/C(10,2) = 15/45 = 1/3.",
        "difficulty": 2,
        "chapter_num": 2,
        "source": "concurso",
        "alternatives": [
            {"letter": "A", "text": "1/2"},
            {"letter": "B", "text": "1/3"},
            {"letter": "C", "text": "1/4"},
            {"letter": "D", "text": "1/5"},
            {"letter": "E", "text": "1/6"},
        ],
    },
    {
        "issue": "(IBGE / FGV – 2017 – Adaptada)\n\nEm um simulado de múltipla escolha, a probabilidade de um aluno acertar cada questão é de 70%, e os acertos são eventos independentes. Considerando duas questões, qual é a probabilidade de que o aluno erre ambas?",
        "correct_answer": "A",
        "solution": "P(errar uma questão) = 1 - 0,7 = 0,3. P(errar ambas) = 0,3 × 0,3 = 0,09 = 9% < 10%.",
        "difficulty": 1,
        "chapter_num": 2,
        "source": "concurso",
        "alternatives": [
            {"letter": "A", "text": "< 10%"},
            {"letter": "B", "text": "entre 10 e 20%"},
            {"letter": "C", "text": "entre 20 e 30%"},
            {"letter": "D", "text": "entre 30 e 50%"},
            {"letter": "E", "text": "> 50%"},
        ],
    },
    {
        "issue": "(IMBEL / FGV – 2021 – Adaptada)\n\nVocê está planejando uma viagem no mês de abril de 2022, que começa em uma sexta-feira. Se você escolher aleatoriamente um dia para a viagem, qual é a probabilidade de esse dia ser sábado ou domingo?",
        "correct_answer": "C",
        "solution": "Abril de 2022 começa numa sexta-feira e tem 30 dias. Sábados: dias 2,9,16,23,30 (5 sábados). Domingos: dias 3,10,17,24 (4 domingos). Total finais de semana = 9 dias. P = 9/30 = 3/10.",
        "difficulty": 2,
        "chapter_num": 2,
        "source": "concurso",
        "alternatives": [
            {"letter": "A", "text": "1/3"},
            {"letter": "B", "text": "1/5"},
            {"letter": "C", "text": "3/10"},
            {"letter": "D", "text": "4/15"},
            {"letter": "E", "text": "11/30"},
        ],
    },
    {
        "issue": "(Pref. Salvador-BA / FGV – 2019 – Adaptada)\n\nImagine que você tem uma urna com 10 bolas brancas numeradas de 1 a 10 e 5 bolas pretas numeradas de 1 a 5. Retira-se duas bolas sem reposição. Qual é a probabilidade de que a segunda bola retirada seja preta e tenha um número par?",
        "correct_answer": "C",
        "solution": "Bolas pretas com número par: {2, 4} = 2 bolas. P(segunda bola = preta e par) = P(qualquer primeira bola) × P(segunda = bola preta par | primeira ≠ essa bola). Por simetria: P = 2/15, pois a segunda bola é igualmente provável de ser qualquer uma das 15 bolas quando considerada isoladamente.",
        "difficulty": 3,
        "chapter_num": 2,
        "source": "concurso",
        "alternatives": [
            {"letter": "A", "text": "1/7"},
            {"letter": "B", "text": "3/14"},
            {"letter": "C", "text": "2/15"},
            {"letter": "D", "text": "4/15"},
            {"letter": "E", "text": "2/7"},
        ],
    },
    {
        "issue": "(Pref. Angra dos Reis-RJ / FGV – 2019 – Adaptada)\n\nEm uma brincadeira, você tem duas urnas:\nUrna M: contém 3 bolas numeradas de 1 a 3.\nUrna N: contém 4 bolas numeradas de 4 a 7.\nVocê escolhe uma urna aleatoriamente e depois retira uma bola. Qual é a probabilidade de sair o número 7?",
        "correct_answer": "E",
        "solution": "O número 7 está apenas na Urna N. P = P(escolher N) × P(tirar 7 | N) = (1/2) × (1/4) = 1/8.",
        "difficulty": 2,
        "chapter_num": 2,
        "source": "concurso",
        "alternatives": [
            {"letter": "A", "text": "1/7"},
            {"letter": "B", "text": "2/7"},
            {"letter": "C", "text": "3/4"},
            {"letter": "D", "text": "1/4"},
            {"letter": "E", "text": "1/8"},
        ],
    },
    {
        "issue": "(Pref. Angra dos Reis-RJ / FGV – 2019 – Adaptada)\n\nPeter tem uma taxa de acerto de 90% ao acertar um alvo. Ele faz dois lançamentos independentes. Qual é a probabilidade de ele acertar o alvo em ambos os lançamentos?",
        "correct_answer": "C",
        "solution": "P(acertar ambos) = P(acertar 1º) × P(acertar 2º) = 0,9 × 0,9 = 0,81 = 81%.",
        "difficulty": 1,
        "chapter_num": 2,
        "source": "concurso",
        "alternatives": [
            {"letter": "A", "text": "180%"},
            {"letter": "B", "text": "90%"},
            {"letter": "C", "text": "81%"},
            {"letter": "D", "text": "72%"},
            {"letter": "E", "text": "> 60%"},
        ],
    },
    {
        "issue": "(MPE-RJ / FGV – 2019 – Adaptada)\n\nVocê tem um dado viciado onde os algarismos pares têm o dobro de probabilidade de serem sorteados em relação aos ímpares. Se esse dado for lançado duas vezes, qual é a probabilidade de a soma dos dois resultados ser 4?",
        "correct_answer": "E",
        "solution": "P(ímpar) = 1/9, P(par) = 2/9. Combinações para soma = 4: (1,3), (2,2), (3,1). P(1,3) = (1/9)(1/9) = 1/81. P(2,2) = (2/9)(2/9) = 4/81. P(3,1) = (1/9)(1/9) = 1/81. Total = 6/81 = 2/27.",
        "difficulty": 3,
        "chapter_num": 2,
        "source": "concurso",
        "alternatives": [
            {"letter": "A", "text": "2/81"},
            {"letter": "B", "text": "1/27"},
            {"letter": "C", "text": "4/81"},
            {"letter": "D", "text": "5/81"},
            {"letter": "E", "text": "2/27"},
        ],
    },
    {
        "issue": "(QCONCURSOS – PUBLICONSULT – 2025 – Adaptada)\n\nUm casal está planejando ter cinco filhos e quer saber a probabilidade de todos eles serem do mesmo sexo. Qual é essa probabilidade?",
        "correct_answer": "D",
        "solution": "P(todos meninos) = (1/2)⁵ = 1/32. P(todas meninas) = 1/32. P(todos do mesmo sexo) = 1/32 + 1/32 = 2/32 = 1/16.",
        "difficulty": 2,
        "chapter_num": 2,
        "source": "concurso",
        "alternatives": [
            {"letter": "A", "text": "1/4"},
            {"letter": "B", "text": "1/8"},
            {"letter": "C", "text": "1/10"},
            {"letter": "D", "text": "1/16"},
        ],
    },

    # ========================================================================
    # CAPÍTULO 7 — Variáveis Aleatórias → Probabilidade (cap 2)
    # ========================================================================
    {
        "issue": "(FGV – 2024)\n\nUm analista judiciário possui um grande número de processos para examinar e avaliar, os quais se enquadram em apenas duas categorias: A e B. Sabe-se que 25% desses processos se enquadram na categoria A. A probabilidade de o analista aprovar um processo da categoria A é de 0,8, enquanto a probabilidade de que um processo da categoria B seja aprovado é de 0,4. Com respeito à situação apresentada, se 5 processos são examinados, de forma independente, por esse analista, a probabilidade aproximada de que exatamente 2 deles sejam aprovados é:",
        "correct_answer": "D",
        "solution": "P(aprovado) = P(A)×P(apr|A) + P(B)×P(apr|B) = 0,25×0,8 + 0,75×0,4 = 0,2 + 0,3 = 0,5. X ~ B(5, 0,5). P(X=2) = C(5,2)×(0,5)²×(0,5)³ = 10/32 = 5/16.",
        "difficulty": 3,
        "chapter_num": 2,
        "source": "concurso",
        "alternatives": [
            {"letter": "A", "text": "1/2"},
            {"letter": "B", "text": "1/4"},
            {"letter": "C", "text": "3/8"},
            {"letter": "D", "text": "5/16"},
            {"letter": "E", "text": "1/32"},
        ],
    },
    {
        "issue": "(FGV – 2024)\n\nUm analista judiciário possui um grande número de processos para examinar e avaliar, os quais se enquadram em apenas duas categorias: A e B. Sabe-se que 25% desses processos se enquadram na categoria A. A probabilidade de o analista aprovar um processo da categoria A é de 0,8, enquanto a probabilidade de que um processo da categoria B seja aprovado é de 0,4. Com respeito à situação apresentada, se 9 processos são examinados, de forma independente, por esse analista, o desvio padrão do número de processos que ele aprova é, aproximadamente:",
        "correct_answer": "B",
        "solution": "P(aprovado) = 0,5 (calculado anteriormente). X ~ B(9, 0,5). Var(X) = n×p×(1-p) = 9×0,5×0,5 = 2,25. σ = √2,25 = 1,5.",
        "difficulty": 3,
        "chapter_num": 2,
        "source": "concurso",
        "alternatives": [
            {"letter": "A", "text": "1"},
            {"letter": "B", "text": "1,5"},
            {"letter": "C", "text": "2"},
            {"letter": "D", "text": "2,5"},
            {"letter": "E", "text": "3"},
        ],
    },
    {
        "issue": "(FGV – 2023 – Banco do Brasil – Analista)\n\nUma variável aleatória discreta X tem função de probabilidade dada por:\n\n| x | 0 | 2 | 4 | 6 |\n|---|---|---|---|---|\n| p(x) | 0,3 | 0,4 | 0,2 | 0,1 |\n\nA soma dos valores da média e da mediana de X é igual a:",
        "correct_answer": "C",
        "solution": "E(X) = 0×0,3 + 2×0,4 + 4×0,2 + 6×0,1 = 0 + 0,8 + 0,8 + 0,6 = 2,2. Mediana: P(X≤0)=0,3 < 0,5; P(X≤2)=0,7 ≥ 0,5 → Mediana = 2. Soma = 2,2 + 2 = 4,2.",
        "difficulty": 2,
        "chapter_num": 2,
        "source": "concurso",
        "alternatives": [
            {"letter": "A", "text": "2,2"},
            {"letter": "B", "text": "3,2"},
            {"letter": "C", "text": "4,2"},
            {"letter": "D", "text": "5,2"},
            {"letter": "E", "text": "6,2"},
        ],
    },
    {
        "issue": "(FCC – 2025)\n\nEm um setor de um órgão público trabalham somente 6 homens e 4 mulheres. Seja X a variável aleatória discreta que representa o número de funcionários desse setor que são homens. Uma amostra aleatória de 3 funcionários desse setor é extraída, com reposição, da população formada pelos 10 funcionários. Com base nessa amostra, a probabilidade de que X = 1, denotada por P(X = 1), é igual a:",
        "correct_answer": "C",
        "solution": "X ~ B(3, 0,6). P(X=1) = C(3,1)×(0,6)¹×(0,4)² = 3×0,6×0,16 = 3×0,096 = 0,288 = 28,8%.",
        "difficulty": 2,
        "chapter_num": 2,
        "source": "concurso",
        "alternatives": [
            {"letter": "A", "text": "25,0%"},
            {"letter": "B", "text": "24,0%"},
            {"letter": "C", "text": "28,8%"},
            {"letter": "D", "text": "25,6%"},
            {"letter": "E", "text": "36,0%"},
        ],
    },
    {
        "issue": "(IMPARH – 2025)\n\nSobre variáveis aleatórias discretas, qual das alternativas a seguir descreve corretamente esse conceito e oferece um exemplo?",
        "correct_answer": "B",
        "solution": "Uma variável aleatória discreta assume valores em um conjunto finito ou enumerável (contável). O número de filhos em uma família é um exemplo clássico (0, 1, 2, 3, ...).",
        "difficulty": 1,
        "chapter_num": 2,
        "source": "concurso",
        "alternatives": [
            {"letter": "A", "text": "Uma variável aleatória discreta pode assumir qualquer valor num intervalo contínuo, como a temperatura."},
            {"letter": "B", "text": "Uma variável aleatória discreta só se assume em um conjunto finito ou enumerável, como o número de filhos em uma família."},
            {"letter": "C", "text": "Uma variável aleatória discreta pode assumir qualquer valor real positivo, como o número de livros em uma estante."},
            {"letter": "D", "text": "Uma variável aleatória discreta é aquela que sempre assume um único valor, como o número de jogadores em um time de futebol."},
        ],
    },
    {
        "issue": "(FGV – 2024)\n\nUma variável aleatória discreta X tem função de probabilidade dada por:\n\n| x | 0 | 1 | 4 | 7 | 8 | 9 |\n|---|---|---|---|---|---|---|\n| p(x) | 0,2 | 0,2 | 0,3 | 0,1 | 0,1 | 0,1 |\n\nO valor absoluto da diferença entre os valores da média e da mediana de X é igual a:",
        "correct_answer": "B",
        "solution": "E(X) = 0×0,2 + 1×0,2 + 4×0,3 + 7×0,1 + 8×0,1 + 9×0,1 = 0 + 0,2 + 1,2 + 0,7 + 0,8 + 0,9 = 3,8. Mediana: P(X≤0)=0,2; P(X≤1)=0,4; P(X≤4)=0,7 ≥ 0,5 → Mediana = 4. |3,8 - 4| = 0,2.",
        "difficulty": 2,
        "chapter_num": 2,
        "source": "concurso",
        "alternatives": [
            {"letter": "A", "text": "0,1"},
            {"letter": "B", "text": "0,2"},
            {"letter": "C", "text": "0,25"},
            {"letter": "D", "text": "0,3"},
            {"letter": "E", "text": "0,35"},
        ],
    },
    {
        "issue": "(FGV – 2022)\n\nUma urna contém 3 bolas vermelhas e 4 bolas azuis indistinguíveis, exceto pela cor. Três bolas serão retiradas dessa urna, sucessivamente e sem reposição. Seja X a variável aleatória que representa a quantidade de bolas azuis retiradas da urna. O valor esperado de X é:",
        "correct_answer": "C",
        "solution": "X tem distribuição hipergeométrica: N=7, K=4 (azuis), n=3 (retiradas). E(X) = n×K/N = 3×4/7 = 12/7 ≈ 1,7.",
        "difficulty": 2,
        "chapter_num": 2,
        "source": "concurso",
        "alternatives": [
            {"letter": "A", "text": "2,7"},
            {"letter": "B", "text": "2,1"},
            {"letter": "C", "text": "1,7"},
            {"letter": "D", "text": "1,3"},
            {"letter": "E", "text": "0,9"},
        ],
    },

    # ========================================================================
    # CAPÍTULO 8 — Distribuições Discretas → Probabilidade (cap 2)
    # ========================================================================
    {
        "issue": "(FGV – 2024 – Auditor Fiscal Tributário)\n\nUma variável aleatória discreta X tem distribuição binomial com parâmetros n e p, em que n é o número de ensaios de Bernoulli independentes, todos com a mesma probabilidade p de sucesso. O valor esperado e a variância de X dependem do valor da probabilidade p. Se o valor máximo da variância de X é 2,5, é correto afirmar que n é igual a:",
        "correct_answer": "B",
        "solution": "Var(X) = n×p×(1-p). O valor máximo ocorre em p=0,5: Var_máx = n/4. Portanto n/4 = 2,5 → n = 10.",
        "difficulty": 2,
        "chapter_num": 2,
        "source": "concurso",
        "alternatives": [
            {"letter": "A", "text": "5"},
            {"letter": "B", "text": "10"},
            {"letter": "C", "text": "15"},
            {"letter": "D", "text": "20"},
            {"letter": "E", "text": "25"},
        ],
    },
    {
        "issue": "(IBFC – 2022 – Economista)\n\nO estudo pormenorizado de variáveis aleatórias discretas é de grande importância para a construção de modelos probabilísticos para situações reais e a consequente estimação de seus parâmetros. Diante do exposto, assinale a alternativa que explica corretamente o modelo de Distribuição Uniforme Discreta:",
        "correct_answer": "A",
        "solution": "A Distribuição Uniforme Discreta é o modelo mais simples de variável aleatória discreta, caracterizado pelo fato de que cada valor possível ocorre com a mesma probabilidade (equiprobabilidade).",
        "difficulty": 1,
        "chapter_num": 2,
        "source": "concurso",
        "alternatives": [
            {"letter": "A", "text": "Este é o modelo mais simples de variável aleatória discreta, em que cada valor possível ocorre com a mesma probabilidade."},
            {"letter": "B", "text": "Muitos experimentos deste modelo são tais que os resultados apresentam ou não uma determinada característica. Por exemplo: uma moeda é lançada: o resultado ou é cara, ou não (ocorrendo, então, coroa)."},
            {"letter": "C", "text": "Este modelo é largamente empregado quando se deseja contar o número de eventos de certo tipo que ocorrem num intervalo de tempo, ou superfície ou volume."},
            {"letter": "D", "text": "Esta distribuição é adequada quando consideramos extrações casuais feitas sem reposição de uma população dividida segundo dois atributos."},
        ],
    },
    {
        "issue": "(COMVEST UFAM – 2024)\n\nSejam X1, X2 e X3 variáveis aleatórias independentes, com distribuição Poisson de parâmetros 3, 4 e 5, respectivamente. Nesse caso, a variável Y = X1 + X2 + X3 tem distribuição de Poisson com parâmetro igual a:",
        "correct_answer": "D",
        "solution": "A soma de variáveis aleatórias independentes com distribuição de Poisson também tem distribuição de Poisson, com parâmetro igual à soma dos parâmetros individuais: λ_Y = λ₁ + λ₂ + λ₃ = 3 + 4 + 5 = 12.",
        "difficulty": 2,
        "chapter_num": 2,
        "source": "concurso",
        "alternatives": [
            {"letter": "A", "text": "3"},
            {"letter": "B", "text": "4"},
            {"letter": "C", "text": "5"},
            {"letter": "D", "text": "12"},
            {"letter": "E", "text": "60"},
        ],
    },

    # ========================================================================
    # CAPÍTULO 9 — Distribuições Contínuas → Probabilidade (cap 2)
    # ========================================================================
    {
        "issue": "(IDESG – 2025 – Analista)\n\nSobre variáveis aleatórias discretas e contínuas, é correto afirmar que:",
        "correct_answer": "B",
        "solution": "A distribuição de Poisson modela o número de eventos em um intervalo de tempo ou espaço, sendo uma distribuição discreta. As demais afirmativas são falsas: a soma das probabilidades discretas é sempre 1 (não maior que 1); v.a. discretas usam função de probabilidade, não de densidade; e para v.a. contínuas, P(X=x)=0 para qualquer valor exato.",
        "difficulty": 1,
        "chapter_num": 2,
        "source": "concurso",
        "alternatives": [
            {"letter": "A", "text": "A soma das probabilidades associadas a uma variável discreta é sempre maior que 1."},
            {"letter": "B", "text": "A distribuição de Poisson é um exemplo de distribuição de variável aleatória discreta."},
            {"letter": "C", "text": "Variáveis aleatórias discretas são representadas por funções de densidade de probabilidade."},
            {"letter": "D", "text": "A probabilidade de uma variável contínua assumir um valor exato é sempre diferente de zero."},
        ],
    },

    # ========================================================================
    # CAPÍTULO 10 — Intervalo de Confiança → Inferência Estatística (cap 3)
    # ========================================================================
    {
        "issue": "(FCC – 2025 – Analista)\n\nA população formada pelos salários, em salários mínimos (SM), dos empregados de uma prefeitura é normalmente distribuída com uma variância populacional igual a 2,25 (SM)². Extraindo uma amostra aleatória desta população, com reposição, de tamanho 100, encontrou-se uma média amostral igual a 4,8 SM. Utilizando as informações da curva normal padrão (Z) que as probabilidades P(Z < 1,64) = 0,95 e P(Z < 1,96) = 0,975, então o intervalo de confiança de 95% para a média populacional, com base na amostra, é igual a:",
        "correct_answer": "E",
        "solution": "σ = √2,25 = 1,5 SM. EP = 1,5/√100 = 0,15 SM. Para IC 95%: z = 1,96. IC = [4,8 - 1,96×0,15; 4,8 + 1,96×0,15] = [4,8 - 0,294; 4,8 + 0,294] = [4,506; 5,094].",
        "difficulty": 2,
        "chapter_num": 3,
        "source": "concurso",
        "alternatives": [
            {"letter": "A", "text": "[4,554; 5,046]"},
            {"letter": "B", "text": "[4,359; 5,241]"},
            {"letter": "C", "text": "[4,604; 4,956]"},
            {"letter": "D", "text": "[4,636; 4,964]"},
            {"letter": "E", "text": "[4,506; 5,094]"},
        ],
    },
    {
        "issue": "(IDESG – 2025 – Analista)\n\nSobre o conceito de intervalos de confiança, é correto afirmar que:",
        "correct_answer": "D",
        "solution": "D é correta: a amplitude do intervalo de confiança aumenta quando o tamanho da amostra diminui (IC = x̄ ± z×σ/√n → menor n → maior amplitude). As demais são falsas: aumentar o nível de confiança AUMENTA (não reduz) a amplitude; IC 95% não significa 95% de probabilidade para o parâmetro estar no intervalo calculado; e ICs não sempre contêm o parâmetro.",
        "difficulty": 1,
        "chapter_num": 3,
        "source": "concurso",
        "alternatives": [
            {"letter": "A", "text": "O aumento do nível de confiança reduz a amplitude do intervalo."},
            {"letter": "B", "text": "Um intervalo de confiança de 95% significa que há 95% de probabilidade de o parâmetro estar no intervalo calculado."},
            {"letter": "C", "text": "Intervalos de confiança sempre contêm o parâmetro populacional."},
            {"letter": "D", "text": "A amplitude do intervalo de confiança aumenta com a redução do tamanho da amostra."},
        ],
    },
    {
        "issue": "(CESPE / CEBRASPE – 2025 – Analista)\n\nDe certa população normal, foi retirada uma amostra aleatória simples com reposição de tamanho n = 100, cuja média amostral é igual a 53 e cujo desvio padrão amostral é igual a 25. Com base nas informações precedentes, assinale a opção que corresponde ao intervalo de 95% de confiança para a média μ dessa população, considerando Z = 1,96 para esse intervalo de confiança.",
        "correct_answer": "C",
        "solution": "EP = s/√n = 25/√100 = 2,5. IC 95%: x̄ ± z×EP = 53 ± 1,96×2,5 = 53 ± 4,9. IC = [48,1; 57,9].",
        "difficulty": 2,
        "chapter_num": 3,
        "source": "concurso",
        "alternatives": [
            {"letter": "A", "text": "50,5 < μ < 55,5"},
            {"letter": "B", "text": "48,875 < μ < 57,125"},
            {"letter": "C", "text": "48,1 < μ < 57,9"},
            {"letter": "D", "text": "47,375 < μ < 58,625"},
            {"letter": "E", "text": "46,55 < μ < 59,45"},
        ],
    },
    {
        "issue": "(CESPE/CEBRASPE – UNIVESP – 2025 – Supervisor Pedagógico)\n\nUm supervisor pedagógico avaliando a montagem de kits de material didático verificou que a média observada foi de 2,4 itens não conformes por kit, com desvio-padrão amostral de 1,2 item. O intervalo de confiança para o número médio de itens não conformes é representado na forma 2,4 ± A × 1,2.\n\nAssinale a opção correta a respeito do intervalo de confiança:",
        "correct_answer": "B",
        "solution": "A opção B é correta: se o tamanho da amostra n for suficientemente grande (pelo Teorema Central do Limite), podemos usar a distribuição normal padrão para obter o valor de A, que é calculado como A = z_{α/2}/√n (onde z depende do nível de confiança e n é o tamanho da amostra).",
        "difficulty": 2,
        "chapter_num": 3,
        "source": "concurso",
        "alternatives": [
            {"letter": "A", "text": "Considerando-se que o número de itens com defeito siga uma distribuição discreta e que n = 4, tipicamente, o valor A é obtido com base na distribuição normal padrão."},
            {"letter": "B", "text": "Se o tamanho da amostra n for suficientemente grande, o valor A pode ser obtido com base na distribuição normal padrão e no próprio tamanho da amostra."},
            {"letter": "C", "text": "Considerando n = 100, o valor de A diminui à medida que o nível de confiança aumenta."},
            {"letter": "D", "text": "Se o nível de confiança for igual a 90%, o valor de A deve aumentar à medida que o tamanho da amostra aumentar."},
            {"letter": "E", "text": "O intervalo de 100% de confiança é representado por 2,4 ± 1,2, em que A = 1."},
        ],
    },
    {
        "issue": "(SSPM – 2025 – Marinha)\n\nUma empresa afirma que o diâmetro médio de um tipo de rolamento é 10 mm com σ² = 0,04 mm². Para verificar essa informação, um auditor realizou uma amostra aleatória de 100 rolamentos e encontrou uma média amostral de 10,1 mm. Com base nessa amostra, qual é o intervalo de confiança de 99% para o diâmetro médio dos rolamentos?",
        "correct_answer": "A",
        "solution": "σ = √0,04 = 0,2 mm. EP = 0,2/√100 = 0,02 mm. Para IC 99%: z = 2,576. IC = [10,1 - 2,576×0,02; 10,1 + 2,576×0,02] = [10,1 - 0,05152; 10,1 + 0,05152] ≈ [10,05; 10,15].",
        "difficulty": 2,
        "chapter_num": 3,
        "source": "concurso",
        "alternatives": [
            {"letter": "A", "text": "[10,05; 10,15]"},
            {"letter": "B", "text": "[10,06; 10,14]"},
            {"letter": "C", "text": "[10,07; 10,13]"},
            {"letter": "D", "text": "[10,08; 10,12]"},
            {"letter": "E", "text": "[10,09; 10,11]"},
        ],
    },
    {
        "issue": "(FCC – 2025 – Auditor Municipal de Controle Interno)\n\nA população formada pelos tempos de durações de atendimento a uma pessoa em um guichê de um órgão público é considerada normalmente distribuída com uma variância populacional igual a 2,56 (minutos)². Uma amostra aleatória de tamanho 64 foi extraída, com reposição, dessa população, obtendo-se uma média amostral igual a 15 minutos. Com base na amostra, um Intervalo de confiança de 95% foi construído para a média populacional, considerando que na curva normal padrão (Z) as probabilidades P(Z ≤ 1,64) = 95% e P(Z ≤ 1,96) = 97,5%. O limite superior do Intervalo encontrado apresenta um valor igual a:",
        "correct_answer": "D",
        "solution": "σ = √2,56 = 1,6 min. EP = 1,6/√64 = 0,2 min. Para IC 95%: z = 1,96. Limite superior = 15 + 1,96×0,2 = 15 + 0,392 = 15,3920.",
        "difficulty": 2,
        "chapter_num": 3,
        "source": "concurso",
        "alternatives": [
            {"letter": "A", "text": "15,4018"},
            {"letter": "B", "text": "15,5160"},
            {"letter": "C", "text": "15,6272"},
            {"letter": "D", "text": "15,3920"},
            {"letter": "E", "text": "15,5248"},
        ],
    },
    {
        "issue": "(VUNESP – 2024)\n\nA fim de conhecer o salário médio mensal dos recém-formados de duas áreas de trabalho, foi realizado um levantamento com uma amostra aleatória de 100 recém-formados da área X e uma amostra aleatória de 170 recém-formados da área Y. Considerando que o salário mensal segue distribuição Normal com o mesmo desvio-padrão populacional, foi construído um intervalo com 95% de confiança para a média do salário mensal com variância conhecida para cada uma das áreas:\n\nÁrea X: IC(μX) 95%: [R$2.700,00; R$3.300,00]\nÁrea Y: IC(μY) 95%: [R$3.270,00; R$3.730,00]\n\nQual afirmação é correta em relação aos intervalos de confiança?",
        "correct_answer": "A",
        "solution": "A amplitude do IC de X é 600 (n=100) e de Y é 460 (n=170). Como a amostra de X é menor (100 < 170) e o desvio padrão é o mesmo, o IC de X tem maior amplitude. Isso é consistente com IC = x̄ ± z×σ/√n: menor n → maior amplitude.",
        "difficulty": 2,
        "chapter_num": 3,
        "source": "concurso",
        "alternatives": [
            {"letter": "A", "text": "A amplitude do intervalo de confiança do salário médio mensal dos recém-formados da área de trabalho X é maior porque o tamanho da amostra é menor."},
            {"letter": "B", "text": "Ao comparar os intervalos de confiança, pode-se afirmar com 5% de significância que o salário médio mensal populacional dos recém-formados da área de trabalho Y é maior do que o da área X."},
            {"letter": "C", "text": "Não é possível comparar o salário médio mensal populacional dos recém-formados das duas áreas devido ao tamanho da amostra ser diferente."},
            {"letter": "D", "text": "Com 95% de confiança, pode-se afirmar que o salário médio mensal populacional dos recém-formados das duas áreas é maior que R$3.500,00."},
            {"letter": "E", "text": "Ao comparar os intervalos de confiança, pode-se afirmar com 5% de significância que o salário médio mensal populacional dos recém-formados da área Y é diferente da área X."},
        ],
    },
    {
        "issue": "(Instituto Consulplan – 2024 – Analista)\n\nSabe-se que a altura dos estudantes de uma universidade é modelada por uma distribuição normal com média desconhecida e desvio-padrão de 12 cm. Em um primeiro estudo, a partir de uma amostra com 64 estudantes dessa universidade, construiu-se o intervalo de confiança [167,54; 172,46] para a média populacional. Em um segundo estudo, uma amostra de tamanho 4 vezes maior foi coletada e foi obtida a mesma média amostral. Usando o mesmo nível de confiança, o intervalo de confiança para a média populacional associado ao segundo estudo é dado por:",
        "correct_answer": "C",
        "solution": "No primeiro estudo: meia-amplitude = 2,46. No segundo: n₂ = 4×64 = 256. A meia-amplitude se reduz por √(n₂/n₁) = √4 = 2. Nova meia-amplitude = 2,46/2 = 1,23. Média amostral = (167,54+172,46)/2 = 170. Novo IC = [170-1,23; 170+1,23] = [168,77; 171,23].",
        "difficulty": 3,
        "chapter_num": 3,
        "source": "concurso",
        "alternatives": [
            {"letter": "A", "text": "[167,96; 172,04]"},
            {"letter": "B", "text": "[168,24; 171,76]"},
            {"letter": "C", "text": "[168,77; 171,23]"},
            {"letter": "D", "text": "[169,02; 170,98]"},
        ],
    },
    {
        "issue": "(FUNDATEC – 2022 – Analista)\n\nEm uma pesquisa eleitoral, 20 eleitores se posicionaram a favor de um candidato A, enquanto 80 outros eleitores se posicionaram contra o mesmo candidato. Qual o intervalo com 95% de confiança para o percentual de aceitação do candidato A, aproximadamente?",
        "correct_answer": "A",
        "solution": "n=100, p̂=20/100=0,20. EP = √(0,20×0,80/100) = √0,0016 = 0,04. IC 95% (z=1,96): [0,20 - 1,96×0,04; 0,20 + 1,96×0,04] = [0,1216; 0,2784] ≈ [12,2%; 27,8%].",
        "difficulty": 2,
        "chapter_num": 3,
        "source": "concurso",
        "alternatives": [
            {"letter": "A", "text": "12,2% – 27,8%."},
            {"letter": "B", "text": "19,7% – 20,3%."},
            {"letter": "C", "text": "16,0% – 24,0%."},
            {"letter": "D", "text": "72,2% – 87,8%."},
            {"letter": "E", "text": "76,0% – 84,0%."},
        ],
    },
    {
        "issue": "(UFPE – 2022 – Estatístico)\n\nEm uma recente pesquisa realizada com 400 estudantes, 80 disseram que votariam no candidato A para presidente na eleição deste ano. O intervalo de confiança de 90% da proporção da população de estudantes que votariam no candidato A, é:",
        "correct_answer": "C",
        "solution": "n=400, p̂=80/400=0,20. EP = √(0,20×0,80/400) = √0,0004 = 0,02. IC 90% (z=1,645): hw = 1,645×0,02 = 0,0329. IC = [0,20-0,033; 0,20+0,033].",
        "difficulty": 2,
        "chapter_num": 3,
        "source": "concurso",
        "alternatives": [
            {"letter": "A", "text": "[0,20–0,039; 0,20+0,039]."},
            {"letter": "B", "text": "[0,80–0,039; 0,80+0,039]."},
            {"letter": "C", "text": "[0,20–0,033; 0,20+0,033]."},
            {"letter": "D", "text": "[0,80–0,033; 0,80+0,033]."},
            {"letter": "E", "text": "[0,20–0,026; 0,20+0,026]."},
        ],
    },
    {
        "issue": "(SSPM – 2021 – Marinha)\n\nNuma pesquisa de mercado, n = 900 pessoas foram entrevistadas sobre determinado produto, e 70% delas preferiram a marca A. Assinale a opção que apresenta um intervalo de confiança conservador para a proporção p com coeficiente de confiança γ = 0,95.",
        "correct_answer": "D",
        "solution": "IC conservador usa p=0,5 (maximiza variância): EP_cons = √(0,5×0,5/900) = 0,5/30 = 1/60 ≈ 0,01667. IC = [0,70 - 1,96×0,01667; 0,70 + 1,96×0,01667] = [0,70 - 0,0327; 0,70 + 0,0327] ≈ [0,667; 0,733].",
        "difficulty": 3,
        "chapter_num": 3,
        "source": "concurso",
        "alternatives": [
            {"letter": "A", "text": "[0,557; 0,843]"},
            {"letter": "B", "text": "[0,581; 0,819]"},
            {"letter": "C", "text": "[0,631; 0,769]"},
            {"letter": "D", "text": "[0,667; 0,733]"},
            {"letter": "E", "text": "[0,673; 0,727]"},
        ],
    },
    {
        "issue": "(FGV – 2021 – Analista)\n\nUma amostra aleatória simples de tamanho 25 de uma distribuição normal com média μ e variância σ² desconhecidas, apresentou os seguintes dados suficientes: Média amostral = 40,0, Desvio-padrão amostral = 2,5. Um intervalo de 95% de confiança para μ será dado, aproximadamente, por:",
        "correct_answer": "A",
        "solution": "Com σ² desconhecida e n=25, usa-se a distribuição t com n-1=24 graus de liberdade. t_{0,025; 24} ≈ 2,064. EP = 2,5/√25 = 0,5. IC = [40 - 2,064×0,5; 40 + 2,064×0,5] = [40 - 1,032; 40 + 1,032] ≈ [39,0; 41,0].",
        "difficulty": 2,
        "chapter_num": 3,
        "source": "concurso",
        "alternatives": [
            {"letter": "A", "text": "(39,0; 41,0)."},
            {"letter": "B", "text": "(38,6; 41,4)."},
            {"letter": "C", "text": "(38,0; 42,0)."},
            {"letter": "D", "text": "(37,6; 42,4)."},
            {"letter": "E", "text": "(37,0; 43,0)."},
        ],
    },
    {
        "issue": "(FGV – 2021 – Analista)\n\nUma amostra aleatória simples de 625 trabalhadores mostrou que, desses, 125 estavam desempregados. Um intervalo aproximado de 95% de confiança para a verdadeira proporção de desempregados na população de trabalhadores, será dado por:",
        "correct_answer": "B",
        "solution": "p̂ = 125/625 = 0,20. EP = √(0,20×0,80/625) = √0,000256 = 0,016. IC 95% (z=1,96): hw = 1,96×0,016 = 0,03136 ≈ 0,03. IC ≈ [0,17; 0,23].",
        "difficulty": 2,
        "chapter_num": 3,
        "source": "concurso",
        "alternatives": [
            {"letter": "A", "text": "(0,19; 0,21)."},
            {"letter": "B", "text": "(0,17; 0,23)."},
            {"letter": "C", "text": "(0,16; 0,24)."},
            {"letter": "D", "text": "(0,15; 0,25)."},
            {"letter": "E", "text": "(0,14; 0,26)."},
        ],
    },

    # ========================================================================
    # CAPÍTULO 11 — Teste de Hipótese → Inferência Estatística (cap 3)
    # ========================================================================
    {
        "issue": "(IDESG – 2025 – Analista)\n\nSobre testes de hipóteses, analise as afirmativas:\n\nI. O nível de significância representa a probabilidade de rejeitar a hipótese nula quando ela é verdadeira.\nII. O valor-p (p-value) é a menor significância em que a hipótese nula pode ser rejeitada.\nIII. Testes bilaterais consideram apenas uma direção da hipótese alternativa.\nIV. O erro tipo I ocorre quando se rejeita uma hipótese verdadeira.\n\nEstão corretas as afirmativas:",
        "correct_answer": "D",
        "solution": "I: VERDADEIRA — o nível de significância α = P(rejeitar H₀ | H₀ verdadeira) = P(erro tipo I). II: VERDADEIRA — o p-valor é a menor significância para a qual os dados observados rejeitariam H₀. III: FALSA — testes bilaterais consideram duas direções (H₁: μ ≠ μ₀); apenas os unilaterais consideram uma direção. IV: VERDADEIRA — erro tipo I = rejeitar H₀ quando ela é verdadeira. Corretas: I, II e IV.",
        "difficulty": 2,
        "chapter_num": 3,
        "source": "concurso",
        "alternatives": [
            {"letter": "A", "text": "I, II, III e IV."},
            {"letter": "B", "text": "II e IV, apenas."},
            {"letter": "C", "text": "I e II, apenas."},
            {"letter": "D", "text": "I, II e IV, apenas."},
        ],
    },
    {
        "issue": "(SSPM – 2025 – Marinha)\n\nSabe-se que a partir de um teste de hipóteses, realizado com os dados amostrais, é possível inferir sobre a população. Com relação ao teste, assinale a opção correta.",
        "correct_answer": "D",
        "solution": "D é correta: o único caminho para reduzir simultaneamente os erros tipo I e tipo II é aumentar o tamanho da amostra. Diminuir α (tipo I) geralmente aumenta β (tipo II), e vice-versa, a menos que n aumente. As demais opções são falsas: rejeitar quando deveria aceitar é erro tipo I (não II); P(erro tipo II) = β, não o nível de significância; as Curvas COC mostram probabilidades de erro tipo II, não I.",
        "difficulty": 2,
        "chapter_num": 3,
        "source": "concurso",
        "alternatives": [
            {"letter": "A", "text": "Se uma hipótese for rejeitada quando deveria ser aceita, dizemos que foi cometido um erro do tipo II."},
            {"letter": "B", "text": "Ao testar uma hipótese, a probabilidade de correr o risco de um erro do tipo II é denominada nível de significância."},
            {"letter": "C", "text": "As Curvas Características de Operação são gráficos que indicam as probabilidades de erros do tipo I."},
            {"letter": "D", "text": "O único caminho para a redução de ambos os tipos de erros consiste em aumentar o tamanho da amostra."},
            {"letter": "E", "text": "As Curvas Características de Operação possibilitam a redução de erros, ou seja, elas indicam o nível de significância do teste."},
        ],
    },
    {
        "issue": "(EsFCEx – 2023 – Oficial)\n\nConsidere o teste de hipóteses: H0: μ₁ = μ₂ contra H1: μ₁ ≠ μ₂ com variâncias conhecidas σ₁² = 2 e σ₂² = 2,5. Suponha que os tamanhos das amostras sejam n1 = 16 e n2 = 20 e que as médias amostrais sejam X̄₁ = 20,5 e X̄₂ = 18,4.\n\nDado φ(1,645) = 0,95, φ(1,96) = 0,975, F(1,691) = 0,95, F(2,03) = 0,975 (φ = distribuição normal padrão acumulada, F = distribuição t de Student com 34 graus de liberdade). É possível concluir em favor de H0?",
        "correct_answer": "A",
        "solution": "Z_cal = (20,5 - 18,4)/√(2/16 + 2,5/20) = 2,1/√(0,125 + 0,125) = 2,1/√0,25 = 2,1/0,5 = 4,2. |Z_cal| = 4,2 > 1,96 → rejeita-se H0 ao nível de 0,05. Portanto, NÃO é possível concluir em favor de H0.",
        "difficulty": 3,
        "chapter_num": 3,
        "source": "concurso",
        "alternatives": [
            {"letter": "A", "text": "Não, pois como |zcal| = 4,20 > 1,96 rejeita-se a hipótese nula ao nível de 0,05 de significância"},
            {"letter": "B", "text": "Não, pois como |zcal| = 1,20 < 1,645 rejeita-se a hipótese nula ao nível de 0,05 de significância."},
            {"letter": "C", "text": "Sim, pois como |tcal| = 4,20 > 2,03 não se rejeita a hipótese nula ao nível de 0,05 de significância."},
            {"letter": "D", "text": "Sim, pois não se rejeita a hipótese nula ao nível de 0,05 de significância, dado que |tcal| = 1,20 < 2,03."},
            {"letter": "E", "text": "Sim, pois como |zcal| = 1,20 < 1,96 não se rejeita a hipótese nula ao nível de 0,05 de significância"},
        ],
    },
    {
        "issue": "(VUNESP – 2023 – Analista Judiciário)\n\nDuzentos candidatos foram entrevistados para se avaliar a correlação entre \"fazer cursinho\" e \"ser aprovado\" em um concurso. Os resultados estão na tabela a seguir:\n\n| | Aprovado? Sim | Aprovado? Não |\n|---|---|---|\n| Cursinho? Sim | 50 | 30 |\n| Cursinho? Não | 50 | 70 |\n\nAplicando o teste qui-quadrado com nível de significância de 5% aos dados da tabela, conclui-se que: (obs: χ² = qui-quadrado)",
        "correct_answer": "C",
        "solution": "Totais: Cursinho Sim=80, Cursinho Não=120, Aprovado=100, Reprovado=100. Valores esperados: E(S,A)=40, E(S,N)=40, E(N,A)=60, E(N,N)=60. χ² = (50-40)²/40 + (30-40)²/40 + (50-60)²/60 + (70-60)²/60 = 2,5 + 2,5 + 1,667 + 1,667 = 8,33 ≈ 8,3. Valor crítico χ²(1df, 5%) = 3,841. Como 8,3 > 3,841, rejeita-se H0 → fazer cursinho influencia na aprovação.",
        "difficulty": 3,
        "chapter_num": 3,
        "source": "concurso",
        "alternatives": [
            {"letter": "A", "text": "χ² = 40 e fazer cursinho influencia na aprovação."},
            {"letter": "B", "text": "χ² = 20 e fazer cursinho influencia na aprovação."},
            {"letter": "C", "text": "χ² = 8,3 e fazer cursinho influencia na aprovação."},
            {"letter": "D", "text": "χ² = 4,2 e fazer cursinho não influencia na aprovação."},
            {"letter": "E", "text": "χ² = 0,8 e fazer cursinho não influencia na aprovação."},
        ],
    },
    {
        "issue": "(EsFCEx – 2023 – Oficial)\n\nNa possibilidade de exemplificar o fenômeno de como os exercícios aeróbicos e a ingestão de calorias podem afetar o peso, quarenta oficiais recém ingressados no exército anotaram o número de minutos de exercícios aeróbicos e sua ingestão calórica (Kcal) diária durante uma semana. Avaliou-se a associação entre X = 'tempo de exercício físico realizado' e Y = 'calorias ingeridas' por meio de um gráfico de dispersão, obtendo-se um coeficiente de correlação r = -0,2515. Aplicou-se o teste de hipótese para correlação zero (H0: ρ = 0), obtendo-se um p-valor de 0,4071. Fixou-se nível de confiança de 95%. É possível afirmar corretamente que:",
        "correct_answer": "E",
        "solution": "p-valor = 0,4071 > 0,05 (nível de significância) → não há evidências para rejeitar H0 (ρ=0). Logo, não se rejeita H0 e conclui-se que as variáveis são independentes (sem correlação linear significativa). Opção E está correta.",
        "difficulty": 2,
        "chapter_num": 3,
        "source": "concurso",
        "alternatives": [
            {"letter": "A", "text": "Não há motivos para se rejeitar H0. Logo, conclui-se que a variável 'tempo de exercício físico realizado' é dependente da variável 'calorias ingeridas'."},
            {"letter": "B", "text": "Rejeita-se H0. Logo, conclui-se que a variável 'tempo de exercício físico realizado' é dependente da variável 'calorias ingeridas'."},
            {"letter": "C", "text": "Rejeita-se H0. Logo, conclui-se que a variável 'tempo de exercício físico realizado' é independente da variável 'calorias ingeridas'."},
            {"letter": "D", "text": "Rejeita-se H0. Logo, conclui-se que as variáveis possuem uma correlação sem sentido (espúria)."},
            {"letter": "E", "text": "Não há motivos para se rejeitar H0. Logo, conclui-se que a variável 'tempo de exercício físico realizado' é independente da variável 'calorias ingeridas'."},
        ],
    },
    {
        "issue": "(CESPE/CEBRAPE – 2023 – Analista)\n\nEm certo tribunal, deseja-se verificar se, nos últimos anos, os juízes (M) analisaram mais processos que as juízas (F), ou vice-versa, isto é, deseja-se verificar se existe diferença de gênero quanto a quem fez a análise dos processos. A partir dessa situação hipotética, assinale a opção que corresponde às hipóteses nula (H0) e alternativa (H1) do referido teste.",
        "correct_answer": "A",
        "solution": "Quer-se testar se PM > 0,5 (juízes analisaram mais) ou PM < 0,5 (juízas analisaram mais). Como a questão pede verificar se há diferença direcional (\"juízes analisaram MAIS\"), a hipótese alternativa é PM > 0,5 (teste unilateral à direita). H0: PM = 0,5 e H1: PM > 0,5.",
        "difficulty": 2,
        "chapter_num": 3,
        "source": "concurso",
        "alternatives": [
            {"letter": "A", "text": "H0: PM = 0,5; H1: PM > 0,5"},
            {"letter": "B", "text": "H0: PM = 0,5; H1: PM ≠ 0,5"},
            {"letter": "C", "text": "H0: PM ≤ 0,5; H1: PM > 0,5"},
            {"letter": "D", "text": "H0: PM = 0,5; H1: PM < 0,5"},
            {"letter": "E", "text": "H0: PM > 0,5; H1: PM ≤ 0,5"},
        ],
    },
    {
        "issue": "(CESPE/CEBRAPE – 2023 – Analista)\n\nAssinale a opção correta, considerando que, em um teste de hipóteses, a decisão de rejeição ou não da hipótese nula (H0) pode ser tomada com base na relação entre o nível de significância (a) e o p-valor.",
        "correct_answer": "C",
        "solution": "A regra de decisão é: se p-valor ≤ α → rejeitar H0; se p-valor > α → não rejeitar H0. Portanto, se a < p-valor (ou seja, p-valor > a) → H0 não será rejeitada. Opção C está correta.",
        "difficulty": 1,
        "chapter_num": 3,
        "source": "concurso",
        "alternatives": [
            {"letter": "A", "text": "Se a > p-valor, então H0 não será rejeitada."},
            {"letter": "B", "text": "Se a > p-valor, então H0 será rejeitada."},
            {"letter": "C", "text": "Se a < p-valor, então H0 não será rejeitada."},
            {"letter": "D", "text": "Se a = p-valor, então H0 será rejeitada."},
            {"letter": "E", "text": "Se a ≤ p-valor, então H0 não será rejeitada."},
        ],
    },
    {
        "issue": "(VUNESP – 2023 – Agente de Defensoria Pública)\n\nAfirma-se que a média de uma variável aleatória é 100. Para se testar esta hipótese a 5% de significância, uma amostra de 100 elementos da variável foi retirada, encontrando-se uma média de 96,4, com desvio-padrão de 20. O teste de hipótese deverá ser:\n\n(Para esta questão, considere que, se z tem distribuição normal padrão, então p(–2 < z < 2) ≅ 0,95 e p(–1,6 < z < 1,6) ≅ 0,90.)",
        "correct_answer": "A",
        "solution": "H0: μ=100 (bilateral). Z = (96,4 - 100)/(20/√100) = -3,6/2 = -1,8. |Z| = 1,8. Para α=5% bilateral: z_crítico = 2 (pois P(-2<Z<2)=0,95). Como |Z|=1,8 < 2, não se rejeita H0. O teste é bicaudal e H0 não deve ser rejeitada.",
        "difficulty": 2,
        "chapter_num": 3,
        "source": "concurso",
        "alternatives": [
            {"letter": "A", "text": "bicaudal, e a hipótese nula não deverá ser rejeitada."},
            {"letter": "B", "text": "bicaudal, e a hipótese nula deverá ser rejeitada."},
            {"letter": "C", "text": "monocaudal, e a hipótese nula não deverá ser rejeitada."},
            {"letter": "D", "text": "monocaudal, e a hipótese nula deverá ser rejeitada."},
            {"letter": "E", "text": "bicaudal, ou monocaudal, e a hipótese nula deverá ser rejeitada."},
        ],
    },
    {
        "issue": "(IFPA – 2023 – Estatístico)\n\nO rendimento semestral global dos estudantes de uma instituição de ensino é uma variável aleatória normalmente distribuída com média e variância desconhecidas. Para testar a hipótese bilateral de que a média populacional é igual ou diferente de 80, foi construído um intervalo apropriado com 95% de confiança a partir de uma amostra de 16 estudantes. Considerando que o intervalo obtido é [76,8; 80,5], a distribuição utilizada para a construção do intervalo e a conclusão do teste de hipóteses são, respectivamente:",
        "correct_answer": "D",
        "solution": "Com variância desconhecida e amostra pequena (n=16), usa-se a distribuição t de Student com 15 graus de liberdade. O valor 80 está dentro do intervalo [76,8; 80,5], portanto não há evidências para rejeitar H0 (μ=80) ao nível de 5% de significância.",
        "difficulty": 2,
        "chapter_num": 3,
        "source": "concurso",
        "alternatives": [
            {"letter": "A", "text": "Distribuição Normal e rejeita-se a hipótese nula."},
            {"letter": "B", "text": "Distribuição t-Student e rejeita-se a hipótese nula."},
            {"letter": "C", "text": "Distribuição Normal e não se rejeita a hipótese nula."},
            {"letter": "D", "text": "Distribuição t-Student e não se rejeita a hipótese nula."},
        ],
    },
    {
        "issue": "(IBFC – 2022 – Economista)\n\nO objetivo do teste estatístico de hipóteses é criar uma metodologia que permite verificar se os dados amostrais trazem evidências que apoiem, ou não, uma hipótese (estatística) formulada. Vários são os passos para a Construção de um Teste de Hipóteses. Assinale a alternativa que apresenta o primeiro passo na realização de um Teste de Hipóteses.",
        "correct_answer": "C",
        "solution": "O primeiro passo na construção de um teste de hipóteses é formular as hipóteses: definir a hipótese nula H0 (afirmação a ser testada) e a hipótese alternativa H1 (afirmação contrária). Somente após definir as hipóteses é que se escolhe a estatística de teste, calcula-se o valor e toma-se a decisão.",
        "difficulty": 1,
        "chapter_num": 3,
        "source": "concurso",
        "alternatives": [
            {"letter": "A", "text": "Usar a teoria estatística e as informações disponíveis para decidir qual estatística (estimador) será usada para testar a hipótese H0. Obter as propriedades dessa estatística (distribuição, media, desvio padrão)"},
            {"letter": "B", "text": "Usar as observações da amostra para calcular o valor da estatística do teste"},
            {"letter": "C", "text": "Fixar qual a hipótese H0 a ser testada e qual a hipótese alternativa H1"},
            {"letter": "D", "text": "Verificar se o valor da estatística calculado com os dados da amostra não pertencem a região critica, não rejeite H0; caso contrario, rejeite H0"},
        ],
    },
    {
        "issue": "(Marinha – 2022 – Técnico)\n\nClassifique abaixo os testes de hipótese para a média em unilateral (U) ou bilateral (B) e marque a opção que apresenta a sequência correta.\n\nI: H1: μ ≠ 3\nII: H1: μ > 3\nIII: H1: μ < 3\nIV: H1: μ ≠ 7\nV: H1: μ > 7",
        "correct_answer": "B",
        "solution": "I: H1: μ≠3 → bilateral (B). II: H1: μ>3 → unilateral (U). III: H1: μ<3 → unilateral (U). IV: H1: μ≠7 → bilateral (B). V: H1: μ>7 → unilateral (U). Sequência: B, U, U, B, U.",
        "difficulty": 1,
        "chapter_num": 3,
        "source": "concurso",
        "alternatives": [
            {"letter": "A", "text": "(U)(B)(U)(B)(U)"},
            {"letter": "B", "text": "(B)(U)(U)(B)(U)"},
            {"letter": "C", "text": "(B)(U)(B)(B)(B)"},
            {"letter": "D", "text": "(U)(B)(U)(U)(B)"},
            {"letter": "E", "text": "(U)(U)(B)(U)(U)"},
        ],
    },
    {
        "issue": "(FUNDATEC – 2022 – Técnico Superior)\n\nUm fabricante de pisos afirma que uma lajota de um certo tipo de piso produzido por ele pode aguentar um peso superior a 900 kg sem trincar. Uma agência de controle de qualidade seleciona uma amostra de 10 lajotas produzidas pela fábrica e determina que o peso médio suportado pela amostra sem trincar é de 1.325,2 kg, com desvio padrão amostral de 425,8 kg. Quais são as respectivas hipóteses nula e alternativa para o presente estudo?",
        "correct_answer": "E",
        "solution": "O fabricante afirma que μ > 900 kg. Para testar esta afirmação, a hipótese nula (conservadora) é H0: μ ≤ 900 kg, e a hipótese alternativa (o que queremos provar) é Ha: μ > 900 kg (teste unilateral à direita).",
        "difficulty": 1,
        "chapter_num": 3,
        "source": "concurso",
        "alternatives": [
            {"letter": "A", "text": "H0: μ > 900 kg e Ha: μ ≤ 900 kg."},
            {"letter": "B", "text": "H0: μ = 900 kg e Ha: μ ≠ 900 kg."},
            {"letter": "C", "text": "H0: μ < 900 kg e Ha: μ ≥ 900 kg."},
            {"letter": "D", "text": "H0: μ ≥ 900 kg e Ha: μ < 900 kg."},
            {"letter": "E", "text": "H0: μ ≤ 900 kg e Ha: μ > 900 kg."},
        ],
    },
    {
        "issue": "(FUNDATEC – 2022 – Analista)\n\nEm relação aos erros que podem ser cometidos em um teste de hipótese, assinale a alternativa correta.",
        "correct_answer": "A",
        "solution": "A definição correta do erro tipo I é: α = P(erro tipo I) = P(rejeitar H₀ | H₀ verdadeira). Ou seja, é a probabilidade de rejeitar a hipótese nula quando ela é verdadeira.",
        "difficulty": 1,
        "chapter_num": 3,
        "source": "concurso",
        "alternatives": [
            {"letter": "A", "text": "α = P(erro tipo I) = P(rejeitar H₀ | H₀ verdadeira)"},
            {"letter": "B", "text": "α = P(erro tipo I) = P(não rejeitar H₀ | H₀ falso)"},
            {"letter": "C", "text": "β = P(erro tipo II) = P(não rejeitar H₀ | H₀ falso)"},
            {"letter": "D", "text": "β = P(erro tipo II) = P(rejeitar H₀ | H₀ verdadeiro)"},
            {"letter": "E", "text": "1 − β = Poder do teste = P(rejeitar H₀ | H₀ falso)"},
        ],
    },
    {
        "issue": "(Ministério da Defesa – Marinha – 2022)\n\nUm dado é lançado 240 vezes e as seguintes frequências são observadas:\n\n| Eventos | Frequências |\n|---|---|\n| Sair o 1 | 40 |\n| Sair o 2 | 50 |\n| Sair o 3 | 45 |\n| Sair o 4 | 35 |\n| Sair o 5 | 42 |\n| Sair o 6 | 28 |\n\nAo testar a hipótese de o dado ser honesto adotando a = 0,05, é correto afirmar que:",
        "correct_answer": "B",
        "solution": "Frequência esperada por face = 240/6 = 40. χ² = [(40-40)²+(50-40)²+(45-40)²+(35-40)²+(42-40)²+(28-40)²]/40 = [0+100+25+25+4+144]/40 = 298/40 = 7,45. Valor crítico χ²(5df, 5%) = 11,07. Como 7,45 < 11,07, não se rejeita H0 (dado pode ser honesto).",
        "difficulty": 3,
        "chapter_num": 3,
        "source": "concurso",
        "alternatives": [
            {"letter": "A", "text": "Xcal = 3,21 e não se rejeita H0"},
            {"letter": "B", "text": "Xcal = 7,45 e não se rejeita H0"},
            {"letter": "C", "text": "Xcal = 11,98 e rejeita-se H0"},
            {"letter": "D", "text": "Xcal = 12,52 e rejeita-se H0"},
            {"letter": "E", "text": "Xcal = 15,45 e rejeita-se H0"},
        ],
    },
]


def run(dry_run: bool = False) -> None:
    import sqlalchemy as sa
    from sqlalchemy import text

    db_url = os.getenv("DATABASE_URL", "")
    if db_url.startswith("postgres://"):
        db_url = db_url.replace("postgres://", "postgresql://", 1)
    if not db_url:
        raise SystemExit("DATABASE_URL não definida.")

    engine = sa.create_engine(db_url)

    with engine.begin() as conn:
        # Busca os IDs dos capítulos pelo número
        chapters = conn.execute(
            text("SELECT id, number FROM chapters ORDER BY number")
        ).fetchall()
        chapter_map = {row[1]: row[0] for row in chapters}

        if not chapter_map:
            raise SystemExit("Nenhum capítulo encontrado. Execute a migração principal primeiro.")

        inserted = 0
        skipped = 0

        for q in QUESTIONS:
            chapter_id = chapter_map.get(q["chapter_num"])
            if not chapter_id:
                print(f"  [WARN] Capítulo {q['chapter_num']} não encontrado — pulando questão")
                skipped += 1
                continue

            if dry_run:
                preview = q["issue"][:80].replace("\n", " ").strip()
                print(f"  [DRY] cap={q['chapter_num']}, src={q['source']}, resp={q['correct_answer']}: {preview}...")
                inserted += 1
                continue

            # Verifica se a questão já existe (por trecho do enunciado)
            issue_snippet = q["issue"][:100]
            exists = conn.execute(
                text("SELECT 1 FROM questions WHERE issue LIKE :snippet LIMIT 1"),
                {"snippet": f"{issue_snippet[:80]}%"},
            ).fetchone()

            if exists:
                skipped += 1
                continue

            # Insere questão
            result = conn.execute(
                text("""
                    INSERT INTO questions
                        (issue, correct_answer, solution, difficulty, chapter_id, source, needs_fix)
                    VALUES
                        (:issue, :correct_answer, :solution, :difficulty, :chapter_id, :source, false)
                    RETURNING id
                """),
                {
                    "issue": q["issue"],
                    "correct_answer": q["correct_answer"],
                    "solution": q.get("solution"),
                    "difficulty": q["difficulty"],
                    "chapter_id": chapter_id,
                    "source": q["source"],
                },
            )
            new_id = result.scalar()

            # Insere alternativas
            for alt in q["alternatives"]:
                conn.execute(
                    text("""
                        INSERT INTO alternatives (question_id, letter, text, is_correct)
                        VALUES (:qid, :letter, :text, :is_correct)
                    """),
                    {
                        "qid": new_id,
                        "letter": alt["letter"],
                        "text": alt["text"],
                        "is_correct": alt["letter"] == q["correct_answer"],
                    },
                )

            inserted += 1
            if inserted % 10 == 0:
                print(f"  {inserted} questões inseridas...")

        prefix = "[DRY-RUN] " if dry_run else ""
        print(f"\n{prefix}Questões inseridas : {inserted}")
        print(f"{prefix}Questões puladas   : {skipped}")
        if dry_run:
            print("Nenhuma alteração aplicada (--dry-run). Remova a flag para executar.")
        else:
            print("Migração da apostila concluída.")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--dry-run", action="store_true",
                        help="Mostra o que seria inserido sem modificar o banco")
    args = parser.parse_args()
    run(dry_run=args.dry_run)
