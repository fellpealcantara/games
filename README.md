# Play Entertainment Platform

Plataforma unificada de alta performance combinando catalogo de jogos classicos e streaming cinematografico, construida com arquitetura moderna e pronta para producao.

## Modulos Principais

### 1. Retro Gaming Hub
- Emulacao nativa no navegador baseada em WebAssembly (EmulatorJS) com suporte a PS1, SNES, Game Boy Advance, Game Boy Color e cliente web de Counter-Strike 1.6.
- Armazenamento em nuvem de alta capacidade via GitHub Releases, contornando restricoes de tamanho de payload da Vercel atraves de proxy reverso (`/api/roms/:path*`).
- Persistencia de estado de jogos, downloads e preferencias locais e sincronizadas.
- Interface responsiva com proporcoes calibradas para telas Full HD e Ultra-Wide (21:9 / 32:9).

### 2. Cinematic Streaming Hub
- Catalogo dinamico de filmes, series e animacoes com suporte a audio dublado e legendado.
- Hero Carousel com pre-visualizacao em video continuo mudo e controles de audio.
- Sistema de navegacao por temporadas, lista de episodios com tracking de progresso, sinopses e player HLS adaptativo.
- Barra de navegacao com categorias instantaneas, busca em tempo real com sugestoes e painel de perfil de usuario.

## Stack Tecnologica

- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS v4, Motion
- **Reproducao de Midia:** HLS.js, HTML5 Video Engine
- **Emulacao:** EmulatorJS WebAssembly Core
- **Armazenamento de Binarios:** GitHub Releases API
- **Banco de Dados / Nuvem:** Neon PostgreSQL Serverless
- **Deploy:** Vercel (com configuracao em `vercel.json`)

## Execucao Local

1. Instalar as dependencias:
   ```bash
   npm install
   ```

2. Iniciar o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```
   Acesse a aplicacao em `http://localhost:3000`.

3. Executar verificacao de tipos e testes unitarios:
   ```bash
   npm run lint
   npm test
   ```

4. Gerar build de producao:
   ```bash
   npm run build
   ```

## Deploy na Vercel

O projeto conta com arquivo `vercel.json` ja estruturado:
- As rotas da SPA sao automaticamente redirecionadas para `/index.html`.
- O endpoint `/api/roms/:path*` faz o proxy transparente dos arquivos hospedados nas releases do GitHub sem problemas de CORS ou limites de bundle.
