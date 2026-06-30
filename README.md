# SaResO

**© 2026 SaResO — Todos os direitos reservados.**

Plataforma social global de vídeo curto com funcionalidades de emprego, mensagens privadas e chamadas — desenvolvida exclusivamente para a sua proprietária.

---

## Funcionalidades

- **Feed de vídeos** — conteúdo em scroll vertical (estilo TikTok)
- **Emprego** — empresas publicam vagas, utilizadores candidatam-se (estilo LinkedIn)
- **Mensagens privadas** — chat em tempo real via Socket.io
- **Chamadas privadas** — vídeo e áudio P2P via WebRTC
- **Moderação** — filtragem automática de linguagem ofensiva em PT e EN
- **Perfis de empresa** — logo, descrição, indústria, website
- **Seguir utilizadores** — feed personalizado

---

## Stack Tecnológica

| Camada          | Tecnologias                                       |
| --------------- | ------------------------------------------------- |
| Frontend        | React 18, TypeScript, Vite, Tailwind CSS          |
| Routing         | TanStack Router (file-based, code splitting)      |
| Estado servidor | TanStack Query                                    |
| Componentes     | shadcn/ui + Radix UI                              |
| Backend         | Express.js + Node.js                              |
| ORM             | Drizzle ORM + Drizzle Kit                         |
| Base de dados   | MySQL (compatível com PlanetScale, Railway, etc.) |
| Real-time       | Socket.io (chat + sinalização WebRTC)             |
| Chamadas        | WebRTC P2P (sem servidor de media)                |
| Moderação       | bad-words (PT + EN)                               |

---

## Pré-requisitos

- Node.js 20+
- pnpm 9+
- MySQL 8+ (ou serviço compatível: PlanetScale, Railway, Render, etc.)

---

## Instalação e desenvolvimento

```bash
# 1. Instalar dependências
pnpm install

# 2. Configurar variáveis de ambiente
cp .env.example .env
# edita .env com as tuas credenciais

# 3. Criar tabelas (aplica migrações)
pnpm db:migrate

# 4. Iniciar em desenvolvimento
pnpm dev
```

O servidor API fica disponível em `:4001` e o Vite em `:5173` (ou próxima porta livre).
O Vite faz proxy de `/api/*` para o Express automaticamente.

---

## Build de produção

```bash
pnpm build
pnpm start
```

O `pnpm build` compila:

- `dist/client/` — app React otimizada
- `dist/server/` — servidor Express compilado

O `pnpm start` serve ambos num único processo Node na porta definida por `PORT` (padrão: 3000).

---

## Deploy (opções recomendadas)

### Railway

1. Cria um projeto no [Railway](https://railway.app)
2. Liga o repositório GitHub
3. Adiciona um serviço MySQL
4. Define as variáveis de ambiente: `DATABASE_URL`, `JWT_SECRET`
5. Railway faz deploy automático a cada push

### Render

1. Cria um Web Service no [Render](https://render.com)
2. Build command: `pnpm install && pnpm build`
3. Start command: `pnpm start`
4. Adiciona um banco PostgreSQL ou usa MySQL externo
5. Define `DATABASE_URL`, `JWT_SECRET` nas variáveis de ambiente

### VPS (Ubuntu/Debian)

```bash
# Instalar Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
npm install -g pnpm

# Clonar e instalar
git clone <repositório> sareso && cd sareso
pnpm install
pnpm build

# Configurar variáveis
cp .env.example .env && nano .env

# Migrar base de dados
pnpm db:migrate

# Iniciar com PM2
npm install -g pm2
pm2 start "pnpm start" --name sareso
pm2 save && pm2 startup
```

### Docker

```bash
docker build -t sareso .
docker run -p 3000:3000 \
  -e DATABASE_URL="mysql://user:pass@host:3306/sareso" \
  -e JWT_SECRET="chave_secreta" \
  sareso
```

---

## Variáveis de ambiente

| Variável       | Obrigatório | Descrição                                       |
| -------------- | ----------- | ----------------------------------------------- |
| `DATABASE_URL` | Sim         | URL de ligação MySQL                            |
| `JWT_SECRET`   | Sim         | Chave secreta para tokens JWT (mínimo 32 chars) |
| `PORT`         | Não         | Porta do servidor (padrão: 3000)                |

---

## Base de dados — Migrações

```bash
# Gerar migração após alterar server/schema.ts
pnpm db:generate

# Aplicar migrações pendentes
pnpm db:migrate
```

As migrações ficam versionadas em `drizzle/`.

---

## Direitos Autorais

**© 2026 SaResO. Todos os direitos reservados.**

Esta aplicação é propriedade exclusiva da sua criadora. É proibida a reprodução, distribuição, modificação ou utilização comercial sem autorização expressa por escrito da proprietária.
