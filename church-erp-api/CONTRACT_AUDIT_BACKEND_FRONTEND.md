# Auditoria Tecnica: Contrato Backend -> Frontend

Data da auditoria: 2026-03-24

## Escopo e criterio

- Fonte de verdade: backend atual em `church-erp-api/src/modules` + `prisma/schema.prisma`.
- Prefixo global real do backend: `/api` (definido em `src/main.ts`).
- O backend usa `ValidationPipe` global com `whitelist`, `forbidNonWhitelisted` e `transform`.
- Quando ha conflito entre frontend e backend, o backend vence.
- Inferencia explicitamente marcada: os controllers sem prefixo `tenant/*` e o agregado `finance/*` parecem ser o contrato-alvo; os controllers `tenant/*` repetem os mesmos services e adicionam aliases legados, inclusive `PUT` em updates.

## 1. Inventario do backend atual

| Modulo | Rotas reais do backend | Autenticacao / autorizacao real | Observacoes |
| --- | --- | --- | --- |
| Health | `GET /api/health` | Publico | Healthcheck com DB ping. |
| Auth | `POST /api/auth/login`, `POST /api/auth/master/login`, `GET /api/auth/me` | Login publico; `me` com JWT | `login` usa `tenantCode + username + password`; `master/login` usa `username + password`. |
| Master tenants | `GET /api/master/tenants`, `GET /api/master/tenants/:id`, `POST /api/master/tenants`, `PATCH /api/master/tenants/:id`, `PATCH /api/master/tenants/:id/inactivate`, `PATCH /api/master/tenants/:id/activate` | `JwtAuthGuard + PlatformMasterGuard` | So usuario com `platformRole=PLATFORM_ADMIN` e `tenantId=null`. |
| Tenant branding | `GET /api/tenant/branding`, `PATCH /api/tenant/branding`, `POST /api/tenant/branding/logo` | `JwtAuthGuard` + check de service | Service exige `role=ADMIN` e `tenantId` presente. |
| Users | Canonico: `GET/POST /api/users`, `GET/PATCH /api/users/:id`, `PATCH /api/users/:id/inactivate` | `JwtAuthGuard` + service | Service exige `role=ADMIN` e `tenantId`. Alias atual: `GET/POST/PUT/PATCH /api/tenant/users`, `PATCH /api/tenant/users/:id/inactivate`. |
| Churches | Canonico: `GET/POST /api/churches`, `GET/PATCH /api/churches/:id`, `PATCH /api/churches/:id/inactivate` | `JwtAuthGuard` + service | View: qualquer usuario autenticado do tenant. Manage: `ADMIN` ou `SECRETARIA`. Alias atual: `GET/POST/PUT/PATCH /api/tenant/churches`, `PATCH /api/tenant/churches/:id/inactivate`. |
| Members | Canonico: `GET/POST /api/members`, `GET/PATCH /api/members/:id`, `PATCH /api/members/:id/inactivate` | `JwtAuthGuard` + service | View: qualquer usuario autenticado do tenant. Manage: `ADMIN` ou `SECRETARIA`. Alias atual: `GET/POST/PUT/PATCH /api/tenant/members`, `PATCH /api/tenant/members/:id/inactivate`. |
| Finance | Canonico: `GET/POST /api/finance/categories`, `GET/POST /api/finance/transactions`, `GET/PATCH /api/finance/transactions/:id`, `PATCH /api/finance/transactions/:id/cancel` | `JwtAuthGuard` + service | View: qualquer usuario autenticado do tenant. Manage: `ADMIN` ou `TESOUREIRO`. Alias atual: `GET/POST /api/tenant/financial-categories`, `GET/POST/PUT/PATCH /api/tenant/financial-transactions`, `PATCH /api/tenant/financial-transactions/:id/cancel`. |
| Dashboard | `GET /api/dashboard/cards`, `GET /api/dashboard/finance-by-month`, `GET /api/dashboard/members-by-month` | `JwtAuthGuard` + tenant user | Nao ha restricao adicional de role. |

## 2. DTOs e contratos reais do backend

### Auth

- `POST /api/auth/login`
  - Body real: `LoginDto { tenantCode, username, password }`
  - Response real: `LoginResponseDto { accessToken, user: AuthUserDto }`
- `POST /api/auth/master/login`
  - Body real: `MasterLoginDto { username, password }`
  - Response real: `LoginResponseDto { accessToken, user: AuthUserDto }`
- `GET /api/auth/me`
  - Response real: `AuthUserDto { id, name, username, email, role, status, tenantId, platformRole, accessType, churchId, createdAt, updatedAt, tenantCode, tenantName, tenantLogoUrl, tenantThemeKey, tenant? }`

### Master tenants

- `GET /api/master/tenants`
  - Query real: nenhum
  - Response real: `TenantResponseDto[]`
- `GET /api/master/tenants/:id`
  - Query real: nenhum
  - Response real: `TenantResponseDto`
- `POST /api/master/tenants`
  - Body real: `CreateTenantDto { name, code?, status?, logoUrl?, themeKey?, adminUser?: { name, username, email?, password } }`
  - Observacao real do service: `code` e ignorado na criacao; o codigo e sempre gerado automaticamente.
  - Response real: `TenantResponseDto`
- `PATCH /api/master/tenants/:id`
  - Body real: `UpdateTenantDto { name?, code?, status?, logoUrl?, themeKey? }`
  - Response real: `TenantResponseDto`
- `PATCH /api/master/tenants/:id/inactivate`
  - Body real: nenhum
  - Response real: `TenantResponseDto`
- `PATCH /api/master/tenants/:id/activate`
  - Body real: nenhum
  - Response real: `TenantResponseDto`

