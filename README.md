# ⚔️ Hunter Gym

> Tracker de treinos gamificado com temática de **Solo Leveling** — ranks, missões, dungeons e feed social.

---

## Visão Geral

Hunter Gym é um aplicativo mobile-first de acompanhamento de treinos com sistema de gamificação completo. Inspirado no universo de Solo Leveling, o app transforma cada treino em progressão de personagem — você sobe de rank, quebra PRs, desbloaqueia títulos e compete com parceiros em grupos fechados.

---

## Funcionalidades

### Treino
- **Split personalizável** (A/B/C/D) com drag-and-drop para reordenar exercícios
- **Treino ativo** com cronômetro, sugestão de carga, tabela de séries por exercício
- **Countdown de descanso** circular com beep de áudio ao finalizar
- **Detecção de PR** em tempo real com flash dourado
- **Resumo pós-treino** com XP ganho, PRs quebrados e eventos

### Gamificação
- **8 Ranks**: E → D → C → B → A → S → National → Monarch
- **Stats RPG**: STR / END / AGI / VIT / INT calculados do histórico real
- **Sistema de XP**: treino, progressão, missões, dungeons, streaks
- **8 Títulos** desbloqueáveis: Awakened, Iron Will, No Days Off, Shadow Monarch...
- **Missões** Diárias, Semanais e Épicas com progress bars e timers de reset

### Histórico
- Lista de sessões com volume, duração e detalhe completo de cada série
- **Gráfico de progressão** de carga por exercício (Recharts)
- Linha de referência do PR atual
- Status de progressão: Progredindo / Pronto p/ +2.5kg / Travado

### Social (Fase 1 — mock local)
- **Criar ou entrar** em grupos com código de convite
- **Ranking semanal** por dias treinados → volume
- **Feed de conquistas**: PRs, rank ups, streaks, títulos, dungeons
- **Reações** 🔥👊⚔️ nos eventos do feed
- **Dungeons coletivas**: crie desafios com objetivo, dificuldade, prazo e recompensa

### AI Coach
- Chat com **GPT-4o mini** via **Edge Function** `shadow-coach` (chave OpenAI só no Supabase, não no bundle)
- Resposta completa por requisição (sem streaming no cliente)
- Contexto automático do histórico (últimos 10 treinos + stats)
- Exige **login Supabase** (JWT); contas só locais não chamam a função
- 6 prompts rápidos pré-definidos
- Renderização de markdown básico (bold, listas)

---

## Stack

| Camada | Tecnologia |
|---|---|
| Frontend | React 19 + Vite 8 + TypeScript |
| Estilo | Tailwind CSS v4 |
| Roteamento | React Router v7 |
| Estado global | Zustand v5 (persist → localStorage) |
| Gráficos | Recharts |
| Drag & Drop | @dnd-kit |
| IA | OpenAI API via Supabase Edge Function `shadow-coach` (gpt-4o-mini) |
| Áudio | Web Audio API nativa |
| Deploy | Vercel |

---

## Começando

### 1. Clone o repositório

```bash
git clone https://github.com/seu-usuario/hunter-gym.git
cd hunter-gym
```

### 2. Instale as dependências

```bash
npm install
```

### 3. Configure as variáveis de ambiente

```bash
cp .env.example .env
```

Edite o `.env` com **SUPABASE_URL** e **SUPABASE_ANON_KEY** (e opcionalmente **VAPID_PUBLIC_KEY**).  
A chave **OpenAI** não vai no front: configure nos secrets do projeto e faça deploy da função `shadow-coach`:

```bash
supabase secrets set OPENAI_API_KEY=sk-...
supabase functions deploy shadow-coach
```

