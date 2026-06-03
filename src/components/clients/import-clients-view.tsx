"use client"

import { useState, useCallback, useRef } from "react"
import { useRouter } from "next/navigation"
import { importClientsAction, type ClientRow, type ImportResult } from "@/actions/import-clients"
import { Upload, FileSpreadsheet, CheckCircle2, AlertCircle, ChevronDown, Users, SkipForward, XCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

// ── Tipos ─────────────────────────────────────────────────────────────────────

type Step = "upload" | "mapping" | "preview" | "result"

type ColumnKey = "name" | "whatsapp" | "email" | "cpf" | "birthDate" | "notes" | "ignore"

const COLUMN_LABELS: Record<ColumnKey, string> = {
  name:      "Nome *",
  whatsapp:  "WhatsApp / Telefone",
  email:     "E-mail",
  cpf:       "CPF",
  birthDate: "Data de nascimento",
  notes:     "Observações",
  ignore:    "Ignorar coluna",
}

// Nomes de colunas que costumam aparecer em diferentes sistemas
const AUTO_DETECT: Record<ColumnKey, string[]> = {
  name:      ["nome", "name", "cliente", "paciente", "patient", "client", "nome completo", "full name"],
  whatsapp:  ["whatsapp", "telefone", "phone", "celular", "fone", "tel", "mobile", "contato", "numero", "número"],
  email:     ["email", "e-mail", "mail", "correio"],
  cpf:       ["cpf", "documento", "document", "rg"],
  birthDate: ["nascimento", "data de nascimento", "birthday", "birth date", "birth_date", "aniversario", "nasc"],
  notes:     ["observações", "observacoes", "notas", "notes", "obs", "anotações", "anotacoes", "comentarios"],
  ignore:    [],
}

function autoDetectColumn(header: string): ColumnKey {
  const h = header.toLowerCase().trim()
  for (const [key, patterns] of Object.entries(AUTO_DETECT) as [ColumnKey, string[]][]) {
    if (key === "ignore") continue
    if (patterns.some((p) => h.includes(p) || p.includes(h))) return key
  }
  return "ignore"
}

// ── Parser de arquivo ─────────────────────────────────────────────────────────

async function parseFile(file: File): Promise<{ headers: string[]; rows: string[][] }> {
  const ext = file.name.split(".").pop()?.toLowerCase()

  if (ext === "csv") {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        const text = e.target?.result as string
        // Detecta separador (vírgula ou ponto-e-vírgula)
        const firstLine = text.split("\n")[0]
        const sep = firstLine.includes(";") ? ";" : ","
        const lines = text.split(/\r?\n/).filter((l) => l.trim())
        const headers = lines[0].split(sep).map((h) => h.replace(/^"|"$/g, "").trim())
        const rows = lines.slice(1).map((l) =>
          l.split(sep).map((cell) => cell.replace(/^"|"$/g, "").trim())
        ).filter((r) => r.some((c) => c))
        resolve({ headers, rows })
      }
      reader.onerror = reject
      reader.readAsText(file, "UTF-8")
    })
  }

  if (ext === "xlsx" || ext === "xls") {
    const XLSX = await import("xlsx")
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const data = e.target?.result
          const wb = XLSX.read(data, { type: "binary" })
          const ws = wb.Sheets[wb.SheetNames[0]]
          const json: string[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" })
          const headers = (json[0] ?? []).map(String)
          const rows = json.slice(1).filter((r) => r.some((c) => String(c).trim())) as string[][]
          resolve({ headers, rows })
        } catch (err) { reject(err) }
      }
      reader.onerror = reject
      reader.readAsBinaryString(file)
    })
  }

  throw new Error("Formato não suportado. Use CSV ou Excel (.xlsx).")
}

// ── Step: Upload ──────────────────────────────────────────────────────────────

