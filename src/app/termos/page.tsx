import Link from "next/link"
import { ArrowLeft } from "lucide-react"

export const metadata = { title: "Termos de Uso — Zeta" }

export default function TermosPage() {
  const updated = "21 de maio de 2025"

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-3xl px-5 py-12 space-y-10">
        <div className="space-y-4">
          <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft size={14} /> Voltar
          </Link>
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-primary-foreground">
                <path d="M12 2L9.5 9.5 2 12l7.5 2.5L12 22l2.5-7.5L22 12l-7.5-2.5z" strokeLinejoin="round" strokeLinecap="round" />
              </svg>
            </div>
            <span className="font-semibold">Zeta</span>
          </div>
          <div>
            <h1 className="font-heading text-3xl font-bold">Termos de Uso</h1>
            <p className="mt-1 text-sm text-muted-foreground">Última atualização: {updated}</p>
          </div>
          <p className="text-muted-foreground leading-relaxed">
            Ao criar uma conta ou utilizar a plataforma Zeta, você concorda com estes Termos de Uso. Leia com atenção antes de utilizar o serviço.
          </p>
        </div>

        <div className="prose prose-sm max-w-none space-y-8 text-foreground">

          <Section title="1. Aceitação dos Termos">
            <p>Estes Termos de Uso regulam a relação entre a plataforma Zeta ("Zeta", "nós") e o usuário ("você", "Usuário") ao acessar ou usar nossos serviços. Ao se cadastrar ou utilizar qualquer funcionalidade da plataforma, você declara ter lido, compreendido e concordado com estes termos.</p>
            <p>Caso não concorde com qualquer disposição, você não deve utilizar o serviço.</p>
          </Section>

          <Section title="2. Descrição do Serviço">
            <p>O Zeta é uma plataforma de gestão voltada para profissionais da estética e biomédicos estetas, oferecendo funcionalidades como:</p>
            <ul>
              <li>Gerenciamento de agenda e agendamentos</li>
              <li>Cadastro e prontuário de clientes</li>
              <li>Registro fotográfico e análise por inteligência artificial</li>
              <li>Controle financeiro e de estoque</li>
              <li>Gestão de pacotes de sessões</li>
            </ul>
          </Section>

          <Section title="3. Cadastro e Conta">
            <p>Para usar o Zeta, você deve criar uma conta com informações verdadeiras, completas e atualizadas. Você é responsável por manter a confidencialidade de suas credenciais de acesso e por todas as atividades realizadas em sua conta.</p>
            <p>O Zeta reserva-se o direito de suspender ou encerrar contas que violem estes termos, forneçam informações falsas ou sejam utilizadas de forma fraudulenta.</p>
          </Section>

          <Section title="4. Plano e Pagamento">
            <p>O Zeta oferece um período de teste gratuito de 7 (sete) dias, sem necessidade de cartão de crédito. Após o período de teste, a utilização do serviço está condicionada à contratação do plano pago.</p>
            <p>Os pagamentos são processados pela Stripe, Inc. A assinatura é renovada automaticamente a cada mês, podendo ser cancelada a qualquer momento pelo Usuário por meio da área de configurações. O cancelamento interrompe a renovação, mas o acesso permanece ativo até o fim do período já pago.</p>
            <p>Não realizamos reembolsos por períodos parciais, salvo obrigação legal.</p>
          </Section>

          <Section title="5. Uso Permitido">
            <p>Você concorda em utilizar o Zeta exclusivamente para fins lícitos e de acordo com estes termos. É vedado:</p>
            <ul>
              <li>Utilizar o serviço para fins ilegais ou que violem direitos de terceiros</li>
              <li>Tentar acessar contas ou dados de outros usuários</li>
              <li>Realizar engenharia reversa, descompilar ou copiar qualquer parte da plataforma</li>
              <li>Usar o serviço para enviar spam, malware ou conteúdo prejudicial</li>
              <li>Revender, sublicenciar ou comercializar o acesso à plataforma sem autorização</li>
            </ul>
          </Section>

          <Section title="6. Dados dos Clientes Finais">
            <p>Ao cadastrar dados de seus clientes na plataforma, você assume a responsabilidade como controlador dos dados pessoais, conforme a Lei Geral de Proteção de Dados (LGPD — Lei nº 13.709/2018). O Zeta atua como operador de dados em nome do Usuário.</p>
            <p>Você declara ter obtido as autorizações necessárias dos seus clientes para o registro e tratamento de seus dados pessoais, incluindo dados sensíveis como imagens e informações de saúde estética.</p>
          </Section>

          <Section title="7. Propriedade Intelectual">
            <p>Todo o conteúdo da plataforma Zeta — incluindo código, design, marcas, logotipos e textos — é de propriedade exclusiva do Zeta ou de seus licenciadores. É proibida qualquer reprodução, distribuição ou uso não autorizado.</p>
            <p>Os dados inseridos pelo Usuário permanecem de propriedade do Usuário, que pode solicitar sua exportação ou exclusão a qualquer momento.</p>
          </Section>

          <Section title="8. Disponibilidade e Limitação de Responsabilidade">
            <p>O Zeta envida esforços para manter o serviço disponível 24/7, mas não garante disponibilidade ininterrupta. Eventos de manutenção, falhas técnicas ou situações de força maior podem causar indisponibilidades temporárias.</p>
            <p>O Zeta não se responsabiliza por danos indiretos, perda de dados, perda de receita ou quaisquer danos decorrentes do uso ou impossibilidade de uso da plataforma, na máxima extensão permitida pela lei.</p>
          </Section>

          <Section title="9. Modificações nos Termos">
            <p>O Zeta pode atualizar estes termos a qualquer momento. Notificaremos você por e-mail ou por aviso na plataforma com pelo menos 7 (sete) dias de antecedência para alterações relevantes. O uso continuado do serviço após a vigência das alterações implica aceitação dos novos termos.</p>
          </Section>

          <Section title="10. Rescisão">
            <p>Você pode encerrar sua conta a qualquer momento. O Zeta pode suspender ou encerrar seu acesso em caso de violação destes termos, sem prejuízo de outras medidas cabíveis.</p>
          </Section>

          <Section title="11. Lei Aplicável e Foro">
            <p>Estes termos são regidos pelas leis da República Federativa do Brasil. Para dirimir quaisquer controvérsias, fica eleito o foro da comarca de domicílio do Usuário, conforme o Código de Defesa do Consumidor.</p>
          </Section>

          <Section title="12. Contato">
            <p>Dúvidas sobre estes termos podem ser enviadas para: <strong>contato@zeta.com.br</strong></p>
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
