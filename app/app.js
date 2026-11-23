/* Gestão do Escritório · Método D.R.A. · v1
   Um só código para todas as mentorandas. Cada uma tem sua pasta com config.js
   (nome, marca e o endereço do próprio Supabase). Sem Supabase configurado, o app
   abre em modo demonstração, com dados de exemplo guardados só neste navegador. */
(() => {
'use strict';
const VERSAO = '1.1.0';
const CFG = Object.assign({
  nome: 'Escritório Modelo', sigla: 'D.R.A.', subtitulo: 'gestão do escritório', rodape: '',
  logo: '', supabaseUrl: '', supabaseChave: ''
}, window.ESCRITORIO || {});
// Três modos: artefato do Claude (modo: 'artefato'), banco Supabase (url e chave preenchidas) ou demonstração.
const ARTEFATO = CFG.modo === 'artefato';
const DEMO = !ARTEFATO && (!CFG.supabaseUrl || !CFG.supabaseChave);
const CHAVE = 'dra:' + location.pathname.replace(/index\.html$/, '');
// Armazenamento local seguro: dentro de artefatos o navegador pode bloquear o localStorage.
const LS = (() => { try { const k = '__dra'; localStorage.setItem(k, k); localStorage.removeItem(k); return localStorage; } catch { const m = {}; return { getItem: k => (k in m ? m[k] : null), setItem: (k, v) => { m[k] = String(v); }, removeItem: k => { delete m[k]; } }; } })();
// Logo do escritório: a última usada neste aparelho já aparece na tela de entrada.
CFG.logoPadrao = CFG.logo;
if (!ARTEFATO && !DEMO) { const l = LS.getItem(CHAVE + ':logo'); if (l) { CFG.logo = l; CFG.logoCliente = true; } }

/* ---------------- utilidades ---------------- */
const TZ = 'America/Sao_Paulo';
const $ = s => document.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const A = (n, a = '', b = '') => `data-act="${n}" data-a="${esc(a)}" data-b="${esc(b)}"`;
const uid = () => (crypto.randomUUID ? crypto.randomUUID() : 'x' + Date.now().toString(36) + Math.random().toString(36).slice(2));
const hoje = () => new Intl.DateTimeFormat('en-CA', { timeZone: TZ }).format(new Date());
const dnum = s => { const [a, b, c] = s.split('-').map(Number); return Date.UTC(a, b - 1, c) / 864e5; };
const dstr = n => new Date(n * 864e5).toISOString().slice(0, 10);
const somaDias = (s, n) => dstr(dnum(s) + n);
const dias = d => d ? dnum(d) - dnum(hoje()) : null;
const DS = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];
const MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
const fdata = d => { if (!d) return 'sem data'; const [a, b, c] = String(d).slice(0, 10).split('-'); return c + '/' + b + '/' + a; };
const fdia = d => d ? DS[new Date(dnum(d) * 864e5).getUTCDay()] : '';
const mesDe = d => (d || '').slice(0, 7);
const fmes = m => { const [a, b] = m.split('-'); return MESES[+b - 1] + ' de ' + a; };
const somaMes = (m, n) => { let [a, b] = m.split('-').map(Number); b += n; while (b > 12) { b -= 12; a++; } while (b < 1) { b += 12; a--; } return a + '-' + String(b).padStart(2, '0'); };
const brl = n => (Number(n) || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const numBR = v => { if (typeof v === 'number') return v; let t = String(v || '').replace(/R\$|\s/g, ''); if (t.includes(',')) t = t.replace(/\./g, '').replace(',', '.'); const n = parseFloat(t); return isNaN(n) ? 0 : n; };
const ftam = n => !n ? '' : n < 1048576 ? Math.max(1, Math.round(n / 1024)) + ' KB' : (n / 1048576).toFixed(1).replace('.', ',') + ' MB';
const pnome = n => String(n || '').trim().split(/\s+/)[0] || '';
const UF = ['', 'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SE', 'SP', 'TO'];
const trib = n => {
  const m = /\.\d{4}\.(\d)\.(\d{2})\./.exec(n || ''); if (!m) return '';
  const j = m[1], t = +m[2];
  if (j === '8') return 'TJ' + (UF[t] || m[2]);
  if (j === '4') return 'TRF' + t; if (j === '5') return 'TRT' + t; if (j === '6') return 'TRE-' + (UF[t] || m[2]);
  if (j === '3') return 'STJ'; if (j === '1') return 'STF';
  return '';
};
const wa = (tel, txt) => {
  let d = String(tel || '').replace(/\D/g, ''); if (!d) return '';
  if (d.length === 10 || d.length === 11) d = '55' + d;
  return 'https://wa.me/' + d + (txt ? '?text=' + encodeURIComponent(txt) : '');
};
function toast(m) { const t = $('#toast'); t.textContent = m; t.hidden = false; clearTimeout(toast.t); toast.t = setTimeout(() => t.hidden = true, 3400); }
async function copiar(t) { try { await navigator.clipboard.writeText(t); toast('Copiado.'); } catch { toast('Não consegui copiar. Selecione o texto e copie à mão.'); } }
function erroMsg(e) {
  const m = (e && (e.message || e.error_description || e.msg)) || String(e);
  if (/Invalid login credentials/i.test(m)) return 'E-mail ou senha incorretos.';
  if (/EMAIL_NAO_LIBERADO|Database error saving new user/i.test(m)) return 'Este e-mail ainda não foi liberado. Peça o acesso à administradora do sistema.';
  if (/Signups not allowed|signup.*disabled/i.test(m)) return 'A criação de contas está desligada no momento. Fale com a administradora.';
  if (/already registered|already been registered/i.test(m)) return 'Este e-mail já tem cadastro. Use "Entrar" ou "Esqueci a senha".';
  if (/duplicate key|already exists/i.test(m)) return 'Este e-mail já está na lista.';
  if (/Email not confirmed/i.test(m)) return 'Este e-mail ainda não foi confirmado.';
  if (/Failed to fetch|NetworkError|Load failed/i.test(m)) return 'Sem conexão com a internet. Tente de novo.';
  if (/row-level security|permission denied/i.test(m)) return 'Sem permissão para isso (regra de acesso do banco).';
  if (/Password should be/i.test(m)) return 'A senha precisa ter pelo menos 8 caracteres.';
  return m;
}

/* ---------------- tabelas e campos ---------------- */
const TABS = ['listas', 'compromissos', 'processos', 'clientes', 'publicacoes', 'comunicacoes', 'documentos', 'financeiro', 'manual'];
const TIPO = { prazo: 'Prazo', audiencia: 'Audiência', acompanhamento: 'Acompanhamento' };
const ETQ = [
  { k: 'urgente', t: 'Urgente', c: 'e-red' },
  { k: 'menor-15', t: 'Prazo curto', c: 'e-orange' },
  { k: 'docs-previos', t: 'Exige documentos', c: 'e-yellow' },
  { k: 'aguardando-cliente', t: 'Aguardando cliente', c: 'e-blue' },
  { k: 'conferencia', t: 'Conferir no sistema', c: 'e-blue' },
  { k: 'acordo', t: 'Tratativa de acordo', c: 'e-green' },
  { k: 'peticao-pronta', t: 'Petição pronta', c: 'e-lime' },
  { k: 'diario', t: 'Olhar diariamente', c: 'e-purple' }
];
const NOME = { compromissos: 'cartão', processos: 'processo', clientes: 'cliente', publicacoes: 'publicação', comunicacoes: 'rascunho', documentos: 'documento', financeiro: 'lançamento', listas: 'lista', manual: 'seção do manual' };
const opsListas = () => [['', 'Coluna do próprio tipo'], ...listasOrd().map(l => [l.id, l.nome])];
const F = {
  compromissos: [
    ['tipo', 'Tipo', 'select', { op: [['prazo', 'Prazo'], ['audiencia', 'Audiência'], ['acompanhamento', 'Acompanhamento']] }],
    ['prioridade', 'Prioridade', 'select', { op: [['normal', 'Normal'], ['alta', 'Alta']] }],
    ['titulo', 'Título', 'text', { req: 1, larga: 1, ph: 'Ex.: Contestação, Maria Silva x Banco' }],
    ['data', 'Data', 'date'], ['hora', 'Hora', 'time'],
    ['processo', 'Processo (nº CNJ)', 'text', { dl: 'processos' }], ['cliente', 'Cliente', 'text', { dl: 'clientes' }],
    ['local', 'Local ou link da audiência', 'text', { larga: 1, se: o => o.tipo === 'audiencia' }],
    ['lista', 'Lista no quadro', 'select', { op: opsListas, larga: 1 }],
    ['etiquetas', 'Etiquetas', 'etq', { larga: 1 }],
    ['descricao', 'Descrição e providência', 'textarea', { larga: 1 }],
    ['checklist', 'Checklist', 'checklist', { larga: 1 }],
    ['baixa_em', 'Data da baixa', 'date', { se: o => o.status === 'feito' }],
    ['feito_resumo', 'O que foi feito', 'textarea', { larga: 1, se: o => o.status === 'feito' }]
  ],
  processos: [
    ['titulo', 'Título do caso', 'text', { req: 1, larga: 1, ph: 'Ex.: Execução, Comércio Modelo x Fulano' }],
    ['numero', 'Número (CNJ)', 'text', { ph: '0000000-00.0000.0.00.0000' }], ['cliente', 'Cliente', 'text', { dl: 'clientes' }],
    ['parte_contraria', 'Parte contrária', 'text'], ['orgao', 'Vara ou órgão', 'text'],
    ['area', 'Área', 'text', { ph: 'Cível, trabalhista…' }], ['fase', 'Fase', 'text', { ph: 'Conhecimento, execução…' }],
    ['risco', 'Risco', 'select', { op: [['', 'Não avaliado'], ['baixo', 'Baixo'], ['médio', 'Médio'], ['alto', 'Alto']] }],
    ['valor_causa', 'Valor da causa (R$)', 'money'],
    ['situacao', 'Situação', 'select', { op: [['ativo', 'Ativo'], ['suspenso', 'Suspenso'], ['encerrado', 'Encerrado']] }],
    ['encerrado_em', 'Encerrado em', 'date', { se: o => o.situacao === 'encerrado' }],
    ['obs', 'Observações', 'textarea', { larga: 1 }]
  ],
  clientes: [
    ['nome', 'Nome ou razão social', 'text', { req: 1, larga: 1 }],
    ['cpf_cnpj', 'CPF ou CNPJ', 'text'], ['whatsapp', 'WhatsApp', 'tel', { ph: '(00) 00000-0000' }],
    ['email', 'E-mail', 'email'], ['nascimento', 'Aniversário', 'date'],
    ['endereco', 'Endereço', 'text', { larga: 1 }], ['obs', 'Observações', 'textarea', { larga: 1 }]
  ],
  publicacoes: [
    ['data', 'Data da publicação', 'date'], ['fonte', 'Fonte', 'text', { ph: 'DJEN, PJe, Projudi, e-mail…' }],
    ['processo', 'Processo (nº CNJ)', 'text', { dl: 'processos', larga: 1 }],
    ['texto', 'Teor', 'textarea', { larga: 1, req: 1 }],
    ['status', 'Situação', 'select', { op: [['nova', 'A triar'], ['triada', 'Virou prazo'], ['descartada', 'Descartada']] }]
  ],
  comunicacoes: [
    ['cliente', 'Cliente', 'text', { dl: 'clientes' }], ['processo', 'Processo', 'text', { dl: 'processos' }],
    ['data', 'Data', 'date'], ['canal', 'Canal', 'select', { op: [['WhatsApp', 'WhatsApp'], ['E-mail', 'E-mail'], ['Ligação', 'Ligação']] }],
    ['texto', 'Mensagem', 'textarea', { larga: 1, req: 1 }],
    ['status', 'Situação', 'select', { op: [['rascunho', 'A enviar'], ['enviada', 'Enviada']] }]
  ],
  documentos: [
    ['arquivo', 'Arquivo (PDF ou imagem)', 'file', { larga: 1 }],
    ['nome', 'Nome do documento', 'text', { req: 1, larga: 1 }],
    ['data', 'Data', 'date'], ['processo', 'Processo', 'text', { dl: 'processos' }], ['cliente', 'Cliente', 'text', { dl: 'clientes' }],
    ['obs', 'Observações', 'textarea', { larga: 1 }]
  ],
  financeiro: [
    ['tipo', 'Tipo', 'select', { op: [['recebimento', 'Recebimento'], ['despesa', 'Despesa']] }],
    ['valor', 'Valor (R$)', 'money', { req: 1 }],
    ['descricao', 'Descrição', 'text', { larga: 1, ph: 'Honorários iniciais, parcela 2 de 5, custas…' }],
    ['cliente', 'Cliente', 'text', { dl: 'clientes' }], ['processo', 'Processo', 'text', { dl: 'processos' }],
    ['vencimento', 'Vencimento', 'date'], ['pagamento', 'Pago em', 'date'],
    ['status', 'Situação', 'select', { op: [['pendente', 'Pendente'], ['recebido', 'Pago / recebido'], ['cancelado', 'Cancelado']] }],
    ['forma', 'Forma', 'text', { ph: 'Pix, boleto, cartão…' }],
    ['obs', 'Observações', 'textarea', { larga: 1 }]
  ],
  listas: [
    ['nome', 'Nome da lista', 'text', { req: 1, larga: 1 }],
    ['ordem', 'Posição no quadro (número menor vem antes)', 'number', { ph: '55' }],
    ['referencia', 'Uso da lista', 'select', { op: [['false', 'Lista de trabalho: entra na agenda e nos alertas'], ['true', 'Lista de consulta: não entra na agenda nem nos alertas']], larga: 1 }],
    ['obs', 'Observações', 'textarea', { larga: 1 }]
  ],
  manual: [['titulo', 'Título', 'text', { req: 1, larga: 1 }], ['ordem', 'Ordem', 'number'], ['texto', 'Texto', 'textarea', { larga: 1, rows: 14 }]]
};

/* ---------------- manual padrão ---------------- */
const MANUAL_PADRAO = [
  ['Primeiros passos', `Este é o sistema de gestão do escritório. Tudo o que você lança aqui fica guardado no seu banco de dados, e só quem tem login no seu escritório enxerga.

Comece por três cadastros: seus clientes, seus processos e os prazos que estão correndo. O Painel junta tudo isso e mostra o que vence hoje, o que está atrasado e o que vem nos próximos 7 dias.`],
  ['Instalar no celular', `No iPhone: abra o endereço do sistema no Safari, toque no botão Compartilhar (o quadrado com a seta para cima) e escolha "Adicionar à Tela de Início". O ícone do escritório aparece junto dos outros aplicativos e o sistema abre em tela cheia.

No Android: abra no Chrome, toque nos três pontos e escolha "Instalar aplicativo" ou "Adicionar à tela inicial".

No computador (Chrome ou Edge): clique no ícone de instalar, à direita da barra de endereço. O sistema passa a abrir numa janela própria.`],
  ['Agenda e quadro', `A Agenda mostra seus cartões em listas. O quadro já vem com as listas sugeridas pelo Método D.R.A.: Prazos, Aguardando resposta ou pagamento do cliente, Petições em elaboração, Comigo para fazer, Audiências, Finalizados e Varas e telefones.

- Varas e telefones é uma lista de consulta: o que fica nela não entra na agenda nem nos alertas.
- Use ◀ e ▶ no topo de cada lista para mudar a ordem, e "Editar" para renomear. Crie quantas listas quiser em "Nova lista".
- Arraste um cartão para outra coluna no computador, ou toque em "Mover" no celular.
- "Dar baixa" leva o cartão para Finalizados e pede um resumo do que foi feito.
- Use etiquetas para sinalizar urgência, documentos pendentes ou aguardando cliente.
- O botão "Ver em lista" mostra tudo em ordem de data, com busca e filtros.

Regra de ouro: a data lançada aqui é apoio. Confira sempre o prazo no sistema do tribunal.`],
  ['Publicações', `Publicações é a caixa de entrada das intimações. Lance cada intimação que chegar (DJEN, PJe, Projudi, eProc, e-mail) e decida: "Virar prazo" cria o cartão na Agenda já com o processo e o teor; "Descartar" tira da fila.

Nada fica sem destino: o número no Painel mostra quantas ainda estão a triar.`],
  ['Comunicação com o cliente', `Em Clientes, "Rascunhar atualização" monta uma mensagem com o que está em andamento e o que foi feito nos últimos 30 dias. Revise, ajuste o tom e toque em WhatsApp para abrir a conversa com o texto pronto. Depois, marque como enviada.

Nada é enviado sozinho: o sistema só prepara o texto.`],
  ['Financeiro', `Lance honorários a receber e despesas do escritório. O mês aparece com o total recebido, a receber, em atraso e o saldo. Um lançamento pendente com vencimento passado aparece como em atraso, com o botão para cobrar no WhatsApp com mensagem educada.`],
  ['Documentos', `Anexe PDFs e imagens de até 20 MB, vinculados ao processo e ao cliente. Os arquivos ficam numa pasta privada do seu banco: o link para abrir dura 2 minutos e só funciona para quem está logado.`],
  ['Backup e segurança', `Uma vez por semana, vá em Ajustes e toque em "Exportar backup". O arquivo traz todos os cadastros (os arquivos anexados ficam no banco). Guarde num lugar seguro.

- Use uma senha forte e só sua. Não compartilhe o login: crie um usuário para cada pessoa da equipe.
- Saia do sistema em computadores que não são seus.
- Os dados dos clientes são protegidos por sigilo profissional e pela LGPD. Você é a controladora desses dados.`]
];

/* ---------------- listas sugeridas do quadro (iguais ao modelo da Daianne) ---------------- */
const LISTAS_PADRAO = [
  { chave: 'prazo', nome: 'Prazos', ordem: 10 },
  { nome: 'Aguardando resposta ou pagamento do cliente', ordem: 20, referencia: false, obs: 'Cartões parados esperando documento, resposta ou pagamento do cliente.' },
  { nome: 'Petições em elaboração', ordem: 30, referencia: false, obs: 'Peças que já estão sendo redigidas.' },
  { chave: 'acompanhamento', nome: 'Comigo para fazer', ordem: 40 },
  { chave: 'audiencia', nome: 'Audiências', ordem: 50 },
  { chave: 'feito', nome: 'Finalizados', ordem: 60 },
  { nome: 'Varas e telefones', ordem: 70, referencia: true, obs: 'Lista de consulta: telefones, e-mails e balcão virtual das varas. Não entra na agenda nem nos alertas.' }
];

/* ---------------- dados de demonstração ---------------- */
function seedDemo() {
  const h = hoje(), d = n => somaDias(h, n), m = mesDe(h);
  const listas = LISTAS_PADRAO.map(l => Object.assign({ id: uid() }, l));
  const L1 = listas[1].id, L2 = listas[2].id, LV = listas[6].id;
  return {
    listas,
    clientes: [
      { id: uid(), nome: 'Maria Exemplo da Silva', cpf_cnpj: '000.000.000-00', whatsapp: '(41) 90000-0000', email: 'maria@exemplo.com', nascimento: '1985-' + h.slice(5, 7) + '-28', endereco: 'Rua Exemplo, 100, Curitiba/PR' },
      { id: uid(), nome: 'Comércio Modelo Ltda', cpf_cnpj: '00.000.000/0001-00', whatsapp: '(65) 90000-0001', email: 'financeiro@modelo.com' },
      { id: uid(), nome: 'João Fictício Souza', whatsapp: '(11) 90000-0002' }
    ],
    processos: [
      { id: uid(), titulo: 'Execução de título, Comércio Modelo x Devedor Exemplo', numero: '0001234-56.2026.8.16.0001', cliente: 'Comércio Modelo Ltda', parte_contraria: 'Devedor Exemplo', orgao: '1ª Vara Cível', area: 'Cível', fase: 'Execução', risco: 'baixo', valor_causa: 48500, situacao: 'ativo' },
      { id: uid(), titulo: 'Indenização, Maria Exemplo x Banco Fictício', numero: '0007654-32.2026.8.16.0014', cliente: 'Maria Exemplo da Silva', parte_contraria: 'Banco Fictício S.A.', orgao: '3º Juizado Especial Cível', area: 'Consumidor', fase: 'Conhecimento', risco: 'médio', valor_causa: 15000, situacao: 'ativo' },
      { id: uid(), titulo: 'Reclamação trabalhista, João Fictício x Empresa Modelo', numero: '0000999-11.2025.5.09.0002', cliente: 'João Fictício Souza', orgao: '2ª Vara do Trabalho', area: 'Trabalhista', fase: 'Sentença', risco: 'alto', situacao: 'ativo' }
    ],
    compromissos: [
      { id: uid(), tipo: 'prazo', titulo: 'Réplica, Maria Exemplo x Banco Fictício', data: d(0), processo: '0007654-32.2026.8.16.0014', cliente: 'Maria Exemplo da Silva', etiquetas: ['urgente'], checklist: [{ t: 'Ler a contestação', ok: true }, { t: 'Juntar extratos', ok: false }], prioridade: 'alta', status: 'aberto' },
      { id: uid(), tipo: 'prazo', titulo: 'Embargos de declaração, João Fictício', data: d(3), processo: '0000999-11.2025.5.09.0002', cliente: 'João Fictício Souza', etiquetas: ['menor-15'], checklist: [], prioridade: 'normal', status: 'aberto' },
      { id: uid(), tipo: 'prazo', titulo: 'Manifestação sobre penhora', data: d(-1), processo: '0001234-56.2026.8.16.0001', cliente: 'Comércio Modelo Ltda', etiquetas: ['conferencia'], checklist: [], prioridade: 'normal', status: 'aberto' },
      { id: uid(), tipo: 'audiencia', titulo: 'Audiência de conciliação, Maria Exemplo', data: d(9), hora: '14:00', local: 'Sala virtual do juizado', processo: '0007654-32.2026.8.16.0014', cliente: 'Maria Exemplo da Silva', etiquetas: ['acordo'], checklist: [], status: 'aberto' },
      { id: uid(), tipo: 'acompanhamento', titulo: 'Conferir pesquisa SISBAJUD', data: d(5), processo: '0001234-56.2026.8.16.0001', cliente: 'Comércio Modelo Ltda', etiquetas: ['diario'], checklist: [], status: 'aberto' },
      { id: uid(), tipo: 'acompanhamento', titulo: 'Pedir procuração atualizada', data: d(2), cliente: 'João Fictício Souza', lista: L1, etiquetas: ['aguardando-cliente', 'docs-previos'], checklist: [], status: 'aberto' },
      { id: uid(), tipo: 'prazo', titulo: 'Contestação, Comércio Modelo (rascunho na pasta)', data: d(6), processo: '0001234-56.2026.8.16.0001', cliente: 'Comércio Modelo Ltda', lista: L2, etiquetas: ['peticao-pronta'], checklist: [{ t: 'Revisar pedidos', ok: false }], status: 'aberto' },
      { id: uid(), tipo: 'acompanhamento', titulo: '1ª Vara Cível: (41) 0000-0000, balcão virtual das 12h às 18h', cliente: '', lista: LV, etiquetas: [], checklist: [], status: 'aberto' },
      { id: uid(), tipo: 'prazo', titulo: 'Petição inicial protocolada', data: d(-6), cliente: 'Comércio Modelo Ltda', etiquetas: [], checklist: [], status: 'feito', baixa_em: d(-6), feito_resumo: 'Inicial protocolada com pedido de citação por WhatsApp.' }
    ],
    publicacoes: [
      { id: uid(), data: d(0), fonte: 'DJEN', processo: '0001234-56.2026.8.16.0001', texto: 'Intime-se a parte exequente para indicar bens à penhora no prazo de 15 dias. (texto fictício)', status: 'nova' },
      { id: uid(), data: d(-2), fonte: 'PJe', processo: '0000999-11.2025.5.09.0002', texto: 'Ciência da sentença publicada. (texto fictício)', status: 'triada' }
    ],
    comunicacoes: [
      { id: uid(), data: d(0), cliente: 'Maria Exemplo da Silva', processo: '0007654-32.2026.8.16.0014', canal: 'WhatsApp', texto: 'Olá, Maria! Passando para contar que a réplica do seu processo está sendo finalizada hoje. Qualquer dúvida, estou à disposição.', status: 'rascunho' }
    ],
    documentos: [],
    financeiro: [
      { id: uid(), tipo: 'recebimento', descricao: 'Honorários iniciais, parcela 2 de 4', cliente: 'Comércio Modelo Ltda', valor: 1500, vencimento: m + '-10', pagamento: m + '-10', status: 'recebido', forma: 'Pix' },
      { id: uid(), tipo: 'recebimento', descricao: 'Honorários, parcela 1 de 3', cliente: 'Maria Exemplo da Silva', valor: 800, vencimento: d(-4), status: 'pendente', forma: 'Boleto' },
      { id: uid(), tipo: 'recebimento', descricao: 'Honorários, parcela 3 de 4', cliente: 'Comércio Modelo Ltda', valor: 1500, vencimento: somaMes(m, 1) + '-10', status: 'pendente', forma: 'Pix' },
      { id: uid(), tipo: 'despesa', descricao: 'Custas iniciais', valor: 312.4, vencimento: m + '-05', pagamento: m + '-05', status: 'recebido' }
    ],
    manual: MANUAL_PADRAO.map(([t, x], i) => ({ id: uid(), titulo: t, ordem: (i + 1) * 10, texto: x }))
  };
}

/* ---------------- armazenamento ---------------- */
const Local = {
  db: null,
  salvar() {
    try { LS.setItem(CHAVE + ':demo', JSON.stringify(this.db)); }
    catch { toast('O navegador ficou sem espaço para a demonstração.'); }
  },
  async init() {
    try { this.db = JSON.parse(LS.getItem(CHAVE + ':demo')); } catch { this.db = null; }
    if (!this.db) { this.db = seedDemo(); this.salvar(); }
    TABS.forEach(t => this.db[t] = this.db[t] || []);
  },
  async list(t) { return JSON.parse(JSON.stringify(this.db[t] || [])); },
  async insert(t, o) { const r = Object.assign({}, o, { id: o.id || uid(), criado_em: new Date().toISOString() }); this.db[t].push(r); this.salvar(); return JSON.parse(JSON.stringify(r)); },
  async update(t, id, p) { const r = this.db[t].find(x => x.id === id); if (!r) throw new Error('Registro não encontrado.'); Object.assign(r, p); this.salvar(); return JSON.parse(JSON.stringify(r)); },
  async remove(t, id) { this.db[t] = this.db[t].filter(x => x.id !== id); this.salvar(); },
  async upsertMany(t, rows) { rows.forEach(r => { const i = this.db[t].findIndex(x => x.id === r.id); if (i >= 0) this.db[t][i] = r; else this.db[t].push(r); }); this.salvar(); },
  async upload(file) {
    if (file.size > 2 * 1048576) throw new Error('Na demonstração o limite é 2 MB por arquivo. Com o banco ligado, vai até 20 MB.');
    const url = await new Promise((ok, no) => { const fr = new FileReader(); fr.onload = () => ok(fr.result); fr.onerror = no; fr.readAsDataURL(file); });
    const k = 'local:' + uid();
    try { LS.setItem(CHAVE + ':f:' + k, url); } catch { throw new Error('O navegador ficou sem espaço para este arquivo.'); }
    return k;
  },
  async fileUrl(k) { const u = LS.getItem(CHAVE + ':f:' + k); if (!u) throw new Error('Arquivo não encontrado.'); return URL.createObjectURL(await (await fetch(u)).blob()); },
  async removeFile(k) { LS.removeItem(CHAVE + ':f:' + k); },
  reset() { Object.keys(localStorage).filter(k => k.startsWith(CHAVE + ':')).forEach(k => LS.removeItem(k)); }
};

const Supa = {
  sb: null, esc: null, user: null,
  limpar(o) { const x = {}; Object.keys(o).forEach(k => { if (o[k] !== undefined && k !== 'escritorio_id' && k !== 'criado_em' && k !== 'atualizado_em') x[k] = o[k] === '' ? null : o[k]; }); return x; },
  async list(t) {
    let all = [], de = 0;
    for (;;) {
      const { data, error } = await this.sb.from(t).select('*').order('criado_em').range(de, de + 999);
      if (error) throw error;
      all = all.concat(data); if (data.length < 1000) break; de += 1000;
    }
    return all;
  },
  async insert(t, o) { const { data, error } = await this.sb.from(t).insert(this.limpar(o)).select().single(); if (error) throw error; return data; },
  async update(t, id, p) { const { data, error } = await this.sb.from(t).update(this.limpar(p)).eq('id', id).select().single(); if (error) throw error; return data; },
  async remove(t, id) { const { error } = await this.sb.from(t).delete().eq('id', id); if (error) throw error; },
  async upsertMany(t, rows) { for (let i = 0; i < rows.length; i += 400) { const { error } = await this.sb.from(t).upsert(rows.slice(i, i + 400).map(r => this.limpar(r))); if (error) throw error; } },
  async upload(file) {
    if (file.size > 20 * 1048576) throw new Error('O limite é 20 MB por arquivo.');
    const nome = file.name.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^\w.\-]+/g, '_').slice(-80);
    const path = this.esc + '/' + uid() + '-' + nome;
    const { error } = await this.sb.storage.from('documentos').upload(path, file, { contentType: file.type || 'application/octet-stream', upsert: false });
    if (error) throw error; return path;
  },
  async fileUrl(p) { const { data, error } = await this.sb.storage.from('documentos').createSignedUrl(p, 120); if (error) throw error; return data.signedUrl; },
  async removeFile(p) { await this.sb.storage.from('documentos').remove([p]); }
};
// Artefato do Claude: dados no banco do próprio artefato (capability db) e arquivos em assets.
const Cld = {
  db: null, assets: null, sample: null,
  async init() {
    const espera = p => Promise.race([p, new Promise(ok => setTimeout(() => ok(null), 12000))]);
    if (!window.claude || !window.claude.use) return false;
    [this.db, this.assets, this.sample] = await Promise.all([espera(window.claude.use('db')), espera(window.claude.use('assets')), espera(window.claude.use('sample'))]);
    return !!this.db;
  },
  limpar(o) { const x = {}; Object.keys(o).forEach(k => { if (o[k] !== undefined && k !== 'id') x[k] = o[k] === '' ? null : o[k]; }); return x; },
  async list(t) { const s = await this.db.collection(t).get(); return s.docs.filter(d => d.exists).map(d => Object.assign({}, d.data(), { id: d.id })); },
  async insert(t, o) { const id = o.id || uid(), r = Object.assign(this.limpar(o), { criado_em: new Date().toISOString() }); await this.db.collection(t).doc(id).set(r); return Object.assign({}, r, { id }); },
  async update(t, id, p) { const ref = this.db.collection(t).doc(id), r = this.limpar(p); r.atualizado_em = new Date().toISOString(); await ref.update(r); const s = await ref.get(); return Object.assign({}, s.data(), { id }); },
  async remove(t, id) { await this.db.collection(t).doc(id).delete(); },
  async upsertMany(t, rows) { for (const r of rows) await this.db.collection(t).doc(r.id || uid()).set(this.limpar(r)); },
  async upload(file) {
    if (!this.assets) throw new Error('Anexos indisponíveis aqui. Abra o sistema pela sua conta do Claude.');
    if (file.size > 20 * 1048576) throw new Error('O limite é 20 MB por arquivo.');
    const a = await this.assets.upload(file); return a.id;
  },
  async fileUrl(id) { return '/_blob/' + id; },
  async removeFile(id) { if (this.assets) try { await this.assets.delete(id); } catch (e) { console.warn(e); } }
};
const Store = ARTEFATO ? Cld : DEMO ? Local : Supa;

