import mysql.connector
import os
from dotenv import load_dotenv


load_dotenv()

def get_db_connection():
    connection = mysql.connector.connect(
        host=os.getenv("DB_HOST", "localhost"),
        user=os.getenv("DB_USER","flask_user"),
        password=os.getenv("DB_PASS","senha123"),
        database=os.getenv("DB_NAME","test_db")
    )
    return connection

