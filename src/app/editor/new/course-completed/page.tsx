'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import CourseCompletedEditor from '@/components/Editor/CourseCompletedEditor'
import { CourseCompletedData } from '@/types'

const defaultData: CourseCompletedData = {
  title: "You're all done!",
  subtitle: "How was your course experience?",
  selectedEmoji: 'happy',
  ctaText: "Create your own course",
  layout: 'image-left',
  confetti: 'celebration'
}

export default function CourseCompletedPage() {
  const router = useRouter()
  const [data, setData] = useState<CourseCompletedData>(defaultData)

  const handleSave = () => {
    // Save logic here
    console.log('Saving course completed data:', data)
    router.push('/dashboard')
  }

  const handleDataChange = (newData: CourseCompletedData) => {
    setData(newData)
  }

  return (
    <div className="editor-page">
      <CourseCompletedEditor 
        data={data} 
        onChange={handleDataChange}
      />
    </div>
  )
}
