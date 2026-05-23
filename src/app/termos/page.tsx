import Link from "next/link"
import { KiraMark } from "@/components/ui/kira-mark"
import { ArrowLeft } from "lucide-react"

export const metadata = { title: "Termos de Uso — Kira" }

export default function TermosPage() {
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
            <h1 className="font-heading text-3xl font-bold">Termos de Uso</h1>
            <p className="mt-1 text-sm text-muted-foreground">Última atualização: {updated}</p>
          </div>
          <p className="text-muted-foreground leading-relaxed">
            Ao criar uma conta ou utilizar a plataforma Kira, você concorda com estes Termos de Uso. Leia com atenção antes de utilizar o serviço.
          </p>
        </div>

        <div className="prose prose-sm max-w-none space-y-8 text-foreground">

          <Section title="1. Aceitação dos Termos">
            <p>Estes Termos de Uso regulam a relação entre a plataforma Kira (&quot;Kira&quot;, &quot;nós&quot;) e o usuário (&quot;você&quot;, &quot;Usuário&quot;) ao acessar ou usar nossos serviços. Ao se cadastrar ou utilizar qualquer funcionalidade da plataforma, você declara ter lido, compreendido e concordado com estes termos.</p>
            <p>Caso não concorde com qualquer disposição, você não deve utilizar o serviço.</p>
          </Section>

          <Section title="2. Descrição do Serviço">
            <p>O Kira é uma plataforma de gestão voltada para profissionais da estética, beleza e biomédicos estetas, oferecendo funcionalidades como:</p>
            <ul>
              <li>Gerenciamento de agenda e agendamentos</li>
              <li>Cadastro e prontuário de clientes</li>
              <li>Registro fotográfico e recursos de inteligência artificial como apoio complementar à organização da evolução</li>
              <li>Controle financeiro e de estoque</li>
              <li>Gestão de pacotes de sessões</li>
              <li>Envio de notificações automáticas via WhatsApp para os clientes finais</li>
            </ul>
          </Section>

          <Section title="3. Cadastro e Conta">
            <p>Para usar o Kira, você deve criar uma conta com informações verdadeiras, completas e atualizadas. Você é responsável por manter a confidencialidade de suas credenciais de acesso e por todas as atividades realizadas em sua conta.</p>
            <p>O Kira reserva-se o direito de suspender ou encerrar contas que violem estes termos, forneçam informações falsas ou sejam utilizadas de forma fraudulenta.</p>
          </Section>

          <Section title="4. Plano e Pagamento">
            <p>O Kira oferece um período de teste gratuito de 7 (sete) dias, sem necessidade de cartão de crédito. Após o período de teste, a utilização do serviço está condicionada à contratação do plano pago.</p>
            <p>Os pagamentos são processados pela Stripe, Inc. A assinatura é renovada automaticamente a cada mês, podendo ser cancelada a qualquer momento pelo Usuário por meio da área de configurações. O cancelamento interrompe a renovação, mas o acesso permanece ativo até o fim do período já pago.</p>
            <p>Não realizamos reembolsos por períodos parciais, salvo obrigação legal.</p>
          </Section>

          <Section title="5. Uso Permitido">
            <p>Você concorda em utilizar o Kira exclusivamente para fins lícitos e de acordo com estes termos. É vedado:</p>
            <ul>
              <li>Utilizar o serviço para fins ilegais ou que violem direitos de terceiros</li>
              <li>Tentar acessar contas ou dados de outros usuários</li>
              <li>Realizar engenharia reversa, descompilar ou copiar qualquer parte da plataforma</li>
              <li>Usar o serviço para enviar spam, malware ou conteúdo prejudicial</li>
              <li>Revender, sublicenciar ou comercializar o acesso à plataforma sem autorização</li>
            </ul>
          </Section>

          <Section title="6. Notificações via WhatsApp">
            <p>A plataforma Kira envia mensagens automáticas via WhatsApp para os clientes finais cadastrados pelo Usuário, incluindo:</p>
            <ul>
              <li>Confirmação de agendamento (com links para confirmar ou recusar presença)</li>
              <li>Lembrete de consulta 24 horas antes do horário agendado</li>
              <li>Mensagem de agradecimento pós-consulta</li>
            </ul>
            <p>O Usuário é inteiramente responsável por obter o consentimento expresso dos seus clientes finais para o recebimento dessas mensagens antes de cadastrá-los na plataforma, conforme exigido pela LGPD e pelas políticas de uso do WhatsApp Business.</p>
            <p>O Kira não se responsabiliza pelo uso indevido das funcionalidades de envio de mensagens, nem por bloqueios ou penalidades decorrentes do envio de mensagens sem consentimento.</p>
          </Section>

          <Section title="8. Dados dos Clientes Finais">
            <p>Ao cadastrar dados de seus clientes na plataforma, você assume a responsabilidade como controlador dos dados pessoais, conforme a Lei Geral de Proteção de Dados (LGPD — Lei nº 13.709/2018). O Kira atua como operador de dados em nome do Usuário.</p>
            <p>Você declara ter obtido as autorizações necessárias dos seus clientes para o registro e tratamento de seus dados pessoais, incluindo dados sensíveis como imagens e informações de saúde estética.</p>
          </Section>

          <Section title="9. Recursos de Inteligência Artificial">
            <p>Os recursos de inteligência artificial do Kira são ferramentas de apoio à organização, comparação visual e geração de relatórios complementares. Eles não substituem avaliação, diagnóstico, prescrição, conduta profissional ou responsabilidade técnica do Usuário.</p>
            <p>O Usuário é responsável por revisar qualquer conteúdo gerado com apoio de IA antes de utilizá-lo em sua rotina profissional ou compartilhá-lo com clientes finais.</p>
          </Section>

          <Section title="10. Propriedade Intelectual">
            <p>Todo o conteúdo da plataforma Kira — incluindo código, design, marcas, logotipos e textos — é de propriedade exclusiva do Kira ou de seus licenciadores. É proibida qualquer reprodução, distribuição ou uso não autorizado.</p>
            <p>Os dados inseridos pelo Usuário permanecem de propriedade do Usuário, que pode solicitar sua exportação ou exclusão a qualquer momento.</p>
          </Section>

          <Section title="11. Disponibilidade e Limitação de Responsabilidade">
            <p>O Kira envida esforços para manter o serviço disponível 24/7, mas não garante disponibilidade ininterrupta. Eventos de manutenção, falhas técnicas ou situações de força maior podem causar indisponibilidades temporárias.</p>
            <p>O Kira não se responsabiliza por danos indiretos, perda de dados, perda de receita ou quaisquer danos decorrentes do uso ou impossibilidade de uso da plataforma, na máxima extensão permitida pela lei.</p>
          </Section>

          <Section title="12. Modificações nos Termos">
            <p>O Kira pode atualizar estes termos a qualquer momento. Notificaremos você por e-mail ou por aviso na plataforma com pelo menos 7 (sete) dias de antecedência para alterações relevantes. O uso continuado do serviço após a vigência das alterações implica aceitação dos novos termos.</p>
          </Section>

          <Section title="13. Rescisão">
            <p>Você pode encerrar sua conta a qualquer momento. O Kira pode suspender ou encerrar seu acesso em caso de violação destes termos, sem prejuízo de outras medidas cabíveis.</p>
          </Section>

          <Section title="14. Lei Aplicável e Foro">
            <p>Estes termos são regidos pelas leis da República Federativa do Brasil. Para dirimir quaisquer controvérsias, fica eleito o foro da comarca de domicílio do Usuário, conforme o Código de Defesa do Consumidor.</p>
          </Section>

          <Section title="15. Contato">
            <p>Dúvidas sobre estes termos podem ser enviadas para: <strong>contato@send.kiraclinic.com.br</strong></p>
          </Section>
        </div>

        <div className="border-t border-border pt-6 flex gap-4 text-sm text-muted-foreground">
          <Link href="/privacidade" className="hover:text-foreground transition-colors">Política de Privacidade</Link>
          <Link href="/" className="hover:text-foreground transition-colors">Página inicial</Link>
        </div>
      </div>
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
