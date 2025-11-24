import React, { useState, useEffect, useRef } from 'react';
import { QuizData } from '../../types';
import { Plus, Eye, CheckSquare, List, MoreVertical, Image as ImageIcon, Flag, MapPin } from 'lucide-react';
import { LuMessageSquareMore } from "react-icons/lu";
import { IoDuplicateOutline } from "react-icons/io5";
import { FaRegTrashCan } from "react-icons/fa6";

interface QuizEditorProps {
  data: QuizData;
  onChange: (data: QuizData) => void;
}

type QuestionType = QuizData['questions'][number]['type']
type SentencePart = NonNullable<QuizData['questions'][number]['sentenceParts']>[number]
type MatchPair = NonNullable<QuizData['questions'][number]['matchPairs']>[number]
type SequenceItem = NonNullable<QuizData['questions'][number]['sequenceItems']>[number]

const QuizEditor: React.FC<QuizEditorProps> = ({ data, onChange }) => {
  const [formData, setFormData] = useState<QuizData>(() => ({
    startTitle: 'Test your knowledge',
    startContent: 'Add your content here...',
    finishTitle: 'Congratulations! 😊',
    finishMessage: 'You have completed the quiz',
    ...data,
    questions: data.questions || []
  }));
  const [selectedLayout, setSelectedLayout] = useState('default');
  const [displayOptions, setDisplayOptions] = useState('standard');
  const [alignment, setAlignment] = useState('left');
  const [showQuestionTypeDropdown, setShowQuestionTypeDropdown] = useState(false);
  const [showQuestionTypeNavDropdown, setShowQuestionTypeNavDropdown] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const questionTypeNavRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setFormData(data);
  }, [data]);

  // Handle clicks outside dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowQuestionTypeDropdown(false);
      }
      if (questionTypeNavRef.current && !questionTypeNavRef.current.contains(event.target as Node)) {
        setShowQuestionTypeNavDropdown(false);
      }
    };

    if (showQuestionTypeDropdown || showQuestionTypeNavDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showQuestionTypeDropdown, showQuestionTypeNavDropdown]);

