# Gestão do Escritório · Método D.R.A.

App de gestão para escritórios de advocacia, entregue às mentorandas da Mentoria Método D.R.A.

O app funciona no navegador e pode ser instalado no celular como aplicativo. Os dados de cada escritório ficam no Supabase próprio, protegidos por login.

Seções:
- Painel
- Agenda (quadro com listas)
- Calendário
- Processos
- Clientes
- Publicações
- Comunicação (rascunhos de WhatsApp)
- Documentos
- Financeiro
- Relatórios
- Finalizados
- Manual

## Pastas

| Caminho | O que é |
|---|---|
| `app/` | Código do app, compartilhado por todas as mentorandas. Atualize aqui. |
| `index.html`, `config.js`, `manifest.webmanifest`, `sw.js`, `icones/` | Demonstração com dados de exemplo, que ficam só no navegador. |
| `modelo-escritorio/` | Pasta modelo: copie para `nome-da-mentoranda/` e preencha o `config.js`. |
| `supabase/schema.sql` | Estrutura do banco. Rode uma vez no Supabase de cada mentoranda. |
| `GUIA-IMPLANTACAO.md` | Passo a passo completo. |

## Tecnologia

- HTML, CSS e JavaScript puros, sem etapa de build.
- supabase-js 2, carregado de um CDN.
- Login por e-mail e senha.
- Row Level Security por escritório.
- Bucket privado `documentos` para os anexos.
- Sem `supabaseUrl` no `config.js`, o app abre em modo demonstração, com os dados guardados no navegador.

Versão 1.0.0
