---
created: 2026-04-10T21:32:37.835Z
title: Move shared question viewer out of admin namespace
area: general
files:
  - app/frontend/app/(admin)/QuestaoViewer.tsx
  - app/backend/statl/routes/admin.py
  - app/frontend/app/(tabs)/listas.tsx
---

## Problem

A tela moderna de gestão de questões agora atende admin e professor, e a tela legada `QuestionsManager` foi removida. Como ponte de compatibilidade, o frontend compartilhado ainda vive em `app/frontend/app/(admin)/QuestaoViewer.tsx` e a listagem compartilhada continua exposta pelo endpoint `/admin/questoes`, apesar de também ser consumida pelo professor.

## Solution

Mover o visualizador compartilhado para uma rota neutra e criar um endpoint de listagem também neutro, preservando a aba SQL apenas para admin. Depois disso, renomear os caminhos restantes para remover a dependência semântica do namespace `admin`.