/* ---------------- estado ---------------- */
const S = {}; TABS.forEach(t => S[t] = []);
let carregado = false, ultimaCarga = 0, tab = 'painel';
const ui = { av: 'quadro', tipo: 'todos', etq: '', vista: '', q: '', qp: '', qc: '', qd: '', qf: '', fin: 'todos', mf: '', cm: '', cd: '', fz: 'cartoes', enc: false, man: 0, tema: LS.getItem(CHAVE + ':tema') || 'auto' };

async function carregarTudo() {
  const res = await Promise.all(TABS.map(t => Store.list(t)));
  TABS.forEach((t, i) => S[t] = res[i]);
  carregado = true; ultimaCarga = Date.now();
  if (!S.manual.length) {
    try { for (const [i, [t, x]] of MANUAL_PADRAO.entries()) S.manual.push(await Store.insert('manual', { titulo: t, ordem: (i + 1) * 10, texto: x })); } catch (e) { console.warn(e); }
  }
  // Primeiro acesso: cria as listas sugeridas do quadro (só se ainda não houver nenhuma coluna fixa salva).
  if (!S.listas.some(l => l.chave)) {
    try { for (const l of LISTAS_PADRAO) if (l.chave || !S.listas.some(x => x.nome === l.nome)) S.listas.push(await Store.insert('listas', l)); } catch (e) { console.warn(e); }
  }
}
async function salvar(t, id, obj) {
  const r = id ? await Store.update(t, id, obj) : await Store.insert(t, obj);
  const i = S[t].findIndex(x => x.id === r.id); if (i >= 0) S[t][i] = r; else S[t].push(r);
  return r;
}
async function apagar(t, id) { await Store.remove(t, id); S[t] = S[t].filter(x => x.id !== id); }

/* ---------------- regras ---------------- */
const etqDe = c => (Array.isArray(c.etiquetas) ? c.etiquetas : []).map(k => ETQ.find(e => e.k === k)).filter(Boolean);
const etqs = c => { const a = etqDe(c); return a.length ? `<div class="etqs">${a.map(e => `<span class="etq ${e.c}">${esc(e.t)}</span>`).join('')}</div>` : ''; };
function urg(c) {
  if (c.status === 'feito') return { k: 'ok', t: 'Concluído' };
  const n = dias(c.data);
  if (n === null) return { k: 'mute', t: 'Sem data' };
  if (n < 0) return c.tipo === 'prazo' ? { k: 'crit', t: 'Sem baixa há ' + (-n) + (n === -1 ? ' dia' : ' dias') } : { k: 'warn', t: c.tipo === 'audiencia' ? 'Data passada, sem baixa' : 'Revisão pendente' };
  if (n === 0) return { k: 'crit', t: 'Hoje' };
  if (n === 1) return { k: 'crit', t: 'Amanhã' };
  return { k: n <= 7 ? 'warn' : 'mute', t: 'Em ' + n + ' dias' };
}
const ord = (a, b) => (a.data || '9999').localeCompare(b.data || '9999') || (a.hora || '').localeCompare(b.hora || '');
const listasOrd = () => S.listas.filter(l => !l.chave).sort((a, b) => (numBR(a.ordem) || 55) - (numBR(b.ordem) || 55) || (a.nome || '').localeCompare(b.nome || ''));
const listaDe = id => S.listas.find(l => l.id === id && !l.chave);
const ehRefL = l => !!l && (l.referencia === true || l.referencia === 'true');
const ehRef = c => ehRefL(c.lista && listaDe(c.lista));
const abertos = () => S.compromissos.filter(c => c.status !== 'feito' && !ehRef(c));
const semLista = c => !c.lista || !listaDe(c.lista);
const finStatus = f => f.status === 'pendente' && f.vencimento && dias(f.vencimento) < 0 ? 'atraso' : f.status;
const FST = { recebido: ['Pago', 'ok'], pendente: ['A receber', 'info'], atraso: ['Em atraso', 'crit'], cancelado: ['Cancelado', 'mute'] };
const cliDe = n => S.clientes.find(c => c.nome && n && c.nome.trim().toLowerCase() === String(n).trim().toLowerCase());
function nomesClientes() { return [...new Set([...S.clientes.map(c => c.nome), ...S.processos.map(p => p.cliente), ...S.compromissos.map(c => c.cliente)].filter(Boolean).map(s => s.trim()))].sort((a, b) => a.localeCompare(b, 'pt')); }

function pascoa(y) { const a = y % 19, b = Math.floor(y / 100), c = y % 100, d = Math.floor(b / 4), e = b % 4, f = Math.floor((b + 8) / 25), g = Math.floor((b - f + 1) / 3), h = (19 * a + b - d - g + 15) % 30, i = Math.floor(c / 4), k = c % 4, l = (32 + 2 * e + 2 * i - h - k) % 7, m = Math.floor((a + 11 * h + 22 * l) / 451), mo = Math.floor((h + l - 7 * m + 114) / 31), da = ((h + l - 7 * m + 114) % 31) + 1; return y + '-' + String(mo).padStart(2, '0') + '-' + String(da).padStart(2, '0'); }
const ferCache = {};
function feriados(y) {
  if (ferCache[y]) return ferCache[y];
  const p = pascoa(y), f = {};
  [['01-01', 'Confraternização Universal'], ['04-21', 'Tiradentes'], ['05-01', 'Dia do Trabalho'], ['09-07', 'Independência'], ['10-12', 'Nossa Senhora Aparecida'], ['11-02', 'Finados'], ['11-15', 'Proclamação da República'], ['11-20', 'Consciência Negra'], ['12-25', 'Natal'], ['12-20', 'Início do recesso forense'], ['01-20', 'Último dia do recesso forense']].forEach(([d, t]) => f[y + '-' + d] = t);
  f[somaDias(p, -48)] = 'Carnaval'; f[somaDias(p, -47)] = 'Carnaval'; f[somaDias(p, -46)] = 'Quarta-feira de Cinzas (meio expediente)';
  f[somaDias(p, -2)] = 'Sexta-feira Santa'; f[somaDias(p, 60)] = 'Corpus Christi';
  return ferCache[y] = f;
}
const ferDe = d => feriados(+d.slice(0, 4))[d];

