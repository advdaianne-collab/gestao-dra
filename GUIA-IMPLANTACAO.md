# Guia · Gestão do Escritório (Método D.R.A.)

## Endereços

| O quê | Link |
|---|---|
| App oficial (com login) | https://advdaianne-collab.github.io/gestao-dra/ |
| Demonstração, para mostrar a interessadas | https://advdaianne-collab.github.io/gestao-dra/demo/ |
| Código (GitHub) | https://github.com/advdaianne-collab/gestao-dra |
| Banco de dados (Supabase, projeto `gestao-dra`, São Paulo) | https://supabase.com/dashboard/project/gujdrlppphkdckwruoin |

## Como funciona

- **Um app só, um banco só.** Só entra quem você convidar. O cadastro aberto está desligado.
- **Cada mentoranda vê apenas o próprio escritório.** O banco separa os escritórios por regras de acesso (RLS). Uma não enxerga os dados da outra, e o app não mostra os dados delas para você.
- **No primeiro acesso, o app cria o escritório dela** com as listas sugeridas do quadro e o manual, e pergunta o nome do escritório.

## Liberar uma mentoranda pelo app (1 minuto)

Você é a **administradora**. Por isso, o menu do app mostra para você a seção **Acessos**, que nenhuma mentoranda vê.

1. No app, abra **Acessos**.
2. Digite o nome e o e-mail da mentoranda e clique em **Liberar acesso**.
3. A mensagem de convite é copiada sozinha. Cole no WhatsApp ou no e-mail dela.
4. Ela abre o link do app, toca em **"Primeiro acesso? Criar minha senha"**, cria a senha e confirma pelo e-mail que recebe. No primeiro acesso, o app pergunta o nome do escritório.

Na lista de Acessos, você acompanha a situação de cada uma:
- **liberada, ainda não criou a senha**;
- **falta confirmar o e-mail**;
- **cadastrada**;
- **usando** (aparece o último acesso).

Para tirar o acesso de alguém, clique em **Remover acesso**. Os dados do escritório dela continuam guardados.

**Por que é seguro:** o cadastro só aceita e-mails que estão na sua lista de Acessos (uma trava no banco, criada pelo arquivo `supabase/acessos.sql`). Qualquer outro e-mail recebe a mensagem "Este e-mail ainda não foi liberado".

Também dá para convidar pelo Supabase, em **Authentication > Users > Add user > Send invitation**. Nesse caso, coloque o e-mail na lista de Acessos antes de convidar.

## Colocar uma secretária no escritório de uma mentoranda

1. Convide a secretária como no passo anterior, mas **peça que ela ainda não entre**.
2. No Supabase, abra **Authentication > Users** e copie o UID dela e o UID da mentoranda.
3. Em **SQL Editor**, rode o comando abaixo, trocando os dois valores:

```sql
insert into public.membros (escritorio_id, user_id, papel)
select escritorio_id, 'UID-DA-SECRETARIA', 'equipe'
from public.membros where user_id = 'UID-DA-MENTORANDA' limit 1;
```

Pronto: ao entrar, a secretária vê o mesmo escritório da mentoranda.

## Bloquear o acesso de alguém

No app, abra **Acessos** e clique em **Remover acesso**. Os dados do escritório continuam guardados no banco.

## Colocar outra administradora

No Supabase, abra **SQL Editor** e rode:

```sql
insert into public.administradoras (email) values ('email-dela@exemplo.com') on conflict do nothing;
```

## Instalar no celular

- **iPhone:** abra o link no **Safari**, toque em Compartilhar e escolha **Adicionar à Tela de Início**.
- **Android:** abra no **Chrome**, toque no menu e escolha **Instalar app**.
- **Computador:** no Chrome ou no Edge, clique no ícone de instalar, ao lado do endereço.

## Atualizações

Ao substituir os arquivos da pasta `app/` no GitHub, todas as mentorandas recebem a atualização juntas, sem perder dados.

## Custos e cuidados

- **Custo atual: zero.** GitHub Pages e Supabase estão no plano gratuito.
- **Limites do plano gratuito, somados entre todas as mentorandas:**
  - 500 MB de banco, que é muito para texto;
  - 1 GB de arquivos anexados.

  Quando chegar perto desses limites, o plano Pro do Supabase custa cerca de US$ 25 por mês.
- **O Supabase gratuito pausa o projeto depois de 7 dias sem nenhum acesso.** Com as mentorandas usando, isso não acontece. Se pausar, entre no painel e clique em **Restore**.
- **Backup:** cada mentoranda pode baixar os dados dela em **Ajustes > Exportar backup**. Oriente que façam isso todo mês.
- **LGPD:** os dados ficam num banco seu, na região de São Paulo, protegidos por login e por regras de acesso por escritório. Cada advogada é a controladora dos dados dos próprios clientes. Você é a operadora que fornece a ferramenta. Vale incluir uma cláusula sobre isso no contrato da mentoria.

## Versão no Claude (com assistente de IA)

Para mentorandas que têm Claude pago, use a skill **sistema-gestao-dra**, que fica em `MENTORIA/_modelo-sistema-dra-completo/gestao-escritorio/skills/sistema-gestao-dra/`. Para instalar no claude.ai, envie o arquivo `sistema-gestao-dra.zip` em Configurações > Capacidades > Skills. Ela cria o mesmo sistema como artefato na conta do Claude da mentoranda, com o assistente de IA. Nesse caso os dados ficam na conta Claude dela, e não no seu banco.