### Tenant branding

- `GET /api/tenant/branding`
  - Query real: nenhum
  - Response real: `TenantResponseDto`
- `PATCH /api/tenant/branding`
  - Body real: `UpdateTenantBrandingDto { logoUrl?, themeKey? }`
  - Response real: `TenantResponseDto`
- `POST /api/tenant/branding/logo`
  - Body real: `multipart/form-data` com campo `logo`
  - Response real: `{ logoUrl: string }`

### Users

- `GET /api/users` ou `GET /api/tenant/users`
  - Query real: nenhum
  - Response real: `UserResponseDto[]`
- `GET /api/users/:id` ou `GET /api/tenant/users/:id`
  - Response real: `UserResponseDto`
- `POST /api/users` ou `POST /api/tenant/users`
  - Body real: `CreateUserDto { name, username?, email, password, role, status?, churchId? }`
  - Response real: `UserResponseDto`
- `PATCH /api/users/:id` ou `PATCH /api/tenant/users/:id`
  - Body real: `UpdateUserDto { name?, username?, email?, password?, role?, status?, churchId? }`
  - Response real: `UserResponseDto`
- `PUT /api/tenant/users/:id`
  - Alias legado de update
- `PATCH /api/users/:id/inactivate` ou `PATCH /api/tenant/users/:id/inactivate`
  - Body real: nenhum
  - Response real: `UserResponseDto`

### Churches

- `GET /api/churches` ou `GET /api/tenant/churches`
  - Query real: nenhum
  - Response real: `ChurchResponseDto[]`
- `GET /api/churches/:id` ou `GET /api/tenant/churches/:id`
  - Response real: `ChurchResponseDto`
- `POST /api/churches` ou `POST /api/tenant/churches`
  - Body real: `CreateChurchDto { name, cnpj?, phone?, email?, address?, pastorName?, status?, notes? }`
  - Response real: `ChurchResponseDto`
- `PATCH /api/churches/:id` ou `PATCH /api/tenant/churches/:id`
  - Body real: `UpdateChurchDto { name?, cnpj?, phone?, email?, address?, pastorName?, status?, notes? }`
  - Response real: `ChurchResponseDto`
- `PUT /api/tenant/churches/:id`
  - Alias legado de update
- `PATCH /api/churches/:id/inactivate` ou `PATCH /api/tenant/churches/:id/inactivate`
  - Body real: nenhum
  - Response real: `ChurchResponseDto`

### Members

- `GET /api/members` ou `GET /api/tenant/members`
  - Query real: `FindMembersQueryDto { page?, limit?, size?, perPage?, name?, status?, churchId? }`
  - Response real: `MembersListResponseDto { items, total, page, limit, totalPages }`
- `GET /api/members/:id` ou `GET /api/tenant/members/:id`
  - Response real: `MemberResponseDto`
- `POST /api/members` ou `POST /api/tenant/members`
  - Body real: `CreateMemberDto { fullName, birthDate?, gender?, phone?, email?, address?, maritalStatus?, joinedAt?, status?, notes?, churchId }`
  - Response real: `MemberResponseDto`
- `PATCH /api/members/:id` ou `PATCH /api/tenant/members/:id`
  - Body real: `UpdateMemberDto { fullName?, birthDate?, gender?, phone?, email?, address?, maritalStatus?, joinedAt?, status?, notes?, churchId? }`
  - Response real: `MemberResponseDto`
- `PUT /api/tenant/members/:id`
  - Alias legado de update
- `PATCH /api/members/:id/inactivate` ou `PATCH /api/tenant/members/:id/inactivate`
  - Body real: nenhum
  - Response real: `MemberResponseDto`

### Finance

- `GET /api/finance/categories` ou `GET /api/tenant/financial-categories`
  - Query real: nenhum
  - Response real: `FinanceCategoryResponseDto[]`
- `POST /api/finance/categories` ou `POST /api/tenant/financial-categories`
  - Body real: `CreateFinanceCategoryDto { name, type, active? }`
  - Response real: `FinanceCategoryResponseDto`
- `GET /api/finance/transactions` ou `GET /api/tenant/financial-transactions`
  - Query real: `FindFinanceTransactionsQueryDto { page?, size?, limit?, perPage?, startDate?, endDate?, type?, categoryId?, churchId? }`
  - Response real: `FinanceTransactionResponseDto[]`
  - Observacao real do service: `page/size/limit/perPage` sao aceitos pelo DTO, mas nao sao usados na query; nao ha paginacao real.
- `GET /api/finance/transactions/:id` ou `GET /api/tenant/financial-transactions/:id`
  - Response real: `FinanceTransactionResponseDto`
- `POST /api/finance/transactions` ou `POST /api/tenant/financial-transactions`
  - Body real: `CreateFinanceTransactionDto { churchId, categoryId, type, description, amount, transactionDate, notes? }`
  - Response real: `FinanceTransactionResponseDto`
- `PATCH /api/finance/transactions/:id` ou `PATCH /api/tenant/financial-transactions/:id`
  - Body real: `UpdateFinanceTransactionDto { churchId?, categoryId?, type?, description?, amount?, transactionDate?, notes?, status? }`
  - Response real: `FinanceTransactionResponseDto`
- `PUT /api/tenant/financial-transactions/:id`
  - Alias legado de update
- `PATCH /api/finance/transactions/:id/cancel` ou `PATCH /api/tenant/financial-transactions/:id/cancel`
  - Body real: nenhum
  - Response real: `FinanceTransactionResponseDto`

### Dashboard

