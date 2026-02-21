'use client'

import { motion } from 'framer-motion'
import { StepOption } from '@/utils/diagnostico'

interface StepMultiSelectProps {
  question: string
  options: StepOption[]
  value: string[]
  onChange: (value: string[]) => void
  onNext: () => void
}

export function StepMultiSelect({ question, options, value, onChange, onNext }: StepMultiSelectProps) {
  const toggleOption = (label: string) => {
    if (value.includes(label)) {
      onChange(value.filter((v) => v !== label))
    } else {
      onChange([...value, label])
    }
  }

  return (
    <div className="w-full max-w-xl mx-auto">
      <h2 className="text-2xl md:text-3xl font-bold text-white mb-2 leading-tight">
        {question}
      </h2>
      <p className="text-gray-400 text-sm mb-8">Selecione uma ou mais opções</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {options.map((option, i) => {
          const isActive = value.includes(option.label)
          return (
            <motion.button
              key={option.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => toggleOption(option.label)}
              className={`
                flex items-center gap-3 p-4 rounded-xl border text-left
                transition-all duration-150 cursor-pointer min-h-[56px]
                ${isActive
                  ? 'border-indigo-400 bg-indigo-400/10'
                  : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/[0.08]'
                }
              `}
            >
              <span className="text-xl flex-shrink-0">{option.emoji}</span>
              <span className="text-white text-sm md:text-base flex-1">{option.label}</span>
              {isActive && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="text-indigo-400 font-bold"
                >
                  ✓
                </motion.span>
              )}
            </motion.button>
          )
        })}
      </div>
      {value.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
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
      )}
    </div>
  )
}
