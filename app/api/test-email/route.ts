import { NextRequest, NextResponse } from 'next/server'
import { sendEmail } from '@/lib/email'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email } = body

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    console.log('Testing email to:', email)

    await sendEmail({
      to: [email],
      subject: 'Prueba de Email - Sistema Vichada',
      htmlContent: `
        <h2>Email de Prueba</h2>
        <p>Este es un email de prueba del Sistema de Soporte Vichada.</p>
        <p>Si recibes este mensaje, la configuración de email está funcionando correctamente.</p>
        <p>Fecha: ${new Date().toLocaleString('es-ES')}</p>
      `
    })

    return NextResponse.json({ 
      success: true, 
      message: 'Email sent successfully' 
    })
  } catch (error) {
    console.error('Error in test email:', error)
    return NextResponse.json({ 
      error: 'Failed to send email',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
