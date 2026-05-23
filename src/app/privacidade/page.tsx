import Link from "next/link"
import { KiraMark } from "@/components/ui/kira-mark"
import { ArrowLeft } from "lucide-react"

export const metadata = { title: "Política de Privacidade — Kira" }

export default function PrivacidadePage() {
  const updated = "23 de maio de 2026"

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-3xl px-5 py-12 space-y-10">
        <div className="space-y-4">
          <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft size={14} /> Voltar
          </Link>
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-primary/10">
              <KiraMark size={24} />
            </div>
            <span className="font-semibold">Kira</span>
          </div>
          <div>
            <h1 className="font-heading text-3xl font-bold">Política de Privacidade</h1>
            <p className="mt-1 text-sm text-muted-foreground">Última atualização: {updated}</p>
          </div>
          <p className="text-muted-foreground leading-relaxed">
            Esta Política descreve como o Kira coleta, usa, armazena e protege seus dados pessoais, em conformidade com a Lei Geral de Proteção de Dados (LGPD — Lei nº 13.709/2018).
          </p>
        </div>

        <div className="space-y-8 text-foreground">

          <Section title="1. Controlador e Operador de Dados">
            <p>O Kira atua como <strong>controlador</strong> dos dados dos Usuários da plataforma (profissionais de estética) e como <strong>operador</strong> dos dados dos clientes finais cadastrados pelos Usuários.</p>
            <p>Encarregado de Dados (DPO): <strong>contato@send.kiraclinic.com.br</strong></p>
          </Section>

          <Section title="2. Dados Coletados">
            <p><strong>Dados do Usuário (você, profissional):</strong></p>
            <ul>
              <li>Nome completo, e-mail, número de WhatsApp</li>
              <li>Documento profissional (CRM, CRBM ou similar)</li>
              <li>Informações da clínica (nome, endereço, Instagram)</li>
              <li>Foto de perfil (opcional)</li>
              <li>Dados de pagamento (processados e armazenados pela Stripe — não armazenamos dados de cartão)</li>
            </ul>
            <p className="mt-2"><strong>Dados dos clientes finais (inseridos por você):</strong></p>
            <ul>
              <li>Nome, telefone/WhatsApp, data de nascimento</li>
              <li>Histórico de procedimentos e anotações clínicas</li>
              <li>Fotografias de evolução</li>
              <li>Informações de anamnese</li>
            </ul>
            <p className="mt-2">O número de telefone/WhatsApp dos clientes finais é utilizado para o envio de notificações automáticas de agendamento (confirmação, lembrete e pós-consulta), sempre mediante responsabilidade do Usuário em obter o consentimento do cliente.</p>
            <p className="mt-2"><strong>Dados de uso:</strong></p>
            <ul>
              <li>Logs de acesso (endereço IP, navegador, data/hora)</li>
              <li>Dados de sessão para autenticação</li>
            </ul>
          </Section>

          <Section title="3. Finalidade e Base Legal">
            <table>
              <thead>
                <tr>
                  <th>Finalidade</th>
                  <th>Base Legal (LGPD)</th>
                </tr>
              </thead>
              <tbody>
                <tr><td>Prestação do serviço contratado</td><td>Execução de contrato (art. 7º, V)</td></tr>
                <tr><td>Cobrança e processamento de pagamentos</td><td>Execução de contrato (art. 7º, V)</td></tr>
                <tr><td>Envio de notificações via WhatsApp para clientes finais</td><td>Execução de contrato / Consentimento (art. 7º, V e I)</td></tr>
                <tr><td>Comunicados sobre o serviço</td><td>Legítimo interesse (art. 7º, IX)</td></tr>
                <tr><td>Cumprimento de obrigações legais</td><td>Obrigação legal (art. 7º, II)</td></tr>
                <tr><td>Segurança e prevenção a fraudes</td><td>Legítimo interesse (art. 7º, IX)</td></tr>
              </tbody>
            </table>
          </Section>

          <Section title="4. Compartilhamento de Dados">
            <p>Não vendemos nem compartilhamos seus dados pessoais com terceiros para fins comerciais. Compartilhamos dados apenas com:</p>
            <ul>
              <li><strong>Stripe</strong> — processamento de pagamentos</li>
              <li><strong>Supabase (PostgreSQL)</strong> — armazenamento de dados em nuvem</li>
              <li><strong>Google Cloud Storage</strong> — armazenamento de imagens</li>
              <li><strong>Groq / Meta Llama</strong> — análise de imagens por IA (imagens processadas sem armazenamento permanente)</li>
              <li><strong>Twilio / Gupshup</strong> — envio de notificações via WhatsApp (número de telefone dos clientes finais compartilhado apenas para fins de entrega da mensagem)</li>
              <li><strong>Vercel</strong> — hospedagem da aplicação</li>
            </ul>
            <p>Todos os fornecedores estão sujeitos a acordos de processamento de dados compatíveis com a LGPD.</p>
          </Section>

          <Section title="5. Cookies e Tecnologias Similares">
            <p>O Kira utiliza <strong>exclusivamente cookies essenciais</strong> para o funcionamento da plataforma:</p>
            <ul>
              <li><strong>Cookie de sessão</strong> — mantém você autenticado durante o uso. Expira em 30 dias ou ao sair da conta.</li>
            </ul>
            <p>Não utilizamos cookies de rastreamento, publicidade ou análise de comportamento de terceiros.</p>
          </Section>

          <Section title="6. Retenção de Dados">
            <ul>
              <li>Dados de conta: mantidos enquanto a conta estiver ativa + 5 anos após encerramento (obrigação fiscal)</li>
              <li>Dados de clientes finais: mantidos conforme configurado pelo Usuário; excluídos em até 30 dias após solicitação</li>
              <li>Logs de acesso: retidos por 6 meses (Marco Civil da Internet)</li>
              <li>Dados de pagamento: retidos pela Stripe conforme regulamentação financeira</li>
            </ul>
          </Section>

          <Section title="7. Seus Direitos (LGPD)">
            <p>Conforme os artigos 17 a 22 da LGPD, você tem direito a:</p>
            <ul>
              <li>Confirmar a existência de tratamento dos seus dados</li>
              <li>Acessar os dados que temos sobre você</li>
              <li>Corrigir dados incompletos, inexatos ou desatualizados</li>
              <li>Solicitar a anonimização, bloqueio ou eliminação de dados desnecessários</li>
              <li>Portabilidade dos seus dados</li>
              <li>Revogar consentimento a qualquer momento</li>
              <li>Solicitar a exclusão completa da sua conta e dados</li>
            </ul>
            <p>Para exercer qualquer direito, envie um e-mail para <strong>contato@send.kiraclinic.com.br</strong> com o assunto &quot;Direitos LGPD&quot;. Responderemos em até 15 dias úteis.</p>
          </Section>

          <Section title="8. Segurança">
            <p>Adotamos medidas técnicas e organizacionais para proteger seus dados:</p>
            <ul>
              <li>Transmissão criptografada via HTTPS/TLS</li>
              <li>Senhas armazenadas com hash bcrypt</li>
              <li>Acesso às imagens restrito por URLs assinadas com expiração</li>
              <li>Banco de dados em ambiente isolado com acesso restrito</li>
            </ul>
          </Section>

          <Section title="9. Transferência Internacional">
            <p>Alguns de nossos fornecedores (Stripe, Google Cloud, Vercel, Groq) operam fora do Brasil. Essas transferências ocorrem com base em cláusulas contratuais padrão e garantias equivalentes às exigidas pela LGPD (art. 33).</p>
          </Section>

          <Section title="10. Alterações nesta Política">
            <p>Podemos atualizar esta política periodicamente. Notificaremos você por e-mail ou aviso na plataforma em caso de mudanças relevantes. A data de última atualização sempre estará indicada no topo deste documento.</p>
          </Section>

          <Section title="11. Contato">
            <p>Para dúvidas, solicitações ou reclamações relacionadas à privacidade:</p>
            <ul>
              <li>E-mail: <strong>contato@send.kiraclinic.com.br</strong></li>
              <li>Você também pode registrar reclamações na Autoridade Nacional de Proteção de Dados (ANPD): <strong>gov.br/anpd</strong></li>
            </ul>
          </Section>
        </div>

        <div className="border-t border-border pt-6 flex gap-4 text-sm text-muted-foreground">
          <Link href="/termos" className="hover:text-foreground transition-colors">Termos de Uso</Link>
          <Link href="/" className="hover:text-foreground transition-colors">Página inicial</Link>
        </div>
      </div>

      <style>{`
        table { width: 100%; border-collapse: collapse; font-size: 0.8rem; }
        th, td { text-align: left; padding: 0.5rem 0.75rem; border: 1px solid hsl(var(--border)); }
        th { background: hsl(var(--muted)); font-weight: 600; }
      `}</style>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <h2 className="text-base font-semibold">{title}</h2>
      <div className="space-y-2 text-sm text-muted-foreground leading-relaxed [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1">
        {children}
      </div>
    </div>
  )
}
