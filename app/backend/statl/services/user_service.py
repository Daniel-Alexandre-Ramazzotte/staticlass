import secrets
from flask import jsonify
from werkzeug.security import generate_password_hash, check_password_hash

from ..repositories.user_repository import (
    buscar_usuario_por_email,
    buscar_usuario_por_id,
    criar_professor,
    criar_usuario_com_papel,
    deletar_usuario,
    listar_alunos,
    listar_professores,
    listar_usuarios_por_papel,
    atualizar_usuario,
)
from ..utils.validators import email_valido


def _gerar_senha_temporaria():
    return secrets.token_urlsafe(12)


def _validar_email_disponivel(email):
    """Retorna mensagem de erro ou None se o e-mail for válido e disponível."""
    if not email_valido(email):
        return "email inválido"
    if buscar_usuario_por_email(email):
        return "email já está em uso"
    return None


# ── Leitura ────────────────────────────────────────────────────────────────

def get_user_by_email_service(email):
    return buscar_usuario_por_email(email) if email else None


def get_user_by_id_service(usuario_id):
    return buscar_usuario_por_id(usuario_id) if usuario_id else None


def get_all_professors_service():
    return listar_professores()


def get_all_alunos_service():
    return listar_alunos()


def get_users_by_role_service(papel):
    return listar_usuarios_por_papel(papel)


# ── Perfil próprio ─────────────────────────────────────────────────────────

def update_own_profile_service(usuario_id, dados):
    usuario = buscar_usuario_por_id(usuario_id)
    if not usuario:
        return None, jsonify({"error": "usuário não encontrado"}), 404

    alteracoes = {}

    novo_nome = (dados.get("name") or "").strip()
    if novo_nome and novo_nome != usuario.name:
        alteracoes["name"] = novo_nome

    novo_email = (dados.get("email") or "").strip()
    if novo_email and novo_email != usuario.email:
        erro = _validar_email_disponivel(novo_email)
        if erro:
            return None, jsonify({"error": erro}), 400
        alteracoes["email"] = novo_email

    nova_senha = dados.get("password")
    if nova_senha:
        if nova_senha != dados.get("confirm_password"):
            return None, jsonify({"error": "as senhas não coincidem"}), 400
        alteracoes["password_hash"] = generate_password_hash(nova_senha)

    if not alteracoes:
        return usuario, None, 200

    try:
        atualizar_usuario(usuario_id, alteracoes)
    except KeyError as e:
        return None, jsonify({"error": str(e)}), 400

    return buscar_usuario_por_id(usuario_id), None, 200


def delete_own_account_service(usuario_id, senha_fornecida):
    usuario = buscar_usuario_por_id(usuario_id)
    if not usuario:
        return {"error": "usuário não encontrado"}, 404
    if not check_password_hash(usuario.password_hash, senha_fornecida):
        return {"error": "senha incorreta"}, 400
    try:
        deletar_usuario(usuario_id)
        return {"message": "conta excluída com sucesso"}, 200
    except Exception as e:
        return {"error": f"erro ao deletar conta: {e}"}, 500


# ── CRUD gerenciado pelo admin ─────────────────────────────────────────────

def create_professor_service(dados):
    """Cria professor (rota legada). Prefira create_managed_user_service."""
    return create_managed_user_service(dados, "professor")


def create_managed_user_service(dados, papel):
    if papel not in {"professor", "aluno"}:
        return None, jsonify({"error": "papel inválido"}), 400
    if not dados:
        return None, jsonify({"error": "dados inválidos"}), 400

    email = (dados.get("email") or "").strip()
    nome  = (dados.get("name") or "").strip()
    if not email or not nome:
        return None, jsonify({"error": "nome e email são obrigatórios"}), 400

    erro = _validar_email_disponivel(email)
    if erro:
        return None, jsonify({"error": erro}), 400

    senha = dados.get("password") or _gerar_senha_temporaria()
    usuario_id = criar_usuario_com_papel(email, generate_password_hash(senha), nome, papel)
    return {"id": usuario_id, "temporary_password": senha}, None, 201


def update_user_service(usuario_id, dados):
    if not dados or not usuario_id:
        return jsonify({"error": "dados inválidos"}), 400
    try:
        atualizar_usuario(usuario_id, dados)
        return jsonify({"message": "usuário atualizado com sucesso"}), 200
    except KeyError as e:
        return jsonify({"error": str(e)}), 400


def update_managed_user_service(usuario_id, dados, papel):
    if not usuario_id:
        return jsonify({"error": "dados inválidos"}), 400

    usuario = buscar_usuario_por_id(usuario_id)
    if not usuario:
        return jsonify({"error": "usuário não encontrado"}), 404
    if usuario.role != papel:
        return jsonify({"error": "usuário não pertence ao grupo informado"}), 400

    alteracoes = {}
    nome   = (dados.get("name") or "").strip()
    email  = (dados.get("email") or "").strip()
    senha  = dados.get("password") or ""
    ativo  = dados.get("active")

    if nome and nome != usuario.name:
        alteracoes["name"] = nome
    if email and email != usuario.email:
        outro = buscar_usuario_por_email(email)
        if not email_valido(email):
            return jsonify({"error": "email inválido"}), 400
        if outro and outro.id != usuario.id:
            return jsonify({"error": "email já está em uso"}), 400
        alteracoes["email"] = email
    if senha:
        alteracoes["password_hash"] = generate_password_hash(senha)
    if ativo is not None:
        alteracoes["active"] = bool(ativo)

    if not alteracoes:
        return jsonify({"message": "nenhuma alteração realizada"}), 200

    try:
        atualizar_usuario(usuario_id, alteracoes)
        return jsonify({"message": "usuário atualizado com sucesso"}), 200
    except KeyError as e:
        return jsonify({"error": str(e)}), 400


def delete_user_service(usuario_id):
    if not usuario_id:
        return jsonify({"error": "id é obrigatório"}), 400
    try:
        deletar_usuario(usuario_id)
        return jsonify({"message": "usuário removido com sucesso"}), 200
    except KeyError as e:
        return jsonify({"error": str(e)}), 500


def delete_managed_user_service(usuario_id, papel):
    usuario = buscar_usuario_por_id(usuario_id)
    if not usuario:
        return jsonify({"error": "usuário não encontrado"}), 404
    if usuario.role != papel:
        return jsonify({"error": "usuário não pertence ao grupo informado"}), 400
    return delete_user_service(usuario_id)
