import { DiagnosticoForm } from '@/components/diagnostico/DiagnosticoForm'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Diagnóstico — The AI Office',
  description: 'Descubra como agentes IA podem transformar sua empresa',
}

export default function DiagnosticoPage() {
  return (
    <main className="min-h-screen bg-[#1a1e36]">
      <DiagnosticoForm />
    </main>
  )
}
