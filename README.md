# ZUP — Zeladoria Urbana Participativa

O **ZUP** é o frontend de uma plataforma de zeladoria urbana participativa voltada para o município de **Videira/SC**. A aplicação permite que cidadãos registrem problemas urbanos em um mapa, acompanhem o andamento das ocorrências e participem de validações comunitárias. Gestores públicos e órgãos responsáveis podem visualizar demandas, atualizar status e acompanhar indicadores de atendimento.

Este repositório contém **somente o frontend** do projeto, desenvolvido em **React + Vite + TypeScript**. O backend Node/Express é externo e fica em outro repositório, chamado **ProjetoZup-principal**.

## Objetivo do projeto

O ZUP foi pensado para aproximar cidadãos e gestão pública no acompanhamento de problemas urbanos, como iluminação, energia, água, saneamento, infraestrutura e vandalismo. A proposta é criar um fluxo transparente em que a população registra, valida e acompanha ocorrências, enquanto os órgãos responsáveis recebem as demandas de forma organizada.

Principais diferenciais:

- mapa público de ocorrências;
- registro de problemas urbanos com localização e fotos;
- validação comunitária de ocorrências;
- roteamento por órgão responsável;
- painéis para cidadãos, gestão pública e administração;
- estatísticas públicas para transparência;
- integração com backend externo via API REST.

## Estado atual da arquitetura

A arquitetura atual está separada em dois projetos:

```text
Frontend ZUP — este repositório
React + Vite + TypeScript
        |
        | VITE_API_BASE_URL
        v
Backend ZUP — repositório ProjetoZup-principal
Node/Express + API REST + banco de dados
```

Neste frontend:
- toda comunicação com dados reais passa pela variável `VITE_API_BASE_URL`;
- login, cadastro, ocorrências, validações e uploads dependem do backend externo rodando.

## Perfis atendidos

### Cidadão

O cidadão pode acessar o mapa, registrar ocorrências, acompanhar seus próprios registros e participar de validações comunitárias.

Principais áreas:

- página inicial;
- mapa de ocorrências;
- cadastro e login;
- painel do cidadão;
- validações pendentes;
- suporte.

### Gestor ou agente institucional

Perfis institucionais representam órgãos responsáveis por tratar ocorrências, como prefeitura, água/saneamento e energia/iluminação.

Principais áreas:

- login de gestão;
- painel institucional;
- visualização de ocorrências do órgão;
- atualização de status;
- estatísticas por bairro, categoria e órgão.

### Administrador

O administrador possui uma visão consolidada dos órgãos, usuários, painéis e indicadores gerais do sistema.

## Funcionalidades principais

- Landing page institucional do ZUP.
- Mapa público de ocorrências urbanas.
- Filtros por status, categoria, bairro e prioridade.
- Registro de ocorrência com categoria, descrição, endereço, localização e fotos.
- Geolocalização do usuário pelo navegador.
- Geocoding reverso via backend.
- Login e cadastro com autenticação JWT.
- Refresh automático de token em caso de expiração.
- Painel do cidadão com ocorrências e validações.
- Validação comunitária de ocorrências.
- Painéis institucionais e administrativos.
- Estatísticas e gráficos com dados agregados.
- Página de suporte com FAQ e contato.

## Stack tecnológica

### Core

- React 18
- Vite 5
- TypeScript 5
- SWC

### Interface e design

- Tailwind CSS
- shadcn/ui
- Radix UI
- lucide-react
- Framer Motion
- embla-carousel-react
- sonner
- next-themes

### Formulários e validação

- react-hook-form
- zod
- @hookform/resolvers

### Estado, cache e dados

- TanStack Query
- Fetch nativo encapsulado em `src/lib/api.ts`

### Mapas, gráficos e rotas

- Google Maps Types / SDK carregado dinamicamente
- Geolocation API do navegador
- Recharts
- React Router DOM

### Testes

- Vitest
- Testing Library
- jsdom
- Playwright

## Como rodar localmente

### 1. Pré-requisitos

Você precisa ter instalado:

- Node.js 18 ou superior; ou
- Bun, caso prefira usar o lockfile do projeto.

Para testar o sistema completo, o backend externo **ProjetoZup-principal** também precisa estar rodando em:

```text
http://localhost:3333/api
```

Sem o backend, a interface pode abrir normalmente, mas chamadas como login, cadastro, ocorrências e validações retornarão erro.

### 2. Configurar variáveis de ambiente

Crie um arquivo `.env` na raiz do projeto com:

```env
VITE_API_BASE_URL=http://localhost:3333/api
```

Nunca envie o arquivo `.env` real para o GitHub. Use apenas `.env.example` como modelo.

### 3. Instalar dependências

Com Bun:

```bash
bun install
```

Ou com npm:

```bash
npm install
```

### 4. Rodar o frontend

Com Bun:

```bash
bun run dev
```

Ou com npm:

```bash
npm run dev
```

A aplicação roda na porta configurada no Vite:

```text
http://localhost:8080
```

## Scripts disponíveis

Os principais scripts do projeto são:

```bash
bun run dev       # inicia o servidor de desenvolvimento
bun run build     # gera build de produção
bun run preview   # pré-visualiza o build
bun run lint      # executa ESLint
bun run test      # executa testes
```

Os mesmos scripts também podem ser executados com `npm run`, caso o projeto tenha sido instalado com npm.

## Variáveis de ambiente

| Variável | Obrigatória | Descrição |
|---|---:|---|
| `VITE_API_BASE_URL` | Sim | URL base da API Node/Express externa. Exemplo local: `http://localhost:3333/api`. |

Atenção: variáveis iniciadas com `VITE_` ficam disponíveis no navegador após o build. Portanto, não coloque senhas, tokens secretos, credenciais de e-mail, chaves privadas ou dados sensíveis no frontend.

