# church-erp-web

Frontend administrativo editavel em `Next.js + TypeScript + shadcn/ui` para o ERP de igreja.

## Base do projeto

O codigo-fonte principal esta em `src/` e nao depende da pasta `.next` como origem.

### Estrutura principal

```text
src/
  app/
    (admin)/
      dashboard/
      usuarios/
      igrejas/
      membros/
      tesouraria/
    login/
  components/
    shared/
    ui/
  lib/
  modules/
    admin/
    auth/
    churches/
    dashboard/
    members/
    treasury/
    users/
public/
```

## Rotas atuais

- `/`
- `/login`
- `/master/login`
- `/master/dashboard`
- `/master/tenants`
- `/master/tenants/novo`
- `/master/tenants/[id]/editar`
- `/dashboard`
- `/usuarios`
- `/usuarios/novo`
- `/usuarios/[id]/editar`
- `/igrejas`
- `/igrejas/nova`
- `/igrejas/[id]/editar`
- `/membros`
- `/membros/novo`
- `/membros/[id]/editar`
- `/tesouraria`
- `/tesouraria/nova`
- `/tesouraria/[id]/editar`

## Configuracao da API

Use `NEXT_PUBLIC_API_URL` no arquivo `.env.local`.

Exemplo:

```bash
Copy-Item .env.example .env.local
```

Depois ajuste o valor conforme a URL real do backend:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

Se voce alterar `.env.local` com o `npm run dev` ja em execucao, reinicie o dev server para o Next.js recarregar a variavel corretamente.

## Fluxo de login

- Tenant: `/login` com `tenantCode`, `username` e `password`, consumindo `POST /api/auth/login`
- Master: `/master/login` com `username` e `password`, consumindo `POST /api/auth/master/login`

## Comandos

```bash
npm install
npm run dev
npm run lint
npm run build
```

## Observacoes

- `.next/` e `node_modules/` nao fazem parte do codigo-fonte.
- O projeto usa `src/lib/http.ts` como cliente HTTP centralizado.
- Os modulos ficam organizados em `src/modules` para facilitar a evolucao do ERP.
