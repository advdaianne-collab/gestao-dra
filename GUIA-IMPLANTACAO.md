# Guia de implantação · Gestão do Escritório (Método D.R.A.)

Este guia tem duas partes:
- **Parte A**: você faz **uma vez só**, para colocar o app no ar.
- **Parte B**: você repete **para cada mentoranda**, em uns 20 minutos.

Tudo usa planos gratuitos.

---

## Como funciona

- **Código:** um só, no seu GitHub. O GitHub Pages publica o app em `https://SEU-USUARIO.github.io/gestao-dra/`.
- **Endereço de cada mentoranda:** uma pasta própria dentro do repositório. Exemplo: `.../gestao-dra/maria-souza/`.
- **Dados:** cada mentoranda tem o próprio banco no Supabase, numa conta dela. Os dados de uma nunca passam pelo banco de outra, e você não fica guardando dados de clientes de ninguém.
- **No celular:** abre como aplicativo, com nome e ícone próprios. No iPhone, pelo Safari: Compartilhar > Adicionar à Tela de Início. No Android, pelo Chrome: Instalar app.

> **Importante (plano gratuito do GitHub):** o repositório precisa ser **público**. Isso torna público só o **código**, que não tem dado nenhum. Os dados ficam no Supabase de cada mentoranda, protegidos por login e por regras de acesso.

---

## Parte A · Uma vez só: publicar o código

1. Crie uma conta em github.com, se ainda não tiver.
2. Clique em **New repository**:
   - nome: `gestao-dra`;
   - marque **Public**;
   - clique em **Create repository**.
3. Na página do repositório, clique em **uploading an existing file**.
4. Arraste **todo o conteúdo** da pasta `app-dra`: as pastas `app`, `icones`, `modelo-escritorio`, `supabase` e os arquivos da raiz.
5. Clique em **Commit changes**.
6. Vá em **Settings > Pages** e configure:
   - **Source:** Deploy from a branch;
   - **Branch:** `main`;
   - **Pasta:** `/ (root)`.
   
   Depois clique em **Save**.
7. Em 1 a 2 minutos, abra `https://SEU-USUARIO.github.io/gestao-dra/`. Vai aparecer a **demonstração**, com dados de exemplo. É esse link que você mostra para quem está pensando em entrar na mentoria.

> Prefere não usar o site? O **GitHub Desktop** (programa gratuito) sincroniza uma pasta do seu computador com o repositório, e aí basta arrastar os arquivos.

---

## Parte B · Para cada mentoranda

### B1. Criar o banco dela (Supabase)

Faça isso **com ela**, numa chamada, usando o e-mail dela. Assim o banco fica no nome dela.

1. Ela cria uma conta em supabase.com.
2. Clique em **New project** e preencha:
   - **Name:** `escritorio`;
   - **Database Password:** gere uma senha e **guarde num lugar seguro**;
   - **Region:** **South America (São Paulo)**.
3. Espere o projeto ficar pronto (cerca de 2 minutos).
4. No menu, abra **SQL Editor > New query**.
5. Cole **todo** o conteúdo do arquivo `supabase/schema.sql` e clique em **Run**. Deve aparecer "Success".
6. Vá em **Authentication > Users > Add user > Create new user**:
   - use o e-mail dela e uma senha provisória;
   - marque **Auto Confirm User**.
7. Vá em **Authentication > Sign In / Providers** e **desligue "Allow new users to sign up"**. Assim ninguém de fora consegue criar conta no app dela.
8. Vá em **Authentication > URL Configuration**:
   - **Site URL:** `https://SEU-USUARIO.github.io/gestao-dra/nome-dela/`;
   - **Redirect URLs:** adicione o mesmo endereço.
   
   Sem isso, o link de "Esqueci a senha" não funciona.
9. Vá em **Project Settings > API** e copie:
   - **Project URL**;
   - a chave **publishable**, ou **anon public**.
   
   **Nunca** copie a chave `service_role` ou `secret`.

### B2. Criar a pasta dela no app

