# Gestão do Escritório · Método D.R.A.

Sistema de gestão para escritórios de advocacia, feito para as mentorandas da Mentoria Método D.R.A.

- **App oficial, com login por convite:** https://advdaianne-collab.github.io/gestao-dra/
- **Demonstração:** https://advdaianne-collab.github.io/gestao-dra/demo/

## Seções

Painel, Agenda (quadro com listas), Calendário, Finalizados, Processos, Clientes, Publicações, Comunicação, Documentos, Indicadores, Relatórios mensais, Financeiro e Manual.

## Estrutura

| Caminho | O que é |
|---|---|
| `app/` | Código do app, compartilhado pelo app oficial, pela demonstração e pela versão artefato |
| `index.html`, `config.js` | App oficial, ligado ao Supabase (login por convite) |
| `demo/` | Demonstração com dados de exemplo, guardados só no navegador |
| `supabase/schema.sql` | Estrutura do banco: tabelas, regras de acesso por escritório e pasta privada de documentos |
| `GUIA-IMPLANTACAO.md` | Como convidar mentorandas, custos e cuidados |

## Tecnologia

- HTML, CSS e JavaScript puros, sem etapa de build.
- Banco e login no Supabase, com regras de acesso (Row Level Security) por escritório.
- Instalável no celular como aplicativo (PWA).
- Com `modo: 'artefato'` no config, o mesmo código roda como artefato do Claude, usando o banco do artefato e o assistente com IA.

Versão 1.1.0
