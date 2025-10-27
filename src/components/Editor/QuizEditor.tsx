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

const QuizEditor: React.FC<QuizEditorProps> = ({ data, onChange }) => {
  const [formData, setFormData] = useState<QuizData>({
    startTitle: 'Test your knowledge',
    startContent: 'Add your content here...',
    finishTitle: 'Congratulations! 😊',
    finishMessage: 'You have completed the quiz',
    questions: [],
    ...data
  });
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

const questionTypes = [
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

  const handleQuestionTypeSelect = (type: string) => {
    const newQuestion = {
      id: `question-${Date.now()}`,
      type: type as any,
      question: 'New question',
      options: type === 'mcq' || type === 'multiple' ? ['Option 1', 'Option 2', 'Option 3', 'Option 4'] : undefined,
      correctAnswer: type === 'mcq' ? 0 : type === 'true-false' ? true : '',
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

  const handleQuestionTypeChange = (questionId: string, newType: string) => {
    const updatedQuestions = formData.questions.map(q => 
      q.id === questionId ? { ...q, type: newType } : q
    );
    const updatedData = { ...formData, questions: updatedQuestions };
    setFormData(updatedData);
    onChange(updatedData);
    setShowQuestionTypeNavDropdown(false);
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

                return (
                  <>
                    <h2 
                      className="quiz-question-text"
                      contentEditable
                      suppressContentEditableWarning={true}
                      onBlur={(e) => handleQuestionChange(question.id, 'question', e.currentTarget.textContent || '')}
                    >
                      {question.question || 'Which of the following is true?'}
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