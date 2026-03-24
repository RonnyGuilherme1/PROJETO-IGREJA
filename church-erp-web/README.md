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

O frontend usa o proxy do Next.js e encaminha `/api/:path*` para `http://127.0.0.1:3001/api/:path*`.

Nao e necessario criar nem editar `.env.local` para rodar localmente.

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