/* ---------------- pedaços de tela ---------------- */
const vazio = (t, d) => `<div class="empty"><b>${carregado ? esc(t) : 'Carregando…'}</b>${carregado ? esc(d || '') : ''}</div>`;
const lista = (arr, fn, t, d) => `<div class="list">${arr.length ? arr.map(fn).join('') : vazio(t, d)}</div>`;
const cnj = n => n ? `<button type="button" class="cnj" ${A('cp', n)} title="Toque para copiar o número">${esc(n)}</button>` : '';
const docsDe = f => S.documentos.filter(f);
const linksDocs = ds => ds.length ? `<div class="docs">${ds.map(d => `<button type="button" ${A('abrirdoc', d.id)}>${esc(d.nome)}</button>`).join('')}</div>` : '';

function rowC(c) {
  const u = urg(c), fe = c.status === 'feito', dt = fe && c.baixa_em ? c.baixa_em : c.data, ck = Array.isArray(c.checklist) ? c.checklist : [];
  return `<div class="row u-${u.k}${fe ? ' done' : ''}">
    <div class="when">${esc(fdata(dt))}<small>${fe ? 'baixa' : esc(fdia(c.data)) + (c.hora ? ' · ' + esc(c.hora) : '')}</small></div>
    <div class="main"><span class="tag">${esc(TIPO[c.tipo] || c.tipo || '')}${c.lista && listaDe(c.lista) ? ' · ' + esc(listaDe(c.lista).nome) : ''}</span>
      <button type="button" class="abre" ${A('edit', 'compromissos', c.id)}>${esc(c.titulo)}</button>
      ${etqs(c)}
      <div class="meta">${cnj(c.processo)}${trib(c.processo) ? `<span>${trib(c.processo)}</span>` : ''}${c.cliente ? `<span>${esc(c.cliente)}</span>` : ''}${c.local ? `<span>${esc(c.local)}</span>` : ''}${ck.length ? `<span>Checklist ${ck.filter(i => i.ok).length} de ${ck.length}</span>` : ''}</div>
      ${c.descricao ? `<p class="txt">${esc(c.descricao)}</p>` : ''}
      ${fe && c.feito_resumo ? `<p class="txt"><b>O que foi feito:</b> ${esc(c.feito_resumo)}</p>` : ''}
      ${linksDocs(docsDe(d => d.compromisso_id === c.id))}
    </div>
    <div class="side"><span class="pill ${u.k}">${esc(u.t)}</span>${!fe && c.prioridade === 'alta' ? '<span class="pill crit">Prioridade</span>' : ''}
      <div class="acts">${fe ? `<button class="btn sm" ${A('reabrir', c.id)}>Reabrir</button>` : `<button class="btn sm ok" ${A('baixa', c.id)}>Dar baixa</button>`}
      <button class="btn sm" ${A('edit', 'compromissos', c.id)}>Abrir</button></div></div></div>`;
}
function cardC(c) {
  const u = urg(c), fe = c.status === 'feito', alta = c.prioridade === 'alta' && !fe, ck = Array.isArray(c.checklist) ? c.checklist : [];
  return `<article class="card u-${u.k}" draggable="true" data-id="${esc(c.id)}">
    <div class="meta"><span class="when">${esc(fdata(fe && c.baixa_em ? c.baixa_em : c.data))}${!fe && c.hora ? ' · ' + esc(c.hora) : ''}</span><span class="pill ${u.k}">${esc(u.t)}</span>${alta ? '<span class="pill crit">Prioridade</span>' : ''}</div>
    ${etqs(c)}
    <button type="button" class="abre" ${A('edit', 'compromissos', c.id)}>${esc(c.titulo)}</button>
    <div class="meta">${cnj(c.processo)}${c.cliente ? `<span>${esc(c.cliente)}</span>` : ''}${ck.length ? `<span>Checklist ${ck.filter(i => i.ok).length}/${ck.length}</span>` : ''}</div>
    <div class="acts">${fe ? `<button class="btn sm" ${A('reabrir', c.id)}>Reabrir</button>` : `<button class="btn sm ok" ${A('baixa', c.id)}>Dar baixa</button><button class="btn sm" ${A('prio', c.id)}>${alta ? 'Tirar prioridade' : 'Priorizar'}</button><button class="btn sm" ${A('mover', c.id)}>Mover</button>`}</div></article>`;
}
// Colunas fixas: [tipo, nome padrão, posição padrão, texto quando vazia]. Nome e posição podem ser mudados
// e ficam guardados numa lista com "chave" igual ao tipo.
const FIX = [['prazo', 'Prazos', 10, 'Nenhum prazo em aberto.'], ['acompanhamento', 'Comigo para fazer', 40, 'Nada pendente com você.'], ['audiencia', 'Audiências', 50, 'Nenhuma audiência marcada.'], ['feito', 'Finalizados', 60, 'Solte aqui o que foi cumprido.']];
const docFix = k => S.listas.find(l => l.chave === k);
function colunas() {
  const ab = abertos().sort(ord);
  const a = FIX.map(([k, t, pad, v]) => {
    const d = docFix(k), o = d && d.ordem !== '' && d.ordem != null ? (numBR(d.ordem) || pad) : pad;
    const arr = k === 'feito' ? S.compromissos.filter(c => c.status === 'feito').sort((x, y) => (y.baixa_em || '').localeCompare(x.baixa_em || '')).slice(0, 8) : ab.filter(c => c.tipo === k && semLista(c));
    return { k, t: (d && d.nome) || t, ord: o, fixa: d, arr, v };
  });
  const b = listasOrd().map(l => ({ k: 'L:' + l.id, t: l.nome || 'sem nome', ord: numBR(l.ordem) || 55, lst: l, ref: ehRefL(l), arr: S.compromissos.filter(c => c.status !== 'feito' && c.lista === l.id).sort(ord), v: ehRefL(l) ? 'Lista de consulta vazia.' : 'Nada nesta lista ainda.' }));
  return [...a, ...b].sort((x, y) => x.ord - y.ord);
}
const coluna = (co, i, todas) => `<section class="col${co.ref ? ' ref' : ''}" data-col="${esc(co.k)}"><header><h2 title="${esc(co.t)}">${esc(co.t)}</h2><span class="acts">${i > 0 ? `<button class="btn sm" ${A('colmv', -1, co.k)} title="Mover esta lista para a esquerda" aria-label="Mover ${esc(co.t)} para a esquerda">◀</button>` : ''}${i < todas.length - 1 ? `<button class="btn sm" ${A('colmv', 1, co.k)} title="Mover esta lista para a direita" aria-label="Mover ${esc(co.t)} para a direita">▶</button>` : ''}<button class="btn sm" ${co.lst ? A('edit', 'listas', co.lst.id) : A('renfix', co.k)} title="Renomear${co.lst ? ' ou excluir' : ''} esta lista">Editar</button><span class="badge i">${co.arr.length}</span></span></header>${co.ref ? '<p class="note">Consulta: não entra na agenda nem nos alertas.</p>' : ''}${co.arr.length ? co.arr.map(cardC).join('') : `<div class="empty">${carregado ? esc(co.v) : 'Carregando…'}</div>`}</section>`;
async function posCol(co, v) {
  if (co.lst) return salvar('listas', co.lst.id, { ordem: v });
  if (co.fixa) return salvar('listas', co.fixa.id, { ordem: v });
  return salvar('listas', null, { chave: co.k, nome: co.t, ordem: v });
}

