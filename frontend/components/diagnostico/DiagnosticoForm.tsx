'use client'

import { useState, useRef, useCallback } from 'react'
import { motion } from 'framer-motion'
import { StepSingleSelect } from './steps/StepSingleSelect'
import { StepMultiSelect } from './steps/StepMultiSelect'
import { StepTextarea } from './steps/StepTextarea'
import { StepCurrency } from './steps/StepCurrency'
import { StepCaptura } from './steps/StepCaptura'
import { ResultadoDiagnostico } from './ResultadoDiagnostico'
import { StepWrapper } from './StepWrapper'
import { STEPS, FormAnswers, TemplateResult, getRecommendedTemplate } from '@/utils/diagnostico'

const TOTAL_STEPS = STEPS.length

const initialAnswers: FormAnswers = {
  setor: '',
  tamanho: '',
  custoEquipe: '',
  papel: '',
  tarefas: [],
  maturidadeIA: '',
  obstaculo: '',
  delegaria: '',
  urgencia: '',
  nome: '',
  email: '',
  whatsapp: '',
}

export function DiagnosticoForm() {
  const [currentStep, setCurrentStep] = useState(0)
  const [direction, setDirection] = useState(1)
  const [answers, setAnswers] = useState<FormAnswers>(initialAnswers)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<TemplateResult | null>(null)
  const isTransitioning = useRef(false)

  const progress = ((currentStep + 1) / TOTAL_STEPS) * 100

  const goNext = useCallback(() => {
    if (isTransitioning.current) return
    isTransitioning.current = true
    setDirection(1)
    setCurrentStep((prev) => Math.min(prev + 1, TOTAL_STEPS - 1))
    setTimeout(() => {
      isTransitioning.current = false
    }, 700)
  }, [])

  const goBack = useCallback(() => {
    if (isTransitioning.current) return
    isTransitioning.current = true
    setDirection(-1)
    setCurrentStep((prev) => Math.max(prev - 1, 0))
    setTimeout(() => {
      isTransitioning.current = false
    }, 700)
  }, [])

  const handleSingleSelect = useCallback(
    (key: string, value: string) => {
      if (isTransitioning.current) return
      isTransitioning.current = true
      setAnswers((prev) => ({ ...prev, [key]: value }))
      setTimeout(() => {
        setDirection(1)
        setCurrentStep((prev) => Math.min(prev + 1, TOTAL_STEPS - 1))
      }, 400)
      // Keep guard active through full animation cycle (400ms delay + 300ms exit + 300ms enter)
      setTimeout(() => {
        isTransitioning.current = false
      }, 1100)
    },
    []
  )

  const handleMultiChange = useCallback((value: string[]) => {
    setAnswers((prev) => ({ ...prev, tarefas: value }))
  }, [])

  const handleCurrencyChange = useCallback((value: string) => {
    setAnswers((prev) => ({ ...prev, custoEquipe: value }))
  }, [])

  const handleTextChange = useCallback((value: string) => {
    setAnswers((prev) => ({ ...prev, delegaria: value }))
  }, [])

  const handleCapturaChange = useCallback(
    (field: 'nome' | 'email' | 'whatsapp', value: string) => {
      setAnswers((prev) => ({ ...prev, [field]: value }))
    },
    []
  )

  const handleSubmit = async () => {
    setIsSubmitting(true)
    setIsLoading(true)

    const template = getRecommendedTemplate(answers)

    // Run fetch and minimum delay in parallel
    const fetchLead = fetch('/api/leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...answers,
        tarefas: JSON.stringify(answers.tarefas),
        templateSugerido: template.template,
      }),
    }).catch((err) => {
      console.error('Failed to submit lead:', err)
    })

    const minimumDelay = new Promise((resolve) => setTimeout(resolve, 2500))

    await Promise.all([fetchLead, minimumDelay])

    setResult(template)
    setIsLoading(false)
    setIsSubmitting(false)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            className="w-12 h-12 border-2 border-indigo-400 border-t-transparent rounded-full mx-auto mb-6"
          />
          <p className="text-white text-lg font-medium">Analisando suas respostas...</p>
          <p className="text-gray-500 text-sm mt-2">Preparando seu diagnóstico personalizado</p>
        </motion.div>
      </div>
    )
  }

  if (result) {
    return (
      <div className="min-h-screen flex items-center justify-center py-12">
        <ResultadoDiagnostico answers={answers} template={result} />
      </div>
    )
  }

  const step = STEPS[currentStep]

  return (
    <div className="min-h-screen flex flex-col">
      {/* Progress bar */}
      <div className="fixed top-0 left-0 right-0 z-50 h-1 bg-white/5">
        <motion.div
          className="h-full bg-indigo-500"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.4, ease: 'easeInOut' }}
        />
      </div>

      {/* Header with back button and step counter */}
      <div className="fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-4 pt-4 md:px-8 md:pt-6">
        {currentStep > 0 ? (
          <button
            onClick={goBack}
            className="flex items-center gap-1 text-gray-400 hover:text-white
                       transition-colors p-2 -ml-2 cursor-pointer"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
          </button>
        ) : (
          <div />
        )}
        <span className="text-gray-500 text-sm">
          {currentStep + 1} de {TOTAL_STEPS}
        </span>
      </div>

      {/* Step content */}
      <div className="flex-1 flex items-center justify-center px-4 md:px-8 py-20">
        <StepWrapper currentStep={currentStep} direction={direction}>
          {step.type === 'single' && (
            <StepSingleSelect
              question={step.question}
              options={step.options}
              value={(answers[step.key] as string) || ''}
              onSelect={(value) => handleSingleSelect(step.key, value)}
            />
          )}
          {step.type === 'multi' && (
            <StepMultiSelect
              question={step.question}
              options={step.options}
              value={answers.tarefas}
              onChange={handleMultiChange}
              onNext={goNext}
            />
          )}
          {step.type === 'currency' && (
            <StepCurrency
              question={step.question}
              placeholder={step.placeholder}
              value={answers.custoEquipe}
              onChange={handleCurrencyChange}
              onNext={goNext}
            />
          )}
          {step.type === 'textarea' && (
            <StepTextarea
              question={step.question}
              placeholder={step.placeholder}
              maxLength={step.maxLength}
              value={answers.delegaria}
              onChange={handleTextChange}
              onNext={goNext}
            />
          )}
          {step.type === 'captura' && (
            <StepCaptura
              question={step.question}
              nome={answers.nome}
              email={answers.email}
              whatsapp={answers.whatsapp}
              onChange={handleCapturaChange}
              onSubmit={handleSubmit}
              isSubmitting={isSubmitting}
            />
          )}
        </StepWrapper>
      </div>
    </div>
  )
}
