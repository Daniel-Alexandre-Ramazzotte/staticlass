#!/usr/bin/env python3
"""
fix_embedded_alternatives_2026.py — Corrige 31 questões cujas alternativas
cadastradas na tabela `alternatives` não correspondem à questão pedida no
`issue` (a migração original vinculou alternativas de OUTRA questão que
compartilhava o mesmo original_id na fonte, já que original_id não é único
lá — só virou único ao migrar para o Postgres). As alternativas reais
continuavam embutidas como texto "1) ... 5) ..." dentro do próprio issue.

Cada alternativa e o gabarito foram verificados manualmente (cálculo ou
lógica do enunciado), não apenas copiados do answer_key da fonte — dois
casos (ids 31 e 170) tinham o próprio answer_key da fonte errado:
  - id 31: média dos coelhos = 28,2/15 = 1,88 → alternativa D, não E.
  - id 170: a média amostral é o centro do intervalo, (35,21+35,99)/2=35,6
    → alternativa B, confirmado pelo próprio texto "RESPOSTA: 35,60" que
    estava colado (por engano) no fim do issue original.

id 170 também tinha um fragmento de outra questão colado no final do
issue ("QUESTÕES 173 - 2 ..."); removido.
id 67 tinha um typo no issue (P(X>=4) em vez de P(X>=14) — confirmado pela
própria solução, que já calculava P(X>=14)); corrigido.

Uso:
    cd app/backend
    python -m statl.fix_embedded_alternatives_2026 [--dry-run]
"""

import argparse
import os
from pathlib import Path
from dotenv import load_dotenv

_SCRIPT_DIR = Path(__file__).resolve().parent
load_dotenv(_SCRIPT_DIR.parent / ".env")

# id -> (lista de 5 alternativas na ordem 1..5, letra correta)
FIXES = {
    28: (["Quantitativa discreta", "Quantitativa contínua", "Qualitativa nominal",
          "Qualitativa ordinal", "Numérica intervalar"], "D"),
    29: (["Mediana", "Moda", "Desvio padrão", "Percentil", "Frequência relativa"], "C"),
    30: (["Altura", "Número de filhos", "Peso", "Cor de cabelo", "Classe social"], "B"),
    31: (["2,45", "1,52", "1,81", "1,88", "2,10"], "D"),
    33: (["Número total de observações", "Proporção de cada categoria",
          "Soma das frequências", "Média dos valores", "Desvio dos dados"], "B"),
    34: (["I, somente.", "I e II, somente.", "I e III, somente.",
          "II e III, somente.", "I, II e III."], "B"),
    35: (["V, F, F", "F, V, F", "F, V, V", "V, V, F", "F, F, V"], "B"),
    36: (["76%", "30%", "82%", "54%", "23%"], "A"),
    37: (["Variável quantitativa contínua", "Variável qualitativa nominal",
          "Variável quantitativa discreta", "Variável qualitativa ordinal",
          "Variável qualitativa discreta"], "A"),
    38: (["A média de tempo de utilização de caixas eletrônicos é 1,6",
          "A amplitude do tempo de utilização de caixas eletrônicos é 0,8",
          "A mediana do tempo de utilização de caixas eletrônicos é 1,3",
          "A moda do tempo de utilização de caixas eletrônicos é 1,1",
          "O desvio padrão do tempo de utilização de caixas eletrônicos é 1,4"], "B"),
    39: (["16,2 e 15", "15,3 e 13,9", "15,3 e 12,6", "16,2 e 13,9", "12,8 e 11,5"], "B"),
    40: (["42,9; 38 e 42,5", "43; 42,9 e 43", "42,9; não há e 42,5",
          "42,5; não há e 42,9", "45; 42,6 e 47"], "C"),
    41: (["Ambos têm o mesmo desvio padrão", "O conjunto A tem maior variabilidade",
          "O conjunto B tem maior variabilidade", "Ambos têm amplitude igual",
          "Não é possível comparar"], "C"),
    42: (["Assimetria negativa", "Assimetria nula", "Assimetria positiva",
          "Curtose negativa", "Distribuição uniforme"], "C"),
    43: (["70% praticam esporte", "50% são homens", "40% das mulheres praticam esporte",
          "60% não praticam esporte", "Homens praticam menos esporte que mulheres"], "B"),
    62: (["0,5", "0,8", "0,3", "0,2", "0,6"], "C"),
    63: (["1", "0,5", "0", "Negativa", "Maior que 1"], "C"),
    64: (["Outro evento independente", "Evento impossível", "Tudo que não é A",
          "Evento certo", "Interseção com A"], "C"),
    65: (["1/6", "1/4", "1/36", "2/6", "1/2"], "E"),
    66: (["0,9", "0,45", "0,4", "0,8", "0,3"], "D"),
    67: (["2,52x10^-5", "3,54x10^-5", "1,47x10^5", "2,78x10^-4", "1,98x10^4"], "A"),
    68: (["0,03", "0,4", "0,025", "0,35", "0,25"], "C"),
    69: (["0,025", "0,40", "0,2", "0,0345", "0,512"], "D"),
    70: (["{C,K}", "{C, CK, K}", "{CK, KC, K}", "{CC, CK, KC, KK}",
          "{CC, KC, CK, KK, C, K}"], "D"),
    71: (["0,02", "0,5", "0,36", "0,9", "0,18"], "B"),
    72: (["0,016", "0,018", "0,020", "0,024", "0,026"], "E"),
    73: (["{0,1,2,3,4,5}", "{1,2,3,4,5,6}", "{1,2,3,4,5}", "{2,3,4,5,6,7}",
          "{cara, coroa}"], "B"),
    74: (["{V, A}", "{V1, V2, V3, A1, A2}", "{1,2,3,4,5}", "{V, V, V, A, A}",
          "{V∩A, V∪A}"], "A"),
    78: (["0,70", "0,94", "0,21", "0,39", "0,40"], "A"),
    88: (["O peso médio dos 50 pacotes é um parâmetro.",
          "O peso médio de todos os pacotes produzidos é uma estimativa.",
          "O peso médio dos 50 pacotes é uma estimativa do parâmetro populacional.",
          "Os 50 pacotes representam o parâmetro.",
          "O peso médio da população é um estimador."], "C"),
    170: (["35,50", "35,60", "35,40", "35,21", "35,99"], "B"),
}

