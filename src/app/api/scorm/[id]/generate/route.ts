import { NextRequest, NextResponse } from 'next/server'

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.API_BASE_URL ||
  'https://scrom.lisaapp.in/api'

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const body = await request.json()
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    
    if (!token) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const params = await context.params
    const scormId = params.id

    if (!scormId) {
      return NextResponse.json({ message: 'Missing SCORM package id' }, { status: 400 })
    }

    const response = await fetch(`${API_BASE_URL}/scorm/${scormId}/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(body)
    })

    if (!response.ok) {
      const errorData = await response.json()
      return NextResponse.json(errorData, { status: response.status })
    }

    // Return the binary data for the ZIP file
    const buffer = await response.arrayBuffer()
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="scorm_package.zip"`
      }
    })
  } catch (error) {
    console.error('API route error:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}