## Integração com a API

A comunicação com o backend é centralizada em `src/lib/api.ts`. Esse cliente é responsável por:

- usar `VITE_API_BASE_URL` como base das requisições;
- enviar token JWT no header `Authorization: Bearer`;
- renovar token automaticamente quando recebe erro 401;
- tratar erros em formato padronizado;
- suportar upload multipart.

Principais clientes de API:

| Arquivo | Responsabilidade |
|---|---|
| `src/lib/api.ts` | Cliente HTTP central. |
| `src/lib/auth-api.ts` | Login, cadastro, sessão e perfil. |
| `src/lib/occurrences-api.ts` | Ocorrências, detalhes, criação, atualização, exclusão e fotos. |
| `src/lib/geo-api.ts` | Geocoding reverso. |
| `src/lib/validations-api.ts` | Convites e decisões de validação comunitária. |

Endpoints consumidos pelo frontend:

```text
POST   /auth/login
POST   /auth/register
POST   /auth/refresh
POST   /auth/forgot-password
POST   /auth/reset-password
GET    /users/me
PATCH  /users/me
GET    /occurrences
GET    /occurrences/:id
POST   /occurrences
PATCH  /occurrences/:id
DELETE /occurrences/:id
POST   /occurrences/:id/photos
GET    /geo/reverse
GET    /validation-invites
POST   /validations
```

## Rotas principais do frontend

| Rota | Página | Acesso |
|---|---|---|
| `/` | Página inicial | Público |
| `/mapa` | Mapa de ocorrências | Público |
| `/dashboard` | Minha Cidade / indicadores | Público |
| `/minha-cidade` | Alias do dashboard | Público |
| `/login` | Login cidadão | Público |
| `/cadastro` | Cadastro cidadão | Público |
| `/recuperar-senha` | Recuperação de senha | Público |
| `/painel` | Painel do cidadão | Autenticado |
| `/validacoes` | Validações comunitárias | Autenticado |
| `/institucional/:type` | Painel institucional | Institucional |
| `/admin` | Painel administrativo | Admin |
| `/gestao` | Portal de gestão | Público |
| `/gestao/login` | Login de gestão | Público |
| `/gestao/painel` | Painel de gestão | Institucional |
| `/gestao/estatisticas` | Estatísticas de gestão | Institucional |
| `/suporte` | Suporte e FAQ | Público |

## Estrutura de pastas

Resumo da estrutura principal:

```text
src/
├── assets/          # imagens e arquivos estáticos usados no frontend
├── components/      # componentes da aplicação
│   ├── layout/      # navbar e estrutura visual global
│   ├── support/     # componentes da área de suporte
│   └── ui/          # componentes shadcn/ui
├── data/            # tipos, dados estáticos e configurações visuais
├── hooks/           # hooks de autenticação, dados, estatísticas e UI
├── lib/             # clientes de API e utilitários
├── pages/           # páginas usadas pelo React Router
├── test/            # setup e arquivos de teste
├── App.tsx          # providers e rotas principais
├── main.tsx         # inicialização do React
└── index.css        # tokens globais e estilos base
```

## Design system

O ZUP usa um design system baseado em Tailwind CSS, shadcn/ui e tokens semânticos em HSL.

Características principais:

- fonte principal Plus Jakarta Sans;
- paleta com predominância de roxo sobre base clara;
- tokens semânticos para background, foreground, primary, secondary, accent, border e estados;
- badges visuais para status e prioridade de ocorrências;
- componentes acessíveis baseados em Radix UI;
- suporte a dark mode por classe;
- animações com Tailwind e Framer Motion;
- layout responsivo com breakpoints padrão do Tailwind.

## Relação com o backend

Este repositório não contém o backend. Para o sistema completo funcionar, rode o frontend e o backend ao mesmo tempo:

```text
Frontend: http://localhost:8080
Backend:  http://localhost:3333/api
```

O backend deve fornecer as rotas consumidas pelo frontend e cuidar de:

- autenticação real;
- banco de dados;
- uploads;
- envio de e-mail;
- validações server-side;
- regras de negócio;
- persistência das ocorrências.

## Limitações conhecidas

- Sem o backend rodando, funcionalidades dependentes de API não funcionam.
- `VITE_API_BASE_URL` precisa estar configurada corretamente.
- A integração com mapas pode depender de chave/configuração externa.
- O Supabase foi removido e não deve ser recriado neste frontend.
- Algumas estatísticas podem depender de dados reais retornados pela API.
- O repositório backend deve ser publicado separadamente em produção.

## Build e publicação

Para gerar uma versão de produção:

```bash
bun run build
```

ou:

```bash
npm run build
```

O resultado será gerado na pasta `dist/`.

Em produção, configure a variável:

```env
VITE_API_BASE_URL=https://sua-api-publica.com/api
```

Exemplos de hospedagem para o frontend:

- Vercel;
- Netlify;
- Cloudflare Pages;
- servidor próprio.

O backend deve ser hospedado separadamente, por exemplo em Render, Railway, Fly.io ou VPS.

## Segurança e versionamento

Antes de publicar no GitHub, confira se estes arquivos não serão commitados:

```text
.env
.env.local
node_modules/
dist/
```

Mantenha no repositório apenas o arquivo `.env.example`, com valores de exemplo e sem credenciais reais.

## Documentação técnica completa

Este README resume o projeto para leitura rápida no GitHub. A documentação técnica e funcional detalhada está no arquivo:

```text
RELATORIO_ZUP.md
```

Esse relatório contém o mapeamento completo de páginas, componentes, hooks, API clients, arquitetura de dados do frontend e limitações técnicas.
