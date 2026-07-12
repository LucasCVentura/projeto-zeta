export type ChangelogEntry = {
  version: string
  date: string
  items: { type: "new" | "improvement" | "fix"; text: string }[]
}

export const CHANGELOG: ChangelogEntry[] = [
  {
    version: "3.4.0",
    date: "2026-07-13",
    items: [
      { type: "improvement", text: "A mensagem de agradecimento após o atendimento agora é enviada mesmo sem o link de avaliação do Google configurado" },
      { type: "new",         text: "Aviso no painel para configurar o link do Google Negócios — com ele, o agradecimento já pede a avaliação da sua cliente automaticamente" },
    ],
  },
  {
    version: "3.3.0",
    date: "2026-07-13",
    items: [
      { type: "new",         text: "Novos temas: além de Claro e Escuro, agora tem Claro Neutro e Escuro Neutro (visual mais neutro, com destaque em azul em vez de rosa) — escolha em Perfil ou pelo menu de tema" },
      { type: "improvement", text: "Perfil mostra um aviso quando falta preencher CPF, telefone, data de nascimento ou documento profissional" },
    ],
  },
  {
    version: "3.2.0",
    date: "2026-07-13",
    items: [
      { type: "new",         text: "Entre ou crie sua conta com um clique usando o Google — sem precisar de senha" },
      { type: "improvement", text: "Cadastro mais rápido: agora só pede nome, e-mail, profissão e senha. CPF, telefone e outros dados ficam para completar depois em Perfil, se quiser" },
    ],
  },
  {
    version: "3.1.2",
    date: "2026-07-10",
    items: [
      { type: "improvement", text: "Agenda no celular: cabeçalho reorganizado — a data aparece em uma linha só e os botões não ficam mais espremidos ou cortados" },
    ],
  },
  {
    version: "3.1.1",
    date: "2026-07-10",
    items: [
      { type: "fix", text: "Corrigido o modal \"O que há de novo\" no celular, que em alguns aparelhos abria cortado e não deixava fechar nem rolar o conteúdo" },
    ],
  },
  {
    version: "3.1.0",
    date: "2026-07-10",
    items: [
      { type: "new", text: "Agenda do dia no WhatsApp: ative em Perfil → Notificações e receba todo dia de manhã um resumo dos seus atendimentos direto no seu WhatsApp" },
    ],
  },
  {
    version: "3.0.1",
    date: "2026-06-26",
    items: [
      { type: "fix", text: "Corrigido o botão Sim/Não (toggle) da ficha de anamnese, que em alguns casos não alternava ao ser tocado" },
      { type: "fix", text: "Envio de mensagens por WhatsApp: houve uma instabilidade temporária no envio, já normalizada" },
    ],
  },
  {
    version: "3.0.0",
    date: "2026-06-24",
    items: [
      { type: "new",         text: "Vários procedimentos no mesmo agendamento: selecione mais de um procedimento de uma vez (ex.: Limpeza de Pele + Peeling) em um único horário" },
      { type: "new",         text: "Use uma sessão de pacote junto com procedimentos avulsos no mesmo atendimento — a sessão do pacote é descontada e os demais são cobrados à parte" },
      { type: "improvement", text: "Ao concluir o atendimento, a comissão é somada por procedimento e o total ganho aparece na tela de conclusão" },
      { type: "improvement", text: "Financeiro: top procedimentos e receita projetada agora consideram todos os procedimentos de cada atendimento" },
    ],
  },
  {
    version: "2.1.0",
    date: "2026-06-22",
    items: [
      { type: "improvement", text: "Financeiro renovado: gráfico de histórico dos últimos 6 meses, top procedimentos por receita e top 5 clientes do mês" },
      { type: "new",         text: "Financeiro: novos KPIs de ticket médio e receita projetada com base nos agendamentos futuros ainda não faturados" },
      { type: "improvement", text: "Financeiro: comparativo de receita com o mês anterior (% de crescimento ou queda) direto no card principal" },
      { type: "improvement", text: "Financeiro: todos os cards agora são sempre visíveis, com estado vazio quando não há dados no período" },
      { type: "new",         text: "Financeiro: ícone de informação em cada card explicando o que aquele dado significa" },
    ],
  },
  {
    version: "2.0.0",
    date: "2026-06-20",
    items: [
      { type: "new",         text: "Visão semanal na agenda: grade completa com todos os horários de funcionamento — slots vazios, agendamentos e bloqueios visíveis de uma vez" },
      { type: "improvement", text: "Agenda: agendamentos na visão semanal viram cards com borda colorida por status; visão mensal exibe pills com horário no lugar de pontinhos" },
      { type: "improvement", text: "Cadastro e perfil: ao selecionar \"Outro segmento de beleza\", abre um campo para digitar livremente a profissão ou área de atuação" },
      { type: "improvement", text: "Perfil: profissão agora é editável — altere entre Esteticista, Biomédico(a) ou Outro segmento diretamente no perfil" },
    ],
  },
  {
    version: "1.8.0",
    date: "2026-06-13",
    items: [
      { type: "new",         text: "Botão de lupa nas fotos da evolução fotográfica — toque para ampliar sem precisar selecionar" },
      { type: "new",         text: "Excluir cliente: novo botão na ficha do cliente com confirmação antes de remover todos os dados" },
      { type: "improvement", text: "Carrossel de evolução agora tem botão Fechar visível no rodapé, facilitando o fechamento no celular" },
      { type: "improvement", text: "Análise comparativa de fotos com IA melhorada: considera o intervalo real entre as fotos e é mais honesta sobre diferenças pequenas" },
    ],
  },
  {
    version: "1.7.0",
    date: "2026-06-12",
    items: [
      { type: "new",         text: "Termos de consentimento: crie múltiplos termos em Configurações → Termos e envie junto com a ficha de anamnese para o cliente aceitar ou recusar" },
      { type: "new",         text: "Respostas dos termos ficam registradas na ficha do cliente com data e hora — editáveis pelo profissional a qualquer momento" },
      { type: "improvement", text: "Termos podem ser ativados ou desativados individualmente sem perder o histórico de respostas" },
    ],
  },
  {
    version: "1.6.0",
    date: "2026-06-07",
    items: [
      { type: "new",         text: "Dashboard reformulado: próximos agendamentos da semana, clientes sem retorno há 30+ dias, aniversariantes da semana e procedimentos mais realizados" },
      { type: "new",         text: "Notificações no sininho quando paciente confirma ou cancela agendamento via WhatsApp" },
      { type: "new",         text: "Notificação no sininho quando paciente preenche a ficha de anamnese — com link direto para a ficha" },
      { type: "new",         text: "Link para ficha de anamnese enviado automaticamente no resumo de agendamento via WhatsApp" },
      { type: "new",         text: "Pacientes podem preencher e editar a ficha de anamnese pelo link sem precisar de login" },
      { type: "improvement", text: "Taxa de confirmação exibida no dashboard no lugar de 'confirmados hoje'" },
    ],
  },
  {
    version: "1.5.0",
    date: "2026-06-05",
    items: [
      { type: "new",         text: "Ficha de anamnese personalizável: adicione, remova e reordene as perguntas da ficha de cada cliente em Configurações → Anamnese" },
      { type: "new",         text: "Suporte a 4 tipos de perguntas na anamnese: texto livre, sim/não, seleção única e múltipla escolha" },
      { type: "improvement", text: "Ficha de anamnese agora salva as respostas por cliente de forma dinâmica — sem campos fixos" },
    ],
  },
  {
    version: "1.4.0",
    date: "2026-06-03",
    items: [
      { type: "new",         text: "Importação de clientes via CSV ou Excel — suba sua lista de qualquer sistema com mapeamento automático de colunas" },
      { type: "new",         text: "Plano Vitalício: acesso permanente sem assinatura ativa" },
      { type: "improvement", text: "Campo de contato unificado em WhatsApp / Telefone no cadastro de clientes" },
      { type: "fix",         text: "Lembretes e mensagens pós-atendimento agora usam o número de WhatsApp do cliente corretamente" },
      { type: "fix",         text: "Análise visual da pele: labels das anotações exibiam caracteres japoneses em alguns dispositivos" },
    ],
  },
  {
    version: "1.3.0",
    date: "2026-06-03",
    items: [
      { type: "new",         text: "Sistema de comissões: defina a % de comissão de cada procedimento e acompanhe os ganhos por profissional" },
      { type: "new",         text: "Profissionais agora têm acesso ao financeiro com visão exclusiva das próprias comissões" },
      { type: "new",         text: "Owner e recepcionista podem selecionar o profissional responsável ao criar um agendamento" },
      { type: "improvement", text: "Financeiro do dono exibe total de comissões a pagar e breakdown por profissional" },
      { type: "fix",         text: "Análise visual da pele: labels das anotações exibiam caracteres japoneses em alguns dispositivos" },
    ],
  },
  {
    version: "1.2.0",
    date: "2026-06-02",
    items: [
      { type: "new",         text: "Forma de pagamento agora é registrada ao finalizar o atendimento (Pix, débito, crédito, parcelado ou dinheiro)" },
      { type: "new",         text: "Financeiro: novo KPI com breakdown de receita por forma de pagamento e barra de proporção" },
      { type: "improvement", text: "Cada lançamento no financeiro exibe um badge colorido com a forma de pagamento utilizada" },
    ],
  },
  {
    version: "1.1.0",
    date: "2026-05-28",
    items: [
      { type: "new",         text: "Análise visual da pele: a IA marca as áreas de atenção diretamente na foto" },
      { type: "new",         text: "Indicações de procedimentos por IA a partir de fotos da cliente" },
      { type: "improvement", text: "Respostas da IA agora falam com você de forma natural, com saudação pelo nome" },
      { type: "fix",         text: "Fotos da evolução não carregavam mais após recarregar a página (F5)" },
      { type: "improvement", text: "Upload de fotos agora aceita arquivos maiores (até 10 MB)" },
    ],
  },
  {
    version: "1.0.0",
    date: "2026-05-01",
    items: [
      { type: "new", text: "Lançamento do Kira — agenda, clientes, financeiro e prontuário estético" },
      { type: "new", text: "Comparação de fotos com análise automática por IA" },
      { type: "new", text: "Lembretes de consulta via WhatsApp com confirmação de presença" },
      { type: "new", text: "Sugestão de retorno com IA baseada no histórico da cliente" },
    ],
  },
]

export const CURRENT_VERSION = CHANGELOG[0].version
