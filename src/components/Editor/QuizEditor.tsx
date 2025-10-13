'use client'

import { useState } from 'react'
import { Plus, Trash2, HelpCircle, CheckCircle, XCircle } from 'lucide-react'
import { QuizData } from '@/types'

interface QuizEditorProps {
  data: QuizData
  onChange: (data: QuizData) => void
}

const questionTypes = [
  { value: 'mcq', label: 'Multiple Choice (Single)' },
  { value: 'multiple', label: 'Multiple Choice (Multiple)' },
  { value: 'true-false', label: 'True/False' },
  { value: 'fill-blank', label: 'Fill in the Blank' },
  { value: 'short-answer', label: 'Short Answer' },
  { value: 'sequence', label: 'Sequence Order' }
]

export default function QuizEditor({ data, onChange }: QuizEditorProps) {
  const [quizData, setQuizData] = useState<QuizData>({
    questions: data.questions || []
  })

  const handleAddQuestion = () => {
    const newQuestion = {
      id: Date.now().toString(),
      type: 'mcq' as const,
      question: '',
      options: ['', '', '', ''],
      correctAnswer: 0,
      explanation: ''
    }
    const newData = {
      questions: [...quizData.questions, newQuestion]
    }
    setQuizData(newData)
    onChange(newData)
  }

  const handleUpdateQuestion = (id: string, field: string, value: any) => {
    const newData = {
      questions: quizData.questions.map(q =>
        q.id === id ? { ...q, [field]: value } : q
      )
    }
    setQuizData(newData)
    onChange(newData)
  }

  const handleDeleteQuestion = (id: string) => {
    const newData = {
      questions: quizData.questions.filter(q => q.id !== id)
    }
    setQuizData(newData)
    onChange(newData)
  }

  const handleAddOption = (questionId: string) => {
    const question = quizData.questions.find(q => q.id === questionId)
    if (question && question.options) {
      const newOptions = [...question.options, '']
      handleUpdateQuestion(questionId, 'options', newOptions)
    }
  }

  const handleRemoveOption = (questionId: string, optionIndex: number) => {
    const question = quizData.questions.find(q => q.id === questionId)
    if (question && question.options) {
      const newOptions = question.options.filter((_, index) => index !== optionIndex)
      handleUpdateQuestion(questionId, 'options', newOptions)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <HelpCircle className="w-5 h-5 text-primary-600" />
          <h3 className="text-lg font-semibold text-gray-900">Quiz Editor</h3>
        </div>
        <button
          onClick={handleAddQuestion}
          className="btn-primary flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Add Question</span>
        </button>
      </div>

      <div className="space-y-6">
        {quizData.questions.map((question, index) => (
          <div key={question.id} className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium text-gray-700">
                Question {index + 1}
              </span>
              <button
                onClick={() => handleDeleteQuestion(question.id)}
                className="text-red-600 hover:text-red-700 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Question Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Question Type
                </label>
                <select
                  className="input-field"
                  value={question.type}
                  onChange={(e) => handleUpdateQuestion(question.id, 'type', e.target.value)}
                >
                  {questionTypes.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Question Text */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Question
                </label>
                <textarea
                  rows={2}
                  className="input-field"
                  placeholder="Enter your question"
                  value={question.question}
                  onChange={(e) => handleUpdateQuestion(question.id, 'question', e.target.value)}
                />
              </div>

              {/* Options for MCQ and Multiple */}
              {(question.type === 'mcq' || question.type === 'multiple') && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Options
                    </label>
                    <button
                      onClick={() => handleAddOption(question.id)}
                      className="text-sm text-primary-600 hover:text-primary-700"
                    >
                      + Add Option
                    </button>
                  </div>
                  <div className="space-y-2">
                    {question.options?.map((option, optionIndex) => (
                      <div key={optionIndex} className="flex items-center space-x-2">
                        <input
                          type={question.type === 'multiple' ? 'checkbox' : 'radio'}
                          name={`correct-${question.id}`}
                          checked={question.correctAnswer === optionIndex}
                          onChange={() => handleUpdateQuestion(question.id, 'correctAnswer', optionIndex)}
                          className="text-primary-600"
                        />
                        <input
                          type="text"
                          className="flex-1 input-field"
                          placeholder={`Option ${optionIndex + 1}`}
                          value={option}
                          onChange={(e) => {
                            const newOptions = [...(question.options || [])]
                            newOptions[optionIndex] = e.target.value
                            handleUpdateQuestion(question.id, 'options', newOptions)
                          }}
                        />
                        <button
                          onClick={() => handleRemoveOption(question.id, optionIndex)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* True/False Options */}
              {question.type === 'true-false' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Correct Answer
                  </label>
                  <div className="flex space-x-4">
                    <label className="flex items-center space-x-2">
                      <input
                        type="radio"
                        name={`tf-${question.id}`}
                        checked={question.correctAnswer === true}
                        onChange={() => handleUpdateQuestion(question.id, 'correctAnswer', true)}
                        className="text-primary-600"
                      />
                      <span>True</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input
                        type="radio"
                        name={`tf-${question.id}`}
                        checked={question.correctAnswer === false}
                        onChange={() => handleUpdateQuestion(question.id, 'correctAnswer', false)}
                        className="text-primary-600"
                      />
                      <span>False</span>
                    </label>
                  </div>
                </div>
              )}

              {/* Explanation */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Explanation (Optional)
                </label>
                <textarea
                  rows={2}
                  className="input-field"
                  placeholder="Explain the correct answer"
                  value={question.explanation || ''}
                  onChange={(e) => handleUpdateQuestion(question.id, 'explanation', e.target.value)}
                />
              </div>
            </div>
          </div>
        ))}

        {quizData.questions.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <HelpCircle className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p className="text-lg font-medium mb-2">No questions yet</p>
            <p className="text-sm">Click "Add Question" to create your first quiz question</p>
          </div>
        )}
      </div>

      {/* Preview */}
      {quizData.questions.length > 0 && (
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h4 className="text-sm font-medium text-gray-700 mb-3">Preview</h4>
          <div className="bg-white rounded border p-4">
            {quizData.questions.map((question, index) => (
              <div key={question.id} className="mb-4 last:mb-0">
                <p className="font-medium text-gray-900 mb-2">
                  {index + 1}. {question.question || 'Question text'}
                </p>
                {question.type === 'mcq' && question.options && (
                  <div className="space-y-1">
                    {question.options.map((option, optIndex) => (
                      <label key={optIndex} className="flex items-center space-x-2">
                        <input type="radio" name={`preview-${question.id}`} className="text-primary-600" />
                        <span className="text-sm">{option || `Option ${optIndex + 1}`}</span>
                      </label>
                    ))}
                  </div>
                )}
                {question.type === 'true-false' && (
                  <div className="space-y-1">
                    <label className="flex items-center space-x-2">
                      <input type="radio" name={`preview-${question.id}`} className="text-primary-600" />
                      <span className="text-sm">True</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input type="radio" name={`preview-${question.id}`} className="text-primary-600" />
                      <span className="text-sm">False</span>
                    </label>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