- `GET /api/dashboard/cards`
  - Query real: nenhum
  - Response real: `DashboardCardsDto { totalMembers, totalChurches, totalMonthEntries, totalMonthExpenses, monthBalance, totalActiveUsers }`
  - Regras reais: conta somente membros ativos, igrejas ativas, usuarios ativos e movimentacoes `ACTIVE` do mes atual.
- `GET /api/dashboard/finance-by-month`
  - Query real: nenhum
  - Response real: `DashboardFinanceByMonthDto[] { month, entries, expenses, balance }`
  - Regras reais: ano corrente ate o mes atual; somente movimentacoes `ACTIVE`.
- `GET /api/dashboard/members-by-month`
  - Query real: nenhum
  - Response real: `DashboardMembersByMonthDto[] { month, totalMembers }`
  - Regras reais: usa `createdAt`, nao `joinedAt`.

## 3. Inventario do frontend atual

### Paginas

- `/` -> redirect para `/login`
- `/login`
- `/master/login`
- `/dashboard`
- `/igrejas`
- `/igrejas/nova`
- `/igrejas/[id]/editar`
- `/membros`
- `/membros/novo`
- `/membros/[id]/editar`
- `/tesouraria`
- `/tesouraria/nova`
- `/tesouraria/[id]/editar`
- `/usuarios`
- `/usuarios/novo`
- `/usuarios/[id]/editar`
- `/banco`
- `/master/dashboard`
- `/master/tenants`
- `/master/tenants/novo`
- `/master/tenants/[id]/editar`

### Services / use-cases HTTP

- `src/modules/auth/services/auth-service.ts`
- `src/modules/admin/services/tenant-branding-service.ts`
- `src/modules/master/services/master-tenants-service.ts`
- `src/modules/churches/services/churches-service.ts`
- `src/modules/users/services/users-service.ts`
- `src/modules/members/services/members-service.ts`
- `src/modules/treasury/services/treasury-service.ts`
- `src/modules/dashboard/services/dashboard-service.ts`

### Observacoes arquiteturais do frontend

- Todo trafego passa por `src/lib/http.ts` (`axios.create({ baseURL: "/api" })`).
- O proxy do Next reescreve `/api/:path*` para `http://127.0.0.1:3001/api/:path*` em `next.config.ts`.
- Nao ha `react-query`, `useQuery`, `useMutation` ou hooks dedicados; o acesso a API esta concentrado nos services acima.
- Ha varias camadas de compatibilidade/legado:
  - arrays de endpoints alternativos/fallback;
  - `normalize*`, `extractList`, `extractSingleRecord`, `findFirstValue`;
  - traducao de nomes de campos (`nome`, `perfil`, `igreja`, etc.);
  - fallback silencioso para sessao no branding;
  - dashboard calculado no cliente a partir de endpoints genericos, ignorando o modulo oficial `/dashboard/*`.

## 4. Matriz de contrato backend -> frontend

### Auth

| Modulo | Arquivo frontend | Endpoint usado hoje no frontend | Metodo usado hoje | Endpoint real do backend | Metodo real do backend | Query params esperados | Body esperado | Shape de resposta esperado | Status | Acao necessaria |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Auth | `church-erp-web/src/modules/auth/services/auth-service.ts` | `/auth/login` -> fallback `/auth/tenant/login`, `/tenant/auth/login` | `POST` | `/api/auth/login` | `POST` | nenhum | `LoginDto { tenantCode, username, password }` | `LoginResponseDto` | LEGADO | Remover fallbacks mortos; manter apenas `/auth/login`; simplificar `auth-session.ts` para o shape real do backend. |
| Auth | `church-erp-web/src/modules/auth/services/auth-service.ts` | `/auth/master/login` -> fallback `/master/auth/login`, `/platform/auth/login`, `/auth/platform/login` | `POST` | `/api/auth/master/login` | `POST` | nenhum | `MasterLoginDto { username, password }` | `LoginResponseDto` | LEGADO | Remover fallbacks mortos; manter apenas `/auth/master/login`. |

### Tenant branding

| Modulo | Arquivo frontend | Endpoint usado hoje no frontend | Metodo usado hoje | Endpoint real do backend | Metodo real do backend | Query params esperados | Body esperado | Shape de resposta esperado | Status | Acao necessaria |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Tenant branding | `church-erp-web/src/modules/admin/services/tenant-branding-service.ts` | `/tenant/branding` | `GET` | `/api/tenant/branding` | `GET` | nenhum | nenhum | `TenantResponseDto` | OK | No service esta alinhado; no componente `tenant-branding-page.tsx`, remover fallback silencioso para dados de sessao quando o GET falhar. |
| Tenant branding | `church-erp-web/src/modules/admin/services/tenant-branding-service.ts` | `/tenant/branding` | `PATCH` | `/api/tenant/branding` | `PATCH` | nenhum | `UpdateTenantBrandingDto { logoUrl?, themeKey? }` | `TenantResponseDto` | OK | Manter; apenas tipar o retorno pelo shape real e remover normalizacao desnecessaria. |
| Tenant branding | `church-erp-web/src/modules/admin/services/tenant-branding-service.ts` | `/tenant/branding/logo` | `POST multipart/form-data` | `/api/tenant/branding/logo` | `POST multipart/form-data` | nenhum | campo `logo` | `{ logoUrl }` | OK | Manter; somente remover caminhos alternativos de sessao no componente. |

### Master tenants

