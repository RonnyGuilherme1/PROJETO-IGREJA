# Deploy no Railway e uso local

Guia curto para este monorepo:

- `church-erp-web`
- `church-erp-api`

Referencias oficiais usadas:

- [Root Directory e monorepo](https://docs.railway.com/deployments/monorepo)
- [Build/Start commands](https://docs.railway.com/builds/build-configuration)
- [Volumes](https://docs.railway.com/volumes)
- [Variable references entre servicos](https://docs.railway.com/integrations/api/manage-variables)

## 1. Rodando localmente

### Banco local

Tenha um PostgreSQL local rodando e acessivel pela `DATABASE_URL` do backend.

### API local

1. Entre em `church-erp-api`
2. Instale dependencias:

```bash
npm install
```

3. Copie `.env.example` para `.env`

4. Ajuste no `.env` local:

```env
NODE_ENV=development
PORT=3001
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/church_erp?schema=public"
CORS_ORIGIN=http://localhost:3000
JWT_SECRET=change-this-secret
JWT_EXPIRES_IN=1d
UPLOAD_ROOT=
```

5. Rode as migrations locais:

```bash
npm run prisma:migrate
```

6. Suba a API:

```bash
npm run start:dev
```

### Web local

1. Entre em `church-erp-web`
2. Instale dependencias:

```bash
npm install
```

3. Para o fluxo local padrao, nao defina `NEXT_PUBLIC_API_URL`.
4. Suba o frontend:

```bash
npm run dev
```

### Como o local funciona hoje

- O frontend usa `/api` por padrao.
- Em desenvolvimento, o Next faz rewrite de `/api/:path*` para `http://127.0.0.1:3001/api/:path*`.
- A API continua servindo arquivos em `/api/uploads`.

## 2. Servicos no Railway

Crie 3 servicos no mesmo projeto:

1. `web`
2. `api`
3. `postgres`

### Root Directory por servico

- `web`: `church-erp-web`
- `api`: `church-erp-api`
- `postgres`: nao se aplica, use o template PostgreSQL do Railway

## 3. Configuracao do servico `postgres`

Use o PostgreSQL gerenciado do Railway.

- Nao precisa configurar root directory.
- Nao precisa configurar build command.
- Nao precisa configurar start command.
- O Railway disponibiliza `DATABASE_URL` e outras variaveis do Postgres para os outros servicos.

## 4. Configuracao do servico `api`

### Build e start

- Build Command:

```bash
npm run prisma:generate && npm run build
```

- Start Command:

```bash
npm run start:railway
```

### Variaveis do servico `api`

Configure:

```env
NODE_ENV=production
DATABASE_URL=${{Postgres.DATABASE_URL}}
CORS_ORIGIN=https://SEU-DOMINIO-DO-WEB
JWT_SECRET=um-segredo-forte-e-longo
JWT_EXPIRES_IN=1d
UPLOAD_ROOT=/app/uploads
```

Observacoes:

- Ajuste `Postgres` no `DATABASE_URL=${{Postgres.DATABASE_URL}}` para o nome real do seu servico de banco no Railway, se ele tiver outro nome.
- Nao precisa definir `PORT` manualmente no Railway se estiver usando a porta fornecida pela plataforma. A API ja le `process.env.PORT`.

### Volume da API

Crie um Volume ligado ao servico `api` com mount path:

```text
/app/uploads
```

Depois mantenha no servico `api`:

```env
UPLOAD_ROOT=/app/uploads
```

Isso preserva uploads de logos entre redeploys. O app continua expondo os arquivos em `/api/uploads`.

## 5. Configuracao do servico `web`

### Build e start

- Build Command:

```bash
npm run build
```

- Start Command:

```bash
npm run start
```

### Variaveis do servico `web`

Configure:

```env
NEXT_PUBLIC_API_URL=https://SEU-DOMINIO-DA-API/api
```

Observacao:

- Em producao, o frontend nao usa rewrite para localhost. Ele chama diretamente a URL publica da API via `NEXT_PUBLIC_API_URL`.

## 6. Prisma em producao

O fluxo de producao da API deve ser este:

1. Build da API:

```bash
npm run prisma:generate && npm run build
```

2. Start da API:

```bash
npm run start:railway
```

3. O script `start:railway` roda:

```bash
npm run prisma:migrate:deploy && npm run start:prod
```

Regra pratica:

- Local: `npm run prisma:migrate`
- Producao: `npm run prisma:migrate:deploy`

## 7. Validacao depois do deploy

### API

Abra:

```text
https://SEU-DOMINIO-DA-API/api/health
```

Se estiver certo, a API deve responder com sucesso.

### Web

Abra o dominio publico do frontend e valide:

1. a aplicacao carrega
2. a tela inicial abre sem erro de runtime
3. o login consegue falar com a API

### Uploads

Depois de subir a API com Volume:

1. faca upload de uma logo
2. confirme que a imagem abre pela URL `/api/uploads/...`
3. redeploy a API
4. confirme que a logo continua acessivel

## 8. Resumo rapido

### Local

- API: `npm run prisma:migrate` e `npm run start:dev`
- Web: `npm run dev`
- Frontend local: sem `NEXT_PUBLIC_API_URL`

### Railway

- `web`
  - Root Directory: `church-erp-web`
  - Build: `npm run build`
  - Start: `npm run start`
  - Variavel: `NEXT_PUBLIC_API_URL=https://SEU-DOMINIO-DA-API/api`

- `api`
  - Root Directory: `church-erp-api`
  - Build: `npm run prisma:generate && npm run build`
  - Start: `npm run start:railway`
  - Variaveis: `NODE_ENV`, `DATABASE_URL`, `CORS_ORIGIN`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `UPLOAD_ROOT`
  - Volume: `/app/uploads`

- `postgres`
  - Servico gerenciado do Railway
  - Sem root directory
  - Sem build/start manual
