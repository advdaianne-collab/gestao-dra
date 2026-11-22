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

## Liberar uma mentoranda (1 minuto)

1. Abra o Supabase em **Authentication > Users**.
2. Clique em **Add user > Send invitation**.
3. Digite o e-mail dela e envie.
4. Ela recebe o e-mail, clica no link e cria a senha. Em seguida entra no app e informa o nome do escritório.

Se o link do convite vencer, mande outro convite. Ela também pode usar "Esqueci a senha" na tela de login.

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

No Supabase, abra **Authentication > Users**, clique nos três pontos ao lado do usuário e escolha **Delete user**. Os dados do escritório continuam guardados no banco.

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