function UploadStep({ onParsed }: {
  onParsed: (headers: string[], rows: string[][], fileName: string) => void
}) {
  const [isDragging, setIsDragging] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleFile(file: File) {
    setError(null)
    setIsLoading(true)
    try {
      const { headers, rows } = await parseFile(file)
      if (headers.length === 0) throw new Error("Arquivo sem colunas detectadas.")
      if (rows.length === 0) throw new Error("Arquivo sem dados.")
      onParsed(headers, rows, file.name)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao ler o arquivo.")
    } finally {
      setIsLoading(false)
    }
  }

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }, [])

  return (
    <div className="space-y-4">
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        className={cn(
          "flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed px-6 py-12 text-center cursor-pointer transition-colors",
          isDragging ? "border-primary bg-primary/5" : "border-border hover:border-primary/50 hover:bg-accent/50"
        )}
      >
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
          {isLoading
            ? <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            : <Upload size={24} className="text-primary" />
          }
        </div>
        <div>
          <p className="font-medium text-sm">
            {isLoading ? "Lendo arquivo..." : "Arraste o arquivo ou clique para selecionar"}
          </p>
          <p className="text-xs text-muted-foreground mt-1">CSV ou Excel (.xlsx) — qualquer tamanho</p>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept=".csv,.xlsx,.xls"
          className="hidden"
          onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
        />
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-3">
          <AlertCircle size={15} className="text-destructive shrink-0 mt-0.5" />
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      {/* Dica de formato */}
      <div className="rounded-lg bg-muted/50 border border-border px-4 py-3 space-y-1.5">
        <p className="text-xs font-medium">Dica: como exportar do seu sistema atual</p>
        <p className="text-xs text-muted-foreground">
          Na maioria dos sistemas, vá em <strong>Clientes → Exportar → CSV</strong> ou <strong>Excel</strong>.
          O Kira detecta automaticamente as colunas — não precisa renomear nada.
        </p>
      </div>
    </div>
  )
}

// ── Step: Mapeamento de colunas ───────────────────────────────────────────────