| Modulo | Arquivo frontend | Endpoint usado hoje no frontend | Metodo usado hoje | Endpoint real do backend | Metodo real do backend | Query params esperados | Body esperado | Shape de resposta esperado | Status | Acao necessaria |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Master tenants | `church-erp-web/src/modules/master/services/master-tenants-service.ts` | `/master/tenants` -> fallback `/platform/tenants`, `/tenants` | `GET` | `/api/master/tenants` | `GET` | nenhum | nenhum | `TenantResponseDto[]` | DESALINHADO | Remover fallbacks; parar de enviar `page/size/limit/perPage/name/status`; ajustar types/UI para nao esperar `adminName/adminUsername/adminEmail`, que o backend nao retorna. |
| Master tenants | `church-erp-web/src/modules/master/services/master-tenants-service.ts` | `/master/tenants/:id` -> fallback `/platform/tenants/:id`, `/tenants/:id` | `GET` | `/api/master/tenants/:id` | `GET` | nenhum | nenhum | `TenantResponseDto` | DESALINHADO | Remover fallbacks e retirar `admin*` do modelo `MasterTenantItem`; o backend nao devolve esses campos. |
| Master tenants | `church-erp-web/src/modules/master/services/master-tenants-service.ts` | `/master/tenants` -> fallback `/platform/tenants`, `/tenants` | `POST` | `/api/master/tenants` | `POST` | nenhum | `CreateTenantDto { name, status?, logoUrl?, themeKey?, adminUser? }` | `TenantResponseDto` | LEGADO | Manter apenas `/master/tenants`; payload esta alinhado. |
| Master tenants | `church-erp-web/src/modules/master/services/master-tenants-service.ts` | `PATCH /master/tenants/:id` com fallback `PUT /master/tenants/:id` | `PATCH` -> fallback `PUT` | `/api/master/tenants/:id` | `PATCH` | nenhum | `UpdateTenantDto { name?, code?, status?, logoUrl?, themeKey? }` | `TenantResponseDto` | LEGADO | Remover fallback `PUT`; manter somente `PATCH /master/tenants/:id`. |
| Master tenants | `church-erp-web/src/modules/master/services/master-tenants-service.ts` | `PATCH /master/tenants/:id/activate` -> fallback `PATCH /:id/status`, `PATCH /:id` | `PATCH` | `/api/master/tenants/:id/activate` | `PATCH` | nenhum | nenhum | `TenantResponseDto` | LEGADO | Manter apenas `/activate`; remover `/status` e fallback generico. |
| Master tenants | `church-erp-web/src/modules/master/services/master-tenants-service.ts` | `PATCH /master/tenants/:id/inactivate` -> fallback `PATCH /:id/status`, `PATCH /:id` | `PATCH` | `/api/master/tenants/:id/inactivate` | `PATCH` | nenhum | nenhum | `TenantResponseDto` | LEGADO | Manter apenas `/inactivate`; remover `/status` e fallback generico. |

### Users

| Modulo | Arquivo frontend | Endpoint usado hoje no frontend | Metodo usado hoje | Endpoint real do backend | Metodo real do backend | Query params esperados | Body esperado | Shape de resposta esperado | Status | Acao necessaria |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Users | `church-erp-web/src/modules/users/services/users-service.ts` | `/tenant/users` -> fallback `/users`, `/tenant/usuarios`, `/usuarios` | `GET` | Canonico: `/api/users` (alias atual: `/api/tenant/users`) | `GET` | nenhum | nenhum | `UserResponseDto[]` | DESALINHADO | Remover filtros server-side (`name/email/status/role`) ou mover para filtro local; remover endpoints fantasmas; incluir `username` no modelo real do frontend. |
| Users | `church-erp-web/src/modules/users/services/users-service.ts` | `/tenant/users/:id` -> fallback `/users/:id`, aliases PT-BR | `GET` | Canonico: `/api/users/:id` (alias atual: `/api/tenant/users/:id`) | `GET` | nenhum | nenhum | `UserResponseDto` | DESALINHADO | Parar de descartar `username`; alinhar `UserItem` ao DTO real. |
| Users | `church-erp-web/src/modules/users/services/users-service.ts` | `/tenant/users` -> fallback `/users`, aliases PT-BR | `POST` | Canonico: `/api/users` (alias atual: `/api/tenant/users`) | `POST` | nenhum | `CreateUserDto { name, username?, email, password, role, status?, churchId? }` | `UserResponseDto` | DESALINHADO | Adicionar campo `username` no form e no payload; hoje o frontend cria usuarios sem `username`, mas o login do backend e username-only. |
| Users | `church-erp-web/src/modules/users/services/users-service.ts` | `PUT /tenant/users/:id` | `PUT` | Canonico: `/api/users/:id` (alias atual: `/api/tenant/users/:id`) | `PATCH` (alias legado `PUT` so em `/tenant/users/:id`) | nenhum | `UpdateUserDto { name?, username?, email?, password?, role?, status?, churchId? }` | `UserResponseDto` | DESALINHADO | Migrar para `PATCH /users/:id`; incluir `username` no form; remover dependencia do alias `PUT`. |
| Users | `church-erp-web/src/modules/users/services/users-service.ts` | `PATCH /tenant/users/:id/inactivate` -> fallback `PATCH /:id/status`, `PATCH /:id` | `PATCH` | Canonico: `/api/users/:id/inactivate` (alias atual: `/api/tenant/users/:id/inactivate`) | `PATCH` | nenhum | nenhum | `UserResponseDto` | LEGADO | Manter apenas `/inactivate`; remover `/status` e fallback generico. |

### Churches

