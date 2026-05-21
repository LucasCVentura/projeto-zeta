import { ClientForm } from "@/components/clients/client-form"

export default function NovoClientePage() {
  return (
    <div className="container-page max-w-2xl py-6">
      <div className="mb-6">
        <h2 className="font-heading text-xl font-semibold">Novo cliente</h2>
        <p className="text-sm text-muted-foreground mt-1">Preencha os dados cadastrais e a ficha de anamnese.</p>
      </div>
      <ClientForm />
    </div>
  )
}
