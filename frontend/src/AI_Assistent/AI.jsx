import { useEffect, useRef, useState } from 'react';
import api, { getError } from '../lib/api';
import { Spinner, Toast } from '../components/UI';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faComments,
  faBookOpen,
  faPaperPlane,
  faCalendarDays,
  faTrash,
} from '@fortawesome/free-solid-svg-icons';

const CHAT_STORAGE_KEY = 'dailygram_safi_chat';
const MAX_HISTORY_MESSAGES = 50;


const cleanAIText = (value = '') => {
  return String(value)
    // HTML line breaks
    .replace(/<br\s*\/?>/gi, '\n')

    // Paragraph tags
    .replace(/<\/p>\s*<p>/gi, '\n\n')
    .replace(/<p>/gi, '')
    .replace(/<\/p>/gi, '\n')

    // Common formatting tags
    .replace(/<strong>/gi, '**')
    .replace(/<\/strong>/gi, '**')
    .replace(/<b>/gi, '**')
    .replace(/<\/b>/gi, '**')
    .replace(/<em>/gi, '*')
    .replace(/<\/em>/gi, '*')
    .replace(/<i>/gi, '*')
    .replace(/<\/i>/gi, '*')

    // HTML entities
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&#39;/gi, "'")
    .replace(/&quot;/gi, '"')

    // Remove any remaining HTML tags
    .replace(/<[^>]*>/g, '')

    // Windows line endings
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')

    // Too many blank lines
    .replace(/\n{3,}/g, '\n\n')

    .trim();
};


const renderInline = (text) => {
  const parts = String(text).split(
    /(\*\*[^*]+\*\*|`[^`]+`|\*[^*]+\*)/g
  );

  return parts.map((part, index) => {
    if (!part) return null;

    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={index} className="font-bold">
          {part.slice(2, -2)}
        </strong>
      );
    }

    if (part.startsWith('`') && part.endsWith('`')) {
      return (
        <code
          key={index}
          className="px-1.5 py-0.5 rounded bg-slate-100 text-indigo-700 font-mono text-[12px]"
        >
          {part.slice(1, -1)}
        </code>
      );
    }

    if (part.startsWith('*') && part.endsWith('*')) {
      return (
        <em key={index}>
          {part.slice(1, -1)}
        </em>
      );
    }

    return <span key={index}>{part}</span>;
  });
};


const renderAIMessage = (text) => {
  const cleaned = cleanAIText(text);

  if (!cleaned) {
    return null;
  }

  const sections = cleaned.split(/```/g);

  return (
    <div className="space-y-3">
      {sections.map((section, sectionIndex) => {
        
        if (sectionIndex % 2 === 1) {
          const codeLines = section.split('\n');

          
          let language = '';
          let code = section;

          if (
            codeLines.length > 0 &&
            /^[a-zA-Z0-9+#.-]+$/.test(codeLines[0].trim())
          ) {
            language = codeLines[0].trim();
            code = codeLines.slice(1).join('\n');
          }

          return (
            <div key={sectionIndex}>
              {language && (
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                  {language}
                </div>
              )}

              <pre className="bg-slate-900 text-slate-100 rounded-xl p-4 overflow-x-auto text-xs leading-relaxed">
                <code>{code.trim()}</code>
              </pre>
            </div>
          );
        }

        const lines = section.split('\n');

        const elements = [];
        let paragraph = [];

        const flushParagraph = () => {
          if (paragraph.length === 0) return;

          elements.push(
            <p
              key={`paragraph-${elements.length}`}
              className="leading-7 whitespace-pre-wrap"
            >
              {paragraph.map((line, index) => (
                <span key={index}>
                  {renderInline(line)}
                  {index < paragraph.length - 1 && <br />}
                </span>
              ))}
            </p>
          );

          paragraph = [];
        };

        lines.forEach((line, index) => {
          const trimmed = line.trim();

          
          if (!trimmed) {
            flushParagraph();
            return;
          }

          
          if (/^#{1,6}\s+/.test(trimmed)) {
            flushParagraph();

            const headingText = trimmed.replace(/^#{1,6}\s+/, '');

            elements.push(
              <h3
                key={`heading-${index}`}
                className="font-bold text-slate-900 text-base mt-2"
              >
                {renderInline(headingText)}
              </h3>
            );

            return;
          }

         
          if (/^[-*•]\s+/.test(trimmed)) {
            if (
              !elements.length ||
              elements[elements.length - 1]?.type !== 'ul'
            ) {
              flushParagraph();

              elements.push(
                <ul
                  key={`list-${index}`}
                  className="list-disc pl-5 space-y-1.5"
                >
                  {renderInline(
                    trimmed.replace(/^[-*•]\s+/, '')
                  )}
                </ul>
              );
            } else {
              flushParagraph();
            }

            return;
          }


          if (/^\d+[.)]\s+/.test(trimmed)) {
            flushParagraph();

            elements.push(
              <div
                key={`number-${index}`}
                className="flex gap-2 items-start"
              >
                <span className="font-semibold text-indigo-600 min-w-5">
                  {trimmed.match(/^\d+/)?.[0]}.
                </span>

                <span className="leading-7">
                  {renderInline(
                    trimmed.replace(/^\d+[.)]\s+/, '')
                  )}
                </span>
              </div>
            );

            return;
          }

          paragraph.push(trimmed);
        });

        flushParagraph();

        return (
          <div key={sectionIndex} className="space-y-2">
            {elements}
          </div>
        );
      })}
    </div>
  );
};

