'use client'

import { motion } from 'framer-motion'

interface StepTextareaProps {
  question: string
  placeholder: string
  maxLength: number
  value: string
  onChange: (value: string) => void
  onNext: () => void
}

export function StepTextarea({ question, placeholder, maxLength, value, onChange, onNext }: StepTextareaProps) {
  return (
    <div className="w-full max-w-xl mx-auto">
      <h2 className="text-2xl md:text-3xl font-bold text-white mb-8 leading-tight">
        {question}
      </h2>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value.slice(0, maxLength))}
          placeholder={placeholder}
          rows={4}
          className="w-full p-4 bg-white/5 border border-white/10 rounded-xl text-white
                     placeholder-gray-500 focus:outline-none focus:border-indigo-400
                     focus:ring-1 focus:ring-indigo-400 resize-none transition-colors"
        />
        <div className="flex justify-between items-center mt-2">
          <span className={`text-sm ${value.length >= maxLength ? 'text-red-400' : 'text-gray-500'}`}>
            {value.length}/{maxLength}
          </span>
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