| Modulo | Arquivo frontend | Endpoint usado hoje no frontend | Metodo usado hoje | Endpoint real do backend | Metodo real do backend | Query params esperados | Body esperado | Shape de resposta esperado | Status | Acao necessaria |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Churches | `church-erp-web/src/modules/churches/services/churches-service.ts` | `/tenant/churches` -> fallback `/churches`, `/tenant/igrejas`, `/igrejas` | `GET` | Canonico: `/api/churches` (alias atual: `/api/tenant/churches`) | `GET` | nenhum | nenhum | `ChurchResponseDto[]` | DESALINHADO | Os filtros `name/status` enviados pelo frontend nao existem no backend; mover filtro para o cliente ou remover a UI; remover endpoints fantasmas. |
| Churches | `church-erp-web/src/modules/churches/services/churches-service.ts` | `/tenant/churches/:id` -> fallback `/churches/:id`, aliases PT-BR | `GET` | Canonico: `/api/churches/:id` (alias atual: `/api/tenant/churches/:id`) | `GET` | nenhum | nenhum | `ChurchResponseDto` | LEGADO | Manter apenas endpoint canonico/alinhado e remover aliases fantasmas. |
| Churches | `church-erp-web/src/modules/churches/services/churches-service.ts` | `/tenant/churches` -> fallback `/churches`, aliases PT-BR | `POST` | Canonico: `/api/churches` (alias atual: `/api/tenant/churches`) | `POST` | nenhum | `CreateChurchDto { name, cnpj?, phone?, email?, address?, pastorName?, status?, notes? }` | `ChurchResponseDto` | LEGADO | Manter apenas endpoint canonico/alinhado e remover fallbacks fantasmas. |
| Churches | `church-erp-web/src/modules/churches/services/churches-service.ts` | `PUT /tenant/churches/:id` | `PUT` | Canonico: `/api/churches/:id` (alias atual: `/api/tenant/churches/:id`) | `PATCH` (alias legado `PUT` so em `/tenant/churches/:id`) | nenhum | `UpdateChurchDto { name?, cnpj?, phone?, email?, address?, pastorName?, status?, notes? }` | `ChurchResponseDto` | LEGADO | Migrar para `PATCH /churches/:id`; remover dependencia do alias `PUT`. |

### Members

| Modulo | Arquivo frontend | Endpoint usado hoje no frontend | Metodo usado hoje | Endpoint real do backend | Metodo real do backend | Query params esperados | Body esperado | Shape de resposta esperado | Status | Acao necessaria |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Members | `church-erp-web/src/modules/members/services/members-service.ts` | `/tenant/members` -> fallback `/members`, `/tenant/membros`, `/membros` | `GET` | Canonico: `/api/members` (alias atual: `/api/tenant/members`) | `GET` | `FindMembersQueryDto { page?, limit?, size?, perPage?, name?, status?, churchId? }` | nenhum | `MembersListResponseDto` | DESALINHADO | A query esta perto do contrato, mas o frontend espera `churchName` na resposta e o backend nao devolve; mapear `churchId -> church.name` usando a lista de igrejas ja carregada. |
| Members | `church-erp-web/src/modules/members/services/members-service.ts` | `/tenant/members/:id` -> fallback `/members/:id`, aliases PT-BR | `GET` | Canonico: `/api/members/:id` (alias atual: `/api/tenant/members/:id`) | `GET` | nenhum | nenhum | `MemberResponseDto` | DESALINHADO | Parar de modelar `churchName` como campo da API; usar somente os campos reais. |
| Members | `church-erp-web/src/modules/members/services/members-service.ts` | `/tenant/members` -> fallback `/members`, aliases PT-BR | `POST` | Canonico: `/api/members` (alias atual: `/api/tenant/members`) | `POST` | nenhum | `CreateMemberDto { fullName, birthDate?, gender?, phone?, email?, address?, maritalStatus?, joinedAt?, status?, notes?, churchId }` | `MemberResponseDto` | LEGADO | Remover fallbacks fantasmas; payload esta alinhado. |
| Members | `church-erp-web/src/modules/members/services/members-service.ts` | `PUT /tenant/members/:id` | `PUT` | Canonico: `/api/members/:id` (alias atual: `/api/tenant/members/:id`) | `PATCH` (alias legado `PUT` so em `/tenant/members/:id`) | nenhum | `UpdateMemberDto { fullName?, birthDate?, gender?, phone?, email?, address?, maritalStatus?, joinedAt?, status?, notes?, churchId? }` | `MemberResponseDto` | LEGADO | Migrar para `PATCH /members/:id`; remover dependencia do alias `PUT`. |
| Members | `church-erp-web/src/modules/members/services/members-service.ts` | `PATCH /tenant/members/:id/inactivate` -> fallback `PATCH /:id/status`, `PATCH /:id` | `PATCH` | Canonico: `/api/members/:id/inactivate` (alias atual: `/api/tenant/members/:id/inactivate`) | `PATCH` | nenhum | nenhum | `MemberResponseDto` | LEGADO | Manter apenas `/inactivate`; remover `/status` e fallback generico. |

### Treasury / finance