export default function AI() {
  const [mode, setMode] = useState('chat');

  const [chatInput, setChatInput] = useState('');


  const [chatMessages, setChatMessages] = useState(() => {
    try {
      const saved = localStorage.getItem(CHAT_STORAGE_KEY);

      if (saved) {
        const parsed = JSON.parse(saved);

        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (error) {
      console.error('Failed to load Safi chat history:', error);
    }

    return [
      {
        role: 'assistant',
        text: "Hey 👋 I'm Safi. You can talk to me normally, ask questions, study something, or just chat with me.",
      },
    ];
  });

  const [chatLoading, setChatLoading] = useState(false);

  const [syllabus, setSyllabus] = useState('');
  const [days, setDays] = useState('');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  const [msg, setMsg] = useState('');

  const chatEndRef = useRef(null);


  useEffect(() => {
    try {
      const historyToSave = chatMessages.slice(
        -MAX_HISTORY_MESSAGES
      );

      localStorage.setItem(
        CHAT_STORAGE_KEY,
        JSON.stringify(historyToSave)
      );
    } catch (error) {
      console.error('Failed to save Safi chat history:', error);
    }
  }, [chatMessages]);

 

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({
      behavior: 'smooth',
    });
  }, [chatMessages, chatLoading]);



  const sendMessage = async (e) => {
    e?.preventDefault();

    const cleanMessage = chatInput.trim();

    if (!cleanMessage || chatLoading) {
      return;
    }

    const userMessage = {
      role: 'user',
      text: cleanMessage,
    };

    const updatedMessages = [
      ...chatMessages,
      userMessage,
    ].slice(-MAX_HISTORY_MESSAGES);

    // Immediately show user message
    setChatMessages(updatedMessages);

    setChatInput('');
    setChatLoading(true);
    setMsg('');

    try {
      const response = await api.post('/ai/chat', {
        message: cleanMessage,

        // IMPORTANT:
        // Send updated history so Safi also receives
        // the current user message.
        history: updatedMessages,
      });

      const assistantText = cleanAIText(
        response.data?.reply ||
          'Sorry, I could not generate a response.'
      );

      setChatMessages((prev) =>
        [
          ...prev,
          {
            role: 'assistant',
            text: assistantText,
          },
        ].slice(-MAX_HISTORY_MESSAGES)
      );
    } catch (error) {
      const errorMessage = cleanAIText(
        getError(error)
      );

      setChatMessages((prev) =>
        [
          ...prev,
          {
            role: 'assistant',
            text: errorMessage,
          },
        ].slice(-MAX_HISTORY_MESSAGES)
      );
    } finally {
      setChatLoading(false);
    }
  };


  const handleChatKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(e);
    }
  };



  const clearChat = () => {
    const confirmed = window.confirm(
      'Clear your Safi chat history?'
    );

    if (!confirmed) {
      return;
    }

    const initialMessage = {
      role: 'assistant',
      text: "Hey 👋 I'm Safi. You can talk to me normally, ask questions, study something, or just chat with me.",
    };

    setChatMessages([initialMessage]);

    localStorage.setItem(
      CHAT_STORAGE_KEY,
      JSON.stringify([initialMessage])
    );
  };

  

  const generate = async (e) => {
    e.preventDefault();

    if (!syllabus.trim()) {
      setMsg('Please enter your syllabus or topics.');
      return;
    }

    const numberOfDays = Number(days);

    if (!days) {
      setMsg('Please enter the number of days.');
      return;
    }

    if (
      !Number.isFinite(numberOfDays) ||
      numberOfDays < 1 ||
      numberOfDays > 365
    ) {
      setMsg('Please enter a valid number of days between 1 and 365.');
      return;
    }

    setLoading(true);
    setMsg('');
    setData(null);

    try {
      const response = await api.post('/ai/timetable', {
        syllabus: syllabus.trim(),
        days: numberOfDays,
      });

      setData(response.data);
    } catch (error) {
      setMsg(getError(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">


      <header>
        <span className="text-xs font-bold tracking-wider text-indigo-600 uppercase block mb-1">
          AI ASSISTANT
        </span>

        <h1 className="font-serif text-3xl font-bold tracking-normal text-gray-900">
          Meet{' '}
          <b className="font-bold text-blue-800">
            Safi
          </b>
        </h1>

        <p className="text-slate-500 mt-1 text-sm leading-relaxed">
          Chat normally with Safi or let Safi create a study timetable for you.
        </p>
      </header>


      <div className="bg-white border border-slate-200 rounded-2xl p-2 flex gap-2 shadow-sm">

        <button
          type="button"
          onClick={() => setMode('chat')}
          className={`flex-1 py-3 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
            mode === 'chat'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <FontAwesomeIcon icon={faComments} />
          Chat with Safi
        </button>

        <button
          type="button"
          onClick={() => setMode('planner')}
          className={`flex-1 py-3 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
            mode === 'planner'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <FontAwesomeIcon icon={faBookOpen} />
          Study Planner
        </button>

      </div>

      {mode === 'chat' && (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">


          <div className="p-4 border-b border-slate-200 flex items-center justify-between gap-3 bg-slate-50/60">

            <div className="flex items-center gap-3">

              <div className="w-11 h-11 rounded-full bg-indigo-100 flex items-center justify-center overflow-hidden">

                <img
                  className="h-full rounded-full w-full object-cover"
                  src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTFDVeCvsOm2mIDjslfeLI1NXWhc-DTTxnABsaBXwWYVw&s=10"
                  alt="Safi"
                />

              </div>

              <div>
                <h2 className="font-bold text-slate-900">
                  Safi
                </h2>

                <p className="text-xs text-green-600 font-medium">
                  ● Online
                </p>
              </div>

            </div>

            <button
              type="button"
              onClick={clearChat}
              disabled={chatLoading}
              className="text-xs px-3 py-2 rounded-lg border border-slate-200 text-slate-500 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors disabled:opacity-50"
              title="Clear chat history"
            >
              <FontAwesomeIcon
                icon={faTrash}
                className="mr-1.5"
              />
              Clear
            </button>

          </div>


          <div className="h-[470px] overflow-y-auto p-5 bg-slate-50/50 flex flex-col gap-4">

            {chatMessages.map((message, index) => {
              const isUser = message.role === 'user';

              return (
                <div
                  key={`${message.role}-${index}`}
                  className={`flex ${
                    isUser
                      ? 'justify-end'
                      : 'justify-start'
                  }`}
                >

                  <div
                    className={`max-w-[85%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                      isUser
                        ? 'bg-indigo-600 text-white rounded-br-none'
                        : 'bg-white text-slate-800 border border-slate-200 rounded-bl-none shadow-sm'
                    }`}
                  >

                    {/* SAFI LABEL */}

                    {!isUser && (
                      <div className="flex items-center gap-2 mb-2">

                        <img
                          className="h-8 w-8 rounded-full object-cover"
                          src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTFDVeCvsOm2mIDjslfeLI1NXWhc-DTTxnABsaBXwWYVw&s=10"
                          alt="Safi"
                        />

                        <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600">
                          Safi
                        </span>

                      </div>
                    )}

                    {/* MESSAGE */}

                    {isUser ? (
                      <div className="whitespace-pre-wrap break-words">
                        {message.text}
                      </div>
                    ) : (
                      <div className="break-words">
                        {renderAIMessage(message.text)}
                      </div>
                    )}

                  </div>

                </div>
              );
            })}


            {chatLoading && (
              <div className="flex justify-start">

                <div className="bg-white border border-slate-200 rounded-2xl rounded-bl-none px-4 py-3 shadow-sm">

                  <div className="flex items-center gap-2">

                    <Spinner />

                    <span className="text-xs text-slate-500">
                      Safi is typing...
                    </span>

                  </div>

                </div>

              </div>
            )}

            <div ref={chatEndRef} />

          </div>


          <form
            onSubmit={sendMessage}
            className="p-3.5 border-t border-slate-200 bg-white flex gap-2.5 items-end"
          >

            <textarea
              value={chatInput}
              onChange={(e) =>
                setChatInput(e.target.value)
              }
              onKeyDown={handleChatKeyDown}
              placeholder="Talk to Safi..."
              rows={1}
              disabled={chatLoading}
              className="flex-1 resize-none px-4 py-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:border-indigo-600 focus:ring-4 focus:ring-indigo-50/50 transition-all disabled:bg-slate-50"
            />

            <button
              type="submit"
              disabled={
                chatLoading ||
                !chatInput.trim()
              }
              className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors flex items-center gap-2"
            >
              <FontAwesomeIcon icon={faPaperPlane} />
              Send
            </button>

          </form>

          <div className="px-4 pb-3">
            <p className="text-[10px] text-slate-400">
              Press Enter to send • Shift + Enter for a new line • Chat history is saved
            </p>
          </div>

        </div>
      )}


      {mode === 'planner' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* FORM */}

          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">

            <div className="flex items-center gap-3 mb-6">

              <div className="w-11 h-11 rounded-xl bg-indigo-100 flex items-center justify-center">

                <FontAwesomeIcon
                  icon={faCalendarDays}
                  className="text-indigo-600"
                />

              </div>

              <div>

                <h2 className="font-bold text-slate-900">
                  Study Planner
                </h2>

                <p className="text-xs text-slate-500">
                  Create a personalized timetable
                </p>

              </div>

            </div>

            <form
              onSubmit={generate}
              className="space-y-5"
            >

              <div>

                <label className="block text-xs font-bold text-slate-700 mb-2">
                  Syllabus / Topics
                </label>

                <textarea
                  value={syllabus}
                  onChange={(e) =>
                    setSyllabus(e.target.value)
                  }
                  placeholder="Example: React, Node.js, MongoDB, JavaScript..."
                  rows={7}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm outline-none focus:border-indigo-600 focus:ring-4 focus:ring-indigo-50/50 resize-none"
                />

              </div>

              <div>

                <label className="block text-xs font-bold text-slate-700 mb-2">
                  Number of Days
                </label>

                <input
                  type="number"
                  min="1"
                  max="365"
                  value={days}
                  onChange={(e) =>
                    setDays(e.target.value)
                  }
                  placeholder="Example: 10"
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm outline-none focus:border-indigo-600 focus:ring-4 focus:ring-indigo-50/50"
                />

              </div>

              {msg && (
                <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-xl text-xs">
                  {msg}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white py-3 rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2"
              >

                {loading ? (
                  <>
                    <Spinner />
                    Generating...
                  </>
                ) : (
                  <>
                    <FontAwesomeIcon icon={faBookOpen} />
                    Generate Timetable
                  </>
                )}

              </button>

            </form>

          </div>


          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">

            <div className="flex items-center gap-3 mb-6">

              <div className="w-11 h-11 rounded-xl bg-indigo-100 flex items-center justify-center overflow-hidden">

                <img
                  className="h-full w-full object-cover"
                  src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTFDVeCvsOm2mIDjslfeLI1NXWhc-DTTxnABsaBXwWYVw&s=10"
                  alt="Safi"
                />

              </div>

              <div>

                <h2 className="font-bold text-slate-900">
                  Your Timetable
                </h2>

                <p className="text-xs text-slate-500">
                  Generated by Safi
                </p>

              </div>

            </div>

            {!data?.days?.length ? (
              <div className="h-[400px] flex items-center justify-center text-center">

                <div>

                  <FontAwesomeIcon
                    icon={faBookOpen}
                    className="text-slate-300 text-4xl mb-4"
                  />

                  <h3 className="font-semibold text-slate-500">
                    No timetable yet
                  </h3>

                  <p className="text-xs text-slate-400 mt-1">
                    Enter your syllabus and generate your study plan.
                  </p>

                </div>

              </div>
            ) : (
              <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">

                {data.days.map((day) => (
                  <div
                    key={day.day}
                    className="border border-slate-200 rounded-xl p-4"
                  >

                    <div className="flex items-center justify-between mb-2">

                      <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">
                        Day {day.day}
                      </span>

                    </div>

                    <div className="space-y-2">

                      {day.topics?.map((topic, index) => (
                        <div
                          key={index}
                          className="bg-slate-50 rounded-lg px-3 py-2"
                        >

                          <p className="text-sm font-semibold text-slate-800">
                            {topic}
                          </p>

                        </div>
                      ))}

                    </div>

                    {day.notes && (
                      <p className="text-xs text-slate-500 mt-3 leading-relaxed">
                        {day.notes}
                      </p>
                    )}

                  </div>
                ))}

              </div>
            )}

          </div>

        </div>
      )}



      {msg && mode === 'chat' && (
        <Toast
          message={msg}
          onClose={() => setMsg('')}
        />
      )}

    </div>
  );
}