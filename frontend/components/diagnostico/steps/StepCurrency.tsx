'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'

interface StepCurrencyProps {
  question: string
  placeholder: string
  value: string
  onChange: (value: string) => void
  onNext: () => void
}

function formatCurrency(raw: string): string {
  const digits = raw.replace(/\D/g, '')
  if (!digits) return ''
  const num = parseInt(digits, 10)
  return num.toLocaleString('pt-BR')
}

function parseCurrency(formatted: string): string {
  return formatted.replace(/\D/g, '')
}

export function StepCurrency({ question, placeholder, value, onChange, onNext }: StepCurrencyProps) {
  const [displayValue, setDisplayValue] = useState(() => formatCurrency(value))

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = parseCurrency(e.target.value)
    if (raw.length > 10) return // cap at 10 digits
    setDisplayValue(formatCurrency(raw))
    onChange(raw)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && value) {
      onNext()
    }
  }

  return (
    <div className="w-full max-w-xl mx-auto">
      <h2 className="text-2xl md:text-3xl font-bold text-white mb-2 leading-tight">
        {question}
      </h2>
      <p className="text-gray-400 text-sm mb-8">
        Inclua salários, benefícios, freelancers — uma estimativa já ajuda
      </p>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg">
            R$
          </span>
          <input
            type="text"
            inputMode="numeric"
            value={displayValue}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="w-full p-4 pl-12 bg-white/5 border border-white/10 rounded-xl text-white
                       text-lg placeholder-gray-500 focus:outline-none focus:border-indigo-400
                       focus:ring-1 focus:ring-indigo-400 transition-colors"
          />
        </div>
      </motion.div>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mt-8 flex justify-end"
      >
        <button
          onClick={onNext}
          className="px-8 py-3 bg-indigo-500 hover:bg-indigo-400 text-white rounded-xl
                     font-medium transition-colors cursor-pointer"
        >
          Próximo
        </button>
      </motion.div>
    </div>
  )
}