LETTERS = ["A", "B", "C", "D", "E"]

# issue completo, verificado manualmente contra o texto original — sem
# regex genérico, porque algumas questões (ex: id 35) têm sua PRÓPRIA lista
# numerada 1)/2)/3) como parte do enunciado real, antes do bloco de opções,
# e um regex genérico apagaria esse conteúdo junto com as opções.
# id 67: corrige typo P(X>=4)->P(X>=14) (confirmado pela própria solução,
# que já calculava P(X>=14)). id 170: remove fragmento de outra questão
# colado no fim ("QUESTÕES 173 - 2 ..."), mantendo só a pergunta real.
ISSUE_OVERRIDES = {
    28: "A variável “nível de escolaridade” é classificada como:",
    29: "A medida que indica o quanto os dados estão dispersos em torno da média é:",
    30: "Qual desses exemplos é considerado uma variável quantitativa discreta",
    31: "Num experimento, 15 coelhos foram alimentados com uma nova ração e tiveram seus "
        "pesos avaliados ao fim do mês. Os dados referentes ao ganho de peso dos coelhos "
        "(em quilogramas) foram: 1,5; 1,6; 2,3; 1,7; 1,5; 2,0; 1,5; 1,8; 2,1; 2,1; 1,9; "
        "1,8; 1,7; 2,5 e 2,2\nQual foi a média de ganho de peso dos coelhos (em quilogramas)?",
    33: "A frequência relativa é:",
    34: "Uma entidade realizou um teste de proficiência da língua inglesa com seus "
        "gerentes. A entidade deseja saber o seguinte:\n"
        "I. A média das notas dos gerentes.\n"
        "II. A distribuição da frequência de cada nota dos gerentes.\n"
        "III. A proficiência do idioma entre os diretores que possuem características "
        "semelhantes aos gerentes.\n"
        "Ao utilizar a estatística descritiva, foi possível obter as seguintes informações:",
    35: "Responda verdadeiro (V) ou falso (F):\n"
        "1) Suponha duas amostras colhidas de uma mesma população, sendo uma de tamanho "
        "100 e outra de tamanho 200. Então, a amostra de tamanho maior é mais "
        "representativa da população.\n"
        "2) Duas variáveis com valores diferentes podem apresentar histogramas iguais.\n"
        "3) Duas variáveis com box-plot iguais não podem ter valores diferentes.",
    36: "Um grupo de pedagogos estuda a influência da troca de escolas no desempenho de "
        "alunos do ensino fundamental. Como parte do levantamento realizado, foi anotado "
        "o número de escolas cursadas pelos alunos participantes do estudo.\n\n"
        "| ESCOLAS CURSADAS | FREQUÊNCIA |\n"
        "| :---- | :---- |\n"
        "| 1 | 46 |\n"
        "| 2 | 57 |\n"
        "| 3 | 21 |\n"
        "| 4 | 15 |\n"
        "| 5 | 54 |\n\n"
        "Qual a porcentagem dos alunos que cursam mais de uma escola?",
    37: "Alunos da Escola de Educação Física foram submetidos a um teste de resistência "
        "quanto ao número de quilômetros que conseguiram correr sem parar. Qual é a "
        "classificação da variável em estudo segundo os tipos de variáveis?",
    38: "O tempo de utilização de caixas eletrônicos depende de cada usuário e das "
        "operações efetuadas. Foram coletadas 10 medidas desse tempo (em minutos): "
        "1,1; 1,7; 1,5; 0,9; 1,3; 1,4; 1,6; 1,7; 1,6; 1,0\nAssinale a alternativa correta:",
    39: "Foram feitas medidas em operários da construção civil a respeito da taxa de "
        "hemoglobina no sangue (em gramas/cm³):\n"
        "15,8; 14,7; 13,5; 12,7; 12,3; 13,5; 15,4; 16,3; 15,2; 12,3; 13,7; 14,1\n"
        "Determine o terceiro quartil e a mediana.",
    40: "Uma pesquisa coletou os dados de idade de 30 pacientes em uma clínica. Calcule: "
        "média, moda e mediana\n"
        "34; 27; 45; 51; 39; 63; 29; 48; 56; 31; 40; 36; 42; 54; 47; 50; 38; 33; 60; 52; "
        "37; 43; 35; 46; 49; 55; 32; 41; 44; 30",
    41: "Considere dois conjuntos:\n"
        "Conjunto A: 10, 10, 10, 10, 10\n"
        "Conjunto B: 5, 8, 10, 12, 15\n"
        "Ambos têm média igual a 10. Sobre a dispersão, podemos afirmar que:",
    42: "Em uma empresa, a maioria dos funcionários ganha entre R$ 2.000 e R$ 3.000, mas "
        "alguns diretores ganham acima de R$ 20.000.\nEssa distribuição tende a apresentar:",
    43: "Em uma pesquisa com 100 pessoas, podemos afirmar que:\n\n"
        "|  | PRATICAM ESPORTE | NÃO PRATICAM ESPORTE |\n"
        "| :---- | :---- | :---- |\n"
        "| FEMININO | 10 | 40 |\n"
        "| MASCULINO | 30 | 20 |",
    62: "Considere dois eventos A e B mutuamente exclusivos, sendo a P(A)=0,5, a P(B)=x e "
        "a P(AUB)=0,8.\nDetermine o valor de x",
    63: "A probabilidade de um evento impossível é:",
    64: "O complemento de um evento A é:",
    65: "Considere A o evento: sair um número par. Calcule P(A) ao rolar um dado justo",
    66: "Seja X uma variável aleatória discreta que segue o modelo Uniforme com os "
        "valores no conjunto {1, 2, 3,…, 10}. Calcule P(X<= 9 | X>=6)",
    67: "Seja X uma variável que segue o modelo Binomial com n=15 e p=0,4. Calcule P(X>=14)",
    68: "Uma companhia produz circuitos em três fábricas, I, II e III. A fábrica I produz "
        "40% dos circuitos, enquanto a II e a III produzem 30% cada uma. As "
        "probabilidades de que um circuito integrado produzido por essas fábricas não "
        "funcione são 0,01, 0,04 e 0,03, respectivamente. Escolhido um circuito da "
        "produção conjunta das três fábricas, qual a probabilidade de o mesmo não funcionar?",
    69: "Em uma fábrica de parafusos, as máquinas A, B e C produzem 25%, 35% e 40% do "
        "total, respectivamente. Da produção de cada máquina 5%, 4% e 2%, respectivamente, "
        "são parafusos defeituosos. Escolhe-se ao acaso um parafuso e verifica-se que é "
        "defeituoso. Qual a probabilidade de que o parafuso venha da máquina A?",
    70: "Uma moeda é lançada duas vezes e observam-se as faces obtidas. Descreva o espaço "
        "amostral considerando K para coroa e C para cara",
    71: "Dois dados são lançados simultaneamente e estamos interessados na soma das faces "
        "observadas. Considerando A o evento “Saírem apenas somas pares”, calcule P(A)",
    72: "Um determinado tipo de bateria é produzido por duas linhas de montagem, L₁ e L2. "
        "A linha L₁ possui uma capacidade de produzir quatro vezes mais baterias do que "
        "a linha L2. Sabe-se, através do controle de qualidade, que 2% das baterias "
        "produzidas por L₁ são defeituosas e 5% das baterias produzidas por L2 são "
        "defeituosas. Todas as baterias das duas linhas são enviadas a um depósito central.\n"
        "Se uma bateria for retirada aleatoriamente desse depósito, a probabilidade de "
        "essa bateria ser defeituosa é",
    73: "Ao lançar um dado honesto uma vez, qual é o espaço amostral?",
    74: "Uma urna tem 3 bolas vermelhas (V) e 2 bolas azuis (A). Ao retirar uma bola da "
        "urna e observar sua cor, qual o espaço amostral?",
    78: "Se P(A)=0,5, P(B)=0,4 e P(A∩B)=0,2, então qual é a P(A∪B)?",
    88: "Uma fábrica deseja conhecer o peso médio de todos os pacotes produzidos "
        "diariamente. Como seria inviável pesar todos os pacotes, foram escolhidos 50 "
        "pacotes aleatoriamente e calculada a média de seus pesos.\n"
        "Nesse contexto, é correto afirmar que:",
    170: "Um intervalo de confiança de 95% para a média de uma população Normal com "
         "desvio padrão 2 foi construído com base em uma amostra de tamanho 100: "
         "(35,21;35,99). Qual foi o valor da média amostral?",
}


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
        fixed = 0
        for qid, (options, correct_letter) in FIXES.items():
            row = conn.execute(
                text("SELECT issue FROM questions WHERE id = :id"), {"id": qid}
            ).fetchone()
            if not row:
                print(f"  Aviso: questão id={qid} não encontrada, pulando.")
                continue

            new_issue = ISSUE_OVERRIDES[qid]

            if not dry_run:
                conn.execute(text("DELETE FROM alternatives WHERE question_id = :id"), {"id": qid})
                for letter, opt_text in zip(LETTERS, options):
                    conn.execute(
                        text("INSERT INTO alternatives (question_id, letter, text, is_correct) "
                             "VALUES (:qid, :letter, :text, :is_correct)"),
                        {"qid": qid, "letter": letter, "text": opt_text,
                         "is_correct": letter == correct_letter},
                    )
                conn.execute(
                    text("UPDATE questions SET issue = :issue, correct_answer = :ans WHERE id = :id"),
                    {"issue": new_issue, "ans": correct_letter, "id": qid},
                )
            fixed += 1

        prefix = "[DRY-RUN] " if dry_run else ""
        print(f"{prefix}Questões corrigidas: {fixed} (esperado {len(FIXES)})")
        if dry_run:
            print("Nenhuma alteração aplicada (--dry-run). Remova a flag para executar.")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--dry-run", action="store_true",
                        help="Mostra o que seria alterado sem modificar o banco")
    args = parser.parse_args()
    run(dry_run=args.dry_run)