/* ---------------- seções ---------------- */
const V = {};
V.painel = {
  nome: 'Painel', body() {
    const ab = abertos().sort(ord);
    const venc = ab.filter(c => c.tipo === 'prazo' && c.data && dias(c.data) < 0);
    const hj = ab.filter(c => dias(c.data) === 0);
    const sem = ab.filter(c => { const n = dias(c.data); return n !== null && n > 0 && n <= 7; });
    const aud = ab.filter(c => c.tipo === 'audiencia' && c.data && dias(c.data) >= 0);
    const pubs = S.publicacoes.filter(p => p.status === 'nova');
    const atraso = S.financeiro.filter(f => f.tipo === 'recebimento' && finStatus(f) === 'atraso');
    const m = mesDe(hoje()), aRec = S.financeiro.filter(f => f.tipo === 'recebimento' && f.status === 'pendente' && mesDe(f.vencimento) === m).reduce((a, f) => a + numBR(f.valor), 0);
    const prox = ab.filter(c => { const n = dias(c.data); return n !== null && n >= 0 && n <= 14; }).slice(0, 8);
    const mm = hoje().slice(5, 7), aniv = S.clientes.filter(c => c.nascimento && c.nascimento.slice(5, 7) === mm).sort((a, b) => a.nascimento.slice(8).localeCompare(b.nascimento.slice(8)));
    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent) && !navigator.standalone && !LS.getItem(CHAVE + ':dica');
    return `${ios ? `<div class="demo">Para instalar no iPhone: toque em <b>Compartilhar</b> e depois em <b>Adicionar à Tela de Início</b>. <button class="btn sm" ${A('dica')}>Entendi</button></div>` : ''}
    <div class="tiles">
      <button type="button" class="tile ${venc.length ? 'crit' : ''}" ${A('vista', 'venc')}><b>${venc.length}</b><span>Prazos sem baixa</span></button>
      <button type="button" class="tile ${hj.length ? 'crit' : ''}" ${A('vista', 'hoje')}><b>${hj.length}</b><span>Vence hoje</span></button>
      <button type="button" class="tile ${sem.length ? 'warn' : ''}" ${A('vista', 'sem')}><b>${sem.length}</b><span>Próximos 7 dias</span></button>
      <button type="button" class="tile" ${A('vista', 'aud')}><b>${aud.length}</b><span>Audiências marcadas</span></button>
      <button type="button" class="tile ${pubs.length ? 'warn' : ''}" ${A('ir', 'publicacoes')}><b>${pubs.length}</b><span>Publicações a triar</span></button>
      <button type="button" class="tile ${atraso.length ? 'crit' : ''}" ${A('ir', 'financeiro')}><b class="v">${esc(brl(aRec))}</b><span>A receber no mês${atraso.length ? ' · ' + atraso.length + ' em atraso' : ''}</span></button>
    </div>
    <div class="sec-h"><h2>Próximos 14 dias</h2><span class="acts"><button class="btn" ${A('ir', 'agenda')}>Abrir o quadro</button><button class="btn pri" ${A('new', 'compromissos')}>Novo cartão</button></span></div>
    ${lista([...venc, ...prox.filter(c => !venc.includes(c))], rowC, 'Nada para os próximos 14 dias.', ' Cadastre prazos, audiências e acompanhamentos pelo botão acima.')}
    ${aniv.length ? `<div class="sec-h"><h2>Aniversariantes de ${esc(MESES[+mm - 1])}</h2></div><div class="list">${aniv.map(c => `<div class="row u-mute"><div class="when">${esc(c.nascimento.slice(8) + '/' + mm)}</div><div class="main"><strong>${esc(c.nome)}</strong></div><div class="side"><div class="acts">${c.whatsapp ? `<a class="btn sm" href="${esc(wa(c.whatsapp, 'Olá, ' + pnome(c.nome) + '! Passando para desejar um feliz aniversário, com muita saúde e conquistas. Um abraço!'))}" target="_blank" rel="noopener">Parabenizar</a>` : ''}</div></div></div>`).join('')}</div>` : ''}`;
  }
};
V.agenda = {
  nome: 'Agenda', body() {
    const VST = { venc: 'Prazos sem baixa', hoje: 'Vence hoje', sem: 'Próximos 7 dias', aud: 'Audiências marcadas' };
    const topo = `<div class="tools"><button class="chip" aria-pressed="${ui.av === 'quadro'}" ${A('av', 'quadro')}>Quadro</button><button class="chip" aria-pressed="${ui.av === 'lista'}" ${A('av', 'lista')}>Ver em lista</button><span style="flex:1"></span>${ui.av === 'quadro' ? `<button class="btn" ${A('new', 'listas')}>Nova lista</button>` : ''}<button class="btn pri" ${A('new', 'compromissos')}>Novo cartão</button></div>`;
    if (ui.av === 'quadro') return topo + `<p class="note">Arraste um cartão para outra coluna (no celular, toque em Mover). Soltar em Finalizados abre a baixa.</p><div class="board">${colunas().map(coluna).join('')}</div>`;
    return topo + `${ui.vista ? `<div class="tools"><button class="chip" aria-pressed="true" ${A('vista', '')}>${esc(VST[ui.vista])} ✕</button></div>` : ''}
      <div class="tools">${['todos', 'prazo', 'audiencia', 'acompanhamento'].map(t => `<button class="chip" aria-pressed="${ui.tipo === t}" ${A('tipo', t)}>${t === 'todos' ? 'Todos' : TIPO[t] + 's'}</button>`).join('')}</div>
      <div class="tools"><input type="search" data-q="q" placeholder="Buscar por processo, cliente ou título" value="${esc(ui.q)}" aria-label="Buscar na agenda">
      <select data-ui="etq" aria-label="Filtrar por etiqueta" style="flex:0 1 230px;width:auto"><option value="">Todas as etiquetas</option>${ETQ.map(e => `<option value="${e.k}"${ui.etq === e.k ? ' selected' : ''}>${esc(e.t)}</option>`).join('')}</select></div>
      <div id="corpo"></div>`;
  },
  corpo() {
    const q = ui.q.trim().toLowerCase();
    const vf = c => { const n = dias(c.data); if (ui.vista === 'venc') return c.tipo === 'prazo' && c.data && n < 0; if (ui.vista === 'hoje') return n === 0; if (ui.vista === 'sem') return n !== null && n > 0 && n <= 7; if (ui.vista === 'aud') return c.tipo === 'audiencia' && n !== null && n >= 0; return true; };
    const arr = abertos().filter(c => vf(c) && (ui.tipo === 'todos' || c.tipo === ui.tipo) && (!ui.etq || etqDe(c).some(e => e.k === ui.etq)) && (!q || [c.titulo, c.processo, c.cliente, c.descricao, ...etqDe(c).map(e => e.t)].join(' ').toLowerCase().includes(q))).sort(ord);
    return lista(arr, rowC, 'Nenhum cartão neste filtro.', ' Ajuste o filtro ou cadastre um novo.');
  }
};
V.calendario = {
  nome: 'Calendário', body() {
    const h = hoje(); if (!ui.cm) ui.cm = mesDe(h); if (!ui.cd) ui.cd = h;
    const [y, mo] = ui.cm.split('-').map(Number);
    const ini = ui.cm + '-01', dow = new Date(dnum(ini) * 864e5).getUTCDay(), start = somaDias(ini, -dow);
    const porDia = {};
    const put = (d, o) => { if (d) (porDia[d] = porDia[d] || []).push(o); };
    S.compromissos.forEach(c => put(c.status === 'feito' || ehRef(c) ? null : c.data, { k: c.tipo, t: (c.hora ? c.hora + ' ' : '') + c.titulo }));
    S.financeiro.filter(f => f.status === 'pendente').forEach(f => put(f.vencimento, { k: 'fin', t: (f.tipo === 'despesa' ? 'Pagar ' : 'Receber ') + brl(f.valor) }));
    let cel = '';
    const nDias = new Date(Date.UTC(y, mo, 0)).getUTCDate(), total = Math.ceil((dow + nDias) / 7) * 7;
    for (let i = 0; i < total; i++) {
      const d = somaDias(start, i); const it = porDia[d] || []; const fer = ferDe(d);
      const todos = (fer ? [{ k: 'fer', t: fer }] : []).concat(it);
      cel += `<button type="button" class="d${mesDe(d) !== ui.cm ? ' fora' : ''}${d === h ? ' hj' : ''}${d === ui.cd ? ' sel' : ''}" ${A('dia', d)} aria-label="${esc(fdata(d) + (todos.length ? ', ' + todos.length + ' itens' : ''))}"><span class="dn">${+d.slice(8)}</span>
        ${todos.slice(0, 3).map(o => `<span class="ci k-${o.k}">${esc(o.t)}</span>`).join('')}${todos.length > 3 ? `<span class="mais">+${todos.length - 3}</span>` : ''}
        <span class="pts">${todos.slice(0, 5).map(o => `<i class="pt k-${o.k}"></i>`).join('')}</span></button>`;
    }
    const sel = ui.cd, doDia = S.compromissos.filter(c => c.data === sel).sort(ord), finDia = S.financeiro.filter(f => f.vencimento === sel && f.status === 'pendente'), ferSel = ferDe(sel);
    return `<div class="cal"><div class="cal-h"><b>${esc(MESES[mo - 1])} ${y}</b><span class="cal-n"><button class="btn sm" ${A('mes', -1)} aria-label="Mês anterior">◀</button><button class="btn sm" ${A('mes', 0)}>Hoje</button><button class="btn sm" ${A('mes', 1)} aria-label="Próximo mês">▶</button></span></div>
      <div class="sem">${DS.map(d => `<span>${d}</span>`).join('')}</div><div class="gde">${cel}</div>
      <div class="leg"><span><i class="pt k-prazo"></i>Prazo</span><span><i class="pt k-audiencia"></i>Audiência</span><span><i class="pt k-acompanhamento"></i>Acompanhamento</span><span><i class="pt k-fin"></i>Financeiro</span><span><i class="pt k-fer"></i>Feriado nacional</span></div></div>
      <div class="sec-h"><h2>${esc(fdia(sel))}, ${esc(fdata(sel))}</h2><button class="btn pri" ${A('newdia', sel)}>Novo neste dia</button></div>
      ${ferSel ? `<p class="note">${esc(ferSel)}. Confira também os feriados do seu estado, do município e as portarias do tribunal.</p>` : ''}
      ${lista(doDia, rowC, 'Nada marcado neste dia.', '')}
      ${finDia.length ? `<div class="list">${finDia.map(rowF).join('')}</div>` : ''}`;
  }
};
V.processos = {
  nome: 'Processos', body() {
    return `<div class="tools"><input type="search" data-q="qp" placeholder="Buscar por número, parte ou cliente" value="${esc(ui.qp)}" aria-label="Buscar processos"><label class="chk"><input type="checkbox" data-ui="enc"${ui.enc ? ' checked' : ''}> Mostrar encerrados</label><button class="btn pri" ${A('new', 'processos')}>Novo processo</button></div><div id="corpo"></div>`;
  },
  corpo() {
    const q = ui.qp.trim().toLowerCase();
    const arr = S.processos.filter(p => (ui.enc || p.situacao !== 'encerrado') && (!q || [p.numero, p.titulo, p.cliente, p.parte_contraria, p.orgao].join(' ').toLowerCase().includes(q))).sort((a, b) => (a.cliente || '').localeCompare(b.cliente || '', 'pt') || (a.titulo || '').localeCompare(b.titulo || '', 'pt'));
    return lista(arr, p => {
      const cs = abertos().filter(c => c.processo && p.numero && c.processo.trim() === p.numero.trim()).sort(ord);
      const rk = { alto: 'crit', 'médio': 'warn', baixo: 'mute' }[p.risco];
      const nd = docsDe(d => p.numero && d.processo === p.numero).length;
      return `<div class="row${p.situacao === 'encerrado' ? ' done' : ''}"><div class="when">${esc(trib(p.numero) || 's/ nº')}<small>${esc(p.area || '')}</small></div>
        <div class="main"><strong>${esc(p.titulo)}</strong><div class="meta">${cnj(p.numero)}<span>${esc(p.cliente || 'Sem cliente')}</span>${p.parte_contraria ? `<span>x ${esc(p.parte_contraria)}</span>` : ''}${p.orgao ? `<span>${esc(p.orgao)}</span>` : ''}${p.fase ? `<span>${esc(p.fase)}</span>` : ''}${p.valor_causa ? `<span>${esc(brl(p.valor_causa))}</span>` : ''}</div>${p.obs ? `<p class="txt">${esc(p.obs)}</p>` : ''}</div>
        <div class="side">${rk ? `<span class="pill ${rk}">Risco ${esc(p.risco)}</span>` : ''}${p.situacao && p.situacao !== 'ativo' ? `<span class="pill mute">${esc(p.situacao)}</span>` : ''}${cs.length ? `<span class="pill ${urg(cs[0]).k}">${cs.length} em aberto · ${esc(fdata(cs[0].data))}</span>` : ''}
        <div class="acts"><button class="btn sm" ${A('novoprazo', p.id)}>Novo prazo</button>${p.numero ? `<button class="btn sm" ${A('agendade', p.numero)}>Ver agenda</button><button class="btn sm" ${A('docsde', p.numero)}>Documentos (${nd})</button>` : ''}<button class="btn sm" ${A('edit', 'processos', p.id)}>Editar</button></div></div></div>`;
    }, 'Nenhum processo neste filtro.', ' Cadastre o primeiro pelo botão acima.');
  }
};
V.clientes = {
  nome: 'Clientes', body() {
    return `<div class="tools"><input type="search" data-q="qc" placeholder="Buscar por nome, contato ou documento" value="${esc(ui.qc)}" aria-label="Buscar clientes"><button class="btn pri" ${A('new', 'clientes')}>Novo cliente</button></div><div id="corpo"></div>`;
  },
  corpo() {
    const nomes = nomesClientes(), q = ui.qc.trim().toLowerCase();
    const vis = !q ? nomes : nomes.filter(n => { const k = cliDe(n) || {}; return [n, k.whatsapp, k.email, k.cpf_cnpj, k.obs].join(' ').toLowerCase().includes(q); });
    return `<p class="note">${vis.length} de ${nomes.length} clientes. Processos e cartões lançados com o mesmo nome aparecem juntos.</p>` + lista(vis, n => {
      const k = cliDe(n), ps = S.processos.filter(p => p.cliente === n && p.situacao !== 'encerrado'), cs = abertos().filter(c => c.cliente === n).sort(ord);
      return `<div class="row"><div class="when">${ps.length}<small>${ps.length === 1 ? 'processo' : 'processos'}</small></div>
        <div class="main"><strong>${esc(n)}</strong><div class="meta">${k && k.whatsapp ? `<span>${esc(k.whatsapp)}</span>` : '<span>Sem contato cadastrado</span>'}${k && k.email ? `<span>${esc(k.email)}</span>` : ''}${k && k.cpf_cnpj ? `<span>${esc(k.cpf_cnpj)}</span>` : ''}${k && k.nascimento ? `<span>Aniversário ${esc(fdata(k.nascimento).slice(0, 5))}</span>` : ''}</div>${k && k.endereco ? `<p class="txt">${esc(k.endereco)}</p>` : ''}${k && k.obs ? `<p class="txt">${esc(k.obs)}</p>` : ''}</div>
        <div class="side">${cs.length ? `<span class="pill ${urg(cs[0]).k}">${cs.length} em aberto · próximo ${esc(fdata(cs[0].data))}</span>` : '<span class="pill mute">Nada em aberto</span>'}
        <div class="acts">${k && k.whatsapp ? `<a class="btn sm" href="${esc(wa(k.whatsapp))}" target="_blank" rel="noopener">WhatsApp</a>` : ''}<button class="btn sm" ${A('rascunho', n)}>Rascunhar atualização</button>${k ? `<button class="btn sm" ${A('edit', 'clientes', k.id)}>Editar</button>` : `<button class="btn sm" ${A('cadcli', n)}>Cadastrar contato</button>`}</div></div></div>`;
    }, 'Nenhum cliente ainda.', ' Cadastre pelo botão acima ou ao lançar um processo.');
  }
};
V.publicacoes = {
  nome: 'Publicações', body() {
    const arr = [...S.publicacoes].sort((a, b) => (a.status === 'nova' ? 0 : 1) - (b.status === 'nova' ? 0 : 1) || (b.data || '').localeCompare(a.data || ''));
    return `<div class="tools"><p class="note" style="flex:1 1 240px">Caixa de entrada das intimações (DJEN, PJe, Projudi, eProc, e-mail). Cada item vira prazo ou é descartado.</p><button class="btn pri" ${A('new', 'publicacoes')}>Lançar publicação</button></div>` +
      lista(arr, p => `<div class="row${p.status === 'nova' ? ' u-info' : ' done'}"><div class="when">${esc(fdata(p.data))}<small>${esc(p.fonte || '')}</small></div>
        <div class="main"><div class="meta">${cnj(p.processo)}${trib(p.processo) ? `<span>${trib(p.processo)}</span>` : ''}</div><p class="txt">${esc(p.texto)}</p></div>
        <div class="side"><span class="pill ${p.status === 'nova' ? 'info' : 'mute'}">${esc({ nova: 'A triar', triada: 'Virou prazo', descartada: 'Descartada' }[p.status] || p.status)}</span>
        <div class="acts">${p.status === 'nova' ? `<button class="btn sm ok" ${A('triar', p.id)}>Virar prazo</button><button class="btn sm" ${A('descartar', p.id)}>Descartar</button>` : ''}<button class="btn sm" ${A('edit', 'publicacoes', p.id)}>Editar</button></div></div></div>`,
      'Nenhuma publicação lançada.', ' Lance as intimações assim que chegarem.');
  }
};
V.comunicacoes = {
  nome: 'Comunicação', body() {
    const arr = [...S.comunicacoes].sort((a, b) => (a.status === 'enviada') - (b.status === 'enviada') || (b.data || '').localeCompare(a.data || ''));
    return `<div class="tools"><p class="note" style="flex:1 1 240px">Rascunhos de mensagens para clientes. Revise, abra no WhatsApp com o texto pronto e marque como enviada. Nada é enviado sozinho.</p><button class="btn pri" ${A('new', 'comunicacoes')}>Novo rascunho</button></div>` +
      lista(arr, m => { const link = wa((cliDe(m.cliente) || {}).whatsapp, m.texto); return `<div class="row${m.status === 'enviada' ? ' done' : ' u-warn'}"><div class="when">${esc(fdata(m.data))}<small>${esc(m.canal || '')}</small></div>
        <div class="main"><strong>${esc(m.cliente || 'Sem cliente')}</strong><div class="meta">${cnj(m.processo)}</div><p class="txt">${esc(m.texto)}</p></div>
        <div class="side"><span class="pill ${m.status === 'enviada' ? 'ok' : 'warn'}">${m.status === 'enviada' ? 'Enviada' : 'A enviar'}</span>
        <div class="acts">${link ? `<a class="btn sm" href="${esc(link)}" target="_blank" rel="noopener">WhatsApp</a>` : ''}<button class="btn sm" ${A('cptexto', m.id)}>Copiar texto</button>${m.status !== 'enviada' ? `<button class="btn sm ok" ${A('enviada', m.id)}>Marcar enviada</button>` : ''}<button class="btn sm" ${A('edit', 'comunicacoes', m.id)}>Editar</button></div></div></div>`; },
      'Nenhum rascunho.', ' Use "Rascunhar atualização" em Clientes ou crie um novo.');
  }
};
V.documentos = {
  nome: 'Documentos', body() {
    return `<div class="tools"><input type="search" data-q="qd" placeholder="Buscar por nome, processo ou cliente" value="${esc(ui.qd)}" aria-label="Buscar documentos"><button class="btn pri" ${A('new', 'documentos')}>Anexar documento</button></div>
      <p class="note">PDF e imagens até ${DEMO ? '2 MB na demonstração' : '20 MB'}. Os arquivos ficam numa pasta privada; o link de abertura vale por 2 minutos.</p><div id="corpo"></div>`;
  },
  corpo() {
    const q = ui.qd.trim().toLowerCase();
    const arr = S.documentos.filter(d => !q || [d.nome, d.processo, d.cliente, d.obs].join(' ').toLowerCase().includes(q)).sort((a, b) => (b.data || '').localeCompare(a.data || '') || (a.nome || '').localeCompare(b.nome || ''));
    return lista(arr, d => `<div class="row"><div class="when">${esc(fdata(d.data))}<small>${esc(ftam(d.tamanho))}</small></div>
      <div class="main"><strong>${esc(d.nome)}</strong><div class="meta">${cnj(d.processo)}${d.cliente ? `<span>${esc(d.cliente)}</span>` : ''}${d.tipo ? `<span>${esc(d.tipo === 'application/pdf' ? 'PDF' : d.tipo.replace('image/', '').toUpperCase())}</span>` : ''}</div>${d.obs ? `<p class="txt">${esc(d.obs)}</p>` : ''}</div>
      <div class="side"><div class="acts">${d.caminho ? `<button class="btn sm" ${A('abrirdoc', d.id)}>Abrir</button>` : ''}<button class="btn sm" ${A('edit', 'documentos', d.id)}>Editar</button></div></div></div>`,
      'Nenhum documento neste filtro.', ' Anexe o primeiro pelo botão acima.');
  }
};
function rowF(f) {
  const st = finStatus(f), s = FST[st] || [st, 'mute'], k = cliDe(f.cliente), neg = f.tipo === 'despesa';
  const cob = st === 'atraso' && k && k.whatsapp ? wa(k.whatsapp, 'Olá, ' + pnome(f.cliente) + ', tudo bem? Passando para lembrar que o pagamento referente a ' + (f.descricao || 'honorários') + ', no valor de ' + brl(f.valor) + ', venceu em ' + fdata(f.vencimento) + ' e ainda consta em aberto. Se já tiver pago, por favor desconsidere e me envie o comprovante. Qualquer dúvida, estou à disposição.') : '';
  return `<div class="row u-${st === 'atraso' ? 'crit' : st === 'recebido' ? 'ok' : 'mute'}${st === 'cancelado' ? ' done' : ''}"><div class="when">${esc(fdata(f.pagamento || f.vencimento))}<small>${f.pagamento ? 'pago' : 'vence'}${f.forma ? ' · ' + esc(f.forma) : ''}</small></div>
    <div class="main"><strong>${neg ? '− ' : ''}${esc(brl(f.valor))}</strong><div class="meta"><span>${esc(f.cliente || (neg ? 'Despesa do escritório' : 'Sem cliente'))}</span>${f.descricao ? `<span>${esc(f.descricao)}</span>` : ''}</div>${f.obs ? `<p class="txt">${esc(f.obs)}</p>` : ''}</div>
    <div class="side"><span class="pill ${s[1]}">${neg ? (st === 'recebido' ? 'Paga' : st === 'atraso' ? 'Atrasada' : st === 'cancelado' ? 'Cancelada' : 'A pagar') : esc(s[0])}</span>
    <div class="acts">${cob ? `<a class="btn sm" href="${esc(cob)}" target="_blank" rel="noopener">Cobrar no WhatsApp</a>` : ''}${f.status === 'pendente' ? `<button class="btn sm ok" ${A('pago', f.id)}>${neg ? 'Marcar paga' : 'Marcar recebido'}</button>` : ''}<button class="btn sm" ${A('edit', 'financeiro', f.id)}>Editar</button></div></div></div>`;
}
V.financeiro = {
  nome: 'Financeiro', body() {
    if (!ui.mf) ui.mf = mesDe(hoje());
    const noMes = S.financeiro.filter(f => mesDe(f.pagamento || f.vencimento) === ui.mf && f.status !== 'cancelado');
    const rec = noMes.filter(f => f.tipo === 'recebimento');
    const recebido = rec.filter(f => f.status === 'recebido').reduce((a, f) => a + numBR(f.valor), 0);
    const aRec = rec.filter(f => f.status === 'pendente').reduce((a, f) => a + numBR(f.valor), 0);
    const desp = noMes.filter(f => f.tipo === 'despesa' && f.status === 'recebido').reduce((a, f) => a + numBR(f.valor), 0);
    const atrasoT = S.financeiro.filter(f => f.tipo === 'recebimento' && finStatus(f) === 'atraso');
    const arr = S.financeiro.filter(f => mesDe(f.pagamento || f.vencimento) === ui.mf && (ui.fin === 'todos' || f.tipo === ui.fin)).sort((a, b) => (a.pagamento || a.vencimento || '').localeCompare(b.pagamento || b.vencimento || ''));
    return `<div class="tools"><button class="btn sm" ${A('mesfin', -1)} aria-label="Mês anterior">◀</button><h2 style="min-width:190px;text-align:center">${esc(fmes(ui.mf))}</h2><button class="btn sm" ${A('mesfin', 1)} aria-label="Próximo mês">▶</button><span style="flex:1"></span><button class="btn pri" ${A('new', 'financeiro')}>Novo lançamento</button></div>
      <div class="tiles"><div class="tile"><b class="v">${esc(brl(recebido))}</b><span>Recebido</span></div><div class="tile"><b class="v">${esc(brl(aRec))}</b><span>A receber</span></div>
      <button type="button" class="tile ${atrasoT.length ? 'crit' : ''}" ${A('veratraso')}><b class="v">${esc(brl(atrasoT.reduce((a, f) => a + numBR(f.valor), 0)))}</b><span>Em atraso (${atrasoT.length})</span></button>
      <div class="tile"><b class="v">${esc(brl(desp))}</b><span>Despesas pagas</span></div><div class="tile ${recebido - desp < 0 ? 'crit' : ''}"><b class="v">${esc(brl(recebido - desp))}</b><span>Saldo do mês</span></div></div>
      <div class="tools">${[['todos', 'Tudo'], ['recebimento', 'Recebimentos'], ['despesa', 'Despesas']].map(([k, t]) => `<button class="chip" aria-pressed="${ui.fin === k}" ${A('fin', k)}>${t}</button>`).join('')}</div>
      ${ui.atraso ? `<div class="sec-h"><h2>Em atraso, todos os meses</h2><button class="btn sm" ${A('veratraso')}>Fechar</button></div>${lista(atrasoT, rowF, 'Nada em atraso.', '')}<div class="sec-h"><h2>Lançamentos do mês</h2></div>` : ''}
      ${lista(arr, rowF, 'Nenhum lançamento neste mês.', ' Lance honorários e despesas pelo botão acima.')}`;
  }
};
/* ---------------- assistente com IA (só na versão artefato do Claude) ---------------- */
const IA = { msgs: [], ocupado: false, parcial: '' };
const iaResumo = o => Object.fromEntries(Object.entries(o).filter(([k, v]) => v !== null && v !== '' && v !== undefined && !['criado_em', 'atualizado_em', 'checklist'].includes(k)));
const IA_TOOLS = [
  { name: 'consultar', description: 'Busca no sistema: cartões em aberto (prazos, audiências, acompanhamentos), processos, clientes e lançamentos pendentes. Use antes de alterar algo ou para responder perguntas. busca vazia traz um resumo do que vence nos próximos 7 dias.',
    inputSchema: { type: 'object', properties: { busca: { type: 'string', description: 'Nome do cliente, número do processo ou palavra do título. Vazio = próximos 7 dias.' } } },
    execute({ busca = '' }) {
      const q = busca.trim().toLowerCase(), tem = o => !q || JSON.stringify(o).toLowerCase().includes(q);
      const cart = (q ? abertos().filter(tem) : abertos().filter(c => c.data && dias(c.data) <= 7)).sort(ord).slice(0, 25).map(iaResumo);
      return { hoje: hoje(), cartoes: cart, processos: q ? S.processos.filter(tem).slice(0, 10).map(iaResumo) : [], clientes: q ? S.clientes.filter(tem).slice(0, 10).map(iaResumo) : [], financeiro_pendente: S.financeiro.filter(f => f.status === 'pendente' && tem(f)).slice(0, 10).map(iaResumo) };
    } },
  { name: 'salvar_cartao', description: 'Cria um cartão na agenda: prazo, audiência ou acompanhamento.',
    inputSchema: { type: 'object', required: ['tipo', 'titulo'], properties: { tipo: { type: 'string', enum: ['prazo', 'audiencia', 'acompanhamento'] }, titulo: { type: 'string' }, data: { type: 'string', description: 'AAAA-MM-DD' }, hora: { type: 'string', description: 'HH:MM' }, processo: { type: 'string' }, cliente: { type: 'string' }, descricao: { type: 'string' }, local: { type: 'string' }, lista: { type: 'string', description: 'Nome de uma lista do quadro, se a pessoa pedir' } } },
    async execute(i) {
      const l = i.lista ? listasOrd().find(x => x.nome.toLowerCase() === String(i.lista).toLowerCase()) : null;
      const r = await salvar('compromissos', null, { tipo: i.tipo, titulo: i.titulo, data: i.data || null, hora: i.hora || null, processo: i.processo || null, cliente: i.cliente || null, descricao: i.descricao || null, local: i.local || null, lista: l ? l.id : null, etiquetas: i.tipo === 'prazo' ? ['conferencia'] : [], checklist: [], prioridade: 'normal', status: 'aberto' });
      return { ok: true, id: r.id };
    } },
  { name: 'dar_baixa', description: 'Marca um cartão como cumprido, com o resumo do que foi feito. Use o id que veio de consultar.',
    inputSchema: { type: 'object', required: ['id'], properties: { id: { type: 'string' }, resumo: { type: 'string' } } },
    async execute({ id, resumo }) { if (!S.compromissos.find(c => c.id === id)) throw new Error('Cartão não encontrado.'); await salvar('compromissos', id, { status: 'feito', baixa_em: hoje(), feito_resumo: resumo || null }); return { ok: true }; } },
  { name: 'salvar_cliente', description: 'Cadastra um cliente novo.',
    inputSchema: { type: 'object', required: ['nome'], properties: { nome: { type: 'string' }, whatsapp: { type: 'string' }, email: { type: 'string' }, cpf_cnpj: { type: 'string' }, obs: { type: 'string' } } },
    async execute(i) { const r = await salvar('clientes', null, iaResumo(i)); return { ok: true, id: r.id }; } },
  { name: 'salvar_processo', description: 'Cadastra um processo novo.',
    inputSchema: { type: 'object', required: ['titulo'], properties: { titulo: { type: 'string' }, numero: { type: 'string' }, cliente: { type: 'string' }, parte_contraria: { type: 'string' }, orgao: { type: 'string' }, area: { type: 'string' }, fase: { type: 'string' } } },
    async execute(i) { const r = await salvar('processos', null, Object.assign({ situacao: 'ativo' }, iaResumo(i))); return { ok: true, id: r.id }; } },
  { name: 'lancar_financeiro', description: 'Lança um recebimento (honorários) ou uma despesa.',
    inputSchema: { type: 'object', required: ['tipo', 'valor'], properties: { tipo: { type: 'string', enum: ['recebimento', 'despesa'] }, valor: { type: 'number' }, descricao: { type: 'string' }, cliente: { type: 'string' }, vencimento: { type: 'string', description: 'AAAA-MM-DD' } } },
    async execute(i) { const r = await salvar('financeiro', null, Object.assign({ status: 'pendente' }, iaResumo(i))); return { ok: true, id: r.id }; } },
  { name: 'rascunhar_mensagem', description: 'Guarda em Comunicação um rascunho de mensagem para o cliente. Nunca envia: a advogada revisa e envia.',
    inputSchema: { type: 'object', required: ['texto'], properties: { cliente: { type: 'string' }, processo: { type: 'string' }, texto: { type: 'string' } } },
    async execute(i) { const r = await salvar('comunicacoes', null, { data: hoje(), canal: 'WhatsApp', status: 'rascunho', cliente: i.cliente || null, processo: i.processo || null, texto: i.texto }); return { ok: true, id: r.id }; } }
];
const iaInstrucoes = () => `Você é o assistente do sistema de gestão do escritório de advocacia "${CFG.nome}" (Método D.R.A.). Hoje é ${hoje()} (${fdia(hoje())}), fuso de Brasília. Responda em português do Brasil, de forma curta e direta.
Use as ferramentas para consultar e registrar. Antes de dar baixa ou alterar, consulte para achar o id certo. Quando faltar um dado essencial (por exemplo a data de um prazo), pergunte. Datas sempre em AAAA-MM-DD nas ferramentas e em DD/MM/AAAA nas respostas.
Prazos processuais: lembre que a data lançada é apoio e deve ser conferida no sistema do tribunal. Nunca invente número de processo, data ou valor. Mensagens para clientes ficam só como rascunho.`;
V.assistente = {
  nome: 'Assistente', body() {
    if (!Cld.sample) return vazio('O assistente funciona na versão do sistema dentro do Claude.', '');
    const bolha = m => `<div class="ia-m ${m.role === 'user' ? 'eu' : 'ia'}">${esc(m.content).replace(/\n/g, '<br>')}</div>`;
    const lista = IA.msgs.slice(2).map(bolha).join('') + (IA.ocupado ? `<div class="ia-m ia">${IA.parcial ? esc(IA.parcial).replace(/\n/g, '<br>') : 'Pensando…'}</div>` : '');
    return `<p class="note">Peça em linguagem natural. Exemplos: "o que vence esta semana?", "lança prazo de contestação do João Fictício para dia 10", "dá baixa na réplica da Maria, protocolada hoje", "rascunha uma atualização para o Comércio Modelo".</p>
      <div class="ia-chat" id="iachat">${lista || '<div class="empty">Nenhuma conversa ainda.</div>'}</div>
      <div class="ia-in"><textarea id="ia-txt" rows="2" placeholder="Escreva seu pedido…" ${IA.ocupado ? 'disabled' : ''}></textarea><button class="btn pri" ${A('ia')} ${IA.ocupado ? 'disabled' : ''}>Enviar</button>${IA.msgs.length ? `<button class="btn" ${A('ialimpa')}>Nova conversa</button>` : ''}</div>`;
  }
};
async function iaEnviar() {
  const t = ($('#ia-txt') || {}).value; if (!t || !t.trim() || IA.ocupado) return;
  if (!IA.msgs.length) IA.msgs.push({ role: 'user', content: iaInstrucoes() }, { role: 'assistant', content: 'Entendido. Como posso ajudar?' });
  IA.msgs.push({ role: 'user', content: t.trim() }); IA.ocupado = true; IA.parcial = ''; render();
  const rola = () => { const c = $('#iachat'); if (c) c.scrollTop = c.scrollHeight; }; rola();
  try {
    const r = await Cld.sample(IA.msgs, { tools: IA_TOOLS, cache: false, onText: ({ text }) => { IA.parcial = text; const c = $('#iachat'); if (c && c.lastElementChild) { c.lastElementChild.innerHTML = esc(text).replace(/\n/g, '<br>'); rola(); } } });
    IA.msgs.push({ role: 'assistant', content: r.text || '(sem resposta)' });
  } catch (e) {
    IA.msgs.push({ role: 'assistant', content: e && e.code === 'rate_limited' ? 'Muitos pedidos seguidos. Espere um minuto e tente de novo.' : e && e.code === 'not_granted' ? 'O assistente não foi autorizado neste artefato.' : 'Não consegui responder agora: ' + erroMsg(e) });
  }
  IA.ocupado = false; IA.parcial = ''; if (tab === 'assistente') { render(); rola(); }
}