| Modulo | Arquivo frontend | Endpoint usado hoje no frontend | Metodo usado hoje | Endpoint real do backend | Metodo real do backend | Query params esperados | Body esperado | Shape de resposta esperado | Status | Acao necessaria |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Treasury | `church-erp-web/src/modules/treasury/services/treasury-service.ts` | `/tenant/financial-transactions` -> varios fallbacks fantasmas (`/tenant/treasury/movements`, `/financial-transactions`, etc.) | `GET` | Canonico: `/api/finance/transactions` (alias atual: `/api/tenant/financial-transactions`) | `GET` | `FindFinanceTransactionsQueryDto { startDate?, endDate?, type?, categoryId?, churchId?, page?, size?, limit?, perPage? }` | nenhum | `FinanceTransactionResponseDto[]` | DESALINHADO | Parar de esperar `churchName`, `categoryName`, `summary`; manter apenas os IDs reais e mapear nomes via listas carregadas; remover todos os fallbacks mortos; parar de enviar paginacao ficticia. |
| Treasury | `church-erp-web/src/modules/treasury/services/treasury-service.ts` | `/tenant/financial-transactions/:id` -> varios fallbacks fantasmas | `GET` | Canonico: `/api/finance/transactions/:id` (alias atual: `/api/tenant/financial-transactions/:id`) | `GET` | nenhum | nenhum | `FinanceTransactionResponseDto` | DESALINHADO | Tipar a resposta pelo DTO real e parar de modelar nomes que o backend nao devolve. |
| Treasury | `church-erp-web/src/modules/treasury/services/treasury-service.ts` | `/tenant/financial-transactions` -> varios fallbacks fantasmas | `POST` | Canonico: `/api/finance/transactions` (alias atual: `/api/tenant/financial-transactions`) | `POST` | nenhum | `CreateFinanceTransactionDto { churchId, categoryId, type, description, amount, transactionDate, notes? }` | `FinanceTransactionResponseDto` | DESALINHADO | Remover fallbacks mortos e alinhar o modelo do retorno ao DTO real. |
| Treasury | `church-erp-web/src/modules/treasury/services/treasury-service.ts` | `PUT /tenant/financial-transactions/:id` | `PUT` | Canonico: `/api/finance/transactions/:id` (alias atual: `/api/tenant/financial-transactions/:id`) | `PATCH` (alias legado `PUT` so em `/tenant/financial-transactions/:id`) | nenhum | `UpdateFinanceTransactionDto { churchId?, categoryId?, type?, description?, amount?, transactionDate?, notes?, status? }` | `FinanceTransactionResponseDto` | DESALINHADO | Migrar para `PATCH /finance/transactions/:id`; alinhar types ao DTO real; manter `status` somente se a tela realmente vai editar status. |
| Treasury | `church-erp-web/src/modules/treasury/services/treasury-service.ts` | `/tenant/financial-categories` -> varios fallbacks fantasmas (`/financial-categories`, `/treasury/categories`, etc.) | `GET` | Canonico: `/api/finance/categories` (alias atual: `/api/tenant/financial-categories`) | `GET` | nenhum | nenhum | `FinanceCategoryResponseDto[]` | DESALINHADO | O backend retorna `active`, nao `status`, e nao retorna `description`; ajustar `TreasuryCategoryItem` e `treasury-categories-sheet.tsx` ao contrato real. |

### Dashboard

| Modulo | Arquivo frontend | Endpoint usado hoje no frontend | Metodo usado hoje | Endpoint real do backend | Metodo real do backend | Query params esperados | Body esperado | Shape de resposta esperado | Status | Acao necessaria |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Dashboard | `church-erp-web/src/modules/dashboard/services/dashboard-service.ts` | `GET /tenant/members`, `GET /tenant/churches`, `GET /tenant/users`, `GET /tenant/financial-transactions` | `GET` | `/api/dashboard/cards` | `GET` | nenhum | nenhum | `DashboardCardsDto` | DESALINHADO | Trocar todo o calculo client-side por `GET /dashboard/cards`; o frontend atual conta membros/igrejas errados e pode incluir movimentacoes canceladas. |
| Dashboard | `church-erp-web/src/modules/dashboard/services/dashboard-service.ts` | `GET /tenant/financial-transactions` | `GET` | `/api/dashboard/finance-by-month` | `GET` | nenhum | nenhum | `DashboardFinanceByMonthDto[]` | DESALINHADO | Parar de reconstruir a serie no cliente; consumir o endpoint oficial, que usa somente transacoes `ACTIVE` e o recorte anual correto. |
| Dashboard | `church-erp-web/src/modules/dashboard/services/dashboard-service.ts` | `GET /tenant/members` | `GET` | `/api/dashboard/members-by-month` | `GET` | nenhum | nenhum | `DashboardMembersByMonthDto[]` | DESALINHADO | Parar de usar `joinedAt`/heuristica; consumir a serie oficial do backend, que usa `createdAt`. |

## 5. Endpoints fantasmas no frontend (MORTO)

| Arquivo frontend | Endpoints mortos hoje no codigo | Observacao |
| --- | --- | --- |
| `church-erp-web/src/modules/auth/services/auth-service.ts` | `/auth/tenant/login`, `/tenant/auth/login`, `/master/auth/login`, `/platform/auth/login`, `/auth/platform/login` | Nenhum controller atual atende esses caminhos. |
| `church-erp-web/src/modules/master/services/master-tenants-service.ts` | `/platform/tenants`, `/tenants`, `PATCH /:id/status` | O backend atual so expoe `/master/tenants/*`. |
| `church-erp-web/src/modules/users/services/users-service.ts` | `/tenant/usuarios`, `/usuarios`, `PATCH /:id/status` | O backend atual nao tem aliases PT-BR nem rota `/status`. |
| `church-erp-web/src/modules/churches/services/churches-service.ts` | `/tenant/igrejas`, `/igrejas` | O backend atual nao tem aliases PT-BR. |
| `church-erp-web/src/modules/members/services/members-service.ts` | `/tenant/membros`, `/membros`, `PATCH /:id/status` | O backend atual nao tem aliases PT-BR nem rota `/status`. |
| `church-erp-web/src/modules/treasury/services/treasury-service.ts` | `/tenant/treasury/movements`, `/tenant/movements`, `/financial-transactions`, `/treasury/movements`, `/tesouraria/movimentacoes`, `/movements`, `/movimentacoes`, `/tenant/treasury/categories`, `/tenant/categorias-financeiras`, `/financial-categories`, `/treasury/categories`, `/tesouraria/categorias`, `/categorias-financeiras`, `/categories/financial` | O backend atual usa somente `/finance/*` e os aliases reais `/tenant/financial-*`. |
| `church-erp-web/src/modules/dashboard/services/dashboard-service.ts` | Herdou os mesmos endpoints mortos de membros/churches/users/treasury | O dashboard atual tambem depende desses caminhos fantasmas. |

