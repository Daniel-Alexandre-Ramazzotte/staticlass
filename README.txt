O aplicativo utiliza a stack:
Frontend - React Native
Backend - Python + Flask
SGDB - MySQL

Para configurar o banco de dados é necessario um arquivo .env que contem
DB_USER= *usuario mysql*
DB_PASS= *senha do usuario*
DB_HOST=localhost
DB_PORT=3306
DB_NAME= *nome do DB*

Para inicializar o backend rode o comando:
flask --app backend/statl run --debug(opcional)

Para inicializar o frontend em um dispositivo android (fisico ou emulado)
npx expo start --android