function MappingStep({
  headers, rows, fileName, onConfirm, onBack,
}: {
  headers: string[]
  rows: string[][]
  fileName: string
  onConfirm: (mapping: Record<number, ColumnKey>) => void
  onBack: () => void
}) {
  const [mapping, setMapping] = useState<Record<number, ColumnKey>>(() => {
    const m: Record<number, ColumnKey> = {}
    headers.forEach((h, i) => { m[i] = autoDetectColumn(h) })
    return m
  })

  const hasName = Object.values(mapping).includes("name")
  const preview = rows.slice(0, 3)

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <FileSpreadsheet size={15} />
        <span className="truncate font-medium text-foreground">{fileName}</span>
        <span>· {rows.length.toLocaleString("pt-BR")} linhas</span>
      </div>

      <div className="surface space-y-3">
        <p className="text-sm font-medium">Mapeamento de colunas</p>
        <p className="text-xs text-muted-foreground">Diga ao Kira o que cada coluna do seu arquivo representa.</p>
        <div className="space-y-2">
          {headers.map((header, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate">{header}</p>
                <p className="text-xs text-muted-foreground truncate">{preview.map(r => r[i]).filter(Boolean).slice(0, 2).join(", ")}</p>
              </div>
              <div className="relative shrink-0">
                <select
                  value={mapping[i]}
                  onChange={(e) => setMapping(prev => ({ ...prev, [i]: e.target.value as ColumnKey }))}
                  className="appearance-none rounded-lg border border-input bg-background pl-3 pr-8 py-1.5 text-xs outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 cursor-pointer"
                >
                  {(Object.keys(COLUMN_LABELS) as ColumnKey[]).map((key) => (
                    <option key={key} value={key}>{COLUMN_LABELS[key]}</option>
                  ))}
                </select>
                <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {!hasName && (
        <div className="flex items-center gap-2 rounded-lg bg-amber-50 border border-amber-200 px-3 py-2">
          <AlertCircle size={14} className="text-amber-600 shrink-0" />
          <p className="text-xs text-amber-700">Mapeie pelo menos a coluna <strong>Nome</strong> para continuar.</p>
        </div>
      )}

      <div className="flex gap-2">
        <Button variant="outline" className="flex-1" onClick={onBack}>Voltar</Button>
        <Button className="flex-1" disabled={!hasName} onClick={() => onConfirm(mapping)}>
          Ver prévia
        </Button>
      </div>
    </div>
  )
}

// ── Step: Preview ─────────────────────────────────────────────────────────────

function PreviewStep({
  clientRows, totalRows, onConfirm, onBack, isLoading,
}: {
  clientRows: ClientRow[]
  totalRows: number
  onConfirm: () => void
  onBack: () => void
  isLoading: boolean
}) {
  const preview = clientRows.slice(0, 8)
  const skipped = totalRows - clientRows.length

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="surface text-center">
          <p className="text-2xl font-bold text-primary">{clientRows.length.toLocaleString("pt-BR")}</p>
          <p className="text-xs text-muted-foreground mt-0.5">clientes para importar</p>
        </div>
        <div className="surface text-center">
          <p className="text-2xl font-bold text-muted-foreground">{skipped.toLocaleString("pt-BR")}</p>
          <p className="text-xs text-muted-foreground mt-0.5">linhas sem nome (serão puladas)</p>
        </div>
      </div>

      <div className="surface space-y-2 p-0 overflow-hidden">
        <p className="text-sm font-medium px-4 pt-3">Prévia — primeiros {preview.length} clientes</p>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left px-4 py-2 text-muted-foreground font-medium">Nome</th>
                <th className="text-left px-4 py-2 text-muted-foreground font-medium">WhatsApp</th>
                <th className="text-left px-4 py-2 text-muted-foreground font-medium">E-mail</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {preview.map((row, i) => (
                <tr key={i}>
                  <td className="px-4 py-2 font-medium max-w-[160px] truncate">{row.name}</td>
                  <td className="px-4 py-2 text-muted-foreground">{row.whatsapp || "—"}</td>
                  <td className="px-4 py-2 text-muted-foreground max-w-[160px] truncate">{row.email || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {clientRows.length > preview.length && (
          <p className="text-xs text-muted-foreground px-4 pb-3">
            + {(clientRows.length - preview.length).toLocaleString("pt-BR")} clientes adicionais
          </p>
        )}
      </div>

      <div className="flex gap-2">
        <Button variant="outline" className="flex-1" onClick={onBack} disabled={isLoading}>Voltar</Button>
        <Button className="flex-1 bg-green-600 hover:bg-green-700 text-white" onClick={onConfirm} disabled={isLoading}>
          {isLoading
            ? <><div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent mr-2" />Importando...</>
            : `Importar ${clientRows.length.toLocaleString("pt-BR")} clientes`
          }
        </Button>
      </div>
    </div>
  )
}

// ── Step: Resultado ───────────────────────────────────────────────────────────

function ResultStep({ result, onReset }: { result: ImportResult; onReset: () => void }) {
  const router = useRouter()

  return (
    <div className="space-y-4">
      <div className="surface space-y-4">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-50">
            <CheckCircle2 size={22} className="text-green-600" />
          </div>
          <div>
            <p className="font-semibold">Importação concluída</p>
            <p className="text-sm text-muted-foreground">Seus clientes foram adicionados ao Kira.</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-xl bg-green-50 border border-green-200 px-3 py-3 text-center">
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <Users size={14} className="text-green-600" />
              <span className="text-xs font-medium text-green-700">Importados</span>
            </div>
            <p className="text-2xl font-bold text-green-700">{result.imported.toLocaleString("pt-BR")}</p>
          </div>
          <div className="rounded-xl bg-muted border border-border px-3 py-3 text-center">
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <SkipForward size={14} className="text-muted-foreground" />
              <span className="text-xs font-medium text-muted-foreground">Pulados</span>
            </div>
            <p className="text-2xl font-bold text-muted-foreground">{result.skipped.toLocaleString("pt-BR")}</p>
          </div>
          <div className={cn("rounded-xl border px-3 py-3 text-center", result.errors > 0 ? "bg-red-50 border-red-200" : "bg-muted border-border")}>
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <XCircle size={14} className={result.errors > 0 ? "text-red-600" : "text-muted-foreground"} />
              <span className={cn("text-xs font-medium", result.errors > 0 ? "text-red-700" : "text-muted-foreground")}>Erros</span>
            </div>
            <p className={cn("text-2xl font-bold", result.errors > 0 ? "text-red-700" : "text-muted-foreground")}>{result.errors}</p>
          </div>
        </div>

        {result.skipped > 0 && (
          <p className="text-xs text-muted-foreground">
            Clientes pulados já existiam no sistema (detectados por nome ou telefone).
          </p>
        )}

        {result.errorDetails.length > 0 && (
          <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 space-y-1">
            {result.errorDetails.slice(0, 5).map((e, i) => (
              <p key={i} className="text-xs text-red-700">{e}</p>
            ))}
          </div>
        )}
      </div>

      <div className="flex gap-2">
        <Button variant="outline" className="flex-1" onClick={onReset}>Nova importação</Button>
        <Button className="flex-1" onClick={() => router.push("/clientes")}>Ver clientes</Button>
      </div>
    </div>
  )
}

// ── Componente principal ──────────────────────────────────────────────────────

function buildClientRows(rows: string[][], headers: string[], mapping: Record<number, ColumnKey>): ClientRow[] {
  return rows
    .map((row) => {
      const obj: Partial<Record<ColumnKey, string>> = {}
      headers.forEach((_, i) => {
        const key = mapping[i]
        if (key && key !== "ignore" && row[i]) obj[key] = String(row[i]).trim()
      })
      if (!obj.name) return null

      // Normaliza data de nascimento para YYYY-MM-DD
      let birthDate = obj.birthDate
      if (birthDate) {
        // Tenta DD/MM/YYYY
        const brMatch = birthDate.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
        if (brMatch) birthDate = `${brMatch[3]}-${brMatch[2].padStart(2, "0")}-${brMatch[1].padStart(2, "0")}`
      }

      return { name: obj.name, whatsapp: obj.whatsapp, email: obj.email, cpf: obj.cpf, birthDate, notes: obj.notes } as ClientRow
    })
    .filter(Boolean) as ClientRow[]
}

const STEP_LABELS = ["Arquivo", "Colunas", "Prévia", "Resultado"]

export function ImportClientsView() {
  const [step, setStep] = useState<Step>("upload")
  const [fileData, setFileData] = useState<{ headers: string[]; rows: string[][]; fileName: string } | null>(null)
  const [mapping, setMapping] = useState<Record<number, ColumnKey>>({})
  const [clientRows, setClientRows] = useState<ClientRow[]>([])
  const [result, setResult] = useState<ImportResult | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const stepIndex = ["upload", "mapping", "preview", "result"].indexOf(step)

  function handleParsed(headers: string[], rows: string[][], fileName: string) {
    setFileData({ headers, rows, fileName })
    setStep("mapping")
  }

  function handleMappingConfirm(m: Record<number, ColumnKey>) {
    if (!fileData) return
    setMapping(m)
    const rows = buildClientRows(fileData.rows, fileData.headers, m)
    setClientRows(rows)
    setStep("preview")
  }

  async function handleImport() {
    setIsLoading(true)
    const res = await importClientsAction(clientRows)
    setResult(res)
    setIsLoading(false)
    setStep("result")
  }

  function handleReset() {
    setStep("upload")
    setFileData(null)
    setMapping({})
    setClientRows([])
    setResult(null)
  }

  return (
    <div className="space-y-6">
      {/* Stepper */}
      {step !== "result" && (
        <div className="flex items-center gap-0">
          {STEP_LABELS.slice(0, 3).map((label, i) => (
            <div key={i} className="flex items-center flex-1 last:flex-none">
              <div className="flex items-center gap-2">
                <div className={cn(
                  "flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold transition-colors",
                  i < stepIndex ? "bg-primary text-primary-foreground" :
                  i === stepIndex ? "bg-primary text-primary-foreground" :
                  "bg-muted text-muted-foreground"
                )}>
                  {i < stepIndex ? "✓" : i + 1}
                </div>
                <span className={cn("text-xs font-medium", i === stepIndex ? "text-foreground" : "text-muted-foreground")}>
                  {label}
                </span>
              </div>
              {i < 2 && <div className={cn("flex-1 h-px mx-3", i < stepIndex ? "bg-primary" : "bg-border")} />}
            </div>
          ))}
        </div>
      )}

      {step === "upload" && <UploadStep onParsed={handleParsed} />}

      {step === "mapping" && fileData && (
        <MappingStep
          headers={fileData.headers}
          rows={fileData.rows}
          fileName={fileData.fileName}
          onConfirm={handleMappingConfirm}
          onBack={() => setStep("upload")}
        />
      )}

      {step === "preview" && (
        <PreviewStep
          clientRows={clientRows}
          totalRows={fileData?.rows.length ?? 0}
          onConfirm={handleImport}
          onBack={() => setStep("mapping")}
          isLoading={isLoading}
        />
      )}

      {step === "result" && result && (
        <ResultStep result={result} onReset={handleReset} />
      )}
    </div>
  )
}
