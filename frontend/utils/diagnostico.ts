export interface FormAnswers {
  setor: string
  tamanho: string
  custoEquipe: string
  papel: string
  tarefas: string[]
  maturidadeIA: string
  obstaculo: string
  delegaria: string
  urgencia: string
  nome: string
  email: string
  whatsapp: string
}

export interface TemplateResult {
  template: string
  icon: string
  agentes: string[]
  cor: string
  descricao: string
}

export function getRecommendedTemplate(answers: FormAnswers): TemplateResult {
  const { setor, tarefas } = answers

  if (setor === 'Marketing e Conteúdo' || tarefas.includes('Criação de conteúdo')) {
    return {
      template: 'Marketing Agency',
      icon: '📢',
      agentes: ['Creative Director', 'Content Strategist', 'Social Media Manager'],
      cor: 'orange',
      descricao: 'Equipe focada em produção e distribuição de conteúdo em escala',
    }
  }
  if (setor === 'Tech / SaaS' || tarefas.includes('Desenvolvimento')) {
    return {
      template: 'Tech Startup',
      icon: '🚀',
      agentes: ['Frontend Dev', 'Backend Engineer', 'Tech Lead'],
      cor: 'blue',
      descricao: 'Time técnico completo pra acelerar seu produto',
    }
  }
  if (tarefas.includes('Atendimento ao cliente')) {
    return {
      template: 'Customer Support',
      icon: '🎧',
      agentes: ['Support Lead', 'Technical Support', 'Knowledge Base Manager'],
      cor: 'green',
      descricao: 'Suporte 24/7 que nunca cansa e nunca esquece nada',
    }
  }
  if (tarefas.includes('Gestão de projetos')) {
    return {
      template: 'SaaS Product Team',
      icon: '📦',
      agentes: ['Product Manager', 'Full-Stack Dev', 'Growth Analyst'],
      cor: 'pink',
      descricao: 'Time de produto que executa do planejamento ao deploy',
    }
  }
  return {
    template: 'Content Studio',
    icon: '✍️',
    agentes: ['Editor-in-Chief', 'Staff Writer', 'Copywriter'],
    cor: 'purple',
    descricao: 'Máquina de conteúdo que escreve, revisa e publica por você',
  }
}

export function getUrgenciaTexto(urgencia: string, nome: string): string {
  if (urgencia === 'Agora, é urgente')
    return `${nome}, você está deixando dinheiro na mesa. Veja o que identificamos:`
  if (urgencia === 'Nos próximos 3 meses')
    return `${nome}, você está no momento certo pra dar esse salto. Veja o que identificamos:`
  return `${nome}, boa notícia: você está à frente da maioria. Veja o que identificamos:`
}

export interface StepOption {
  emoji: string
  label: string
}

interface StepSingle {
  type: 'single'
  question: string
  key: keyof FormAnswers
  options: StepOption[]
}

interface StepMulti {
  type: 'multi'
  question: string
  key: 'tarefas'
  options: StepOption[]
}

interface StepText {
  type: 'textarea'
  question: string
  key: 'delegaria'
  placeholder: string
  maxLength: number
}

interface StepCurrency {
  type: 'currency'
  question: string
  key: 'custoEquipe'
  placeholder: string
}

interface StepContact {
  type: 'captura'
  question: string
  key: 'captura'
}

export type StepConfig = StepSingle | StepMulti | StepText | StepCurrency | StepContact

export const STEPS: StepConfig[] = [
  {
    type: 'single',
    question: 'Qual é o setor da sua empresa?',
    key: 'setor',
    options: [
      { emoji: '🛒', label: 'E-commerce' },
      { emoji: '📣', label: 'Marketing e Conteúdo' },
      { emoji: '💻', label: 'Tech / SaaS' },
      { emoji: '💼', label: 'Serviços Profissionais' },
      { emoji: '🏪', label: 'Varejo' },
      { emoji: '🔧', label: 'Outro' },
    ],
  },
  {
    type: 'single',
    question: 'Quantas pessoas trabalham na sua empresa?',
    key: 'tamanho',
    options: [
      { emoji: '👤', label: 'Só eu' },
      { emoji: '👥', label: '2 a 10' },
      { emoji: '🏢', label: '11 a 50' },
      { emoji: '🏭', label: 'Mais de 50' },
    ],
  },
  {
    type: 'currency',
    question: 'Quanto sua empresa gasta com equipe por mês?',
    key: 'custoEquipe',
    placeholder: 'Ex: 15000',
  },
  {
    type: 'single',
    question: 'Qual é o seu papel na empresa?',
    key: 'papel',
    options: [
      { emoji: '🚀', label: 'Fundador / CEO' },
      { emoji: '🤝', label: 'Sócio' },
      { emoji: '📋', label: 'Gestor' },
      { emoji: '🔹', label: 'Outro' },
    ],
  },
  {
    type: 'multi',
    question: 'Quais tarefas tomam mais tempo do seu time hoje?',
    key: 'tarefas',
    options: [
      { emoji: '💬', label: 'Atendimento ao cliente' },
      { emoji: '✍️', label: 'Criação de conteúdo' },
      { emoji: '📊', label: 'Análise de dados' },
      { emoji: '👨‍💻', label: 'Desenvolvimento' },
      { emoji: '📞', label: 'Vendas e follow-up' },
      { emoji: '📁', label: 'Gestão de projetos' },
    ],
  },
  {
    type: 'single',
    question: 'Como você usa IA hoje?',
    key: 'maturidadeIA',
    options: [
      { emoji: '❌', label: 'Não uso IA ainda' },
      { emoji: '🤖', label: 'Uso ChatGPT ou similar, mas sem processo definido' },
      { emoji: '⚙️', label: 'Tenho algumas automações' },
      { emoji: '🧠', label: 'Uso IA de forma estruturada' },
    ],
  },
  {
    type: 'single',
    question: 'Qual é o maior obstáculo pra escalar sua empresa hoje?',
    key: 'obstaculo',
    options: [
      { emoji: '👥', label: 'Falta de gente' },
      { emoji: '🔄', label: 'Tarefas repetitivas que consomem o time' },
      { emoji: '✅', label: 'Dificuldade de manter qualidade' },
      { emoji: '💰', label: 'Custo alto de contratação' },
      { emoji: '🧭', label: 'Não sei por onde começar com IA' },
    ],
  },
  {
    type: 'textarea',
    question:
      'Se você pudesse ter um time de assistentes IA trabalhando pra você agora, qual seria a primeira coisa que delegaria?',
    key: 'delegaria',
    placeholder: 'Ex: responder e-mails de clientes, criar posts para o Instagram...',
    maxLength: 300,
  },
  {
    type: 'single',
    question: 'Quando você precisa resolver isso?',
    key: 'urgencia',
    options: [
      { emoji: '🔥', label: 'Agora, é urgente' },
      { emoji: '📅', label: 'Nos próximos 3 meses' },
      { emoji: '🔍', label: 'Ainda estou pesquisando' },
    ],
  },
  {
    type: 'captura',
    question: 'Onde enviamos seu diagnóstico personalizado?',
    key: 'captura',
  },
]