/* ---------------- kit Claude (prompts, skills e agendamentos) ---------------- */
const KIT = { itens: null, erro: '' };
async function carregarKit() {
  const { data, error } = await Supa.sb.from('kit_itens').select('*').order('ordem').order('titulo');
  if (error) { KIT.erro = erroMsg(error); KIT.itens = []; } else { KIT.erro = ''; KIT.itens = data || []; }
  if (tab === 'kit') render();
}
async function baixarKit(caminho) {
  const w = window.open('', '_blank');
  try {
    const { data, error } = await Supa.sb.storage.from('kit').createSignedUrl(caminho, 300, { download: caminho.split('/').pop() });
    if (error) throw error;
    if (w) w.location.href = data.signedUrl; else location.href = data.signedUrl;
  } catch (e) { if (w) w.close(); toast(erroMsg(e)); }
}
async function atualizarKit(files) {
  let n = 0, man = null;
  for (const f of files) {
    if (/manifesto.*\.json$/i.test(f.name)) { man = JSON.parse(await f.text()); continue; }
    const { error } = await Supa.sb.storage.from('kit').upload(f.name, f, { upsert: true, contentType: f.type || 'application/octet-stream' });
    if (error) throw error; n++;
  }
  if (man) {
    const itens = (man.itens || man).map((x, i) => Object.assign({ ordem: i + 1 }, x, { atualizado_em: new Date().toISOString() }));
    const { error: e1 } = await Supa.sb.from('kit_itens').delete().neq('id', '__nada__'); if (e1) throw e1;
    const { error: e2 } = await Supa.sb.from('kit_itens').insert(itens); if (e2) throw e2;
  }
  return { arquivos: n, itens: man ? (man.itens || man).length : 0 };
}
V.kit = {
  nome: 'Kit Claude', body() {
    if (KIT.itens === null) { carregarKit(); return vazio('Carregando o kit…', ''); }
    const it = KIT.itens, por = t => it.filter(x => x.tipo === t);
    const bloco = x => `<div class="row kit u-info"><div class="main"><strong>${esc(x.titulo)}</strong>${x.grupo ? `<div class="meta"><span>${esc(x.grupo)}</span></div>` : ''}${x.descricao ? `<p class="txt">${esc(x.descricao)}</p>` : ''}</div>
      <div class="side"><div class="acts">${x.conteudo ? `<button class="btn sm${x.tipo === 'prompt' ? ' pri' : ''}" ${A('kitcopia', x.id)}>Copiar texto</button>` : ''}${x.arquivo ? `<button class="btn sm" ${A('kitbaixa', x.arquivo)}>Baixar</button>` : ''}</div></div></div>`;
    const grupos = [...new Set(por('skill').map(x => x.grupo || 'Outras'))];
    const adm = Supa.admin ? `<div class="sec-h"><h2>Atualizar o kit</h2></div><div class="row u-mute"><div class="main"><p class="txt">Só você vê esta parte. Envie os arquivos .zip das skills, o arquivo do sistema e o <b>kit-manifesto.json</b> (a lista do que aparece aqui). Arquivos com o mesmo nome são substituídos.</p></div><div class="side"><div class="acts"><button class="btn sm" ${A('kitenvia')}>Enviar arquivos</button></div></div></div><input type="file" id="kitArq" multiple hidden>` : '';
    return `<p class="note">O sistema funciona sozinho, sem precisar do Claude. Se você usa o <b>Claude no computador</b> e quer o sistema dentro dele (com assistente de IA, as skills do Método D.R.A. e as tarefas automáticas, como a varredura do DJEN), siga os passos abaixo. Comece pelo <b>prompt geral</b>: ele instala tudo de uma vez.</p>
      ${KIT.erro ? `<p class="note" style="color:var(--crit)">${esc(KIT.erro)}</p>` : ''}
      ${it.length ? '' : '<div class="empty"><b>O kit ainda está sendo preparado.</b> Volte em breve.</div>'}
      ${por('pacote').length || por('prompt').length || por('sistema').length ? `<div class="sec-h"><h2>Comece por aqui</h2></div><div class="list">${[...por('pacote'), ...por('prompt'), ...por('sistema')].map(bloco).join('')}</div>` : ''}
      ${grupos.map(g => `<div class="sec-h"><h2>Skills · ${esc(g)}</h2></div><div class="list">${por('skill').filter(x => (x.grupo || 'Outras') === g).map(bloco).join('')}</div>`).join('')}
      ${por('agendamento').length ? `<div class="sec-h"><h2>Tarefas agendadas</h2></div><div class="list">${por('agendamento').map(bloco).join('')}</div>` : ''}
      ${adm}`;
  }
};

document.addEventListener('change', async e => {
  const inp = e.target; if (!inp || inp.id !== 'kitArq' || !inp.files.length) return;
  toast('Enviando o kit…');
  try { const r = await atualizarKit([...inp.files]); toast(`Kit atualizado: ${r.arquivos} arquivo(s) e ${r.itens} item(ns).`); KIT.itens = null; render(); }
  catch (ex) { toast(erroMsg(ex)); }
});

/* ---------------- acessos (só a administradora) ---------------- */
const AC = { lista: null, erro: '' };
async function carregarAcessos() {
  const { data, error } = await Supa.sb.rpc('lista_acessos');
  if (error) { AC.erro = erroMsg(error); AC.lista = []; } else { AC.erro = ''; AC.lista = data || []; }
  if (tab === 'acessos') render();
}
const msgConvite = (nome, email) => `Olá${nome ? ', ' + pnome(nome) : ''}! Seu acesso ao Sistema de Gestão do Método D.R.A. está liberado.

1. Abra: ${location.origin + location.pathname}
2. Toque em "Primeiro acesso? Criar minha senha".
3. Use este e-mail: ${email}
4. Crie sua senha. Pronto, você já entra no seu escritório.

Depois, no celular, instale como aplicativo: no iPhone, pelo Safari, Compartilhar > Adicionar à Tela de Início; no Android, pelo Chrome, menu > Instalar app.`;
V.acessos = {
  nome: 'Acessos', body() {
    if (!Supa.admin) return vazio('Somente a administradora vê esta página.', '');
    if (AC.lista === null) { carregarAcessos(); return vazio('Carregando os acessos…', ''); }
    const st = a => a.confirmada ? (a.ultimo_acesso ? ['Usando', 'ok'] : ['Cadastrada', 'ok']) : a.cadastrada ? ['Falta confirmar o e-mail', 'warn'] : ['Liberada, ainda não criou a senha', 'info'];
    return `<p class="note">Libere o e-mail da mentoranda aqui e envie a mensagem de convite. Só quem está nesta lista consegue criar senha. Cada uma vê apenas o próprio escritório.</p>
      <form class="tools" id="fac"><input type="text" name="nome" placeholder="Nome da mentoranda" aria-label="Nome" style="flex:1 1 200px"><input type="email" name="email" placeholder="E-mail dela" aria-label="E-mail" required style="flex:1 1 240px"><button class="btn pri" type="submit">Liberar acesso</button></form>
      ${AC.erro ? `<p class="note" style="color:var(--crit)">${esc(AC.erro)}</p>` : ''}
      <div class="list">${AC.lista.length ? AC.lista.map((a, i) => { const s = st(a); return `<div class="row u-${s[1] === 'ok' ? 'ok' : s[1] === 'warn' ? 'warn' : 'info'}"><div class="when">${esc(fdata(String(a.criado_em).slice(0, 10)))}<small>liberada</small></div>
        <div class="main"><strong>${esc(a.nome || a.email)}</strong><div class="meta"><span>${esc(a.email)}</span>${a.escritorio ? `<span>${esc(a.escritorio)}</span>` : ''}${a.ultimo_acesso ? `<span>último acesso ${esc(fdata(String(a.ultimo_acesso).slice(0, 10)))}</span>` : ''}</div></div>
        <div class="side"><span class="pill ${s[1]}">${esc(s[0])}</span><div class="acts"><button class="btn sm" ${A('acmsg', i)}>Copiar convite</button>${a.cadastrada ? `<button class="btn sm" ${A('acsenha', i)}>Senha provisória</button>` : ''}<button class="btn sm danger" ${A('acrem', i)}>Remover acesso</button></div></div></div>`; }).join('') : '<div class="empty">Nenhum acesso liberado ainda.</div>'}</div>`;
  }
};
document.addEventListener('submit', async e => {
  if (!e.target || e.target.id !== 'fac') return; e.preventDefault();
  const f = e.target, email = f.email.value.trim().toLowerCase(), nome = f.nome.value.trim(), b = f.querySelector('button'); if (!email) return;
  b.disabled = true;
  try {
    const { error } = await Supa.sb.from('convites').insert({ email, nome: nome || null, convidado_por: Supa.user ? Supa.user.email : null });
    if (error) throw error;
    await copiar(msgConvite(nome, email)); toast('Acesso liberado. A mensagem de convite foi copiada: cole no WhatsApp ou no e-mail dela.');
    AC.lista = null; render();
  } catch (ex) { AC.erro = erroMsg(ex); render(); }
});

