'use client'

import { motion } from 'framer-motion'
import { FormAnswers, TemplateResult, getUrgenciaTexto } from '@/utils/diagnostico'

interface ResultadoDiagnosticoProps {
  answers: FormAnswers
  template: TemplateResult
}

const corClasses: Record<string, { border: string; bg: string; text: string }> = {
  orange: { border: 'border-orange-400', bg: 'bg-orange-400/10', text: 'text-orange-400' },
  blue: { border: 'border-blue-400', bg: 'bg-blue-400/10', text: 'text-blue-400' },
  green: { border: 'border-green-400', bg: 'bg-green-400/10', text: 'text-green-400' },
  pink: { border: 'border-pink-400', bg: 'bg-pink-400/10', text: 'text-pink-400' },
  purple: { border: 'border-purple-400', bg: 'bg-purple-400/10', text: 'text-purple-400' },
}

export function ResultadoDiagnostico({ answers, template }: ResultadoDiagnosticoProps) {
  const cores = corClasses[template.cor] || corClasses.purple
  const ctaUrl = process.env.NEXT_PUBLIC_CTA_URL || '#'

  return (
    <div className="w-full max-w-2xl mx-auto px-4">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center mb-10"
      >
        <h1 className="text-2xl md:text-3xl font-bold text-white leading-tight">
          {getUrgenciaTexto(answers.urgencia, answers.nome)}
        </h1>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className={`p-6 md:p-8 rounded-2xl border ${cores.border} ${cores.bg} mb-8`}
      >
        <div className="flex items-center gap-4 mb-4">
          <span className="text-4xl">{template.icon}</span>
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-white">{template.template}</h2>
            <p className="text-gray-400 text-sm mt-1">{template.descricao}</p>
          </div>
        </div>

        <div className="mt-6 space-y-3">
          <p className={`text-sm font-medium ${cores.text} uppercase tracking-wide`}>
            Seu time de agentes
          </p>
          {template.agentes.map((agente, i) => (
            <motion.div
              key={agente}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 + i * 0.1 }}
              className="flex items-center gap-3 p-3 bg-white/5 rounded-lg"
            >
              <div
                className={`w-8 h-8 rounded-full ${cores.bg} ${cores.border} border
                            flex items-center justify-center text-sm font-bold ${cores.text}`}
              >
                {i + 1}
              </div>
              <span className="text-white">{agente}</span>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {answers.delegaria && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="p-5 bg-white/5 border border-white/10 rounded-xl mb-8"
        >
          <p className="text-gray-300 leading-relaxed">
            Você mencionou que delegaria{' '}
            <span className="text-white font-medium">&ldquo;{answers.delegaria}&rdquo;</span>.
            É exatamente isso que o{' '}
            <span className={`font-medium ${cores.text}`}>{template.agentes[0]}</span> resolve.
          </p>
        </motion.div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.9 }}
        className="text-center space-y-4"
      >
        <a
          href={ctaUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block px-10 py-4 bg-indigo-500 hover:bg-indigo-400 text-white
                     rounded-xl font-bold text-lg transition-colors"
        >
          Quero conhecer a plataforma
        </a>
        <p className="text-gray-500 text-sm">
          Entraremos em contato em até 24h no e-mail {answers.email}
        </p>
      </motion.div>
    </div>
  )
}
