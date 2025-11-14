# API REST CRM

## Informação
A api foi criada para fazer o registro e gestão de clientes que a empresa prestou serviço, afim de registrar os dados excenciais e identificar as licenças que a empresa fornoceu para os clientes. 

## Tecnologias Utilizadas
TypeScript || 
Express ||
MongoDB ||
Node.js

## Ferramentas a baixar
Mongo DB Compass ||
Express ||
Node.js ||
Insominia ||
Npm

## Nome da BD em Mongo DB
API_Gestor

## Exemplo do ficheiro .env
````
PORT=3000
NODE_ENV=development
WHITE_LIST_ORIGINS=
MONGO_URL=mongodb://localhost:27017/
LOG_LEVER=info
JWT_ACCESS_SECRET=""
JWT_REFRESH_SECRET=""
ACCESS_TOKEN_EXPIRY=1h
REFRESH_TOKEN_EXPIRY=1w
SECRET_EMAIL=""
````
## Rotas de Execução
Teste nodemon.json
````
npm run dev
````
Developer
````
npm run start
```` 

## EndPoints
## Login 
````
POST: http://localhost:3000/api/v1/auth/login
````
### Teste em JSON no insominia
````
{
	"email":"aires33matos54@gmail.com",
	"password": "123456789"
}
````
### Resultado
````
{
	"user": {
		"username": "user-pou6ifr4yi9",
		"email": "aires33matos54@gmail.com",
		"role": "user"
	},
	"accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2OTBiNWFjNGNlNzRlYWFiYWE4YmY2N2IiLCJpYXQiOjE3NjI1MTEzOTAsImV4cCI6MTc2MjUxNDk5MCwic3ViIjoiYWNjZXNzQXBpIn0.591PBK5tafdztMpa-L3VylxW4WC5UgsSzIRrCiQcbh8"
}
````

## Register
````
POST: http://localhost:3000/api/v1/auth/register
````
### Teste em JSON no insominia

role: "user" || "admin"

````
{
	"email":"airesmatos65@gmail.com",
	"password": "123456789",
	"firstName": "Aires",
	"lastName": "Matos",
	"role": "user"
}
````
### Resultado
````
{
	"user": {
		"username": "user-ynmlegxpl9",
		"email": "airesmatos65@gmail.com",
		"role": "user",
		"firstName": "Aires",
		"lastName": "Matos"
	},
	"accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2OTBiNzQwNWNlNzRlYWFiYWE4YmY2YWMiLCJpYXQiOjE3NjIzNTgyNzcsImV4cCI6MTc2MjM2MTg3Nywic3ViIjoiYWNjZXNzQXBpIn0.ik-5h6udo0L9u-CX7P6h627udpVc8qfZiyKyANmoVNE"
}
````
## Refresh
````
POST: http://localhost:3000/api/v1/auth/refresh-token
````
## Logout
````
POST: http://localhost:3000/api/v1/auth/logout
````
## Usuario
````
DELE: http://localhost:3000/api/v1/users/delete/:id
GET: http://localhost:3000/api/v1/users/
UPDATE: http://localhost:3000/api/v1/users/update/:id
````

## Accountable
````
POST: http://localhost:3000/api/v1/accountable/register

GET: http://localhost:3000/api/v1/accountable/accountable_id

PUT: http://localhost:3000/api/v1/accountable/accountable_id

DELETE: http://localhost:3000/api/v1/accountable/accountable_id
````
## Address
````
POST: http://localhost:3000/api/v1/address/register

PUT: http://localhost:3000/api/v1/address/:ID

GET: http://localhost:3000/api/v1/address/addresses

DEL: http://localhost:3000/api/v1/address/:address_id
````
## Client
````
POST: http://localhost:3000/api/v1/auth/register/client

PUT: http://localhost:3000/api/v1/client/update/:ID

DEL: http://localhost:3000/api/v1/client/delete/

GET: http://localhost:3000/api/v1/client/clients
````
## Contact
````
POST: http://localhost:3000/api/v1/contact/register

PUT: http://localhost:3000/api/v1/contact/contacts/ID

GET: http://localhost:3000/api/v1/contact/contacts

DEL: http://localhost:3000/api/v1/contact/contacts/ID
````
## License
````
POST: http://localhost:3000/api/v1/licenses/register

PUT: http://localhost:3000/api/v1/licenses/update/:ID

DEL: http://localhost:3000/api/v1/licenses/license_id

GET: http://localhost:3000/api/v1/licenses/licenses
````