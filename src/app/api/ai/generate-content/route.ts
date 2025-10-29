import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(request: NextRequest) {
  try {
    const { systemPrompt, userPrompt, contentType } = await request.json()

    if (!systemPrompt || !userPrompt || !contentType) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      )
    }

    // Determine max_tokens based on content type
    const getMaxTokens = (contentType: string): number => {
      switch (contentType) {
        case 'text-image':
          return 400  // 100-150 words for paragraph-based slide content
        case 'flashcards':
          return 800  // Multiple Q&A pairs
        case 'accordion':
          return 600  // Multiple expandable sections
        case 'checklist':
          return 400  // Multiple checklist items
        default:
          return 500
      }
    }

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: systemPrompt
        },
        {
          role: 'user',
          content: userPrompt
        }
      ],
      temperature: 0.7,
      max_tokens: getMaxTokens(contentType),
    })

    const generatedContent = completion.choices[0]?.message?.content

    if (!generatedContent) {
      return NextResponse.json(
        { error: 'No content generated' },
        { status: 500 }
      )
    }

    // Parse the JSON response
    try {
      const parsedContent = JSON.parse(generatedContent)
      
      // Validate and structure the content based on type
      const structuredContent = validateAndStructureContent(parsedContent, contentType)
      
      return NextResponse.json(structuredContent)
    } catch (parseError) {
      console.error('Error parsing AI response:', parseError)
      return NextResponse.json(
        { error: 'Invalid JSON response from AI' },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('AI generation error:', error)
    return NextResponse.json(
      { error: 'Failed to generate content' },
      { status: 500 }
    )
  }
}

function validateAndStructureContent(content: any, contentType: string) {
  switch (contentType) {
    case 'text-image':
      // Keep plain text only; strip any HTML tags if present
      {
        const raw = (content.content || '').toString()
        // Remove any HTML tags and decode basic entities
        const withoutTags = raw.replace(/<[^>]*>/g, '')
        // Normalize whitespace; preserve double line breaks as paragraph breaks
        const normalized = withoutTags
          .replace(/\r\n/g, '\n')
          .replace(/\r/g, '\n')
          .replace(/\n{3,}/g, '\n\n')
          .replace(/[\t ]+/g, ' ')
          .trim()

        return {
          title: content.title || 'AI Generated Content',
          content: normalized, // PLAIN TEXT – NO HTML
          layout: content.layout || 'right',
          altText: content.altText || 'Generated content'
        }
      }

    case 'flashcards':
      return {
        title: content.title || 'AI Generated Flashcards',
        description: content.description || 'Generated flashcard set',
        cards: Array.isArray(content.cards) ? content.cards.map((card: any, index: number) => ({
          id: card.id || (index + 1).toString(),
          frontTitle: card.frontTitle || '',
          frontDescription: card.frontDescription || '',
          back: card.back || ''
        })) : []
      }

    case 'accordion':
      return {
        title: content.title || 'AI Generated Accordion',
        description: content.description || 'Generated accordion content',
        items: Array.isArray(content.items) ? content.items.map((item: any, index: number) => ({
          id: item.id || (index + 1).toString(),
          title: item.title || '',
          description: item.description || '',
          isExpanded: item.isExpanded || false
        })) : []
      }

    case 'checklist':
      return {
        title: content.title || 'AI Generated Checklist',
        items: Array.isArray(content.items) ? content.items.map((item: any, index: number) => ({
          id: item.id || (index + 1).toString(),
          text: item.text || '',
          checked: item.checked || false,
          parentId: item.parentId || null,
          children: item.children || []
        })) : []
      }

    default:
      return content
  }
}