## 6. Rotas duplicadas e aliases legados no backend

| Contrato canonico (inferencia a partir do codigo) | Alias real hoje no backend | Comentario |
| --- | --- | --- |
| `/api/users` | `/api/tenant/users` | Mesmo service; alias adiciona `PUT`. |
| `/api/churches` | `/api/tenant/churches` | Mesmo service; alias adiciona `PUT`. |
| `/api/members` | `/api/tenant/members` | Mesmo service; alias adiciona `PUT`. |
| `/api/finance/categories` | `/api/tenant/financial-categories` | Mesmo service. |
| `/api/finance/transactions` | `/api/tenant/financial-transactions` | Mesmo service; alias adiciona `PUT`. |

## 7. Metodos HTTP errados ou acoplados a alias

| Arquivo frontend | Chamada atual | Contrato canonico real | Problema |
| --- | --- | --- | --- |
| `church-erp-web/src/modules/users/services/users-service.ts` | `PUT /tenant/users/:id` | `PATCH /api/users/:id` | Funciona so porque o alias legado ainda existe. |
| `church-erp-web/src/modules/churches/services/churches-service.ts` | `PUT /tenant/churches/:id` | `PATCH /api/churches/:id` | Funciona so porque o alias legado ainda existe. |
| `church-erp-web/src/modules/members/services/members-service.ts` | `PUT /tenant/members/:id` | `PATCH /api/members/:id` | Funciona so porque o alias legado ainda existe. |
| `church-erp-web/src/modules/treasury/services/treasury-service.ts` | `PUT /tenant/financial-transactions/:id` | `PATCH /api/finance/transactions/:id` | Funciona so porque o alias legado ainda existe. |
| `church-erp-web/src/modules/master/services/master-tenants-service.ts` | fallback `PUT /master/tenants/:id` | `PATCH /api/master/tenants/:id` | O backend atual nao expoe `PUT`. |

## 8. Filtros e params enviados pelo frontend que o backend nao usa

| Arquivo frontend | Rota atual | Params enviados e ignorados pelo backend atual |
| --- | --- | --- |
| `church-erp-web/src/modules/master/services/master-tenants-service.ts` | `GET /master/tenants` | `page`, `size`, `limit`, `perPage`, `name`, `status` |
| `church-erp-web/src/modules/users/services/users-service.ts` | `GET /tenant/users` | `page`, `size`, `limit`, `perPage`, `name`, `email`, `status`, `role` |
| `church-erp-web/src/modules/churches/services/churches-service.ts` | `GET /tenant/churches` | `page`, `size`, `limit`, `perPage`, `name`, `status` |
| `church-erp-web/src/modules/dashboard/services/dashboard-service.ts` | `GET /tenant/members`, `GET /tenant/churches`, `GET /tenant/users` | `DEFAULT_LIST_PARAMS` e, em usuarios, `status=ACTIVE` para uma rota que nao filtra server-side |
| `church-erp-web/src/lib/http.ts` | todas as rotas autenticadas | Headers `X-Tenant-Code` e `X-Tenant` nao sao lidos por nenhum controller atual |

Observacao:

- Em `members` e `finance/transactions`, os DTOs de query existem, mas:
  - `members`: filtros `name`, `status`, `churchId` sao usados; `page=0` e normalizado para `1`.
  - `finance/transactions`: filtros `startDate`, `endDate`, `type`, `categoryId`, `churchId` sao usados; `page/size/limit/perPage` sao aceitos pelo DTO, mas nao entram na query real.

## 9. Campos que o frontend espera, mas o backend nao devolve

| Area | Campo esperado hoje no frontend | Realidade do backend |
| --- | --- | --- |
| Master tenants | `adminName`, `adminUsername`, `adminEmail` | `TenantResponseDto` nao inclui nenhum campo do admin. |
| Users | tela/servico nao modela `username` | `UserResponseDto` inclui `username`, e o login do backend usa `username`. |
| Members | `churchName` | `MemberResponseDto` so devolve `churchId`. |
| Treasury movements | `churchName`, `categoryName` | `FinanceTransactionResponseDto` so devolve `churchId` e `categoryId`. |
| Treasury categories | `status`, `description` | `FinanceCategoryResponseDto` devolve `active`; nao devolve `description`. |

## 10. Campos que o backend exige e o frontend nao envia

Estritamente pelo DTO, nenhum `create/update` obrigatorio esta faltando hoje.

Mas existe um problema funcional grave:

- O backend autentica usuarios de tenant exclusivamente por `username` em `POST /api/auth/login`.
- O frontend de usuarios nao coleta, nao exibe e nao edita `username`.
- Resultado: o frontend pode criar usuarios validos para o DTO, mas inviaveis para o fluxo real de login.

## 11. Achados principais por impacto

### P0

- Dashboard completamente fora do contrato real:
  - o frontend ignora `/api/dashboard/cards`, `/api/dashboard/finance-by-month` e `/api/dashboard/members-by-month`;
  - reconstrui tudo a partir de endpoints genericos;
  - conta membros e igrejas com regra diferente da oficial;
  - pode incluir transacoes `CANCELLED` nas metricas;
  - usa `joinedAt` onde o backend oficial usa `createdAt`.
- Modulo de usuarios desalinhado funcionalmente:
  - frontend nao administra `username`;
  - login do backend e username-only;
  - cria-se conta que depois nao entra.
