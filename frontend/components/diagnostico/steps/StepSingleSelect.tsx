'use client'

import { motion } from 'framer-motion'
import { StepOption } from '@/utils/diagnostico'

interface StepSingleSelectProps {
  question: string
  options: StepOption[]
  value: string
  onSelect: (value: string) => void
}

export function StepSingleSelect({ question, options, value, onSelect }: StepSingleSelectProps) {
  return (
    <div className="w-full max-w-xl mx-auto">
      <h2 className="text-2xl md:text-3xl font-bold text-white mb-8 leading-tight">
        {question}
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {options.map((option, i) => {
          const isSelected = value === option.label
          return (
            <motion.button
              key={option.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => onSelect(option.label)}
              className={`
                flex items-center gap-3 p-4 rounded-xl border text-left
                transition-all duration-150 cursor-pointer min-h-[56px]
                ${isSelected
                  ? 'border-indigo-400 bg-indigo-400/10 scale-[1.02]'
                  : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/[0.08]'
                }
              `}
            >
              <span className="text-xl flex-shrink-0">{option.emoji}</span>
              <span className="text-white text-sm md:text-base">{option.label}</span>
            </motion.button>
          )
        })}
      </div>
    </div>
  )
}