const questionTypes: Array<{ id: QuestionType; label: string; icon: string }> = [
    { id: 'mcq', label: 'Multiple choice', icon: '☑️' },
    { id: 'multiple', label: 'Multiple response', icon: '☑️' },
    { id: 'true-false', label: 'True / False', icon: '✓✗' },
    { id: 'short-answer', label: 'Short answer', icon: 'T' },
    { id: 'fill-blank', label: 'Fill in the blank', icon: '⌄' },
    { id: 'match', label: 'Match the corresponding', icon: '≡' },
    { id: 'sequence', label: 'Match sequence', icon: '≡' }
  ];

  const handleAddQuestion = () => {
    setShowQuestionTypeDropdown(true);
  };

  const handleQuestionTypeSelect = (type: QuestionType) => {
    const getDefaultQuestion = (questionType: QuestionType) => {
      switch (questionType) {
        case 'mcq':
          return 'Choose the correct answer from the options below:';
        case 'multiple':
          return 'Select all correct answers from the options below:';
        case 'true-false':
          return 'Determine if the following statement is true or false:';
        case 'short-answer':
          return 'Provide a short answer to the following question:';
        case 'fill-blank':
          return 'Fill in the blanks to complete the sentence correctly:';
        case 'match':
          return 'Match each item with the correct option:';
        case 'sequence':
          return 'Arrange the following in the correct order:';
        default:
          return 'Answer the following question:';
      }
    };

    const newQuestion: QuizData['questions'][number] = {
      id: `question-${Date.now()}`,
      type,
      question: getDefaultQuestion(type),
      options: type === 'mcq' || type === 'multiple' ? ['Option 1', 'Option 2', 'Option 3', 'Option 4'] : undefined,
      correctAnswer: type === 'mcq' ? 0 : 
                    type === 'multiple' ? [0] : 
                    type === 'true-false' ? true : 
                    type === 'short-answer' ? [''] : 
                    type === 'fill-blank' ? [] : 
                    type === 'match' ? [] : 
                    type === 'sequence' ? [] : '',
      sentenceParts: type === 'fill-blank'
        ? ([
            { type: 'text', text: 'The capital of France is' },
            { type: 'blank', options: ['Paris', 'London', 'Berlin'], selectedAnswer: '' },
            { type: 'text', text: '. It has a football club named as' },
            { type: 'blank', options: ['PSG', 'Arsenal', 'Bayern'], selectedAnswer: '' }
          ] as SentencePart[])
        : undefined,
      matchPairs: type === 'match'
        ? ([
            { item: '', option: '' },
            { item: '', option: '' }
          ] as MatchPair[])
        : undefined,
      sequenceItems: type === 'sequence'
        ? ([
            { text: 'Item 1' },
            { text: 'Item 2' },
            { text: 'Item 3' },
            { text: '' }
          ] as SequenceItem[])
        : undefined,
      explanation: ''
    };

    const updatedData = {
      ...formData,
      questions: [...formData.questions, newQuestion]
    };
    setFormData(updatedData);
    onChange(updatedData);
    setShowQuestionTypeDropdown(false);
  };

  const handleQuestionChange = (questionId: string, field: string, value: any) => {
    const updatedQuestions = formData.questions.map(q => 
      q.id === questionId ? { ...q, [field]: value } : q
    );
    const updatedData = { ...formData, questions: updatedQuestions };
    setFormData(updatedData);
    onChange(updatedData);
  };

  const handleDeleteQuestion = (questionId: string) => {
    const updatedQuestions = formData.questions.filter(q => q.id !== questionId);
    const updatedData = { ...formData, questions: updatedQuestions };
    setFormData(updatedData);
    onChange(updatedData);
  };

  const handleDuplicateQuestion = (questionId: string) => {
    const questionToDuplicate = formData.questions.find(q => q.id === questionId);
    if (questionToDuplicate) {
      const duplicatedQuestion = {
        ...questionToDuplicate,
        id: `question-${Date.now()}`,
        question: questionToDuplicate.question
      };
      
      const questionIndex = formData.questions.findIndex(q => q.id === questionId);
      const updatedData = {
        ...formData,
        questions: [
          ...formData.questions.slice(0, questionIndex + 1),
          duplicatedQuestion,
          ...formData.questions.slice(questionIndex + 1)
        ]
      };
      setFormData(updatedData);
      onChange(updatedData);
    }
  };

  const handleQuestionTypeChange = (questionId: string, newType: QuestionType) => {
    const updatedQuestions = formData.questions.map(q => 
      q.id === questionId ? { ...q, type: newType } : q
    );
    const updatedData = { ...formData, questions: updatedQuestions };
    setFormData(updatedData);
    onChange(updatedData);
    setShowQuestionTypeNavDropdown(false);
  };

  const handleTextChange = (field: string, value: string) => {
    const updatedData = { ...formData, [field]: value };
    setFormData(updatedData);
    onChange(updatedData);
  };

  const totalSlides = 1 + formData.questions.length + 1; // start + questions + finish

  const getSlideIndicator = () => {
    if (currentSlide === 0) {
      return 'START';
    } else if (currentSlide === totalSlides - 1) {
      return 'FINISH';
    } else {
      return `QUESTION ${currentSlide}`;
    }
  };

  return (
    <div className="quiz-editor">
      {/* Top Navigation Bar */}
      <div className="quiz-top-nav">
        <div className="quiz-nav-group">
          <div className="quiz-start-indicator">{getSlideIndicator()}</div>
          {currentSlide > 0 && currentSlide < totalSlides - 1 ? (
            // Question slide - show question options
            <>
              <div className="quiz-question-type-nav" ref={questionTypeNavRef}>
                <div 
                  className="quiz-question-type-nav-trigger"
                  onClick={() => setShowQuestionTypeNavDropdown(!showQuestionTypeNavDropdown)}
                >
                  <div className="quiz-question-type-icon">☑️</div>
                  <span>{formData.questions[currentSlide - 1]?.type === 'mcq' ? 'Multiple choice' : formData.questions[currentSlide - 1]?.type}</span>
                  <span className="dropdown-arrow">▼</span>
                </div>
                
                {showQuestionTypeNavDropdown && (
                  <div className="quiz-question-type-nav-dropdown">
                    <div className="question-type-header">
                      <h3>Question Type</h3>
                    </div>
                    <div className="question-type-list">
                      {questionTypes.map((type) => (
                        <div
                          key={type.id}
                          className="question-type-option"
                          onClick={() => handleQuestionTypeChange(formData.questions[currentSlide - 1]?.id, type.id)}
                        >
                          <div className="question-type-icon">{type.icon}</div>
                          <div className="question-type-label">{type.label}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <div className="quiz-feedback-nav">
                <LuMessageSquareMore size={16} />
                <span>Feedback message</span>
              </div>
              <div className="quiz-nav-separator"></div>
              <div className="quiz-action-btn" onClick={() => handleDuplicateQuestion(formData.questions[currentSlide - 1]?.id)}>
                <IoDuplicateOutline size={16} />
              </div>
              <div className="quiz-action-btn" onClick={() => handleDeleteQuestion(formData.questions[currentSlide - 1]?.id)}>
                <FaRegTrashCan size={16} />
              </div>
            </>
          ) : (
            // Start/Finish slide - show regular dropdowns
            <>
              <div className="quiz-nav-dropdown">
                <List size={16} />
                <span>Layout</span>
                <span className="dropdown-arrow">▼</span>
              </div>
              <div className="quiz-nav-dropdown">
                <Eye size={16} />
                <span>Display options</span>
                <span className="dropdown-arrow">▼</span>
              </div>
              <div className="quiz-nav-dropdown">
                <CheckSquare size={16} />
                <span>Alignment</span>
                <span className="dropdown-arrow">▼</span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="quiz-main-content">
        <div className="quiz-content-wrapper">
          {currentSlide === totalSlides - 1 ? (
            // Finish Slide
            <div className="quiz-finish-content">
              <h1 
                className="quiz-finish-title"
                contentEditable
                suppressContentEditableWarning={true}
                onBlur={(e) => handleTextChange('finishTitle', e.currentTarget.textContent || '')}
              >
                {formData.finishTitle || 'Congratulations! 😊'}
              </h1>
              <p 
                className="quiz-finish-message"
                contentEditable
                suppressContentEditableWarning={true}
                onBlur={(e) => handleTextChange('finishMessage', e.currentTarget.textContent || '')}
              >
                {formData.finishMessage || 'You have completed the quiz'}
              </p>
              <button className="quiz-continue-btn">
                Continue
                <span className="continue-arrow">→</span>
              </button>
            </div>
          ) : currentSlide === 0 ? (
            // Start Slide
            <>
              <h1 
                className="quiz-title"
                contentEditable
                suppressContentEditableWarning={true}
                onBlur={(e) => handleTextChange('startTitle', e.currentTarget.textContent || '')}
              >
                {formData.startTitle || 'Test your knowledge'}
              </h1>
              
              <div className="quiz-question-count">
                <div className="question-icon">
                  <span>?</span>
                </div>
                <span>{formData.questions.length} Questions</span>
              </div>

              <div 
                className="quiz-content-placeholder"
                contentEditable
                suppressContentEditableWarning={true}
                onBlur={(e) => handleTextChange('startContent', e.currentTarget.textContent || '')}
              >
                <p>{formData.startContent || 'Add your content here...'}</p>
              </div>

              <button className="quiz-get-started-btn">Get started</button>
            </>
          ) : (
            // Question Slide
            <div className="quiz-question-content">
              {(() => {
                const questionIndex = currentSlide - 1;
                const question = formData.questions[questionIndex];
                if (!question) return null;

                // Render different question types
                switch (question.type) {
                  case 'mcq':
                    return (
                      <>
                        <h2 
                          className="quiz-question-text"
                          contentEditable
                          suppressContentEditableWarning={true}
                          onBlur={(e) => handleQuestionChange(question.id, 'question', e.currentTarget.textContent || '')}
                        >
                          {question.question || 'Choose the correct answer from the options below:'}
                        </h2>

                        <div className="quiz-options-container">
                          {question.options?.map((option, optionIndex) => (
                            <div key={optionIndex} className="quiz-option">
                              <label className="quiz-option-label">
                                <input
                                  type="radio"
                                  name={`question-${question.id}`}
                                  checked={question.correctAnswer === optionIndex}
                                  onChange={() => handleQuestionChange(question.id, 'correctAnswer', optionIndex)}
                                  className="quiz-option-radio"
                                />
                                <span 
                                  className="quiz-option-text"
                                  contentEditable
                                  suppressContentEditableWarning={true}
                                  onBlur={(e) => {
                                    const newOptions = [...(question.options || [])];
                                    newOptions[optionIndex] = e.currentTarget.textContent || '';
                                    handleQuestionChange(question.id, 'options', newOptions);
                                  }}
                                >
                                  {option}
                                </span>
                    </label>
                    <button
                                className="quiz-option-remove"
                                onClick={() => {
                                  const newOptions = question.options?.filter((_, idx) => idx !== optionIndex) || [];
                                  handleQuestionChange(question.id, 'options', newOptions);
                                }}
                              >
                                −
                              </button>
                            </div>
                          ))}
                          
                          <div className="quiz-add-option">
                            <button
                              className="quiz-add-option-btn"
                              onClick={() => {
                                const newOptions = [...(question.options || []), `Option ${(question.options?.length || 0) + 1}`];
                                handleQuestionChange(question.id, 'options', newOptions);
                              }}
                            >
                              Add an option
                    </button>
                  </div>
                        </div>
                      </>
                    );

                  case 'multiple':
                    return (
                      <>
                        <h2 
                          className="quiz-question-text"
                          contentEditable
                          suppressContentEditableWarning={true}
                          onBlur={(e) => handleQuestionChange(question.id, 'question', e.currentTarget.textContent || '')}
                        >
                          {question.question || 'Select all correct answers from the options below:'}
                        </h2>

                        <div className="quiz-options-container">
                    {question.options?.map((option, optionIndex) => (
                            <div key={optionIndex} className="quiz-option">
                              <label className="quiz-option-label">
                        <input
                                  type="checkbox"
                                  name={`question-${question.id}`}
                                  checked={Array.isArray(question.correctAnswer) ? question.correctAnswer.includes(optionIndex) : false}
                                  onChange={() => {
                                    const currentAnswers = Array.isArray(question.correctAnswer) ? question.correctAnswer : [];
                                    const newAnswers = currentAnswers.includes(optionIndex)
                                      ? currentAnswers.filter(idx => idx !== optionIndex)
                                      : [...currentAnswers, optionIndex];
                                    handleQuestionChange(question.id, 'correctAnswer', newAnswers);
                                  }}
                                  className="quiz-option-checkbox"
                                />
                                <span 
                                  className="quiz-option-text"
                                  contentEditable
                                  suppressContentEditableWarning={true}
                                  onBlur={(e) => {
                                    const newOptions = [...(question.options || [])];
                                    newOptions[optionIndex] = e.currentTarget.textContent || '';
                                    handleQuestionChange(question.id, 'options', newOptions);
                                  }}
                                >
                                  {option}
                                </span>
                              </label>
                        <button
                                className="quiz-option-remove"
                                onClick={() => {
                                  const newOptions = question.options?.filter((_, idx) => idx !== optionIndex) || [];
                                  handleQuestionChange(question.id, 'options', newOptions);
                                }}
                              >
                                −
                        </button>
                      </div>
                    ))}
                          
                          <div className="quiz-add-option">
                            <button
                              className="quiz-add-option-btn"
                              onClick={() => {
                                const newOptions = [...(question.options || []), `Option ${(question.options?.length || 0) + 1}`];
                                handleQuestionChange(question.id, 'options', newOptions);
                              }}
                            >
                              Add an option
                            </button>
                  </div>
                </div>
                      </>
                    );

                  case 'true-false':
                    return (
                      <>
                        <h2 
                          className="quiz-question-text"
                          contentEditable
                          suppressContentEditableWarning={true}
                          onBlur={(e) => handleQuestionChange(question.id, 'question', e.currentTarget.textContent || '')}
                        >
                          {question.question || 'Determine if the following statement is true or false:'}
                        </h2>

                        <div className="quiz-options-container">
                          <div className="quiz-option">
                            <label className="quiz-option-label">
                      <input
                        type="radio"
                                name={`question-${question.id}`}
                        checked={question.correctAnswer === true}
                                onChange={() => handleQuestionChange(question.id, 'correctAnswer', true)}
                                className="quiz-option-radio"
                      />
                              <span className="quiz-option-text">True</span>
                    </label>
                          </div>
                          <div className="quiz-option">
                            <label className="quiz-option-label">
                      <input
                        type="radio"
                                name={`question-${question.id}`}
                        checked={question.correctAnswer === false}
                                onChange={() => handleQuestionChange(question.id, 'correctAnswer', false)}
                                className="quiz-option-radio"
                      />
                              <span className="quiz-option-text">False</span>
                    </label>
                  </div>
                        </div>
                      </>
                    );

                  case 'short-answer':
                    return (
                      <>
                        <h2 
                          className="quiz-question-text"
                          contentEditable
                          suppressContentEditableWarning={true}
                          onBlur={(e) => handleQuestionChange(question.id, 'question', e.currentTarget.textContent || '')}
                        >
                          {question.question || 'Provide a short answer to the following question:'}
                        </h2>

                        <div className="quiz-short-answer-container">
                          <div className="quiz-correct-answers">
                            {(Array.isArray(question.correctAnswer) ? question.correctAnswer : ['']).map((answer: string, index: number) => (
                              <div key={index} className="quiz-correct-answer-item">
                                <div className="quiz-correct-answer-input-wrapper">
                                  <input
                                    type="text"
                                    value={answer}
                                    onChange={(e) => {
                                      const currentAnswers = Array.isArray(question.correctAnswer) ? question.correctAnswer : [''];
                                      const newAnswers = [...currentAnswers];
                                      newAnswers[index] = e.target.value;
                                      handleQuestionChange(question.id, 'correctAnswer', newAnswers);
                                    }}
                                    className="quiz-correct-answer-input"
                                    placeholder="Enter correct answer"
                                  />
                                  <button 
                                    className="quiz-correct-answer-remove"
                                    onClick={() => {
                                      const currentAnswers = Array.isArray(question.correctAnswer) ? question.correctAnswer : [''];
                                      const newAnswers = currentAnswers.filter((_, idx) => idx !== index);
                                      handleQuestionChange(question.id, 'correctAnswer', newAnswers);
                                    }}
                                  >
                                    ⊖
                                  </button>
                                </div>
                              </div>
                            ))}
                            <button
                              className="quiz-add-answer-btn"
                              onClick={() => {
                                const currentAnswers = Array.isArray(question.correctAnswer) ? question.correctAnswer : [''];
                                const newAnswers = [...currentAnswers, ''];
                                handleQuestionChange(question.id, 'correctAnswer', newAnswers);
                              }}
                            >
                              Add an option
                            </button>
                          </div>
                          
                          <div className="quiz-case-sensitive-toggle">
                            <label className="quiz-toggle-label">
                              <span className="quiz-case-icon">Tt</span>
                              <span className="quiz-toggle-text">Case sensitive answers</span>
                              <input
                                type="checkbox"
                                checked={question.caseSensitive || false}
                                onChange={(e) => handleQuestionChange(question.id, 'caseSensitive', e.target.checked)}
                                className="quiz-toggle-input"
                              />
                              <span className="quiz-toggle-slider"></span>
                            </label>
                          </div>
                        </div>
                      </>
                    );

                  case 'fill-blank':
                    return (
                      <>
                        <h2 
                          className="quiz-question-text"
                          contentEditable
                          suppressContentEditableWarning={true}
                          onBlur={(e) => handleQuestionChange(question.id, 'question', e.currentTarget.textContent || '')}
                        >
                          {question.question || 'Fill in the blanks to complete the sentence correctly:'}
                        </h2>

                        <div className="quiz-fill-blank-container">
                          <div className="quiz-sentence-builder">
                            {question.sentenceParts?.map((part: any, index: number) => (
                              <div key={index} className="quiz-sentence-part">
                                {part.type === 'text' ? (
                                  <div 
                                    className="quiz-sentence-text"
                                    contentEditable
                                    suppressContentEditableWarning={true}
                                    onBlur={(e) => {
                                      const newParts = [...(question.sentenceParts || [])];
                                      newParts[index].text = e.currentTarget.textContent || '';
                                      handleQuestionChange(question.id, 'sentenceParts', newParts);
                                    }}
                                  >
                                    {part.text}
                                  </div>
                                ) : (
                                  <div className="quiz-blank-dropdown">
                                    <div className="quiz-custom-dropdown">
                                      <button 
                                        className="quiz-dropdown-trigger"
                                        onClick={() => {
                                          const newParts = [...(question.sentenceParts || [])];
                                          newParts[index].isOpen = !newParts[index].isOpen;
                                          handleQuestionChange(question.id, 'sentenceParts', newParts);
                                        }}
                                      >
                                        <span className="quiz-dropdown-text">
                                          {part.selectedAnswer || 'Please select'}
                                        </span>
                                        <span className="quiz-dropdown-arrow">▼</span>
                                      </button>
                                      
                                      {part.isOpen && (
                                        <div className="quiz-dropdown-menu">
                                          {part.options?.map((option: string, optIndex: number) => (
                                            <div 
                                              key={optIndex} 
                                              className={`quiz-dropdown-option ${part.selectedAnswer === option ? 'selected' : ''}`}
                                              onClick={() => {
                                                const newParts = [...(question.sentenceParts || [])];
                                                newParts[index].selectedAnswer = option;
                                                newParts[index].isOpen = false;
                                                handleQuestionChange(question.id, 'sentenceParts', newParts);
                                              }}
                                            >
                                              <span className={`quiz-option-checkmark ${part.selectedAnswer === option ? 'selected' : ''}`}>✓</span>
                                              <span className="quiz-option-text">{option}</span>
                                              <button 
                                                className="quiz-option-delete"
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  const newParts = [...(question.sentenceParts || [])];
                                                  const blankPart = newParts[index];
                                                  if (!blankPart || !blankPart.options) return;
                                                  blankPart.options = blankPart.options.filter((_, idx) => idx !== optIndex);
                                                  if (newParts[index].selectedAnswer === option) {
                                                    newParts[index].selectedAnswer = '';
                                                  }
                                                  handleQuestionChange(question.id, 'sentenceParts', newParts);
                                                }}
                                              >
                                                −
                                              </button>
                                            </div>
                                          ))}
                                          
                                          <div className="quiz-add-option-container">
                                            <input
                                              type="text"
                                              placeholder="Enter an option"
                                              className="quiz-add-option-input"
                                              onKeyPress={(e) => {
                                                if (e.key === 'Enter') {
                                                  const input = e.target as HTMLInputElement;
                                                  if (input.value.trim()) {
                                                    const newParts = [...(question.sentenceParts || [])];
                                                    const blankPart = newParts[index];
                                                    if (!blankPart) return;
                                                    blankPart.options = [...(blankPart.options || []), input.value.trim()];
                                                    handleQuestionChange(question.id, 'sentenceParts', newParts);
                                                    input.value = '';
                                                  }
                                                }
                                              }}
                                            />
                                          </div>
                                          
                                          <div 
                                            className="quiz-delete-dropdown"
                                            onClick={() => {
                                              const newParts = question.sentenceParts?.filter((_, idx) => idx !== index) || [];
                                              handleQuestionChange(question.id, 'sentenceParts', newParts);
                                            }}
                                          >
                                            <span className="quiz-delete-icon">🗑️</span>
                                            <span className="quiz-delete-text">Delete dropdown</span>
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                          
                          <div className="quiz-sentence-controls">
                            <button
                              className="quiz-add-text-btn"
                              onClick={() => {
                                const newParts = [...(question.sentenceParts || []), { type: 'text', text: 'Enter your question' }];
                                handleQuestionChange(question.id, 'sentenceParts', newParts);
                              }}
                            >
                              Enter your question
                            </button>
                            <button
                              className="quiz-add-dropdown-btn"
                              onClick={() => {
                                const newParts = [...(question.sentenceParts || []), { 
                                  type: 'blank', 
                                  options: ['Option 1', 'Option 2', 'Option 3'],
                                  selectedAnswer: ''
                                }];
                                handleQuestionChange(question.id, 'sentenceParts', newParts);
                              }}
                            >
                              Add dropdown
                            </button>
                          </div>
                        </div>
                      </>
                    );

                  case 'match':
                    return (
                      <>
                        <h2 
                          className="quiz-question-text"
                          contentEditable
                          suppressContentEditableWarning={true}
                          onBlur={(e) => handleQuestionChange(question.id, 'question', e.currentTarget.textContent || '')}
                        >
                          {question.question || 'Match each item with the correct option:'}
                        </h2>

                        <div className="quiz-match-container">
                          <div className="quiz-match-pairs">
                            {question.matchPairs?.map((pair: any, index: number) => (
                              <div key={index} className="quiz-match-pair">
                                <div className="quiz-match-item">
                                  <input
                                    type="text"
                                    value={pair.item || ''}
                                    onChange={(e) => {
                                      const newPairs = [...(question.matchPairs || [])];
                                      newPairs[index].item = e.target.value;
                                      handleQuestionChange(question.id, 'matchPairs', newPairs);
                                    }}
                                    className="quiz-match-input"
                                    placeholder={`Item ${index + 1}`}
                                  />
                                </div>
                                
                                <div className="quiz-match-connector">
                                  <div className="quiz-connector-line"></div>
                                  <div className="quiz-connector-dot">•</div>
                                </div>
                                
                                <div className="quiz-match-option">
                                  <input
                                    type="text"
                                    value={pair.option || ''}
                                    onChange={(e) => {
                                      const newPairs = [...(question.matchPairs || [])];
                                      newPairs[index].option = e.target.value;
                                      handleQuestionChange(question.id, 'matchPairs', newPairs);
                                    }}
                                    className="quiz-match-input"
                                    placeholder={`Option ${index + 1}`}
                                  />
                                </div>
                                
                                <button 
                                  className="quiz-match-remove"
                                  onClick={() => {
                                    const newPairs = question.matchPairs?.filter((_, idx) => idx !== index) || [];
                                    handleQuestionChange(question.id, 'matchPairs', newPairs);
                                  }}
                                >
                                  ×
                                </button>
                              </div>
                            ))}
                          </div>
                          
                          <div className="quiz-match-controls">
                            <button
                              className="quiz-add-match-btn"
                              onClick={() => {
                                const newPairs = [...(question.matchPairs || []), { item: '', option: '' }];
                                handleQuestionChange(question.id, 'matchPairs', newPairs);
                              }}
                            >
                              Add answer
                            </button>
                          </div>
                        </div>
                      </>
                    );

                  case 'sequence':
                    return (
                      <>
                        <h2 
                          className="quiz-question-text"
                          contentEditable
                          suppressContentEditableWarning={true}
                          onBlur={(e) => handleQuestionChange(question.id, 'question', e.currentTarget.textContent || '')}
                        >
                          {question.question || 'Arrange the following in the correct order:'}
                        </h2>

                        <div className="quiz-sequence-container">
                          <div className="quiz-sequence-items">
                            {question.sequenceItems?.map((item: any, index: number) => (
                              <div 
                                key={index} 
                                className="quiz-sequence-item"
                                draggable
                                onDragStart={(e) => {
                                  e.dataTransfer.setData('text/plain', index.toString());
                                  e.currentTarget.style.opacity = '0.5';
                                }}
                                onDragEnd={(e) => {
                                  e.currentTarget.style.opacity = '1';
                                }}
                                onDragOver={(e) => {
                                  e.preventDefault();
                                }}
                                onDrop={(e) => {
                                  e.preventDefault();
                                  const draggedIndex = parseInt(e.dataTransfer.getData('text/plain'));
                                  const newItems = [...(question.sequenceItems || [])];
                                  const draggedItem = newItems[draggedIndex];
                                  newItems.splice(draggedIndex, 1);
                                  newItems.splice(index, 0, draggedItem);
                                  handleQuestionChange(question.id, 'sequenceItems', newItems);
                                }}
                              >
                                <div className="quiz-sequence-number">
                                  {index + 1}
                                </div>
                                <div className="quiz-sequence-input-wrapper">
                                  <input
                                    type="text"
                                    value={item.text || ''}
                                    onChange={(e) => {
                                      const newItems = [...(question.sequenceItems || [])];
                                      newItems[index].text = e.target.value;
                                      handleQuestionChange(question.id, 'sequenceItems', newItems);
                                    }}
                                    className="quiz-sequence-input"
                                    placeholder="Add an option"
                                  />
                                  {index < (question.sequenceItems?.length || 0) - 1 && (
                                    <button 
                                      className="quiz-sequence-remove"
                                      onClick={() => {
                                        const newItems = question.sequenceItems?.filter((_, idx) => idx !== index) || [];
                                        handleQuestionChange(question.id, 'sequenceItems', newItems);
                                      }}
                                    >
                                      −
                                    </button>
                                  )}
                                </div>
                                <div className="quiz-sequence-drag-handle">
                                  ⋮⋮
                                </div>
                              </div>
                            ))}
                          </div>
                          
                          <div className="quiz-sequence-controls">
                            <button
                              className="quiz-add-sequence-btn"
                              onClick={() => {
                                const newItems = [...(question.sequenceItems || []), { text: '' }];
                                handleQuestionChange(question.id, 'sequenceItems', newItems);
                              }}
                            >
                              Add an option
                            </button>
                          </div>
                        </div>
                      </>
                    );

                  default:
                    return (
                      <>
                        <h2 
                          className="quiz-question-text"
                          contentEditable
                          suppressContentEditableWarning={true}
                          onBlur={(e) => handleQuestionChange(question.id, 'question', e.currentTarget.textContent || '')}
                        >
                          {question.question || 'Answer the following question:'}
                        </h2>
                        <p>Question type: {question.type}</p>
                      </>
                    );
                }
              })()}
                </div>
              )}
        </div>
      </div>

      {/* Right Sidebar */}
      <div className="quiz-right-sidebar">
        <div className="quiz-sidebar-icon">
          <CheckSquare size={20} />
        </div>
        <div className="quiz-sidebar-icon">
          <List size={20} />
        </div>
        <div className="quiz-sidebar-icon">
          <Eye size={20} />
        </div>
        <div className="quiz-sidebar-icon">
          <div className="circle-outline"></div>
        </div>
      </div>


      {/* Bottom Floating Action Bar */}
      <div className="quiz-bottom-bar">
        <button 
          className={`quiz-bottom-icon ${currentSlide === 0 ? 'active' : ''}`}
          onClick={() => setCurrentSlide(0)}
        >
          <MapPin size={16} />
        </button>
        {/* Pagination circles - only show if there are questions */}
        {formData.questions.length > 0 && Array.from({ length: formData.questions.length }, (_, index) => (
          <button 
            key={index} 
            className={`quiz-pagination-circle ${currentSlide === index + 1 ? 'active' : ''}`}
            onClick={() => setCurrentSlide(index + 1)}
          >
            {index + 1}
          </button>
        ))}
        <button 
          className={`quiz-bottom-icon ${currentSlide === totalSlides - 1 ? 'active' : ''}`}
          onClick={() => setCurrentSlide(totalSlides - 1)}
        >
          <Flag size={16} />
        </button>
        <div className="quiz-add-question-container" ref={dropdownRef}>
          <button className="quiz-add-question-btn" onClick={handleAddQuestion}>
            <Plus size={16} />
            <span>Add question</span>
          </button>
          
          {/* Question Type Dropdown */}
          {showQuestionTypeDropdown && (
            <div className="quiz-question-type-dropdown">
              <div className="question-type-header">
                <h3>QUESTION TYPE</h3>
              </div>
              <div className="question-type-list">
                {questionTypes.map((type) => (
                  <div 
                    key={type.id} 
                    className="question-type-option"
                    onClick={() => handleQuestionTypeSelect(type.id)}
                  >
                    <div className="question-type-icon">{type.icon}</div>
                    <span className="question-type-label">{type.label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          </div>
      </div>

      {/* Questions List (Hidden by default, shown when questions exist) */}
      {formData.questions.length > 0 && (
        <div className="quiz-questions-list">
          <h3>Questions ({formData.questions.length})</h3>
          {formData.questions.map((question, index) => (
            <div key={question.id} className="quiz-question-item">
              <div className="question-header">
                <span className="question-number">{index + 1}</span>
                <span className="question-type">{question.type.toUpperCase()}</span>
                <button 
                  className="delete-question-btn"
                  onClick={() => handleDeleteQuestion(question.id)}
                >
                  ×
                </button>
                  </div>
              <div className="question-content">
                <input
                  type="text"
                  value={question.question}
                  onChange={(e) => handleQuestionChange(question.id, 'question', e.target.value)}
                  className="question-input"
                  placeholder="Enter your question..."
                />
                  </div>
              </div>
            ))}
        </div>
      )}
    </div>
  );
};

export default QuizEditor;