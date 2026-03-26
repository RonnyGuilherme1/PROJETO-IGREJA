# Deploy no Railway e uso local

Guia curto para rodar o monorepo localmente e publicar no Railway sem alterar a estrutura atual do projeto.

## Estrutura do monorepo

- `church-erp-web`: frontend Next.js
- `church-erp-api`: backend NestJS + Prisma

## 1. Como rodar localmente

### API local

1. Entre em `church-erp-api`.
2. Instale dependencias:

```bash
npm install
```

3. Crie o arquivo `.env` a partir de `.env.example`.
4. Garanta que o PostgreSQL local esteja rodando.
5. Gere o client do Prisma:

```bash
npm run prisma:generate
```

6. Aplique o schema no banco local.

Fluxo atual do projeto:

```bash
npm run prisma:push
```

Se o time passar a versionar migrations locais:

```bash
npm run prisma:migrate
```

7. Suba a API:

```bash
npm run start:dev
```

API local esperada: `http://localhost:3001/api`

Health check local: `http://localhost:3001/api/health`

### Web local

1. Entre em `church-erp-web`.
2. Instale dependencias:

```bash
npm install
```

3. Para manter o fluxo local atual, nao defina `NEXT_PUBLIC_API_URL`.
4. Suba o frontend:

```bash
npm run dev
```

Web local esperada: `http://localhost:3000`

Login comum local: `http://localhost:3000/login`

Login master local: `http://localhost:3000/master/login`

## 2. Variaveis locais

### API local (`church-erp-api/.env`)

Minimo recomendado:

```env
NODE_ENV=development
PORT=3001
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/church_erp?schema=public"
CORS_ORIGIN=http://localhost:3000
JWT_SECRET=change-this-secret
JWT_EXPIRES_IN=1d
UPLOAD_ROOT=
```

Notas:

- Se `UPLOAD_ROOT` ficar vazio, o backend usa o fallback local atual: `<projeto>/church-erp-api/uploads`
- `CORS_ORIGIN` pode conter mais de uma origem separada por virgula

### Web local (`church-erp-web/.env.local`)

Para o fluxo local atual, pode ficar sem variaveis.

Opcional:

```env
# Deixe vazio ou nao defina para usar o proxy local /api do Next.js.
# Se quiser apontar direto para uma API externa:
NEXT_PUBLIC_API_URL=
```

## 3. Como configurar os 3 servicos no Railway

Crie um projeto no Railway com:

1. Um servico `postgres`
2. Um servico `api`
3. Um servico `web`

### Servico `postgres`

- Tipo: PostgreSQL do proprio Railway
- Root directory: nao se aplica
- Build command: nao se aplica
- Start command: nao se aplica

### Servico `api`

- Codigo fonte: este mesmo repositorio
- Root directory: `church-erp-api`
- Build command: `npm run build`
- Start command: `npm run start:railway`

### Servico `web`

- Codigo fonte: este mesmo repositorio
- Root directory: `church-erp-web`
- Build command: `npm run build`
- Start command: `npm run start -- --hostname 0.0.0.0 --port $PORT`

## 4. Variaveis por servico no Railway

### `postgres`

- Nenhuma variavel manual obrigatoria
- Use a `DATABASE_URL` fornecida pelo proprio Railway

### `api`

Defina:

```env
NODE_ENV=production
DATABASE_URL=<DATABASE_URL do servico postgres>
CORS_ORIGIN=https://<dominio-publico-do-web>
JWT_SECRET=<segredo-forte>
JWT_EXPIRES_IN=1d
UPLOAD_ROOT=/data/uploads
```

Notas:

- `PORT` existe no `.env.example`, mas no Railway ele normalmente e injetado automaticamente pelo ambiente
- `CORS_ORIGIN` deve ser o dominio publico do servico `web`

### `web`

Defina:

```env
NEXT_PUBLIC_API_URL=https://<dominio-publico-da-api>/api
```

Nota:

- Em producao o frontend passa a falar direto com essa URL

## 5. Volume da API

Para persistir logos no Railway sem migrar para S3:

1. Anexe um Volume ao servico `api`
2. Monte o Volume em `/data/uploads`
3. Defina `UPLOAD_ROOT=/data/uploads`

Resultado:

- arquivos gravados no disco persistente do Railway
- URL publica continua igual: `/api/uploads/...`

## 6. Prisma em producao

O start recomendado da API ja executa:

```bash
npm run prisma:migrate:deploy
```

e depois sobe a aplicacao com:

```bash
npm run start:prod
```

Ou seja, no Railway basta usar:

```bash
npm run start:railway
```

### Observacao importante sobre o estado atual do repositorio

Hoje o repositorio ainda nao tem a pasta `church-erp-api/prisma/migrations`.

Isso significa que:

- `prisma migrate deploy` so aplica migrations que ja estejam versionadas no repositorio
- antes do primeiro deploy de producao com migrations, e preciso gerar e commitar a migration inicial localmente

Exemplo de comando local para iniciar esse fluxo:

```bash
npm run prisma:migrate -- --name init
```

Depois disso:

1. commit a pasta `prisma/migrations`
2. publique novamente
3. deixe o Railway executar `npm run start:railway`

## 7. Validacao apos subir

Checklist rapido:

1. O servico `postgres` deve estar `healthy`
2. O servico `api` deve concluir o build e iniciar sem erro de `DATABASE_URL`, `JWT_SECRET` ou `CORS_ORIGIN`
3. Abra `https://<dominio-da-api>/api/health`
4. Abra `https://<dominio-do-web>/login`
5. Abra `https://<dominio-do-web>/master/login`
6. Faca login e verifique se o frontend consegue carregar dados da API
7. Teste upload de logo e confirme que o arquivo continua acessivel apos reinicio do servico

## 8. Resumo rapido

### Root directory por servico

- `web`: `church-erp-web`
- `api`: `church-erp-api`
- `postgres`: nao se aplica

### Build/start recomendados

- `web` build: `npm run build`
- `web` start: `npm run start -- --hostname 0.0.0.0 --port $PORT`
- `api` build: `npm run build`
- `api` start: `npm run start:railway`

### URLs finais esperadas

- web: `https://<dominio-do-web>`
- api health: `https://<dominio-da-api>/api/health`
- login comum: `https://<dominio-do-web>/login`
- login master: `https://<dominio-do-web>/master/login`

## Referencias oficiais do Railway

- Monorepo: https://docs.railway.com/guides/monorepo
- Build/start commands: https://docs.railway.com/reference/build-and-start-commands
- Volumes: https://docs.railway.com/guides/volumes
