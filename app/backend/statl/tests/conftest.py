import pytest
from statl import create_app, db as _db


@pytest.fixture(scope="function")
def app():
    # create_app(testing=True) uses sqlite:///:memory: with StaticPool so all
    # connections (including the Flask test client) share a single in-memory DB.
    application = create_app(testing=True)
    with application.app_context():
        yield application
        _db.session.remove()
        _db.drop_all()


@pytest.fixture(scope="function")
def client(app):
    return app.test_client()
