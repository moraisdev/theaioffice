'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'

interface StepCapturaProps {
  question: string
  nome: string
  email: string
  whatsapp: string
  onChange: (field: 'nome' | 'email' | 'whatsapp', value: string) => void
  onSubmit: () => void
  isSubmitting: boolean
}

export function StepCaptura({
  question,
  nome,
  email,
  whatsapp,
  onChange,
  onSubmit,
  isSubmitting,
}: StepCapturaProps) {
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validate = () => {
    const newErrors: Record<string, string> = {}
    if (!nome.trim()) newErrors.nome = 'Nome é obrigatório'
    if (!email.trim()) {
      newErrors.email = 'E-mail é obrigatório'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'E-mail inválido'
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = () => {
    if (validate()) onSubmit()
  }

  const clearError = (field: string) => {
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev }
        delete next[field]
        return next
      })
    }
  }

  const inputClass = (hasError: boolean) =>
    `w-full p-4 bg-white/5 border rounded-xl text-white placeholder-gray-500
     focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400
     transition-colors ${hasError ? 'border-red-400' : 'border-white/10'}`

  return (
    <div className="w-full max-w-xl mx-auto">
      <h2 className="text-2xl md:text-3xl font-bold text-white mb-8 leading-tight">
        {question}
      </h2>
      <div className="space-y-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <label className="block text-sm text-gray-400 mb-1.5">Nome *</label>
          <input
            type="text"
            value={nome}
            onChange={(e) => {
              onChange('nome', e.target.value)
              clearError('nome')
            }}
            placeholder="Seu nome"
            className={inputClass(!!errors.nome)}
          />
          {errors.nome && <p className="text-red-400 text-sm mt-1">{errors.nome}</p>}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <label className="block text-sm text-gray-400 mb-1.5">E-mail *</label>
          <input
            type="email"
            value={email}
            onChange={(e) => {
              onChange('email', e.target.value)
              clearError('email')
            }}
            placeholder="seu@email.com"
            className={inputClass(!!errors.email)}
          />
          {errors.email && <p className="text-red-400 text-sm mt-1">{errors.email}</p>}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <label className="block text-sm text-gray-400 mb-1.5">WhatsApp (opcional)</label>
          <input
            type="tel"
            value={whatsapp}
            onChange={(e) => onChange('whatsapp', e.target.value)}
            placeholder="(00) 00000-0000"
            className={inputClass(false)}
          />
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="mt-8 flex justify-end"
      >
        <button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="px-8 py-3 bg-indigo-500 hover:bg-indigo-400 disabled:opacity-50
                     disabled:cursor-not-allowed text-white rounded-xl font-medium
                     transition-colors cursor-pointer"
        >
          Ver meu diagnóstico
        </button>
      </motion.div>
    </div>
  )
}
