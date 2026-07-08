# SaResO

**© 2026 SaResO — Todos os direitos reservados.**

Plataforma social global de vídeo curto com funcionalidades de emprego, mensagens privadas e chamadas — desenvolvida exclusivamente para a sua proprietária.

---

## Funcionalidades

- **Feed de vídeos** — conteúdo em scroll vertical (estilo TikTok)
- **Stories** — stories de 24h no topo do feed
- **Discover / Explore** — trending, hashtags, sugestões de perfis e feed Following
- **Emprego** — empresas publicam vagas, utilizadores candidatam-se (estilo LinkedIn)
- **Currículos** — candidatos criam CVs pesquisáveis pelas empresas
- **Mensagens privadas** — chat em tempo real via Socket.io
- **Chamadas privadas** — vídeo e áudio P2P via WebRTC
- **Lives** — transmissões ao vivo com controlo do anfitrião e moderação
- **Moderação** — filtragem automática de palavrões, discurso de ódio, menções e links a outras plataformas
- **Perfis públicos/privados** — premium e verificados são sempre públicos
- **Verificação de empresas** — NIF/NIPC e documento legal obrigatórios
- **Pagamentos** — subscrições premium e de empresas via Stripe
- **Notificações** — likes, seguidores, mensagens, candidaturas, subscrições
- **Denúncias** — denunciar vídeos e comentários

---

## Stack Tecnológica

| Camada          | Tecnologias                                       |
| --------------- | ------------------------------------------------- |
| Frontend        | React 19, TypeScript, Vite, Tailwind CSS          |
| Routing         | TanStack Router (file-based, code splitting)      |
| Estado servidor | TanStack Query                                    |
| Componentes     | shadcn/ui + Radix UI                              |
| Backend         | Express.js + Node.js                              |
| ORM             | Drizzle ORM + Drizzle Kit                         |
| Base de dados   | MySQL (compatível com PlanetScale, Railway, etc.) |
| Real-time       | Socket.io (chat + sinalização WebRTC)             |
| Chamadas        | WebRTC P2P (sem servidor de media)                |
| Moderação       | bad-words (PT + EN)                               |
| Upload          | Cloudinary (vídeos + imagens)                     |
| Pagamentos      | Stripe Checkout + Webhooks                        |

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
4. Define as variáveis de ambiente: `DATABASE_URL`, `JWT_SECRET`, etc.
5. Railway faz deploy automático a cada push

### Render

1. Cria um Web Service no [Render](https://render.com)
2. Build command: `pnpm install && pnpm build`
3. Start command: `pnpm start`
4. Adiciona um banco MySQL externo (ex: PlanetScale, Railway)
5. Define `DATABASE_URL`, `JWT_SECRET` e outras variáveis

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
  -e STRIPE_SECRET_KEY="sk_..." \
  -e STRIPE_WEBHOOK_SECRET="whsec_..." \
  -e CLOUDINARY_CLOUD_NAME="..." \
  -e CLOUDINARY_API_KEY="..." \
  -e CLOUDINARY_API_SECRET="..." \
  sareso
```

---

## Variáveis de ambiente

| Variável                      | Obrigatório | Descrição                                                           |
| ----------------------------- | ----------- | ------------------------------------------------------------------- |
| `DATABASE_URL`                | Sim         | URL de ligação MySQL                                                |
| `JWT_SECRET`                  | Sim         | Chave secreta para tokens JWT (mínimo 32 caracteres)                |
| `PORT`                        | Não         | Porta do servidor (padrão: 3000)                                    |
| `STRIPE_SECRET_KEY`           | Não\*       | Chave secreta Stripe (necessária para pagamentos reais)             |
| `STRIPE_WEBHOOK_SECRET`       | Não\*       | Segredo do webhook Stripe (necessário para ativação de subscrições) |
| `STRIPE_PRICE_PREMIUM`        | Não\*       | ID do price Stripe para subscrição premium de criador               |
| `STRIPE_PRICE_SUBSCRIBE`      | Não\*       | ID do price Stripe para subscrição a um criador                     |
| `STRIPE_PRICE_COMPANY_MONTH`  | Não\*       | ID do price Stripe para subscrição mensal de empresa                |
| `STRIPE_PRICE_COMPANY_ANNUAL` | Não\*       | ID do price Stripe para subscrição anual de empresa                 |
| `CLOUDINARY_CLOUD_NAME`       | Não\*       | Nome da cloud Cloudinary (necessário para upload de ficheiros)      |
| `CLOUDINARY_API_KEY`          | Não\*       | API key Cloudinary                                                  |
| `CLOUDINARY_API_SECRET`       | Não\*       | API secret Cloudinary                                               |
| `ADMIN_USERNAME`              | Não         | Username com acesso ao painel de admin (padrão: soaresestrelasares) |

\* Não obrigatórias para correr a app localmente, mas necessárias para funcionalidades de produção.

---

## Base de dados — Migrações

Se estiveres a usar o fluxo de desenvolvimento local com `server/migrate.ts`, as tabelas são criadas automaticamente ao iniciar o servidor.

Caso contrário, usa:

```bash
# Gerar migração após alterar server/schema.ts
pnpm db:generate

# Aplicar migrações pendentes
pnpm db:migrate
```

As migrações ficam versionadas em `drizzle/`.

### Migrações manuais para bases já existentes

Se já tens uma base de dados em produção e só precisas de adicionar as colunas novas, corre:

```sql
ALTER TABLE users
  ADD COLUMN is_private INT NOT NULL DEFAULT 0,
  ADD COLUMN location VARCHAR(200) DEFAULT '';

ALTER TABLE videos
  ADD COLUMN location VARCHAR(200) DEFAULT '',
  ADD COLUMN music_url VARCHAR(500) DEFAULT '',
  ADD COLUMN music_title VARCHAR(200) DEFAULT '';

ALTER TABLE stories
  ADD COLUMN location VARCHAR(200) DEFAULT '',
  ADD COLUMN music_url VARCHAR(500) DEFAULT '';

ALTER TABLE companies
  ADD COLUMN verification_status VARCHAR(20) NOT NULL DEFAULT 'pending',
  ADD COLUMN legal_doc_url VARCHAR(500) DEFAULT '',
  ADD COLUMN tax_id VARCHAR(100) DEFAULT '';

CREATE TABLE IF NOT EXISTS resumes (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL UNIQUE,
  summary VARCHAR(2000) DEFAULT '',
  skills VARCHAR(2000) DEFAULT '',
  experience TEXT,
  education TEXT,
  desired_role VARCHAR(200) DEFAULT '',
  desired_location VARCHAR(200) DEFAULT '',
  remote INT NOT NULL DEFAULT 0,
  cv_url VARCHAR(500) DEFAULT '',
  is_public INT NOT NULL DEFAULT 1,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

---

## Nota importante

O sistema está totalmente implementado e pronto a produção. O servidor cria automaticamente todas as tabelas necessárias ao arrancar (via `server/migrate.ts`), pelo que só precisas de configurar a variável de ambiente `DATABASE_URL` e o sistema estará operacional.

Para bases de dados já existentes, podes usar as migrações manuais documentadas acima ou o fluxo `pnpm db:migrate` com as migrações versionadas em `drizzle/`.

Certifica-te também de definir `JWT_SECRET` e, para funcionalidades de pagamentos/upload, as credenciais Stripe e Cloudinary.

---

## Direitos Autorais

**© 2026 SaResO. Todos os direitos reservados.**

Esta aplicação é propriedade exclusiva da sua criadora. É proibida a reprodução, distribuição, modificação ou utilização comercial sem autorização expressa por escrito da proprietária.
