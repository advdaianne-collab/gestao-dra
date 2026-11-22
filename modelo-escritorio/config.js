/* Configuração do escritório. Edite só o que está entre aspas.
   - nome: nome do escritório, aparece no menu e no login.
   - logo: deixe 'icones/monograma.png' para usar o D.R.A., ou troque pelo arquivo da logo dela
     (PNG com fundo transparente, de preferência clara, porque o menu é escuro).
   - supabaseUrl e supabaseChave: copie do Supabase dela em Project Settings > API
     (Project URL e a chave "publishable" ou "anon public"). Nunca use a chave "service_role" ou "secret".
   Sem esses dois campos, o app abre em modo demonstração. */
window.ESCRITORIO = {
  nome: 'Nome do Escritório',
  sigla: 'D.R.A.',
  subtitulo: 'gestão do escritório',
  rodape: '',
  logo: 'icones/monograma.png',
  supabaseUrl: '',
  supabaseChave: ''
};
