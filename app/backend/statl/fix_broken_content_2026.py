#!/usr/bin/env python3
"""
fix_broken_content_2026.py — Corrige texto quebrado deixado pela importação
original (referências de imagem estilo Google Docs "![][imageN]" que nunca
foram resolvidas, e um caso de duas questões concatenadas na mesma linha).

Casos tratados:
  - Remove "![][imageN]" de questões cuja imagem real já foi vinculada via
    image_q/image_s (statl/cleanup_questions_2026.py).
  - id 7: solução era só uma referência de imagem quebrada (sem texto). Como
    não existe arquivo de imagem para a solução dessa questão, foi escrita
    uma explicação textual, verificada contra a tabela de notas por bimestre
    e as alternativas cadastradas.
  - id 45, 46: referência de imagem quebrada dentro da solução; substituída
    por LaTeX ($...$), com o cálculo verificado contra as alternativas.
    id 46 também tinha a solução cortada no meio (faltava o cálculo final).
  - id 32: solução contradiz o gabarito cadastrado (0,05 no texto, mas a
    alternativa marcada como correta é 0,12 — e 0,05 nem é uma opção) e
    depende de uma tabela de imagem que não existe no acervo. Sem a imagem
    original não há como reconciliar; removida.
  - id 154: campo issue continha a questão real (distribuição amostral,
    μ=50, σ=8) seguida de um fragmento de outra questão colado no final
    ("QUESTÕES 153 - 1 ... média aritmética"). As alternativas e a solução
    já cadastradas no banco pertencem a esse fragmento colado (7,0/7,5/8,0/
    8,5/9,0, correta 8,0), não à questão de μ=50. issue foi corrigido para
    conter só a questão que corresponde às alternativas reais.

Uso:
    cd app/backend
    python -m statl.fix_broken_content_2026 [--dry-run]
"""

import argparse
import os
import re
from pathlib import Path
from dotenv import load_dotenv

_SCRIPT_DIR = Path(__file__).resolve().parent
load_dotenv(_SCRIPT_DIR.parent / ".env")

_BROKEN_IMG_REF = re.compile(r'\n*!\[\]\[image\d+\]\n*')

# ids cuja imagem real já foi vinculada via image_q/image_s — só remover a
# referência quebrada do texto, sem reescrever mais nada
STRIP_ONLY_IDS = [1, 2, 4, 5, 8, 12]

# (id, coluna, texto novo completo)
REWRITES = [
    (
        3, "solution",
        "Seja x a terceira nota, temos que:",
    ),
    (
        7, "solution",
        "Calculamos a média de cada aluno somando as notas dos 4 bimestres "
        "(considerando a nota 7 no 4º bimestre) e dividindo por 4:\n\n"
        "Ana: $(6+5+5+7)/4 = 23/4 = 5{,}75$ — abaixo de 6, reprovada.\n"
        "Maria: $(8+4+6+7)/4 = 25/4 = 6{,}25$ — acima de 6, aprovada.\n"
        "Pedro: $(7+7+5+7)/4 = 26/4 = 6{,}5$ — acima de 6, aprovado.\n\n"
        "Logo, somente Ana foi reprovada.",
    ),
    (
        45, "solution",
        "Divisores de 60: (1, 2, 3, 4, 5, 6, 10, 12, 15, 20, 30, 60). Temos um "
        "espaço amostral de 12 elementos, dos quais 3 são primos (2, 3, 5). "
        "Portanto, a probabilidade de escolhermos ao acaso um número primo "
        "dentro dos divisores do número 60 será dada por:\n\n"
        "$P = \\dfrac{3}{12} = \\dfrac{1}{4} = 25\\%$",
    ),
    (
        46, "solution",
        "Podemos transformar o gráfico na seguinte tabela:\n\n"
        "| Idade | nº de cadetes |\n"
        "|---|---|\n"
        "| 17 | 80 |\n"
        "| 18 | 70 |\n"
        "| 19 | 60 |\n"
        "| 20 | 50 |\n"
        "| 21 | 20 |\n\n"
        "Total de cadetes: $80+70+60+50+20 = 280$\n\n"
        "Dessa forma, a probabilidade de se escolher aleatoriamente um aluno "
        "e ele ter 20 ou 21 anos é dada por:\n\n"
        "$P(20 \\text{ ou } 21) = \\dfrac{50+20}{280} = \\dfrac{70}{280} = 0{,}25 = 25\\%$",
    ),
    (
        154, "issue",
        "Considere os dados (em unidades): 4, 7, 7, 10, 12. Calcule a média "
        "aritmética $\\bar{x}$.",
    ),
    (
        154, "solution",
        "$\\bar{x} = \\dfrac{4+7+7+10+12}{5} = \\dfrac{40}{5} = 8$",
    ),
]

# unicamente broken: solução contradiz o gabarito e depende de uma tabela
# de imagem inexistente — sem como reconciliar
DELETE_IDS = [32]


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
        # ── 1. Remover referências quebradas simples ─────────────────────
        stripped = 0
        for qid in STRIP_ONLY_IDS:
            for col in ("issue", "solution"):
                row = conn.execute(
                    text(f"SELECT {col} FROM questions WHERE id = :id"), {"id": qid}
                ).fetchone()
                if not row or not row[0]:
                    continue
                new_val = _BROKEN_IMG_REF.sub('\n', row[0]).strip()
                if new_val != row[0]:
                    if not dry_run:
                        conn.execute(
                            text(f"UPDATE questions SET {col} = :v WHERE id = :id"),
                            {"v": new_val, "id": qid},
                        )
                    stripped += 1
        print(f"Referências quebradas removidas: {stripped}")

        # ── 2. Reescritas com conteúdo verificado ─────────────────────────
        rewritten = 0
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
            rewritten += 1
        print(f"Campos reescritos: {rewritten} (esperado {len(REWRITES)})")

        # ── 3. Excluir questões irreconciliáveis ──────────────────────────
        existing = conn.execute(
            text("SELECT id FROM questions WHERE id = ANY(:ids)"),
            {"ids": DELETE_IDS},
        ).fetchall()
        found_ids = [r[0] for r in existing]
        if not dry_run and found_ids:
            conn.execute(
                text("DELETE FROM questions WHERE id = ANY(:ids)"), {"ids": found_ids}
            )
        print(f"Questões excluídas (irreconciliáveis): {len(found_ids)} (esperado {len(DELETE_IDS)})")

        prefix = "[DRY-RUN] " if dry_run else ""
        print(f"\n{prefix}Concluído.")
        if dry_run:
            print("Nenhuma alteração aplicada (--dry-run). Remova a flag para executar.")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--dry-run", action="store_true",
                        help="Mostra o que seria alterado sem modificar o banco")
    args = parser.parse_args()
    run(dry_run=args.dry_run)
