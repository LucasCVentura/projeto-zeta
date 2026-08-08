// Base fechada de fatos reais do Kira — o bot de FAQ do WhatsApp só responde
// com base nisso (ver src/lib/faq-bot.ts). Nada de RAG: é só um texto curto
// que cabe no system prompt. Atualize aqui quando algo do produto mudar.

export const FAQ_KNOWLEDGE = `
- Preço: R$49,90/mês, sem taxa de adesão.
- Teste grátis: 7 dias, sem precisar de cartão de crédito.
- Depois do teste, é só assinar pra continuar usando — nada é cobrado automaticamente sem o cliente confirmar.
- Dá pra instalar o Kira como aplicativo no celular (PWA): em Configurações tem a opção de instalar, funciona como um app nativo, sem precisar de loja de aplicativo.
- Importação de clientes: dá pra importar uma planilha (CSV ou Excel) com a lista de clientes de uma vez, em Clientes → Importar — o sistema detecta as colunas sozinho.
- Agendamento online: existe um link público de agendamento que a cliente usa pra marcar horário sozinha, sem precisar criar conta.
- Mensagens de WhatsApp automáticas: confirmação de agendamento, lembrete e agradecimento pós-atendimento saem sozinhos, sem precisar escrever nada.
- Financeiro: a receita é lançada automaticamente ao concluir um atendimento ou vender um pacote — não tem lançamento manual.
- Fotos de evolução: dá pra registrar fotos do antes/depois de cada cliente, comparar lado a lado e pedir sugestão de procedimento por IA.
- Estoque: dá pra cadastrar insumos com estoque mínimo — o sistema desconta sozinho a cada atendimento e avisa quando está acabando.
- Equipe: dá pra convidar outras pessoas (recepcionista, outro profissional, financeiro) por e-mail, cada uma vê só o que precisa.
- Cupons e vale-presentes: podem ser criados e enviados automático pelo WhatsApp com QR code, resgatados na hora de concluir o atendimento.
- Anamnese: as perguntas da ficha são personalizáveis, e as respostas ficam salvas na ficha do cliente.
`.trim()
