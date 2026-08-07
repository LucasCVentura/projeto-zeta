// Dica fixa do dia no dashboard — uma por dia, a mesma pra todo mundo, sem
// precisar de banco nem tela de admin. Cada uma descreve um comportamento
// real do sistema (ver src/lib/guides.ts pros guias completos de cada um).

export const DASHBOARD_TIPS: string[] = [
  "Sempre conclua o atendimento na agenda — é isso que lança a receita no Financeiro automaticamente, não precisa registrar nada na mão.",
  "Vendeu um pacote de sessões? As sessões descontam sozinhas conforme você conclui os atendimentos vinculados.",
  "Cadastrou o estoque mínimo de um insumo? Ele desconta sozinho a cada atendimento e te avisa quando estiver acabando.",
  "Tem uma planilha de clientes antiga? Importe tudo de uma vez em Clientes → Importar, sem cadastrar um por um.",
  "Nas fotos de evolução, selecione duas fotos pra comparar lado a lado — ou peça pra IA analisar e sugerir procedimentos.",
  "O Kira já manda um pedido de avaliação no Google pra cliente depois de cada atendimento — configure o link em Configurações → Clínica.",
  "Cada função da equipe vê só o que precisa: profissional atende e vê prontuário, recepcionista cuida de agenda e clientes, financeiro só vê financeiro.",
  "Cupons e vales-presentes chegam prontos no WhatsApp da cliente com QR code — é só escanear na hora de concluir o atendimento.",
  "As perguntas da anamnese são só um ponto de partida — personalize em Configurações → Anamnese pra ficar do seu jeito.",
  "Sua cliente pode agendar sozinha, sem criar conta, pelo link público da sua agenda — compartilhe no Instagram ou WhatsApp.",
  "Criou um termo de consentimento? Ele aparece sozinho na ficha de anamnese pra cliente ler e assinar, sem precisar imprimir nada.",
  "Confirmação de agendamento, lembrete e agradecimento pós-atendimento saem automáticos pelo WhatsApp — você não precisa escrever nada.",
  "Convide sua equipe em Configurações → Equipe: a pessoa recebe um convite por e-mail e cria a própria senha.",
  "No Financeiro dá pra ver receita, custo de insumos e lucro líquido por mês, com os procedimentos e clientes que mais renderam.",
]
