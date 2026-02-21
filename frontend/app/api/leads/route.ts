import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/utils/db'

const rateLimitMap = new Map<string, { count: number; reset: number }>()
const RATE_LIMIT = 10
const RATE_WINDOW = 60 * 60 * 1000 // 1 hour

export async function POST(request: NextRequest) {
  try {
    // Rate limiting by IP
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0] ?? 'unknown'
    const now = Date.now()
    const entry = rateLimitMap.get(ip)
    if (entry && now < entry.reset) {
      if (entry.count >= RATE_LIMIT) {
        return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
      }
      entry.count++
    } else {
      rateLimitMap.set(ip, { count: 1, reset: now + RATE_WINDOW })
    }

    const body = await request.json()

    if (!body.nome?.trim() || !body.email?.trim()) {
      return NextResponse.json({ error: 'Nome and email are required' }, { status: 400 })
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 })
    }

    const lead = await prisma.lead.create({
      data: {
        nome: body.nome,
        email: body.email,
        whatsapp: body.whatsapp || null,
        setor: body.setor || '',
        tamanho: body.tamanho || '',
        papel: body.papel || '',
        tarefas: body.tarefas || '[]',
        maturidadeIA: body.maturidadeIA || '',
        obstaculo: body.obstaculo || '',
        delegaria: body.delegaria || '',
        urgencia: body.urgencia || '',
        templateSugerido: body.templateSugerido || '',
      },
    })

    return NextResponse.json({ success: true, id: lead.id }, { status: 201 })
  } catch (error) {
    console.error('Failed to save lead:', error)
    return NextResponse.json({ error: 'Failed to save lead' }, { status: 500 })
  }
}
