import { useEffect, useRef, useState, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import api, { getError } from '../lib/api'
import { getUser } from '../lib/auth'
import { getSocket } from '../lib/socket'
import { Spinner, Empty, Toast } from '../components/UI'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faComments,
  faPaperPlane,
  faHand,
  faKey,
  faFolderOpen,
  faVideo,
  faLink
} from '@fortawesome/free-solid-svg-icons'

export default function Messages() {
  const user = getUser()
  const userId = user?.userid?.toString()

  const [searchParams] = useSearchParams()

  const [appointmentId, setAppointmentId] = useState(
    searchParams.get('appointmentId') || ''
  )

  const [inputMessage, setInputMessage] = useState('')
  const [recordingLink, setRecordingLink] = useState('')
  const [messages, setMessages] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [isSendingRecording, setIsSendingRecording] = useState(false)
  const [toastMessage, setToastMessage] = useState('')

  const messagesEndRef = useRef(null)
  const socketRef = useRef(null)

  // Keep appointment ID synced with URL
  useEffect(() => {
    const urlAppointmentId =
      searchParams.get('appointmentId') || ''

    setAppointmentId(urlAppointmentId)
  }, [searchParams])

  // Fetch old messages
  const fetchMessages = useCallback(async () => {
    if (!appointmentId.trim()) {
      setMessages([])
      return
    }

    setIsLoading(true)

    try {
      const { data } = await api.get(
        `/message/${appointmentId}`
      )

      setMessages(
        Array.isArray(data) ? data : []
      )
    } catch (error) {
      setToastMessage(getError(error))
    } finally {
      setIsLoading(false)
    }
  }, [appointmentId])

  // Socket connection
  useEffect(() => {
    const socket = getSocket()

    socketRef.current = socket

    if (userId) {
      socket.emit('register', userId)
    }

    const handleIncomingMessage = (message) => {
      if (
        message?.appointmentId?.toString() ===
        appointmentId?.toString()
      ) {
        setMessages((prev) => [
          ...prev,
          message
        ])
      }
    }

    socket.on(
      'receiveMessage',
      handleIncomingMessage
    )

    return () => {
      socket.off(
        'receiveMessage',
        handleIncomingMessage
      )
    }
  }, [appointmentId, userId])

  // Load messages whenever appointment changes
  useEffect(() => {
    if (appointmentId) {
      fetchMessages()
    } else {
      setMessages([])
    }
  }, [appointmentId, fetchMessages])

  // Auto scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: 'smooth'
    })
  }, [messages])

  // Normal message
  const handleSendMessage = (e) => {
    e.preventDefault()

    const cleanText = inputMessage.trim()

    if (!cleanText || !appointmentId) {
      return
    }

    socketRef.current?.emit('sendMessage', {
      appointmentId,
      senderId: userId,
      text: cleanText
    })

    setInputMessage('')
  }

  // Validate Google Drive link
  const isValidGoogleDriveLink = (value) => {
    try {
      const url = new URL(value)

      return (
        url.protocol === 'https:' &&
        (
          url.hostname === 'drive.google.com' ||
          url.hostname === 'docs.google.com'
        )
      )
    } catch {
      return false
    }
  }

  // Send recording link
  const handleSendRecording = (e) => {
    e.preventDefault()

    const cleanLink = recordingLink.trim()

    if (!appointmentId) {
      setToastMessage(
        'Open an appointment conversation first.'
      )
      return
    }

    if (!cleanLink) {
      setToastMessage(
        'Please paste the Google Drive recording link.'
      )
      return
    }

    if (!isValidGoogleDriveLink(cleanLink)) {
      setToastMessage(
        'Please enter a valid Google Drive link.'
      )
      return
    }

    try {
      setIsSendingRecording(true)

      const recordingMessage =
        `🎬 Class Recording\n${cleanLink}`

      socketRef.current?.emit('sendMessage', {
        appointmentId,
        senderId: userId,
        text: recordingMessage
      })

      setRecordingLink('')

      setToastMessage(
        'Recording link sent successfully.'
      )
    } catch (error) {
      setToastMessage(
        error?.message ||
        'Unable to send recording link.'
      )
    } finally {
      setIsSendingRecording(false)
    }
  }

  // Detect recording message
  const getRecordingLink = (text) => {
    if (!text || !text.includes('🎬 Class Recording')) {
      return null
    }

    const lines = text
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)

    const link = lines.find((line) => {
      try {
        const url = new URL(line)

        return (
          url.protocol === 'https:' &&
          (
            url.hostname === 'drive.google.com' ||
            url.hostname === 'docs.google.com'
          )
        )
      } catch {
        return false
      }
    })

    return link || null
  }

  const renderChatInterfaceBody = () => {
    if (!appointmentId) {
      return (
        <div className="flex-1 flex items-center justify-center bg-slate-50/50 p-6">

          <Empty
            icon={
              <FontAwesomeIcon
                icon={faComments}
                className="text-indigo-500 text-3xl"
              />
            }
            title="Choose a conversation"
            text="Open an accepted appointment from Appointments to start chatting."
          />

        </div>
      )
    }

    if (isLoading) {
      return (
        <div className="flex-1 flex items-center gap-3 justify-center text-slate-500 bg-slate-50/50 py-12">

          <Spinner />

          <span className="text-xs font-semibold tracking-wide">
            Loading messages…
          </span>

        </div>
      )
    }

    return (
      <div className="flex flex-col flex-1 overflow-hidden">

        {/* Messages */}
        <div className="flex-1 p-5 overflow-y-auto flex flex-col gap-3.5 bg-slate-50/60">

          {/* Encryption notice */}
          <div className="flex justify-center items-center py-1 text-[15px] text-slate-400 font-medium tracking-wide gap-1 select-none">
            <span>
              End-to-end encrypted
            </span>
          </div>

          {messages.length ? (

            messages.map((msg, index) => {

              const msgSenderId =
                msg.senderId?._id?.toString() ||
                msg.senderId?.toString()

              const isMe =
                msgSenderId === userId

              const timestamp = msg.createdAt
                ? new Date(
                    msg.createdAt
                  ).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit'
                  })
                : ''

              const recordingUrl =
                getRecordingLink(msg.text)

              return (
                <div
                  key={msg._id || index}
                  className={`max-w-[80%] px-4 py-2.5 rounded-2xl flex flex-col text-xs shadow-3xs relative leading-relaxed ${
                    isMe
                      ? 'bg-indigo-600 text-white self-end rounded-br-none'
                      : 'bg-white text-slate-900 border border-slate-200/80 self-start rounded-bl-none'
                  }`}
                >

                  {!isMe && (
                    <span className="text-[9px] font-bold text-indigo-600 tracking-wider uppercase mb-1 block">
                      {msg.senderId?.name || 'User'}
                    </span>
                  )}

                  {recordingUrl ? (

                    <div className="space-y-3">

                      <div className="flex items-center gap-2">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                          isMe
                            ? 'bg-white/15'
                            : 'bg-indigo-50'
                        }`}>
                          <FontAwesomeIcon
                            icon={faVideo}
                            className={
                              isMe
                                ? 'text-white'
                                : 'text-indigo-600'
                            }
                          />
                        </div>

                        <div>
                          <p className="font-bold">
                            Class Recording
                          </p>

                          <p className={`text-[10px] ${
                            isMe
                              ? 'text-indigo-100'
                              : 'text-slate-500'
                          }`}>
                            Google Drive recording
                          </p>
                        </div>
                      </div>

                      <a
                        href={recordingUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`inline-flex items-center justify-center gap-2 w-full px-3 py-2 rounded-xl font-bold transition ${
                          isMe
                            ? 'bg-white text-indigo-700 hover:bg-indigo-50'
                            : 'bg-indigo-600 text-white hover:bg-indigo-700'
                        }`}
                      >
                        <FontAwesomeIcon
                          icon={faVideo}
                        />

                        Watch Recording
                      </a>

                    </div>

                  ) : (

                    <p className="whitespace-pre-wrap">
                      {msg.text}
                    </p>

                  )}

                  {timestamp && (
                    <small
                      className={`text-[9px] mt-1 block select-none text-right opacity-65 ${
                        isMe
                          ? 'text-indigo-200'
                          : 'text-slate-400'
                      }`}
                    >
                      {timestamp}
                    </small>
                  )}

                </div>
              )
            })

          ) : (

            <div className="my-auto">

              <Empty
                icon={
                  <FontAwesomeIcon
                    icon={faHand}
                    className="text-indigo-400 text-3xl"
                  />
                }
                title="No messages yet"
                text="Say hello when your appointment is accepted."
              />

            </div>

          )}

          <div ref={messagesEndRef} />

        </div>

        {/* Recording link composer */}
        <form
          onSubmit={handleSendRecording}
          className="px-3.5 py-2.5 border-t border-slate-200 bg-slate-50 flex gap-2 items-center"
        >

          <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center flex-shrink-0">
            <FontAwesomeIcon
              icon={faVideo}
              className="text-indigo-600 text-xs"
            />
          </div>

          <input
            type="url"
            value={recordingLink}
            onChange={(e) =>
              setRecordingLink(e.target.value)
            }
            placeholder="Paste Google Drive recording link..."
            className="flex-1 min-w-0 px-3 py-2 border border-slate-200 rounded-xl text-xs outline-none focus:border-indigo-600 focus:ring-4 focus:ring-indigo-50/50 transition-all bg-white"
          />

          <button
            type="submit"
            disabled={
              !recordingLink.trim() ||
              isSendingRecording
            }
            className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-3 py-2 rounded-xl text-xs font-semibold transition-colors flex-shrink-0 flex items-center gap-1.5"
          >

            <FontAwesomeIcon
              icon={faLink}
            />

            <span className="hidden sm:inline">
              {isSendingRecording
                ? 'Sending...'
                : 'Send Recording'}
            </span>

          </button>

        </form>

        {/* Normal chat composer */}
        <form
          className="p-3.5 border-t border-slate-200 bg-white flex gap-2.5 items-center"
          onSubmit={handleSendMessage}
        >

          <input
            value={inputMessage}
            onChange={(e) =>
              setInputMessage(e.target.value)
            }
            placeholder="Write a message…"
            className="flex-1 px-4 py-2 border border-slate-200 rounded-xl text-xs outline-none focus:border-indigo-600 focus:ring-4 focus:ring-indigo-50/50 transition-all bg-white"
          />

          <button
            type="submit"
            disabled={!inputMessage.trim()}
            className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-xl text-xs font-semibold shadow-2xs transition-colors cursor-pointer flex-shrink-0 flex items-center gap-1.5"
          >

            <FontAwesomeIcon
              icon={faPaperPlane}
            />

            <span>
              Send
            </span>

          </button>

        </form>

      </div>
    )
  }

  return (
    <div className="space-y-8">

      <header>

        <span className="text-xs font-bold tracking-wider text-indigo-600 uppercase block mb-1">
          REAL-TIME CHAT
        </span>

        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
          Messages
        </h1>

        <p className="text-slate-500 mt-1 text-sm leading-relaxed">
          Select an accepted appointment from Appointments to open its conversation.
        </p>

      </header>

      <div className="bg-white border border-slate-200 rounded-2xl flex flex-col h-[620px] overflow-hidden shadow-sm">

        {/* Appointment channel */}
        <div className="p-3.5 border-b border-slate-200 bg-slate-50/60 flex gap-2.5 items-center">

          <div className="flex-1 relative flex items-center">

            <FontAwesomeIcon
              icon={faKey}
              className="absolute left-3 text-slate-400 text-xs pointer-events-none"
            />

            <input
              value={appointmentId}
              onChange={(e) =>
                setAppointmentId(e.target.value)
              }
              placeholder="Appointment ID..."
              className="w-full pl-9 pr-4 py-1.5 border border-slate-200 rounded-xl text-xs outline-none focus:border-indigo-600 bg-white transition-all"
            />

          </div>

          <button
            type="button"
            onClick={fetchMessages}
            disabled={!appointmentId.trim()}
            className="bg-gray-700 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-1.5 rounded-xl text-xs font-semibold shadow-2xs transition-colors cursor-pointer flex-shrink-0 flex items-center gap-1.5"
          >

            <FontAwesomeIcon
              icon={faFolderOpen}
            />

            <span className="hidden sm:inline">
              Open Channel
            </span>

          </button>

        </div>

        {renderChatInterfaceBody()}

      </div>

      {toastMessage && (
        <Toast
          message={toastMessage}
          onClose={() =>
            setToastMessage('')
          }
        />
      )}

    </div>
  )
}