- Fallbacks mortos espalhados em auth/master/users/churches/members/treasury/dashboard aumentam complexidade e mascaram contrato real.

### P1

- Master tenants UI espera campos de admin que o backend nao devolve; colunas e metricas ficam sempre vazias/incorretas.
- Filtros de users/churches/master-tenants sao placebo server-side; a UI promete filtro que o backend atual nao executa.
- Treasury e members esperam nomes embedados (`churchName`, `categoryName`) que o backend nao fornece.
- Treasury categories modela `status/description`, mas o backend atual entrega `active`.
- Tenant branding faz fallback silencioso para sessao stale quando o `GET /tenant/branding` falha.

### P2

- `auth-session.ts` e os services mantem normalizacao para muitos formatos de resposta e nomes de campos que nao existem no backend atual.
- O backend ainda expoe controllers duplicados `tenant/*` e aliases `PUT`, mantendo compatibilidade que o usuario explicitamente quer remover.
- `CreateTenantDto.code` existe no DTO, mas e ignorado pelo service de criacao.

## 12. Ordem ideal de refatoracao

1. Frontend: matar todos os fallbacks mortos e fixar endpoints/metodos canonicamente reais.
2. Frontend: trocar o dashboard inteiro para `/api/dashboard/cards`, `/api/dashboard/finance-by-month` e `/api/dashboard/members-by-month`.
3. Frontend: corrigir o modulo de usuarios para expor `username` em types, listagem e form.
4. Frontend: alinhar os modelos de resposta de master-tenants, members e treasury ao DTO real do backend.
5. Frontend: remover filtros server-side falsos de master-tenants, users e churches; se a UX precisar dos filtros, aplicar localmente sobre a lista recebida.
6. Frontend: remover normalizacoes de API antiga (`nome`, `perfil`, `igreja`, `movimentacoes`, etc.) e deixar apenas o shape real.
7. Backend: depois do frontend deployado e estabilizado, remover controllers alias `tenant/*` e `PUT` legados.
8. Backend: opcional, endurecer o contrato de usuarios para impedir criacao de conta sem `username`.

## 13. Arquivos exatos que precisam ser alterados

### Frontend

- `church-erp-web/src/lib/http.ts`
- `church-erp-web/src/modules/auth/services/auth-service.ts`
- `church-erp-web/src/modules/auth/lib/auth-session.ts`
- `church-erp-web/src/modules/admin/components/tenant-branding-page.tsx`
- `church-erp-web/src/modules/master/services/master-tenants-service.ts`
- `church-erp-web/src/modules/master/types/tenant.ts`
- `church-erp-web/src/modules/master/components/tenants-table.tsx`
- `church-erp-web/src/modules/master/components/master-dashboard-page.tsx`
- `church-erp-web/src/modules/churches/services/churches-service.ts`
- `church-erp-web/src/modules/churches/components/churches-list-page.tsx`
- `church-erp-web/src/modules/churches/components/churches-filters.tsx`
- `church-erp-web/src/modules/users/services/users-service.ts`
- `church-erp-web/src/modules/users/types/user.ts`
- `church-erp-web/src/modules/users/components/users-list-page.tsx`
- `church-erp-web/src/modules/users/components/users-filters.tsx`
- `church-erp-web/src/modules/users/components/users-table.tsx`
- `church-erp-web/src/modules/users/components/user-form-page.tsx`
- `church-erp-web/src/modules/members/services/members-service.ts`
- `church-erp-web/src/modules/members/types/member.ts`
- `church-erp-web/src/modules/members/components/members-table.tsx`
- `church-erp-web/src/modules/members/components/members-list-page.tsx`
- `church-erp-web/src/modules/treasury/services/treasury-service.ts`
- `church-erp-web/src/modules/treasury/types/treasury.ts`
- `church-erp-web/src/modules/treasury/components/treasury-list-page.tsx`
- `church-erp-web/src/modules/treasury/components/treasury-table.tsx`
- `church-erp-web/src/modules/treasury/components/treasury-categories-sheet.tsx`
- `church-erp-web/src/modules/treasury/components/treasury-form-page.tsx`
- `church-erp-web/src/modules/dashboard/services/dashboard-service.ts`
- `church-erp-web/src/modules/dashboard/types/dashboard.ts`
- `church-erp-web/src/modules/dashboard/components/dashboard-overview.tsx`

### Backend

Necessarios para limpeza final apos alinhar o frontend ao contrato atual:

- `church-erp-api/src/modules/users/tenant-users.controller.ts`
- `church-erp-api/src/modules/churches/tenant-churches.controller.ts`
- `church-erp-api/src/modules/members/tenant-members.controller.ts`
- `church-erp-api/src/modules/finance/tenant-finance-categories.controller.ts`
- `church-erp-api/src/modules/finance/tenant-finance-transactions.controller.ts`

Recomendados para fechar inconsistencias do proprio backend:

- `church-erp-api/src/modules/users/dto/create-user.dto.ts`
- `church-erp-api/src/modules/users/dto/update-user.dto.ts`
- `church-erp-api/src/modules/tenants/dto/create-tenant.dto.ts`

## 14. Resumo executivo

- O maior desalinhamento hoje nao esta em CRUD simples; esta em `dashboard`, `users`, `master-tenants` e `treasury`.
- O frontend ainda carrega uma camada pesada de compatibilidade com APIs antigas que nao existem mais no backend atual.
- O backend atual ja contem contratos suficientes para um frontend limpo, mas o frontend precisa parar de inferir, normalizar e fazer fallback.
- O caminho mais seguro e:
  - primeiro alinhar frontend aos contratos reais;
  - depois remover aliases e compatibilidades legadas do backend.
