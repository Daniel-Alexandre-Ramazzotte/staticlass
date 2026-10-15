#!/usr/bin/env python3
"""
latex_convert_2026.py — Converte notação de expoente em caret ("x^2",
"P(A^c)") para LaTeX ($...$) nas 13 questões onde isso quebra a leitura
(sem LaTeX, "x^2" aparece literalmente como "x^2" em vez de x²).

Símbolos Unicode isolados (μ, σ, Σ, √, ≥, ≤, ∩, ∪) não precisaram de
conversão — já renderizam corretamente como texto puro.

Cada issue/solution foi reescrito manualmente, verificado contra o
cálculo original, mantendo o mesmo resultado numérico.

Uso:
    cd app/backend
    python -m statl.latex_convert_2026 [--dry-run]
"""

import argparse
import os
from pathlib import Path
from dotenv import load_dotenv

_SCRIPT_DIR = Path(__file__).resolve().parent
load_dotenv(_SCRIPT_DIR.parent / ".env")

# (id, coluna, texto novo)
REWRITES = [
    (26, "solution",
     "Primeiro, a média: $\\bar{x} = \\dfrac{0\\cdot2 + 1\\cdot3 + 2\\cdot1}{6} = \\dfrac{5}{6} \\approx 0,8333$.\n\n"
     "Agora, $\\text{var}(X) = \\dfrac{2(0-\\bar{x})^2 + 3(1-\\bar{x})^2 + 1(2-\\bar{x})^2}{6}$.\n\n"
     "$(0-0,8333)^2 \\approx 0,6944 \\rightarrow 2 \\times 0,6944 = 1,3889$\n"
     "$(1-0,8333)^2 \\approx 0,02778 \\rightarrow 3 \\times 0,02778 = 0,08333$\n"
     "$(2-0,8333)^2 \\approx 1,3611 \\rightarrow 1 \\times 1,3611 = 1,3611$\n\n"
     "Soma $= 2,8333$. Dividindo por 6: $\\text{var}(X) \\approx 0,4722$."),

    (56, "issue",
     "Um teste para uma doença retorna positivo (evento B). A prevalência da doença é $P(A)=0,01$. "
     "A sensibilidade é $P(B|A)=0,90$ e a taxa de falso positivo é $P(B|A^c)=0,05$. Qual é a probabilidade "
     "de um indivíduo estar doente dado que o teste foi positivo, $P(A|B)$?"),
    (56, "solution",
     "$P(A|B) = \\dfrac{P(A)\\cdot P(B|A)}{P(B)}$.\n\n"
     "$P(B) = P(A)P(B|A) + P(A^c)P(B|A^c) = 0,01\\times0,90 + 0,99\\times0,05 = 0,009 + 0,0495 = 0,0585$.\n\n"
     "Logo, $P(A|B) = 0,009/0,0585 \\approx 0,1538$."),

    (57, "issue", "Se $P(A) = 0,30$, qual é $P(A^c)$ (o complementar de A)?"),
    (57, "solution", "$P(A) + P(A^c) = 1$.\n\nLogo, $P(A^c) = 1 - 0,30 = 0,70$."),

    (58, "issue", "Se $X \\sim b(n=10, p=0,2)$, calcule $P(X = 3)$."),
    (58, "solution",
     "$P(X=3) = C(10,3)\\, p^3 (1-p)^{10-3} = 120\\times(0,2)^3\\times(0,8)^7$.\n\n"
     "$(0,2)^3 = 0,008$ e $(0,8)^7 \\approx 0,2097152$.\n\n"
     "Logo, $P \\approx 120\\times0,008\\times0,2097152 \\approx 0,2013266$."),

    (59, "solution",
     "$E(X) = \\sum x\\,p(x) = 0\\times0,2 + 1\\times0,5 + 2\\times0,3 = 0,5 + 0,6 = 1,1$.\n\n"
     "$E(X^2) = \\sum x^2\\,p(x) = 0 + 1\\times0,5 + 4\\times0,3 = 0,5 + 1,2 = 1,7$.\n\n"
     "$Var(X) = E(X^2) - [E(X)]^2 = 1,7 - (1,1)^2 = 1,7 - 1,21 = 0,49$."),

    (60, "solution",
     "Estimativa por média:\n\n"
     "$\\lambda = \\dfrac{0\\times20 + 1\\times30 + 2\\times25 + 3\\times25}{100} = "
     "\\dfrac{30+50+75}{100} = \\dfrac{155}{100} = 1,55$\n\n"
     "No modelo de Poisson, $P(N=0)=e^{-\\lambda} = e^{-1,55} \\approx 0,212$."),

    (67, "solution",
     "$P(X\\geq14)=P(X=14)+P(X=15)$\n\n"
     "$P(X=14)= C(15,14) \\times (0,4)^{14} \\times (0,6)^1 = 2,41\\times10^{-5}$\n"
     "$P(X=15)= C(15,15) \\times (0,4)^{15} \\times (0,6)^0 = 1,07\\times10^{-6}$\n\n"
     "$P(X=14)+P(X=15) = 2,41\\times10^{-5} + 1,07\\times10^{-6} = 2,52\\times10^{-5}$"),

    (80, "issue",
     "Uma doença atinge apenas 2% da população. Sabe-se que o teste dessa doença dá positivo em 95% dos "
     "doentes e falso positivo em 5% dos não doentes. Considerando que uma pessoa testou positivo, qual a "
     "probabilidade dela estar doente?"),
    (80, "solution",
     "Dados do problema:\n\n"
     "Probabilidade de estar doente: $P(D)=0,02$\n"
     "Probabilidade de não estar doente: $P(D^c)=0,98$\n"
     "Teste positivo se a pessoa está doente: $P(+|D)=0,95$\n"
     "Falso positivo: $P(+|D^c)=0,05$\n"
     "Probabilidade que queremos encontrar: $P(D|+)$\n\n"
     "Primeiro, a probabilidade total de teste positivo:\n\n"
     "$P(+)=P(+|D)P(D)+P(+|D^c)P(D^c)$\n"
     "$P(+)=0,95\\times0,02+0,05\\times0,98$\n"
     "$P(+)=0,019+0,049 = 0,068$\n\n"
     "Agora, aplicando Bayes:\n\n"
     "$P(D|+)=\\dfrac{P(+|D)P(D)}{P(+)} = \\dfrac{0,019}{0,068} = 0,279 \\approx 0,28$"),

    (102, "solution",
     "A margem é $z\\sigma/\\sqrt{n}$. Exigimos $z\\sigma/\\sqrt{n} \\leq 2$.\n\n"
     "Então $\\sqrt{n} \\geq z\\sigma/2 = 1,96\\times10/2 = 9,8$.\n\n"
     "Logo $n \\geq 9,8^2 = 96,04$.\n\nO menor inteiro é $n = 97$."),

    (162, "solution",
     "Para $X \\sim b(n,p)$, $P(X=k) = \\dbinom{n}{k} p^k (1-p)^{n-k}$.\n\n"
     "Aqui $n=10$, $p=0,1$ e $k=2$.\n\n"
     "Logo, $P(X=2) = \\dbinom{10}{2}\\cdot(0,1)^2\\cdot(0,9)^8$."),

    (164, "solution",
     "A densidade da normal padrão é dada por $\\varphi(z)=\\dfrac{1}{\\sqrt{2\\pi}}\\cdot e^{-z^2/2}$."),

    (173, "solution",
     "Pela propriedade da variância, se $Y = kX + c$, então $Var(Y) = Var(kX + c) = k^2 Var(X)$. "
     "A constante aditiva $c$ não altera a dispersão."),

    (187, "solution",
     "No modelo de Poisson, $P(X = k) = \\dfrac{e^{-\\lambda}\\lambda^k}{k!}$.\n\n"
     "Substituindo $k = 0$ e a taxa $\\lambda = 3$:\n\n"
     "$P(X=0)= \\dfrac{e^{-3}\\cdot3^0}{0!} = e^{-3} \\approx 0,0498$"),
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
        updated = 0
        for qid, col, new_val in REWRITES:
            row = conn.execute(
                text("SELECT id FROM questions WHERE id = :id"), {"id": qid}
            ).fetchone()
            if not row:
                print(f"  Aviso: questão id={qid} não encontrada, pulando.")
                continue
            if not dry_run:
                conn.execute(
                    text(f"UPDATE questions SET {col} = :v WHERE id = :id"),
                    {"v": new_val, "id": qid},
                )
            updated += 1
        prefix = "[DRY-RUN] " if dry_run else ""
        print(f"{prefix}Campos convertidos para LaTeX: {updated} (esperado {len(REWRITES)})")
        if dry_run:
            print("Nenhuma alteração aplicada (--dry-run). Remova a flag para executar.")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--dry-run", action="store_true",
                        help="Mostra o que seria alterado sem modificar o banco")
    args = parser.parse_args()
    run(dry_run=args.dry_run)