1. No seu GitHub, abra a pasta `modelo-escritorio`.
2. Crie a pasta dela. O jeito mais simples:
   - **Add file > Create new file**;
   - no nome, digite `nome-dela/config.js`. A barra cria a pasta.
3. No `config.js` dela, cole o conteúdo de `modelo-escritorio/config.js` e preencha:
   - `nome`: o nome do escritório dela;
   - `supabaseUrl` e `supabaseChave`: os dois valores que você copiou no passo B1.9.
4. Copie também, para dentro da pasta dela:
   - `index.html`, `manifest.webmanifest` e `sw.js`;
   - a pasta `icones`.
   
   Pelo site, isso é feito com **Add file > Upload files**, dentro da pasta dela.
5. Em `manifest.webmanifest`, troque:
   - `"name"` pelo nome completo do escritório dela;
   - `"short_name"` pelo nome curto que vai aparecer embaixo do ícone (até 12 letras).
6. Em `index.html`, troque o texto de `apple-mobile-web-app-title` pelo mesmo nome curto e o `<title>` pelo nome do escritório.

### B3. Logo e ícone dela (opcional)

- Se ela não tiver logo, deixe o monograma D.R.A., que já vem pronto.
- Se tiver logo:
  1. Abra o app dela e entre em **Ajustes > Gerar ícones a partir de uma imagem**.
  2. Escolha a logo dela, quadrada e com bom contraste.
  3. O app baixa 5 arquivos. Envie esses arquivos para a pasta `nome-dela/icones/`, substituindo os que estão lá.
  4. Para trocar a imagem do menu, envie a logo como `icones/logo.png` e coloque `logo: 'icones/logo.png'` no `config.js`. Use uma versão clara, com fundo transparente, porque o menu é escuro.

### B4. Primeiro acesso

1. Ela abre `https://SEU-USUARIO.github.io/gestao-dra/nome-dela/`, entra com o e-mail e a senha provisória, e **troca a senha** em "Esqueci a senha".
2. No primeiro acesso, o app cria sozinho o escritório dela, o manual e as listas sugeridas do quadro.
3. No celular, ela instala:
   - **iPhone:** pelo **Safari**, Compartilhar > **Adicionar à Tela de Início**;
   - **Android:** pelo **Chrome**, menu > **Instalar app**.

---

## Adicionar secretária ou outra advogada ao escritório dela

1. No Supabase dela, crie o usuário como no passo B1.6 e copie o **User UID** que aparece na lista de usuários.
2. Em **SQL Editor**, rode o comando abaixo **antes** do primeiro login da pessoa, trocando o UID:

```sql
insert into public.membros (escritorio_id, user_id, papel)
select id, 'COLE-AQUI-O-UID', 'equipe' from public.escritorios limit 1;
```

Pronto: ela entra e vê os mesmos dados do escritório.

---

## Atualizações

Quando houver versão nova, você só substitui os arquivos da pasta `app` no GitHub. **Todas as mentorandas recebem a atualização juntas**, sem perder dados.

---

## Custos e cuidados

- **GitHub Pages e Supabase gratuitos:** custo zero.
- **Supabase gratuito pausa o projeto depois de 7 dias sem uso.** Quem usa o app toda semana não percebe. Se pausar, basta entrar em supabase.com e clicar em **Restore**.
- **Limites do plano gratuito:**
  - 500 MB de banco, que é muito para texto;
  - 1 GB de arquivos, que dá centenas de PDFs.
  
  Se um escritório crescer, o plano Pro do Supabase custa cerca de US$ 25 por mês, pago por ela.
- **Backup:** em **Ajustes > Exportar backup**, o app baixa um arquivo com todos os dados, menos os arquivos anexados. Oriente que ela faça isso todo mês.
- **LGPD:**
  - os dados ficam no Supabase dela, na região de São Paulo, protegidos por login e por regras de acesso por escritório;
  - os documentos ficam numa pasta privada, e o link para abrir cada um vale só 2 minutos;
  - a controladora dos dados é a própria advogada; você só fornece a ferramenta.