/* ---------------- relatórios mensais (um rascunho de mensagem por cliente) ---------------- */
const SEMCLI = 'Sem cliente vinculado';
const feitos = () => S.compromissos.filter(c => c.status === 'feito');
function relMes(m) {
  const g = {}, put = n => g[n] || (g[n] = { nome: n, feitos: [], pubs: [], prox: [] });
  feitos().filter(c => mesDe(c.baixa_em || c.data) === m).forEach(c => put(c.cliente || SEMCLI).feitos.push(c));
  S.publicacoes.filter(p => mesDe(p.data) === m && p.status !== 'descartada').forEach(p => { const pr = S.processos.find(x => x.numero && x.numero === p.processo); put((pr && pr.cliente) || SEMCLI).pubs.push(p); });
  Object.values(g).forEach(o => { o.prox = o.nome === SEMCLI ? [] : abertos().filter(c => c.cliente === o.nome).sort(ord); });
  return Object.values(g).sort((a, b) => (a.nome === SEMCLI) - (b.nome === SEMCLI) || a.nome.localeCompare(b.nome, 'pt'));
}
function txtRel(o, m) {
  let t = 'Olá, tudo bem? Segue o relatório de ' + fmes(m) + ' do seu caso com ' + CFG.nome + '.\n';
  if (o.feitos.length) t += '\nO que fizemos no mês:\n' + o.feitos.map(c => '• ' + fdata(c.baixa_em || c.data) + ': ' + c.titulo + (c.processo ? ' (processo nº ' + c.processo + ')' : '') + (c.feito_resumo ? '. ' + c.feito_resumo : '')).join('\n') + '\n';
  if (o.pubs.length) t += '\nIntimações recebidas e analisadas:\n' + o.pubs.map(p => '• ' + fdata(p.data) + (p.processo ? ', processo nº ' + p.processo : '')).join('\n') + '\n';
  if (o.prox.length) t += '\nPróximos passos:\n' + o.prox.map(c => '• ' + c.titulo + (c.data ? ', previsto para ' + fdata(c.data) : '')).join('\n') + '\n';
  return t + '\nQualquer dúvida, estou à disposição.';
}
V.relatorios = {
  nome: 'Relatórios mensais', body() {
    if (!ui.mr) ui.mr = mesDe(hoje());
    const m = ui.mr, arr = relMes(m);
    const topo = `<div class="tools"><button class="btn sm" ${A('mesrel', -1)} aria-label="Mês anterior">◀</button><h2 style="min-width:190px;text-align:center">${esc(fmes(m))}</h2><button class="btn sm" ${A('mesrel', 1)} aria-label="Próximo mês">▶</button></div>
      <p class="note">Entram só os clientes com movimentação no mês: baixas registradas e publicações recebidas. O texto é um rascunho: você confere, ajusta e envia.</p>`;
    if (!arr.length) return topo + vazio('Nenhuma movimentação registrada em ' + fmes(m) + '.', ' As baixas e publicações do mês aparecem aqui.');
    return topo + `<div class="list">${arr.map((o, i) => {
      const sc = o.nome === SEMCLI, t = sc ? '' : txtRel(o, m), k = cliDe(o.nome), link = k && k.whatsapp ? wa(k.whatsapp, t) : '';
      return `<div class="row${sc ? ' u-mute' : ''}"><div class="when">${o.feitos.length}<small>${o.feitos.length === 1 ? 'baixa' : 'baixas'}</small></div>
        <div class="main"><strong>${esc(o.nome)}</strong><div class="meta"><span>${o.pubs.length} ${o.pubs.length === 1 ? 'publicação' : 'publicações'}</span><span>${o.prox.length} em aberto</span></div>
        ${sc ? '<p class="txt">Itens sem cliente preenchido. Edite o cartão ou o processo para vincular.</p>' + o.feitos.map(c => `<p class="txt">${esc(c.titulo)}</p>`).join('') + o.pubs.map(p => `<p class="txt">${esc(fdata(p.data))} ${esc(p.processo || '')}</p>`).join('') : `<p class="txt pre" id="rel-${i}">${esc(t)}</p>`}</div>
        <div class="side"><div class="acts">${sc ? '' : `${link ? `<a class="btn sm pri" href="${esc(link)}" target="_blank" rel="noopener">Abrir no WhatsApp</a>` : ''}<button class="btn sm" ${A('copiarel', i)}>Copiar texto</button><button class="btn sm" ${A('salvarel', i, o.nome)}>Guardar em Comunicação</button>`}</div></div></div>`;
    }).join('')}</div>`;
  }
};
/* ---------------- indicadores do escritório ---------------- */
V.indicadores = {
  nome: 'Indicadores', body() {
    const m = mesDe(hoje()), fe = feitos(), noMes = fe.filter(c => mesDe(c.baixa_em) === m);
    const folga = fe.filter(c => c.tipo === 'prazo' && c.data && c.baixa_em).map(c => dnum(c.data) - dnum(c.baixa_em));
    const ant = folga.filter(n => n >= 1).length, dia = folga.filter(n => n === 0).length, apos = folga.filter(n => n < 0).length;
    const med = folga.length ? (folga.reduce((a, b) => a + b, 0) / folga.length).toFixed(1).replace('.', ',') : '0';
    const ab = abertos(), parados = ab.filter(c => c.tipo === 'acompanhamento' && c.data && dias(c.data) < -30).sort(ord);
    const ativos = S.processos.filter(p => p.situacao !== 'encerrado');
    const semMov = ativos.filter(p => !S.compromissos.some(c => c.processo && c.processo === p.numero && (c.status !== 'feito' || (c.baixa_em && dias(c.baixa_em) >= -60))) && !S.publicacoes.some(q => q.processo && q.processo === p.numero && q.data && dias(q.data) >= -60));
    const ms = []; for (let i = 0; i < 6; i++) ms.push(somaMes(m, -i));
    const ct = (k, t) => fe.filter(c => c.tipo === t && mesDe(c.baixa_em) === k).length;
    const tile = (n, t, cl = '') => `<div class="tile ${cl}"><b>${n}</b><span>${esc(t)}</span></div>`;
    return `<p class="note">Calculados só com o que está lançado neste sistema. Quanto mais completo o lançamento das baixas, mais fiel o retrato.</p>
      <div class="tiles">${tile(noMes.length, 'Cumpridos em ' + MESES[+m.slice(5) - 1])}${tile(ant, 'Prazos com folga')}${tile(dia, 'Prazos no último dia', dia ? 'warn' : '')}${tile(apos, 'Baixa após a data', apos ? 'crit' : '')}${tile(med, 'Folga média (dias)')}</div>
      <div class="tiles">${tile(ab.filter(c => c.tipo === 'prazo').length, 'Prazos em aberto')}${tile(parados.length, 'Comigo há mais de 30 dias', parados.length ? 'warn' : '')}${tile(ativos.length, 'Processos ativos')}${tile(semMov.length, 'Sem registro em 60 dias', semMov.length ? 'warn' : '')}</div>
      <div class="sec-h"><h2>Produção por mês</h2></div>
      <div class="tblw"><table class="tbl"><thead><tr><th>Mês</th><th>Prazos cumpridos</th><th>Audiências</th><th>Providências</th><th>Publicações recebidas</th></tr></thead><tbody>${ms.map(k => `<tr><td>${esc(fmes(k))}</td><td class="n">${ct(k, 'prazo')}</td><td class="n">${ct(k, 'audiencia')}</td><td class="n">${ct(k, 'acompanhamento')}</td><td class="n">${S.publicacoes.filter(p => mesDe(p.data) === k).length}</td></tr>`).join('')}</tbody></table></div>
      ${parados.length ? `<div class="sec-h"><h2>Comigo há mais de 30 dias</h2></div>${lista(parados, rowC, '', '')}` : ''}
      ${semMov.length ? `<div class="sec-h"><h2>Processos ativos sem registro em 60 dias</h2></div><div class="tblw"><table class="tbl"><thead><tr><th>Processo</th><th>Cliente</th><th>Número</th></tr></thead><tbody>${semMov.map(p => `<tr><td>${esc(p.titulo)}</td><td>${esc(p.cliente || '')}</td><td>${cnj(p.numero)}</td></tr>`).join('')}</tbody></table></div>` : ''}`;
  }
};
V.finalizados = {
  nome: 'Finalizados', body() {
    return `<div class="tools"><button class="chip" aria-pressed="${ui.fz === 'cartoes'}" ${A('fz', 'cartoes')}>Cartões com baixa</button><button class="chip" aria-pressed="${ui.fz === 'processos'}" ${A('fz', 'processos')}>Processos encerrados</button><input type="search" data-q="qf" placeholder="Buscar nos finalizados" value="${esc(ui.qf)}" aria-label="Buscar nos finalizados"></div><div id="corpo"></div>`;
  },
  corpo() {
    const q = ui.qf.trim().toLowerCase();
    if (ui.fz === 'processos') {
      const arr = S.processos.filter(p => p.situacao === 'encerrado' && (!q || [p.numero, p.titulo, p.cliente].join(' ').toLowerCase().includes(q))).sort((a, b) => (b.encerrado_em || '').localeCompare(a.encerrado_em || ''));
      return lista(arr, p => `<div class="row done"><div class="when">${esc(fdata(p.encerrado_em))}<small>encerrado</small></div><div class="main"><strong>${esc(p.titulo)}</strong><div class="meta">${cnj(p.numero)}<span>${esc(p.cliente || '')}</span></div></div><div class="side"><div class="acts"><button class="btn sm" ${A('reativar', p.id)}>Reativar</button><button class="btn sm" ${A('edit', 'processos', p.id)}>Editar</button></div></div></div>`, 'Nenhum processo encerrado.', '');
    }
    const arr = S.compromissos.filter(c => c.status === 'feito' && (!q || [c.titulo, c.processo, c.cliente, c.feito_resumo].join(' ').toLowerCase().includes(q))).sort((a, b) => (b.baixa_em || b.data || '').localeCompare(a.baixa_em || a.data || ''));
    return lista(arr, rowC, 'Nada finalizado ainda.', ' Os cartões chegam aqui quando você dá baixa.');
  }
};
const fmtTexto = t => esc(t || '').split(/\n{2,}/).map(b => /^- /m.test(b) && b.split('\n').every(l => /^- /.test(l) || !l.trim()) ? '<ul>' + b.split('\n').filter(l => l.trim()).map(l => '<li>' + l.replace(/^- /, '') + '</li>').join('') + '</ul>' : '<p>' + b.replace(/\n/g, '<br>') + '</p>').join('');
V.manual = {
  nome: 'Manual', body() {
    const arr = [...S.manual].sort((a, b) => numBR(a.ordem) - numBR(b.ordem));
    if (!arr.length) return vazio('O manual está vazio.', ' Crie a primeira seção.') + `<div class="tools"><button class="btn pri" ${A('new', 'manual')}>Nova seção</button></div>`;
    const i = Math.min(ui.man, arr.length - 1), s = arr[i];
    return `<div class="man"><ul class="toc">${arr.map((x, j) => `<li><button type="button" aria-current="${j === i}" ${A('man', j)}>${esc(x.titulo)}</button></li>`).join('')}<li style="margin-top:10px"><button type="button" ${A('new', 'manual')}>+ Nova seção</button></li></ul>
      <article class="doc"><h3>${esc(s.titulo)}</h3>${fmtTexto(s.texto)}<div class="dfoot"><button class="btn sm" ${A('edit', 'manual', s.id)}>Editar esta seção</button></div></article></div>`;
  }
};
V.ajustes = {
  nome: 'Ajustes', body() {
    const email = Supa.user ? Supa.user.email : '';
    return `<div class="list">
      <div class="row"><div class="when">Escritório</div><div class="main"><strong>${esc(CFG.nome)}</strong><div class="meta"><span>${DEMO ? 'Modo demonstração: dados só neste navegador' : ARTEFATO ? 'Dados guardados na sua conta do Claude' : 'Conectado ao banco do escritório'}</span>${email ? `<span>${esc(email)}</span>` : ''}<span>Versão ${VERSAO}</span></div></div><div class="side"><div class="acts">${DEMO || ARTEFATO ? '' : `<button class="btn sm" ${A('renesc')}>Nome e logo</button><button class="btn sm" ${A('senha')}>Trocar senha</button><button class="btn sm danger" ${A('sair')}>Sair</button>`}</div></div></div>
      <div class="row"><div class="when">Aparência</div><div class="main"><div class="tools">${[['auto', 'Automático'], ['claro', 'Claro'], ['escuro', 'Escuro']].map(([k, t]) => `<button class="chip" aria-pressed="${ui.tema === k}" ${A('tema', k)}>${t}</button>`).join('')}</div></div></div>
      <div class="row"><div class="when">Backup</div><div class="main"><p class="txt">Baixe um arquivo com todos os cadastros. Faça isso toda semana e guarde num lugar seguro. Os arquivos anexados não entram no backup: eles ficam na pasta privada do banco.</p></div><div class="side"><div class="acts"><button class="btn sm" ${A('exportar')}>Exportar backup</button><button class="btn sm" ${A('importar')}>Importar backup</button></div></div></div>
      <div class="row"><div class="when">Ícone do app</div><div class="main"><p class="txt">Escolha a logo quadrada do escritório (ideal 1024 × 1024 px). O sistema gera os arquivos do ícone para a tela de início do celular. Envie esses arquivos para quem cuida da implantação.</p><div class="tools"><label class="f" style="flex:1 1 220px">Cor de fundo do ícone<input type="color" id="ic-cor" value="#1A1A1A" style="height:40px;padding:2px;background:none;border:0"></label><label class="chk"><input type="checkbox" id="ic-mold" checked> Deixar margem (recomendado para Android)</label></div></div><div class="side"><div class="acts"><button class="btn sm" ${A('icones')}>Gerar ícones</button></div></div></div>
      ${DEMO ? `<div class="row"><div class="when">Demonstração</div><div class="main"><p class="txt">Volta os dados de exemplo ao estado inicial.</p></div><div class="side"><div class="acts"><button class="btn sm danger" ${A('resetdemo')}>Recomeçar demonstração</button></div></div></div>` : ''}
      <div class="row"><div class="when">Privacidade</div><div class="main"><p class="txt">Os dados deste escritório ficam no banco do próprio escritório, protegidos por login e por regras que só deixam cada usuário ver o escritório a que pertence. A titular do escritório é a controladora dos dados (LGPD) e responde pelo sigilo profissional. A criadora do modelo não tem acesso a esses dados.</p></div></div>
    </div>`;
  }
};
const NAV = [
  ['Hoje', [['painel', 'Painel'], ['agenda', 'Agenda'], ['calendario', 'Calendário'], ['finalizados', 'Finalizados']]],
  ['Escritório', [['processos', 'Processos'], ['clientes', 'Clientes'], ['publicacoes', 'Publicações'], ['comunicacoes', 'Comunicação'], ['documentos', 'Documentos']]],
  ['Resultados', [['indicadores', 'Indicadores'], ['relatorios', 'Relatórios mensais'], ['financeiro', 'Financeiro']]],
  ['Ajuda', [['manual', 'Manual'], ['ajustes', 'Ajustes']]]
];
const ICON = {
  painel: '<svg viewBox="0 0 24 24"><rect x="3.5" y="3.5" width="7" height="7" rx="1.5"/><rect x="13.5" y="3.5" width="7" height="7" rx="1.5"/><rect x="3.5" y="13.5" width="7" height="7" rx="1.5"/><rect x="13.5" y="13.5" width="7" height="7" rx="1.5"/></svg>',
  agenda: '<svg viewBox="0 0 24 24"><rect x="3.5" y="4" width="4.5" height="16" rx="1.2"/><rect x="9.75" y="4" width="4.5" height="11" rx="1.2"/><rect x="16" y="4" width="4.5" height="13.5" rx="1.2"/></svg>',
  calendario: '<svg viewBox="0 0 24 24"><rect x="3.5" y="5" width="17" height="15.5" rx="2"/><path d="M3.5 10h17M8 3v4M16 3v4"/></svg>',
  processos: '<svg viewBox="0 0 24 24"><path d="M12 4v16M6 20h12M5 7h14M5 7l-2.5 6a2.5 2.5 0 0 0 5 0L5 7zM19 7l-2.5 6a2.5 2.5 0 0 0 5 0L19 7z"/></svg>',
  mais: '<svg viewBox="0 0 24 24"><circle cx="5" cy="12" r="1.8"/><circle cx="12" cy="12" r="1.8"/><circle cx="19" cy="12" r="1.8"/></svg>'
};
function badges() {
  const ab = abertos(), crit = ab.filter(c => c.data && dias(c.data) <= 0 && (c.tipo === 'prazo' || dias(c.data) === 0)).length;
  return { agenda: crit ? `<span class="badge">${crit}</span>` : '', painel: crit ? `<span class="badge">${crit}</span>` : '', publicacoes: (n => n ? `<span class="badge i">${n}</span>` : '')(S.publicacoes.filter(p => p.status === 'nova').length), comunicacoes: (n => n ? `<span class="badge i">${n}</span>` : '')(S.comunicacoes.filter(m => m.status !== 'enviada').length) };
}

/* ---------------- montagem ---------------- */
const marcaHTML = () => `<div class="marca${CFG.logoCliente ? ' cli' : ''}">${CFG.logo ? `<img src="${esc(CFG.logo)}" alt="">` : `<span class="sigla">${esc(CFG.sigla)}</span>`}<span class="nome">${esc(CFG.nome)}</span></div>`;
function montarShell() {
  document.body.innerHTML = `<div class="app"><aside class="sidebar">${marcaHTML()}<p class="eyebrow">${esc(CFG.subtitulo)}</p><div class="rule" role="presentation"></div><nav aria-label="Seções"><div id="nav"></div></nav><p class="sub">${CFG.rodape ? esc(CFG.rodape) + '<br>' : ''}<span id="hojeTxt"></span></p></aside>
    <div class="wrap"><h1 class="pg" id="pg"></h1>${DEMO ? '<div class="demo"><b>Demonstração do sistema de gestão do Método D.R.A.</b> Os dados são de exemplo e ficam só neste navegador: pode clicar e testar à vontade.</div>' : ''}<main id="view" class="sec"></main></div></div>
    <nav id="tabbar" aria-label="Navegação principal"></nav>
    <div id="mais" hidden><div class="fundo" ${A('maisfecha')}></div><div class="folha" role="dialog" aria-label="Todas as seções"><div class="alca"></div><div class="tit">Todas as seções</div><div id="mais-in"></div></div></div>
    <dialog id="dlg"></dialog><div id="toast" role="status" hidden></div><input type="file" id="arqImport" accept="application/json,.json" hidden><input type="file" id="arqIcone" accept="image/*" hidden>`;
  ligarEventos();
}
function render() {
  if (!V[tab]) tab = 'painel';
  const bd = badges();
  $('#nav').innerHTML = NAV.map(([g, it]) => `<div class="grp">${g}</div>` + it.map(([k, t]) => `<a href="#${k}"${k === tab ? ' aria-current="page"' : ''}><span>${t}</span>${bd[k] || ''}</a>`).join('')).join('');
  $('#mais-in').innerHTML = NAV.map(([g, it]) => `<div class="grp">${g}</div><div class="lks">` + it.map(([k, t]) => `<a href="#${k}"${k === tab ? ' aria-current="page"' : ''}><span>${t}</span>${bd[k] || ''}</a>`).join('') + '</div>').join('');
  const tb = ARTEFATO && Cld.sample ? ['painel', 'agenda', 'assistente', 'calendario'] : ['painel', 'agenda', 'calendario', 'processos'];
  $('#tabbar').innerHTML = tb.map(k => `<a href="#${k}"${k === tab ? ' aria-current="page"' : ''}><span class="ic">${ICON[k]}</span>${V[k].nome}${bd[k] || ''}</a>`).join('') + `<button type="button" ${A('maisabre')}${tb.includes(tab) ? '' : ' aria-current="page"'}><span class="ic">${ICON.mais}</span>Mais</button>`;
  $('#hojeTxt').textContent = fdia(hoje()) + ', ' + fdata(hoje());
  $('#pg').textContent = V[tab].nome;
  document.title = V[tab].nome + ' · ' + CFG.nome;
  $('#view').innerHTML = V[tab].body();
  renderCorpo();
}
function renderCorpo() { const c = $('#corpo'); if (c && V[tab].corpo) c.innerHTML = V[tab].corpo(); }
function ir(t) { if (location.hash !== '#' + t) location.hash = t; else { tab = t; render(); } window.scrollTo(0, 0); }