> Chave em [platform.openai.com/api-keys](https://platform.openai.com/api-keys). Modelo: `gpt-4o-mini`.

### 4. Inicie o servidor de desenvolvimento

```bash
npm run dev
```

Acesse `http://localhost:5173`

### 5. Build de produção

```bash
npm run build
npm run preview
```

---

## Deploy na Vercel

### Via Vercel CLI

```bash
npm i -g vercel
vercel
```

### Via GitHub (recomendado)

1. Faça push para um repositório no GitHub
2. Acesse [vercel.com](https://vercel.com) → **Add New Project**
3. Importe o repositório
4. Configure **SUPABASE_URL** e **SUPABASE_ANON_KEY** (mesmos valores do Dashboard Supabase)
5. A chave OpenAI permanece apenas em **Supabase → Project Settings → Edge Functions → Secrets** (`OPENAI_API_KEY`)
6. Clique em **Deploy**

> O `vercel.json` já está configurado com rewrites para SPA routing e cache headers para assets.

---

## Estrutura do Projeto

```
src/
├── pages/
│   ├── Dashboard.tsx       # Página inicial com stats e gamificação
│   ├── WorkoutSetup.tsx    # Configurar split e exercícios
│   ├── WorkoutActive.tsx   # Treino em andamento
│   ├── History.tsx         # Histórico e gráficos
│   ├── Missions.tsx        # Missões diárias/semanais/épicas
│   ├── Group.tsx           # Grupo social, feed, dungeons
│   ├── Profile.tsx         # Perfil, títulos, ranks
│   ├── AICoach.tsx         # Chat com Shadow Coach (GPT-4o mini)
│   └── Onboarding.tsx      # Tela de cadastro inicial
│
├── components/
│   ├── ui/                 # Button, Input, Modal, Badge, Toast, BottomNav
│   ├── workout/            # ExerciseCard, RestCountdown, SortableExerciseItem
│   ├── gamification/       # RankBadge, XPBar, StatBars, MissionCard, DungeonCard, TitleBadge
│   └── social/             # FeedItem, RankingRow, CreateDungeonModal
│
├── hooks/
│   ├── useStopwatch.ts           # Cronômetro sem drift
│   ├── useCountdown.ts           # Countdown com beep de áudio
│   ├── useProgressionEngine.ts   # Sugestão de carga por exercício
│   ├── useLocalStorage.ts        # Wrapper tipado para localStorage
│   ├── useGamification.ts        # Orquestra XP, rank, títulos, feed
│   └── useAICoach.ts             # Chat streaming com OpenAI
│
├── store/
│   ├── workoutStore.ts     # Templates, sessões, sessão ativa
│   ├── userStore.ts        # Perfil, XP, rank, títulos
│   ├── gamificationStore.ts# Missões, eventos pendentes
│   └── groupStore.ts       # Grupo, feed, dungeons
│
└── lib/
    ├── types.ts             # Todos os tipos TypeScript
    ├── gamificationLogic.ts # Ranks, XP, stats, missões, títulos
    ├── progressionLogic.ts  # Sugestão de carga, PR, volume
    ├── audioUtils.ts        # Web Audio API (beeps)
    └── supabaseClient.ts    # Mock para Fase 1 (pronto para Fase 2)
```

---

## Roadmap

### Fase 1 — Atual (localStorage)
- [x] Treino com progressão de carga
- [x] Gamificação completa (XP, ranks, missões, títulos)
- [x] Histórico com gráficos
- [x] Grupo social (mock local)
- [x] AI Coach com streaming

### Fase 2 — Supabase (próximo)
- [ ] Autenticação com magic link ou Google
- [ ] Sincronização multi-dispositivo
- [ ] Grupos reais com múltiplos usuários
- [ ] Leaderboard global
- [ ] Push notifications para streak e dungeons

### Fase 3 — Extras
- [ ] PWA com instalação no celular
- [ ] Integração com wearables (Apple Health / Google Fit)
- [ ] Planos de treino com IA
- [ ] Modo offline com sync quando conectar

---

## Licença

MIT — Livre para uso pessoal e comercial.

---

> *"A partir de hoje, somente eu serei o único ser que se fortalece ao encontrar desafios."*  
> — Sung Jin-Woo