/* ---------------- formulários ---------------- */
const dlg = () => $('#dlg');
function opts(f) { const op = typeof f[3].op === 'function' ? f[3].op() : f[3].op; return op; }
function campo(f, o) {
  const [k, rot, tipo, x = {}] = f, v = o[k] ?? '', cl = 'f' + (x.larga ? ' larga' : ''), req = x.req ? ' required' : '', ph = x.ph ? ` placeholder="${esc(x.ph)}"` : '', dl = x.dl ? ` list="dl-${x.dl}"` : '';
  const vis = x.se ? ` data-se="${k}"${x.se(o) ? '' : ' hidden'}` : '';
  if (tipo === 'select') return `<label class="${cl}"${vis}>${rot}<select name="${k}">${opts(f).map(([a, b]) => `<option value="${esc(a)}"${String(v) === String(a) ? ' selected' : ''}>${esc(b)}</option>`).join('')}</select></label>`;
  if (tipo === 'textarea') return `<label class="${cl}"${vis}>${rot}<textarea name="${k}"${req}${ph}${x.rows ? ` rows="${x.rows}" style="min-height:${x.rows * 22}px"` : ''}>${esc(v)}</textarea></label>`;
  if (tipo === 'etq') { const sel = Array.isArray(v) ? v : []; return `<fieldset class="etqf larga"${vis}><legend>${rot}</legend>${ETQ.map(e => `<label class="etqo"><input type="checkbox" name="etq" value="${e.k}"${sel.includes(e.k) ? ' checked' : ''}><span class="etq ${e.c}">${esc(e.t)}</span></label>`).join('')}</fieldset>`; }
  if (tipo === 'checklist') { const it = Array.isArray(v) ? v : []; return `<div class="${cl}"${vis}>${rot}<div class="chkb" id="chkb">${it.map(chkLinha).join('')}</div><button type="button" class="btn sm" ${A('chkadd')} style="align-self:flex-start">Adicionar item</button></div>`; }
  if (tipo === 'file') return o.id ? (o.caminho ? `<p class="note larga">Arquivo anexado: ${esc(ftam(o.tamanho))}. Para trocar, exclua e anexe de novo.</p>` : '') : `<label class="${cl}">${rot}<input type="file" name="${k}" accept="application/pdf,image/*" required></label>`;
  if (tipo === 'money') return `<label class="${cl}"${vis}>${rot}<input type="text" inputmode="decimal" name="${k}" value="${v === '' || v === null ? '' : esc(String(v).replace('.', ','))}"${req}${ph}></label>`;
  const t = { text: 'text', date: 'date', time: 'time', email: 'email', tel: 'tel', number: 'number' }[tipo] || 'text';
  return `<label class="${cl}"${vis}>${rot}<input type="${t}" name="${k}" value="${esc(v)}"${req}${ph}${dl}${t === 'number' ? ' step="any"' : ''}></label>`;
}
const chkLinha = i => `<div class="chkl"><input type="checkbox"${i.ok ? ' checked' : ''} aria-label="Feito"><input type="text" value="${esc(i.t)}" placeholder="Item"><button type="button" class="btn sm" ${A('chkdel')} aria-label="Remover item">✕</button></div>`;
const datalists = () => `<datalist id="dl-clientes">${nomesClientes().map(n => `<option value="${esc(n)}">`).join('')}</datalist><datalist id="dl-processos">${S.processos.filter(p => p.numero).map(p => `<option value="${esc(p.numero)}">${esc(p.titulo)}</option>`).join('')}</datalist>`;

function abrirForm(t, id, preset = {}, depois) {
  const o = id ? Object.assign({}, S[t].find(x => x.id === id)) : Object.assign(padroes(t), preset);
  if (id && !o.id) return toast('Registro não encontrado.');
  const d = dlg();
  d.innerHTML = `<form method="dialog" novalidate><h3>${id ? 'Editar ' : 'Novo '}${NOME[t]}</h3>${datalists()}<div class="fg">${F[t].map(f => campo(f, o)).join('')}</div><p class="err note" style="color:var(--crit)" hidden></p>
    <div class="dfoot"><span>${id ? `<button type="button" class="btn danger" ${A('excluir', t, id)}>Excluir</button>` : ''}</span><span class="acts"><button type="button" class="btn" ${A('fechar')}>Cancelar</button><button type="submit" class="btn pri">Salvar</button></span></div></form>`;
  const form = d.querySelector('form');
  form.addEventListener('change', e => { // mostra campos condicionais
    const cur = lerForm(t, form, o, true);
    form.querySelectorAll('[data-se]').forEach(el => { const f = F[t].find(x => x[0] === el.dataset.se); el.hidden = !f[3].se(Object.assign({}, o, cur)); });
    if (t === 'documentos' && e.target.name === 'arquivo' && e.target.files[0] && !form.nome.value) form.nome.value = e.target.files[0].name.replace(/\.[^.]+$/, '');
  });
  form.addEventListener('submit', async e => {
    e.preventDefault();
    const err = form.querySelector('.err'); err.hidden = true;
    const falta = F[t].filter(f => f[3] && f[3].req && f[2] !== 'file' && !String(form.elements[f[0]]?.value || '').trim()).map(f => f[1]);
    const fi = form.querySelector('input[type=file]');
    if (fi && !fi.files[0]) falta.push('Arquivo');
    if (falta.length) { err.textContent = 'Preencha: ' + falta.join(', ') + '.'; err.hidden = false; return; }
    const btn = form.querySelector('[type=submit]'); btn.disabled = true; btn.textContent = 'Salvando…';
    try {
      const dados = lerForm(t, form, o);
      if (fi && fi.files[0]) { const file = fi.files[0]; dados.caminho = await Store.upload(file); dados.tipo = file.type; dados.tamanho = file.size; }
      const r = await salvar(t, id, dados);
      d.close(); toast('Salvo.');
      if (depois) await depois(r);
      render();
    } catch (ex) { err.textContent = erroMsg(ex); err.hidden = false; btn.disabled = false; btn.textContent = 'Salvar'; }
  });
  d.showModal();
  setTimeout(() => { const f = form.querySelector('input[type=text],textarea'); if (f && !matchMedia('(max-width:960px)').matches) f.focus(); }, 30);
}
function padroes(t) {
  const h = hoje();
  return ({
    compromissos: { tipo: 'prazo', prioridade: 'normal', status: 'aberto', etiquetas: [], checklist: [], lista: '' },
    processos: { situacao: 'ativo' }, publicacoes: { data: h, status: 'nova' }, comunicacoes: { data: h, canal: 'WhatsApp', status: 'rascunho' },
    documentos: { data: h }, financeiro: { tipo: 'recebimento', status: 'pendente', vencimento: h }, listas: { ordem: 55 }, manual: { ordem: (S.manual.length + 1) * 10 }, clientes: {}
  })[t] || {};
}
function lerForm(t, form, o, parcial) {
  const r = {};
  F[t].forEach(([k, , tipo]) => {
    if (tipo === 'file') return;
    if (tipo === 'etq') { r.etiquetas = [...form.querySelectorAll('input[name=etq]:checked')].map(i => i.value); return; }
    if (tipo === 'checklist') { r.checklist = [...form.querySelectorAll('#chkb .chkl')].map(l => ({ t: l.querySelector('input[type=text]').value.trim(), ok: l.querySelector('input[type=checkbox]').checked })).filter(i => i.t); return; }
    const el = form.elements[k]; if (!el) return;
    let v = el.value.trim();
    if (tipo === 'money') v = v === '' ? null : numBR(v);
    else if (tipo === 'number') v = v === '' ? null : numBR(v);
    else if (v === '' && !parcial) v = null;
    r[k] = v;
  });
  if (t === 'compromissos' && !parcial && r.lista === null) r.lista = null;
  if (t === 'processos' && r.situacao === 'encerrado' && !r.encerrado_em && !parcial) r.encerrado_em = hoje();
  if (t === 'financeiro' && !parcial && r.status === 'recebido' && !r.pagamento) r.pagamento = hoje();
  return r;
}
function dialogoSimples(titulo, html, onOk, rotuloOk = 'Salvar') {
  const d = dlg();
  d.innerHTML = `<form method="dialog" novalidate><h3>${esc(titulo)}</h3>${html}<p class="err note" style="color:var(--crit)" hidden></p><div class="dfoot"><span></span><span class="acts"><button type="button" class="btn" ${A('fechar')}>Cancelar</button>${onOk ? `<button type="submit" class="btn pri">${esc(rotuloOk)}</button>` : ''}</span></div></form>`;
  const form = d.querySelector('form');
  form.addEventListener('submit', async e => {
    e.preventDefault(); if (!onOk) return; const err = form.querySelector('.err'); err.hidden = true;
    const btn = form.querySelector('[type=submit]'); btn.disabled = true;
    try { await onOk(form); d.close(); render(); } catch (ex) { err.textContent = erroMsg(ex); err.hidden = false; btn.disabled = false; }
  });
  d.showModal();
}
function baixa(id) {
  const c = S.compromissos.find(x => x.id === id); if (!c) return;
  dialogoSimples('Dar baixa', `<p class="note">${esc(c.titulo)}</p><div class="fg"><label class="f">Data da baixa<input type="date" name="baixa_em" value="${hoje()}"></label><label class="f larga">O que foi feito (aparece no relatório ao cliente)<textarea name="feito_resumo" placeholder="Ex.: Réplica protocolada com pedido de prova pericial.">${esc(c.feito_resumo || '')}</textarea></label></div>`,
    async f => { await salvar('compromissos', id, { status: 'feito', baixa_em: f.baixa_em.value || hoje(), feito_resumo: f.feito_resumo.value.trim() || null }); toast('Baixa registrada.'); }, 'Dar baixa');
}
function mover(id, destino) {
  if (destino === 'feito') return baixa(id);
  const p = destino.startsWith('L:') ? { lista: destino.slice(2) } : { tipo: destino, lista: null };
  return salvar('compromissos', id, p).then(render).catch(e => toast(erroMsg(e)));
}
function rascunho(nome) {
  const ab = abertos().filter(c => c.cliente === nome).sort(ord);
  const lim = somaDias(hoje(), -30), fe = S.compromissos.filter(c => c.status === 'feito' && c.cliente === nome && (c.baixa_em || '') >= lim);
  let t = 'Olá, ' + pnome(nome) + ', tudo bem? Passando para atualizar você sobre o andamento do seu caso.\n';
  if (fe.length) t += '\nO que fizemos nos últimos dias:\n' + fe.map(c => '• ' + fdata(c.baixa_em) + ': ' + c.titulo + (c.feito_resumo ? '. ' + c.feito_resumo : '')).join('\n') + '\n';
  if (ab.length) t += '\nPróximos passos:\n' + ab.map(c => '• ' + c.titulo + (c.data ? ', previsto para ' + fdata(c.data) : '')).join('\n') + '\n';
  t += '\nQualquer dúvida, estou à disposição.';
  const pr = S.processos.find(p => p.cliente === nome && p.situacao !== 'encerrado');
  abrirForm('comunicacoes', null, { cliente: nome, processo: pr ? pr.numero : '', texto: t });
}
async function abrirDoc(id) {
  const d = S.documentos.find(x => x.id === id); if (!d || !d.caminho) return toast('Documento sem arquivo.');
  const w = window.open('', '_blank');
  try { const u = await Store.fileUrl(d.caminho); if (w) w.location.href = u; else location.href = u; }
  catch (e) { if (w) w.close(); toast(erroMsg(e)); }
}
function exportar() {
  const dados = { app: 'gestao-dra', versao: VERSAO, escritorio: CFG.nome, exportado_em: new Date().toISOString(), tabelas: {} };
  TABS.forEach(t => dados.tabelas[t] = S[t]);
  const blob = new Blob([JSON.stringify(dados, null, 1)], { type: 'application/json' });
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'backup-' + CFG.nome.toLowerCase().normalize('NFD').replace(/[^\w]+/g, '-') + '-' + hoje() + '.json';
  document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  toast('Backup baixado.');
}
async function importar(file) {
  try {
    const j = JSON.parse(await file.text());
    if (j.app !== 'gestao-dra' || !j.tabelas) throw new Error('Este arquivo não é um backup deste sistema.');
    const n = TABS.reduce((a, t) => a + (j.tabelas[t] || []).length, 0);
    if (!confirm('Importar ' + n + ' registros do backup de ' + fdata((j.exportado_em || '').slice(0, 10)) + '? Registros com o mesmo código serão substituídos; os demais continuam.')) return;
    for (const t of TABS) if ((j.tabelas[t] || []).length) await Store.upsertMany(t, j.tabelas[t]);
    await carregarTudo(); render(); toast('Backup importado.');
  } catch (e) { toast(erroMsg(e)); }
}
async function gerarIcones(file) {
  const img = await new Promise((ok, no) => { const i = new Image(); i.onload = () => ok(i); i.onerror = () => no(new Error('Não consegui ler esta imagem.')); i.src = URL.createObjectURL(file); });
  const cor = ($('#ic-cor') || {}).value || '#3E2C0D', margem = ($('#ic-mold') || { checked: true }).checked;
  const lado = Math.min(img.width, img.height), sx = (img.width - lado) / 2, sy = (img.height - lado) / 2;
  const fazer = (tam, pad) => { const c = document.createElement('canvas'); c.width = c.height = tam; const g = c.getContext('2d'); g.fillStyle = cor; g.fillRect(0, 0, tam, tam); const p = Math.round(tam * pad); g.imageSmoothingQuality = 'high'; g.drawImage(img, sx, sy, lado, lado, p, p, tam - 2 * p, tam - 2 * p); return c; };
  const baixar = (c, nome) => new Promise(ok => c.toBlob(b => { const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = nome; document.body.appendChild(a); a.click(); a.remove(); setTimeout(ok, 350); }, 'image/png'));
  await baixar(fazer(180, 0), 'apple-touch-icon.png');
  await baixar(fazer(192, 0), 'icone-192.png');
  await baixar(fazer(512, 0), 'icone-512.png');
  await baixar(fazer(512, margem ? 0.12 : 0), 'icone-maskable-512.png');
  await baixar(fazer(32, 0), 'favicon.png');
  toast('Cinco arquivos de ícone baixados. Coloque-os na pasta icones/ do escritório.');
}
function aplicarTema() {
  const esc2 = ui.tema === 'escuro' || (ui.tema === 'auto' && matchMedia('(prefers-color-scheme: dark)').matches);
  document.documentElement.dataset.theme = esc2 ? 'dark' : 'light';
  const m = document.querySelector('meta[name=theme-color]'); if (m) m.content = esc2 ? '#110F0A' : '#FBF7EE';
}

/* ---------------- ações ---------------- */
async function acao(n, a, b, el) {
  try {
    switch (n) {
      case 'ir': return ir(a);
      case 'maisabre': $('#mais').hidden = false; return;
      case 'maisfecha': $('#mais').hidden = true; return;
      case 'fechar': return dlg().close();
      case 'new': return abrirForm(a, null);
      case 'edit': return abrirForm(a, b);
      case 'newdia': return abrirForm('compromissos', null, { data: a });
      case 'excluir': {
        if (!confirm('Excluir este ' + NOME[a] + '? Não dá para desfazer.')) return;
        const o = S[a].find(x => x.id === b);
        if (a === 'documentos' && o && o.caminho) await Store.removeFile(o.caminho);
        await apagar(a, b); dlg().close(); toast('Excluído.'); return render();
      }
      case 'cp': return copiar(a);
      case 'cptexto': { const m = S.comunicacoes.find(x => x.id === a); return m && copiar(m.texto || ''); }
      case 'baixa': return baixa(a);
      case 'reabrir': await salvar('compromissos', a, { status: 'aberto', baixa_em: null }); toast('Cartão reaberto.'); return render();
      case 'prio': { const c = S.compromissos.find(x => x.id === a); await salvar('compromissos', a, { prioridade: c.prioridade === 'alta' ? 'normal' : 'alta' }); return render(); }
      case 'mover': {
        const c = S.compromissos.find(x => x.id === a);
        const at = c.lista && listaDe(c.lista) ? 'L:' + c.lista : c.tipo;
        return dialogoSimples('Mover cartão', `<p class="note">${esc(c.titulo)}</p><div class="tools">${colunas().filter(co => co.k !== at).map(co => `<button type="button" class="btn" ${A('moverpara', a, co.k)}>${esc(co.t)}</button>`).join('')}</div>`, null);
      }
      case 'moverpara': dlg().close(); return mover(a, b);
      case 'colmv': {
        const arr = colunas(), i = arr.findIndex(c => c.k === b), j = i + (+a);
        if (i < 0 || j < 0 || j >= arr.length) return;
        const X = arr[i], Y = arr[j], ox = X.ord, oy = Y.ord === X.ord ? X.ord + (+a) : Y.ord;
        await posCol(X, oy); await posCol(Y, ox); toast('Lista movida.'); return render();
      }
      case 'renfix': {
        const co = colunas().find(c => c.k === a); if (!co) return;
        return dialogoSimples('Renomear lista', `<label class="f">Nome da lista<input name="nome" value="${esc(co.t)}" required></label><p class="note">Esta é uma coluna fixa do quadro: pode mudar o nome e a posição, mas não pode ser excluída.</p>`, async f => {
          const nome = f.nome.value.trim(); if (!nome) throw new Error('Digite o nome da lista.');
          if (co.fixa) await salvar('listas', co.fixa.id, { nome }); else await salvar('listas', null, { chave: co.k, nome, ordem: co.ord });
        });
      }
      case 'av': ui.av = a; return render();
      case 'tipo': ui.tipo = a; return render();
      case 'vista': ui.vista = a; ui.av = 'lista'; ui.tipo = 'todos'; return ir('agenda');
      case 'agendade': ui.q = a; ui.av = 'lista'; ui.vista = ''; ui.tipo = 'todos'; return ir('agenda');
      case 'docsde': ui.qd = a; return ir('documentos');
      case 'novoprazo': { const p = S.processos.find(x => x.id === a); return abrirForm('compromissos', null, { processo: p.numero || '', cliente: p.cliente || '', titulo: '' }); }
      case 'dia': ui.cd = a; if (mesDe(a) !== ui.cm) ui.cm = mesDe(a); return render();
      case 'mes': ui.cm = +a === 0 ? mesDe(hoje()) : somaMes(ui.cm, +a); if (+a === 0) ui.cd = hoje(); return render();
      case 'mesfin': ui.mf = somaMes(ui.mf, +a); return render();
      case 'kitcopia': { const x = (KIT.itens || []).find(k => k.id === a); return copiar(x ? x.conteudo : ''); }
      case 'kitbaixa': return baixarKit(a);
      case 'kitenvia': { const inp = $('#kitArq'); inp.value = ''; return inp.click(); }
      case 'acmsg': { const x = AC.lista[+a]; return copiar(msgConvite(x.nome, x.email)); }
      case 'acsenha': {
        const x = AC.lista[+a];
        if (!confirm('Criar uma senha provisória para ' + (x.nome || x.email) + '? A senha atual dela deixa de funcionar.')) return;
        const abc = 'abcdefghjkmnpqrstuvwxyz23456789', r = new Uint32Array(10); crypto.getRandomValues(r);
        const nova = Array.from(r, n => abc[n % abc.length]).join('');
        const { error } = await Supa.sb.rpc('redefinir_senha', { alvo: x.email, nova }); if (error) throw error;
        const txt = `Olá${x.nome ? ', ' + pnome(x.nome) : ''}! Sua senha provisória do Sistema de Gestão D.R.A. é: ${nova}\n\nEntre em ${location.origin + location.pathname} com o e-mail ${x.email} e essa senha. Depois troque em Ajustes > Trocar senha.`;
        await copiar(txt);
        return dialogoSimples('Senha provisória criada', `<p class="note">A mensagem abaixo já foi copiada. Cole no WhatsApp dela.</p><p class="txt pre" style="background:var(--surface-2);padding:12px;border-radius:10px">${esc(txt)}</p>`, null);
      }
      case 'acrem': {
        const x = AC.lista[+a];
        if (!confirm('Remover o acesso de ' + (x.nome || x.email) + '? Ela não vai mais conseguir entrar. Os dados do escritório dela ficam guardados.')) return;
        const { error } = await Supa.sb.rpc('remover_acesso', { alvo: x.email }); if (error) throw error;
        toast('Acesso removido.'); AC.lista = null; return render();
      }
      case 'ia': return iaEnviar();
      case 'ialimpa': IA.msgs = []; return render();
      case 'mesrel': ui.mr = somaMes(ui.mr, +a); return render();
      case 'copiarel': { const n = $('#rel-' + a); return copiar(n ? n.textContent : ''); }
      case 'salvarel': { const n = $('#rel-' + a); await salvar('comunicacoes', null, { data: hoje(), cliente: b, canal: 'WhatsApp', texto: n ? n.textContent : '', status: 'rascunho' }); toast('Rascunho guardado em Comunicação.'); return render(); }
      case 'fin': ui.fin = a; return render();
      case 'veratraso': ui.atraso = !ui.atraso; return render();
      case 'pago': { const f = S.financeiro.find(x => x.id === a); await salvar('financeiro', a, { status: 'recebido', pagamento: hoje() }); toast(f.tipo === 'despesa' ? 'Despesa paga.' : 'Recebimento registrado.'); return render(); }
      case 'fz': ui.fz = a; return render();
      case 'reativar': await salvar('processos', a, { situacao: 'ativo', encerrado_em: null }); return render();
      case 'triar': {
        const p = S.publicacoes.find(x => x.id === a), pr = S.processos.find(x => x.numero && x.numero === p.processo);
        return abrirForm('compromissos', null, { tipo: 'prazo', processo: p.processo || '', cliente: pr ? pr.cliente : '', titulo: pr ? pr.titulo : '', descricao: (p.fonte ? p.fonte + ' de ' + fdata(p.data) + ': ' : '') + (p.texto || ''), etiquetas: ['conferencia'] },
          async () => { await salvar('publicacoes', a, { status: 'triada' }); });
      }
      case 'descartar': await salvar('publicacoes', a, { status: 'descartada' }); toast('Publicação descartada.'); return render();
      case 'enviada': await salvar('comunicacoes', a, { status: 'enviada' }); toast('Marcada como enviada.'); return render();
      case 'rascunho': return rascunho(a);
      case 'cadcli': return abrirForm('clientes', null, { nome: a });
      case 'abrirdoc': return abrirDoc(a);
      case 'man': ui.man = +a; return render();
      case 'tema': ui.tema = a; LS.setItem(CHAVE + ':tema', a); aplicarTema(); return render();
      case 'exportar': return exportar();
      case 'importar': return $('#arqImport').click();
      case 'icones': return $('#arqIcone').click();
      case 'dica': LS.setItem(CHAVE + ':dica', '1'); return render();
      case 'resetdemo': if (confirm('Apagar tudo o que foi lançado na demonstração e voltar aos exemplos?')) { Local.reset(); location.reload(); } return;
      case 'chkadd': { const box = $('#chkb'); box.insertAdjacentHTML('beforeend', chkLinha({ t: '', ok: false })); box.lastElementChild.querySelector('input[type=text]').focus(); return; }
      case 'chkdel': el.closest('.chkl').remove(); return;
      case 'senha': return dialogoSimples('Trocar senha', `<label class="f">Nova senha (mínimo 8 caracteres)<input type="password" name="s1" autocomplete="new-password" required minlength="8"></label><label class="f">Repita a nova senha<input type="password" name="s2" autocomplete="new-password" required></label>`,
        async f => { if (f.s1.value.length < 8) throw new Error('A senha precisa ter pelo menos 8 caracteres.'); if (f.s1.value !== f.s2.value) throw new Error('As senhas não conferem.'); const { error } = await Supa.sb.auth.updateUser({ password: f.s1.value }); if (error) throw error; toast('Senha trocada.'); });
      case 'renesc': return renomearEscritorio(false);
      case 'sair': if (confirm('Sair do sistema neste aparelho?')) { await Supa.sb.auth.signOut(); LS.removeItem(CHAVE + ':logo'); location.reload(); } return;
    }
  } catch (e) { console.error(e); toast(erroMsg(e)); }
}
function ligarEventos() {
  document.addEventListener('click', e => {
    const el = e.target.closest('[data-act]'); if (!el) return;
    if (el.tagName === 'A' && el.getAttribute('href')) return;
    e.preventDefault(); acao(el.dataset.act, el.dataset.a, el.dataset.b, el);
  });
  document.addEventListener('input', e => { const k = e.target.dataset && e.target.dataset.q; if (k) { ui[k] = e.target.value; renderCorpo(); } });
  document.addEventListener('change', e => {
    const k = e.target.dataset && e.target.dataset.ui; if (!k) return;
    ui[k] = e.target.type === 'checkbox' ? e.target.checked : e.target.value; renderCorpo();
  });
  dlg().addEventListener('click', e => { if (e.target === dlg()) dlg().close(); });
  $('#arqImport').addEventListener('change', e => { const f = e.target.files[0]; e.target.value = ''; if (f) importar(f); });
  $('#arqIcone').addEventListener('change', e => { const f = e.target.files[0]; e.target.value = ''; if (f) gerarIcones(f).catch(x => toast(erroMsg(x))); });
  // arrastar cartões no quadro
  let arrast = null;
  document.addEventListener('dragstart', e => { const c = e.target.closest && e.target.closest('.card'); if (!c) return; arrast = c.dataset.id; e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', arrast); });
  document.addEventListener('dragover', e => { const col = e.target.closest && e.target.closest('.col'); if (!col || !arrast) return; e.preventDefault(); document.querySelectorAll('.col.over').forEach(x => x !== col && x.classList.remove('over')); col.classList.add('over'); });
  document.addEventListener('dragleave', e => { const col = e.target.closest && e.target.closest('.col'); if (col && !col.contains(e.relatedTarget)) col.classList.remove('over'); });
  document.addEventListener('drop', e => {
    const col = e.target.closest && e.target.closest('.col'); if (!col || !arrast) return; e.preventDefault();
    col.classList.remove('over'); const id = arrast; arrast = null;
    const c = S.compromissos.find(x => x.id === id), k = col.dataset.col, at = c.status === 'feito' ? 'feito' : c.lista && listaDe(c.lista) ? 'L:' + c.lista : c.tipo;
    if (k !== at) { if (c.status === 'feito') salvar('compromissos', id, { status: 'aberto', baixa_em: null }).then(() => mover(id, k)); else mover(id, k); }
  });
  document.addEventListener('dragend', () => { arrast = null; document.querySelectorAll('.col.over').forEach(x => x.classList.remove('over')); });
  window.addEventListener('hashchange', () => { $('#mais').hidden = true; tab = location.hash.slice(1) || 'painel'; render(); window.scrollTo(0, 0); });
  document.addEventListener('visibilitychange', async () => {
    if (document.visibilityState !== 'visible' || Date.now() - ultimaCarga < 60000 || dlg().open) return;
    try { await carregarTudo(); render(); } catch (e) { console.warn(e); }
  });
  matchMedia('(prefers-color-scheme: dark)').addEventListener?.('change', aplicarTema);
}

/* ---------------- login ---------------- */
function telaLogin(modo = 'entrar', msg = '') {
  document.body.innerHTML = `<div class="login"><div class="caixa">${marcaHTML()}<p class="eyebrow">${esc(CFG.subtitulo)}</p><div class="rule"></div>
    ${modo === 'entrar' ? `<form id="fl"><label class="f">E-mail<input type="email" name="email" autocomplete="username" required></label><label class="f">Senha<input type="password" name="senha" autocomplete="current-password" required></label><p class="err"${msg ? '' : ' hidden'}>${esc(msg)}</p><button class="btn pri" type="submit">Entrar</button></form><button class="lnk" id="esq" type="button">Esqueci a senha</button><button class="lnk" id="cria" type="button">Primeiro acesso? Criar minha senha</button>`
    : modo === 'criar' ? `<form id="fc"><p class="note">Use o e-mail que foi liberado para você e crie sua senha (mínimo 8 caracteres).</p><label class="f">E-mail<input type="email" name="email" autocomplete="username" required></label><label class="f">Senha<input type="password" name="s1" autocomplete="new-password" required minlength="8"></label><label class="f">Repita a senha<input type="password" name="s2" autocomplete="new-password" required></label><p class="err" hidden></p><button class="btn pri" type="submit">Criar acesso</button></form><button class="lnk" id="volta" type="button">Já tenho senha</button>`
    : modo === 'esqueci' ? `<div><p class="note"><b>Esqueceu a senha?</b> Peça à administradora do sistema uma <b>senha provisória</b> pelo WhatsApp. Entre com ela e depois troque em Ajustes &gt; Trocar senha.</p><p class="note">Ainda não tem senha? Volte e toque em "Primeiro acesso".</p></div><button class="lnk" id="volta" type="button">Voltar</button>`
    : `<form id="fn"><p class="note">${/type=invite/.test(location.hash) ? 'Bem-vinda! Crie sua senha de acesso (mínimo 8 caracteres).' : 'Crie sua senha nova (mínimo 8 caracteres).'}</p><label class="f">Nova senha<input type="password" name="s1" autocomplete="new-password" required minlength="8"></label><label class="f">Repita<input type="password" name="s2" autocomplete="new-password" required></label><p class="err" hidden></p><button class="btn pri" type="submit">Salvar e entrar</button></form>`}
    </div></div><div id="toast" role="status" hidden></div>`;
  const err = m => { const p = document.querySelector('.err'); p.textContent = m; p.hidden = false; };
  const f = document.querySelector('form');
  if (f) f.addEventListener('submit', async e => {
    e.preventDefault(); const b = f.querySelector('button[type=submit]'); b.disabled = true;
    try {
      if (modo === 'entrar') { const { error } = await Supa.sb.auth.signInWithPassword({ email: f.email.value.trim(), password: f.senha.value }); if (error) throw error; return iniciarOnline(); }
      if (modo === 'criar') {
        if (f.s1.value.length < 8) throw new Error('A senha precisa ter pelo menos 8 caracteres.');
        if (f.s1.value !== f.s2.value) throw new Error('As senhas não conferem.');
        const email = f.email.value.trim();
        const { data, error } = await Supa.sb.auth.signUp({ email, password: f.s1.value, options: { emailRedirectTo: location.origin + location.pathname } });
        if (error) throw error;
        if (data && data.session) return iniciarOnline();
        if (data && data.user && Array.isArray(data.user.identities) && !data.user.identities.length) throw new Error('already registered');
        return telaLogin('entrar', 'Quase lá! Enviamos um e-mail de confirmação para ' + email + '. Clique no link do e-mail e depois entre aqui com sua senha. Confira também o spam.');
      }
      if (modo === 'esqueci') { const { error } = await Supa.sb.auth.resetPasswordForEmail(f.email.value.trim(), { redirectTo: location.origin + location.pathname }); if (error) throw error; return telaLogin('entrar', 'Se o e-mail estiver cadastrado, o link chega em alguns minutos. Confira também o spam.'); }
      if (f.s1.value.length < 8) throw new Error('A senha precisa ter pelo menos 8 caracteres.');
      if (f.s1.value !== f.s2.value) throw new Error('As senhas não conferem.');
      const { error } = await Supa.sb.auth.updateUser({ password: f.s1.value }); if (error) throw error;
      history.replaceState(null, '', location.pathname); return iniciarOnline();
    } catch (ex) { err(erroMsg(ex)); b.disabled = false; }
  });
  const esq = $('#esq'); if (esq) esq.onclick = () => telaLogin('esqueci');
  const vol = $('#volta'); if (vol) vol.onclick = () => telaLogin('entrar');
  const cri = $('#cria'); if (cri) cri.onclick = () => telaLogin('criar');
}
async function iniciarOnline() {
  document.body.innerHTML = '<div class="carregando">Abrindo o escritório…</div>';
  try {
    const { data: u } = await Supa.sb.auth.getUser(); Supa.user = u && u.user;
    const { data, error } = await Supa.sb.rpc('garantir_escritorio', { nome_escritorio: 'Meu escritório' });
    if (error) throw error; Supa.esc = data;
    const { data: e } = await Supa.sb.from('escritorios').select('nome, logo').eq('id', data).single();
    if (e && e.nome) CFG.nome = e.nome;
    if (e && e.logo) { CFG.logo = e.logo; CFG.logoCliente = true; LS.setItem(CHAVE + ':logo', e.logo); } else LS.removeItem(CHAVE + ':logo');
    const { data: adm } = await Supa.sb.rpc('sou_admin');
    Supa.admin = adm === true;
    if (Supa.admin && !NAV[NAV.length - 1][1].some(x => x[0] === 'acessos')) NAV[NAV.length - 1][1].unshift(['acessos', 'Acessos']);
    if (!NAV[NAV.length - 1][1].some(x => x[0] === 'kit')) NAV[NAV.length - 1][1].splice(NAV[NAV.length - 1][1].findIndex(x => x[0] === 'manual') + 1, 0, ['kit', 'Kit Claude']);
    await carregarTudo();
  } catch (e) {
    console.error(e);
    document.body.innerHTML = `<div class="login"><div class="caixa">${marcaHTML()}<p class="err">Não consegui abrir os dados: ${esc(erroMsg(e))}</p><p class="note">Se é a primeira vez, confira se o arquivo schema.sql foi rodado no Supabase.</p><button class="btn pri" onclick="location.reload()">Tentar de novo</button></div></div>`;
    return;
  }
  montarShell(); tab = location.hash.slice(1) || 'painel'; render();
  if (CFG.nome === 'Meu escritório') renomearEscritorio(true);
}
// Reduz a logo para no máximo 480 px e devolve como data URL (PNG mantém o fundo transparente).
async function prepararLogo(file) {
  if (!/^image\//.test(file.type)) throw new Error('Escolha uma imagem (PNG ou JPG).');
  if (file.size > 8 * 1048576) throw new Error('A imagem é muito grande. Use uma de até 8 MB.');
  const img = await new Promise((ok, no) => { const i = new Image(); i.onload = () => ok(i); i.onerror = () => no(new Error('Não consegui ler esta imagem.')); i.src = URL.createObjectURL(file); });
  const k = Math.min(1, 480 / Math.max(img.width, img.height)), c = document.createElement('canvas');
  c.width = Math.max(1, Math.round(img.width * k)); c.height = Math.max(1, Math.round(img.height * k));
  c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
  return /png|svg|webp|gif/.test(file.type) ? c.toDataURL('image/png') : c.toDataURL('image/jpeg', 0.88);
}
function renomearEscritorio(primeira) {
  const atual = CFG.logoCliente ? CFG.logo : '';
  dialogoSimples(primeira ? 'Bem-vinda! Vamos deixar o sistema com a cara do seu escritório' : 'Nome e logo do escritório', `<label class="f">Nome do escritório<input name="nome" value="${esc(CFG.nome === 'Meu escritório' ? '' : CFG.nome)}" required placeholder="Ex.: Souza & Lima Advocacia"></label>
    <label class="f">Logo do escritório (opcional)<input type="file" name="logo" accept="image/png,image/jpeg,image/webp,image/svg+xml"></label>
    <div id="logoPrev" class="logo-prev"${atual ? '' : ' hidden'}>${atual ? `<img src="${esc(atual)}" alt="Logo atual">` : ''}</div>
    ${atual ? '<label class="chk"><input type="checkbox" name="semlogo"> Tirar a logo e voltar ao símbolo D.R.A.</label>' : ''}
    <p class="note">O nome aparece no menu e nos relatórios enviados aos clientes. A logo aparece no menu e na tela de entrada. Prefira PNG com fundo transparente. Dá para mudar depois em Ajustes.</p>`, async f => {
    const nome = f.nome.value.trim(); if (!nome) throw new Error('Digite o nome do escritório.');
    const dados = { nome };
    if (f.logo.files[0]) dados.logo = await prepararLogo(f.logo.files[0]);
    else if (f.semlogo && f.semlogo.checked) dados.logo = null;
    const { error } = await Supa.sb.from('escritorios').update(dados).eq('id', Supa.esc); if (error) throw error;
    CFG.nome = nome;
    if (dados.logo) { CFG.logo = dados.logo; CFG.logoCliente = true; LS.setItem(CHAVE + ':logo', dados.logo); }
    else if (dados.logo === null) { CFG.logo = CFG.logoPadrao; CFG.logoCliente = false; LS.removeItem(CHAVE + ':logo'); }
    montarShell(); render(); toast('Escritório atualizado.');
  });
  const inp = dlg().querySelector('input[name=logo]'), prev = dlg().querySelector('#logoPrev');
  if (inp) inp.addEventListener('change', async () => { const fl = inp.files[0]; if (!fl) return; try { prev.innerHTML = `<img src="${esc(await prepararLogo(fl))}" alt="Prévia da logo">`; prev.hidden = false; } catch (e) { toast(erroMsg(e)); } });
}

/* ---------------- início ---------------- */
async function iniciar() {
  aplicarTema();
  if (ARTEFATO) {
    document.body.innerHTML = '<div class="carregando">Abrindo o escritório…</div>';
    const ok = await Cld.init().catch(() => false);
    if (!ok) { document.body.innerHTML = '<div class="carregando">Não consegui abrir o banco de dados do sistema. Abra este artefato pela sua conta do Claude (claude.ai), conectada à internet.</div>'; return; }
    try { await carregarTudo(); } catch (e) { console.error(e); document.body.innerHTML = `<div class="carregando">Não consegui carregar os dados: ${esc(erroMsg(e))}</div>`; return; }
    if (Cld.sample) { NAV[0][1].splice(1, 0, ['assistente', 'Assistente']); ICON.assistente = '<svg viewBox="0 0 24 24"><path d="M4 5.5h16v10H9l-5 4z"/><path d="M8.5 10.5h.01M12 10.5h.01M15.5 10.5h.01"/></svg>'; }
    montarShell(); tab = location.hash.slice(1) || 'painel'; render(); return;
  }
  if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1')) navigator.serviceWorker.register('sw.js').catch(() => {});
  if (DEMO) { await Local.init(); await carregarTudo(); montarShell(); tab = location.hash.slice(1) || 'painel'; render(); return; }
  if (!window.supabase) { document.body.innerHTML = '<div class="carregando">Sem conexão com a internet. Abra de novo quando estiver online.</div>'; return; }
  Supa.sb = window.supabase.createClient(CFG.supabaseUrl, CFG.supabaseChave, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, storageKey: CHAVE + ':auth' } });
  let recuperando = /type=(recovery|invite)/.test(location.hash);
  Supa.sb.auth.onAuthStateChange(ev => { if (ev === 'PASSWORD_RECOVERY') { recuperando = true; telaLogin('nova'); } });
  const { data: { session } } = await Supa.sb.auth.getSession();
  if (recuperando && session) return telaLogin('nova');
  if (!session) return telaLogin('entrar');
  iniciarOnline();
}
iniciar();
})();
