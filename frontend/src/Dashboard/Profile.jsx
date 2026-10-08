import { useEffect, useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import api, { getError } from '../lib/api'
import { saveSession, getUser } from '../lib/auth'
import { Spinner, Toast } from '../components/UI'

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faFloppyDisk,
  faCrown,
  faCheckCircle,
  faUser,
  faIndianRupeeSign,
  faPlus,
  faXmark,
  faMagnifyingGlass,
  faShieldHalved,
  faBuilding,
  faBriefcase,
  faArrowLeft,
  faCalendarCheck,
  faStar,
  faCamera
} from '@fortawesome/free-solid-svg-icons'

const AVAILABLE_SKILLS = [
  'Software Engineering',
  'Computer Science',
  'Science',
  'Mathematics',
  'Physics',
  'Chemistry',
  'Biology',
  'JEE',
  'NEET',
  'React.js',
  'Node.js',
  'Java',
  'JavaScript',
  'TypeScript',
  'Python',
  'Next.js',
  'Express.js',
  'SQL',
  'MongoDB',
  'Docker',
  'Git',
  'C++',
  'DSA',
  'Cyber Security',
  'Machine Learning',
  'Artificial Intelligence'
]



const mapUserToForm = (data, defaultRole) => ({
  name: data?.name ?? '',
  companyName: data?.companyName ?? data?.company ?? '',
  bio: data?.bio ?? '',
  experience: String(
    Number(data?.experience) >= 0 ? Number(data.experience) : 0
  ),
  skills: Array.isArray(data?.skills) ? data.skills : [],
  role: data?.role || defaultRole,
  mentorshipPrice:
    Number(data?.mentorshipPrice) >= 0
      ? Number(data.mentorshipPrice)
      : 0,
  profileImage: data?.profileImage ?? '',
  rating: Number(data?.rating || 0),
  completedSessions: Number(data?.completedSessions || 0)
})

const mapUserToVerification = data => ({
  status: data?.aadhaarVerificationStatus || 'not_submitted',
  linkedinUrl: data?.linkedinUrl || '',
  resumeUrl: data?.resumeUrl || ''
})

const EMPTY_TOAST = { message: '', type: 'error' }

export default function Profile() {
  const cachedUser = getUser()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  const mentorId = searchParams.get('mentorId')
  const isMentorProfile = Boolean(mentorId)

  const [formData, setFormData] = useState(() =>
    mapUserToForm(cachedUser, 'learner')
  )

  const [premiumEligible, setPremiumEligible] = useState(
    Boolean(cachedUser?.premiumEligible)
  )
  const [premiumEnabled, setPremiumEnabled] = useState(
    Boolean(cachedUser?.premiumEnabled)
  )

  const [verification, setVerification] = useState(() =>
    mapUserToVerification(cachedUser)
  )

  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isVerificationLoading, setIsVerificationLoading] =
    useState(false)
  const [isUploadingImage, setIsUploadingImage] = useState(false)
  const [bookingLoading, setBookingLoading] = useState(false)

  const [skillSearch, setSkillSearch] = useState('')
  const [customSkill, setCustomSkill] = useState('')

  // toast ab object hai: type string match se nahi, seedha set hota hai
  const [toast, setToast] = useState(EMPTY_TOAST)
  const notify = (message, type = 'error') =>
    setToast({ message, type })

  useEffect(() => {
    const loadProfile = async () => {
      try {
        setIsLoading(true)

        const url = isMentorProfile
          ? `/user/mentor/${mentorId}`
          : '/auth/profile'

        const { data } = await api.get(url)

        setFormData(
          mapUserToForm(data, isMentorProfile ? 'mentor' : 'learner')
        )
        setPremiumEligible(Boolean(data.premiumEligible))
        setPremiumEnabled(Boolean(data.premiumEnabled))
        setVerification(mapUserToVerification(data))

        if (!isMentorProfile) {
          saveSession({
            ...cachedUser,
            ...data,
            token: localStorage.getItem('dailygram_token'),
            userid: cachedUser?.userid || data._id
          })
        }
      } catch (error) {
        notify(getError(error))
      } finally {
        setIsLoading(false)
      }
    }

    loadProfile()
    
  }, [mentorId, isMentorProfile])

  const handleImageUpload = async event => {
    const file = event.target.files?.[0]

    if (!file) return

    if (!file.type.startsWith('image/')) {
      notify('Please select a valid image.')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      notify('Profile image must be smaller than 5MB.')
      return
    }

    const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME
    const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET

    if (!cloudName || !uploadPreset) {
      notify('Cloudinary upload settings are missing.')
      return
    }

    try {
      setIsUploadingImage(true)

      const uploadData = new FormData()
      uploadData.append('file', file)
      uploadData.append('upload_preset', uploadPreset)

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
        { method: 'POST', body: uploadData }
      )

      const result = await response.json()

      if (!response.ok) {
        throw new Error(
          result?.error?.message || 'Image upload failed'
        )
      }

      if (!result?.secure_url) {
        throw new Error('Upload succeeded but no image URL returned.')
      }

      setFormData(prev => ({
        ...prev,
        profileImage: result.secure_url
      }))

      notify('Photo uploaded. Click Save changes to save it.', 'success')
    } catch (error) {
      notify(error?.message || 'Unable to upload profile photo.')
    } finally {
      setIsUploadingImage(false)
      event.target.value = ''
    }
  }

  const submitVerification = async () => {
    if (formData.role !== 'mentor') {
      notify('Only mentor accounts can submit verification.')
      return
    }

    if (
      !verification.linkedinUrl.trim() ||
      !verification.resumeUrl.trim()
    ) {
      notify('LinkedIn URL and resume URL are required.')
      return
    }

    setIsVerificationLoading(true)

    try {
      const { data } = await api.post('/user/mentor/verification', {
        linkedinUrl: verification.linkedinUrl.trim(),
        resumeUrl: verification.resumeUrl.trim()
      })

      const updatedStatus =
        data?.user?.aadhaarVerificationStatus || 'pending'

      setVerification(prev => ({ ...prev, status: updatedStatus }))

      notify(
        'Verification submitted. Admin review is now pending.',
        'success'
      )
    } catch (error) {
      notify(getError(error))
    } finally {
      setIsVerificationLoading(false)
    }
  }

  const handleToggleSkill = skillName => {
    setFormData(prev => {
      const isSelected = prev.skills.includes(skillName)

      return {
        ...prev,
        skills: isSelected
          ? prev.skills.filter(item => item !== skillName)
          : [...prev.skills, skillName]
      }
    })
  }

  const handleAddCustomSkill = () => {
    const skill = customSkill.trim()

    if (!skill) return

    const exists = formData.skills.some(
      item => item.toLowerCase() === skill.toLowerCase()
    )

    if (!exists) {
      setFormData(prev => ({
        ...prev,
        skills: [...prev.skills, skill]
      }))
    }

    setCustomSkill('')
  }

  const handleRemoveSkill = skillName => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.filter(skill => skill !== skillName)
    }))
  }

  const handlePriceChange = value => {
    if (value === '') {
      setFormData(prev => ({ ...prev, mentorshipPrice: 0 }))
      return
    }

    const numericValue = Number(value)

    if (!Number.isFinite(numericValue)) return

    setFormData(prev => ({
      ...prev,
      mentorshipPrice: Math.max(0, Math.floor(numericValue))
    }))
  }

  const handleSaveProfile = async e => {
    e.preventDefault()

    const cleanName = (formData.name ?? '').trim()

    if (!cleanName) {
      notify('Name cannot be empty.')
      return
    }

    const selectedRole =
      formData.role === 'mentor' ? 'mentor' : 'learner'
    const currentPrice = Number(formData.mentorshipPrice)

    if (
      selectedRole === 'mentor' &&
      (!Number.isFinite(currentPrice) || currentPrice < 0)
    ) {
      notify('Mentorship price cannot be negative.')
      return
    }

    setIsSaving(true)

    try {
      const payload = {
        name: cleanName,
        bio: String(formData.bio ?? '').trim(),
        companyName: String(formData.companyName ?? '').trim(),
        experience: String(formData.experience ?? '0').trim() || '0',
        skills: Array.isArray(formData.skills)
          ? formData.skills.filter(Boolean)
          : [],
        role: selectedRole,
        profileImage: formData.profileImage ?? ''
      }

      if (selectedRole === 'mentor') {
        payload.mentorshipPrice = Number.isFinite(currentPrice)
          ? Math.max(0, Math.floor(currentPrice))
          : 0
      }

      const { data } = await api.put('/auth/profile', payload)

      const updatedUser = data?.user ?? data?.data ?? data

      setFormData(prev => ({
        ...prev,
        name: updatedUser?.name ?? prev.name,
        companyName:
          updatedUser?.companyName ??
          updatedUser?.company ??
          prev.companyName,
        bio: updatedUser?.bio ?? prev.bio,
        experience:
          updatedUser?.experience !== undefined &&
          updatedUser?.experience !== null
            ? String(updatedUser.experience)
            : prev.experience,
        skills: Array.isArray(updatedUser?.skills)
          ? updatedUser.skills
          : prev.skills,
        role: updatedUser?.role ?? prev.role,
        mentorshipPrice:
          updatedUser?.mentorshipPrice ?? prev.mentorshipPrice,
        profileImage: updatedUser?.profileImage ?? prev.profileImage
      }))

      saveSession({
        ...cachedUser,
        ...updatedUser,
        token: localStorage.getItem('dailygram_token'),
        userid: cachedUser?.userid || updatedUser?._id
      })

      notify('Profile updated successfully.', 'success')
    } catch (error) {
      console.error('Profile update error:', error)
      notify(getError(error) || 'Failed to update profile.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleBookMentor = async () => {
    if (!isMentorProfile || !mentorId) return

    if (cachedUser?.role === 'mentor') {
      notify('Mentor accounts cannot book another mentor.')
      return
    }

    if (bookingLoading) return

    const price = Number(formData.mentorshipPrice || 0)

    const confirmed = window.confirm(
      price > 0
        ? `Request a session with ${formData.name} for ₹${price}?`
        : `Request a free session with ${formData.name}?`
    )

    if (!confirmed) return

    try {
      setBookingLoading(true)

      // NOTE: backend ko price DB se hi padhna chahiye, ye value trust nahi karni
      await api.post('/appointments/request', {
        mentorId,
        mentorshipPrice: price
      })

      notify('Appointment request sent successfully.', 'success')
    } catch (error) {
      notify(getError(error))
    } finally {
      setBookingLoading(false)
    }
  }

  const filteredSkills = AVAILABLE_SKILLS.filter(skill =>
    skill.toLowerCase().includes(skillSearch.toLowerCase())
  )

  const firstInitial = (formData.name || 'U')[0].toUpperCase()

  const verificationLabel =
    {
      not_submitted: 'Not submitted',
      pending: 'Pending review',
      verified: 'Verified',
      rejected: 'Rejected'
    }[verification.status] || 'Not submitted'

  const toastEl = (
    <Toast
      message={toast.message}
      type={toast.type}
      onClose={() => setToast(EMPTY_TOAST)}
    />
  )



  if (isMentorProfile && isLoading) {
    return (
      <div className="mx-auto flex min-h-64 max-w-5xl items-center justify-center gap-3 rounded-3xl border border-slate-200 bg-slate-50 text-slate-500">
        <Spinner />
        <span className="text-sm font-medium">Loading mentor...</span>
        {toastEl}
      </div>
    )
  }


  if (isMentorProfile) {
    return (
      <div className="mx-auto max-w-5xl space-y-6">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-600 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600"
        >
          <FontAwesomeIcon icon={faArrowLeft} />
          Back to mentors
        </button>

        <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="h-32 bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 sm:h-40" />

          <div className="px-5 pb-7 sm:px-8">
            <div className="-mt-14 flex flex-col gap-5 sm:-mt-16 sm:flex-row sm:items-end sm:justify-between">
              <div className="flex items-end gap-4">
                <div className="h-28 w-28 shrink-0 overflow-hidden rounded-3xl border-4 border-white bg-blue-50 shadow-lg sm:h-32 sm:w-32">
                  {formData.profileImage ? (
                    <img
                      src={formData.profileImage}
                      alt={formData.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-4xl font-black text-blue-600">
                      {firstInitial}
                    </div>
                  )}
                </div>

                <div className="pb-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="text-2xl font-black text-slate-900 sm:text-3xl">
                      {formData.name}
                    </h1>

                    {premiumEnabled && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-[10px] font-bold text-amber-700">
                        <FontAwesomeIcon icon={faCrown} />
                        Premium
                      </span>
                    )}
                  </div>

                  <p className="mt-1 text-xs font-bold uppercase tracking-widest text-blue-600">
                    Mentor
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleBookMentor}
                disabled={
                  bookingLoading || cachedUser?.role === 'mentor'
                }
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 py-3 text-xs font-black text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                <FontAwesomeIcon icon={faCalendarCheck} />
                {bookingLoading ? 'Sending...' : 'Request Appointment'}
              </button>
            </div>
          </div>
        </section>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <section className="space-y-6 lg:col-span-2">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-7">
              <h2 className="text-lg font-black text-slate-900">
                About {formData.name}
              </h2>

              <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-600">
                {formData.bio || 'This mentor has not added a bio yet.'}
              </p>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-7">
              <h2 className="text-lg font-black text-slate-900">
                Skills
              </h2>

              {formData.skills.length > 0 ? (
                <div className="mt-5 flex flex-wrap gap-2">
                  {formData.skills.map(skill => (
                    <span
                      key={skill}
                      className="rounded-full border border-blue-100 bg-blue-50 px-3 py-2 text-xs font-bold text-blue-600"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="mt-4 text-sm text-slate-500">
                  No skills added yet.
                </p>
              )}
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-7">
              <h2 className="text-lg font-black text-slate-900">
                Experience
              </h2>

              <div className="mt-4 flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                  <FontAwesomeIcon icon={faBriefcase} />
                </div>

                <div>
                  <p className="text-xl font-black text-slate-900">
                    {formData.experience}
                  </p>
                  <p className="text-xs text-slate-500">
                    years of experience
                  </p>
                </div>
              </div>

              {formData.companyName && (
                <div className="mt-5 flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
                    <FontAwesomeIcon icon={faBuilding} />
                  </div>

                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Organization
                    </p>
                    <p className="mt-1 text-sm font-bold text-slate-800">
                      {formData.companyName}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </section>

          <aside className="space-y-6">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-sm font-black uppercase tracking-wider text-slate-500">
                Mentor stats
              </h2>

              <div className="mt-5 space-y-4">
                <div className="flex items-center justify-between rounded-2xl bg-slate-50 p-4">
                  <div className="flex items-center gap-3">
                    <FontAwesomeIcon
                      icon={faStar}
                      className="text-amber-500"
                    />
                    <span className="text-xs font-bold text-slate-600">
                      Rating
                    </span>
                  </div>

                  <span className="text-sm font-black text-slate-900">
                    {formData.rating > 0
                      ? formData.rating.toFixed(1)
                      : 'New'}
                  </span>
                </div>

                <div className="flex items-center justify-between rounded-2xl bg-slate-50 p-4">
                  <span className="text-xs font-bold text-slate-600">
                    Completed sessions
                  </span>
                  <span className="text-sm font-black text-slate-900">
                    {formData.completedSessions}
                  </span>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-blue-100 bg-blue-50 p-6">
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-blue-600 shadow-sm">
                  <FontAwesomeIcon icon={faIndianRupeeSign} />
                </div>

                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-blue-500">
                    Session price
                  </p>

                  <p className="mt-1 text-2xl font-black text-slate-900">
                    {formData.mentorshipPrice === 0
                      ? 'Free'
                      : `₹${formData.mentorshipPrice}`}
                  </p>

                  <p className="mt-1 text-[11px] text-slate-500">
                    Per mentorship session
                  </p>
                </div>
              </div>
            </div>

            {premiumEnabled && (
              <div className="rounded-3xl border border-amber-200 bg-amber-50 p-6">
                <div className="flex items-start gap-3">
                  <FontAwesomeIcon
                    icon={faCrown}
                    className="mt-1 text-amber-500"
                  />

                  <div>
                    <h3 className="text-sm font-black text-slate-900">
                      Premium mentor
                    </h3>
                    <p className="mt-1 text-xs leading-5 text-slate-600">
                      This mentor has been approved for Premium by the Dailygram team.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </aside>
        </div>

        {toastEl}
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <header className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 sm:p-8">
        <div>
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-blue-600">
            <FontAwesomeIcon icon={faUser} />
            Account
          </div>

          <h1 className="text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
            Your profile
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            Manage your profile and skills.
          </p>
        </div>
      </header>

      {isLoading ? (
        <div className="flex min-h-64 items-center justify-center gap-3 rounded-3xl border border-slate-200 bg-slate-50 text-slate-500">
          <Spinner />
          <span className="text-sm font-medium">Loading profile...</span>
        </div>
      ) : (
        <>
          {formData.role === 'mentor' && (
            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                    <FontAwesomeIcon icon={faShieldHalved} />
                  </div>

                  <div>
                    <h2 className="text-lg font-black text-slate-900">
                      Mentor status
                    </h2>
                    <p className="mt-1 text-sm text-slate-500">
                      Verification is required before offering paid mentorship.
                    </p>
                  </div>
                </div>

                <span
                  className={`self-start rounded-full px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider ${
                    verification.status === 'verified'
                      ? 'bg-emerald-50 text-emerald-700'
                      : verification.status === 'rejected'
                        ? 'bg-red-50 text-red-700'
                        : verification.status === 'pending'
                          ? 'bg-amber-50 text-amber-700'
                          : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {verificationLabel}
                </span>
              </div>

              <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
                <label className="text-xs font-bold text-slate-600">
                  LinkedIn URL
                  <input
                    value={verification.linkedinUrl}
                    onChange={event =>
                      setVerification(prev => ({
                        ...prev,
                        linkedinUrl: event.target.value
                      }))
                    }
                    placeholder="https://linkedin.com/in/your-name"
                    className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
                  />
                </label>

                <label className="text-xs font-bold text-slate-600">
                  Resume URL
                  <input
                    value={verification.resumeUrl}
                    onChange={event =>
                      setVerification(prev => ({
                        ...prev,
                        resumeUrl: event.target.value
                      }))
                    }
                    placeholder="https://your-public-resume-url"
                    className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
                  />
                </label>
              </div>

              <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4">
                <p className="text-xs font-bold text-amber-800">
                  Aadhaar verification
                </p>
                <p className="mt-1 text-xs leading-5 text-amber-700">
                  Paid mentorship also requires Aadhaar verification.
                </p>
                <p className="mt-2 text-[10px] font-semibold text-amber-700">
                  Current status: {verificationLabel}
                </p>
              </div>

              <button
                type="button"
                onClick={submitVerification}
                disabled={
                  isVerificationLoading ||
                  verification.status === 'pending' ||
                  verification.status === 'verified'
                }
                className="mt-5 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                {isVerificationLoading
                  ? 'Submitting...'
                  : verification.status === 'verified'
                    ? 'Verification approved'
                    : verification.status === 'pending'
                      ? 'Review pending'
                      : 'Submit for verification'}
              </button>
            </section>
          )}

          <form
            className="max-w-3xl space-y-7 rounded-3xl border border-slate-200 bg-slate-50 p-6 shadow-sm sm:p-8"
            onSubmit={handleSaveProfile}
          >

            <div className="flex flex-col items-center gap-4 border-b border-slate-200 pb-7 sm:flex-row">
              <div className="h-28 w-28 shrink-0 overflow-hidden rounded-full border-4 border-white bg-blue-100 shadow-md">
                {formData.profileImage ? (
                  <img
                    src={formData.profileImage}
                    alt={formData.name || 'Profile'}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-3xl font-black text-blue-600">
                    {firstInitial}
                  </div>
                )}
              </div>

              <div className="text-center sm:text-left">
                <h2 className="text-lg font-black text-slate-900">
                  {formData.name || 'Your name'}
                </h2>

                <span className="mt-1 block text-[10px] font-bold uppercase tracking-widest text-blue-600">
                  {formData.role}
                </span>

                <label
                  className={`mt-4 inline-flex cursor-pointer items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold text-white transition ${
                    isUploadingImage
                      ? 'cursor-not-allowed bg-slate-400'
                      : 'bg-blue-600 hover:bg-blue-700'
                  }`}
                >
                  <FontAwesomeIcon icon={faCamera} />
                  {isUploadingImage ? 'Uploading...' : 'Upload photo'}

                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    className="hidden"
                    disabled={isUploadingImage}
                    onChange={handleImageUpload}
                  />
                </label>

                <p className="mt-2 text-[10px] text-slate-400">
                  JPG, PNG or WebP · Max 5MB
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label
                htmlFor="fullName"
                className="text-[10px] font-bold uppercase tracking-widest text-slate-600"
              >
                Full name
              </label>

              <input
                id="fullName"
                value={formData.name}
                onChange={e =>
                  setFormData(prev => ({ ...prev, name: e.target.value }))
                }
                required
                className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500/40 focus:ring-4 focus:ring-blue-50"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label
                htmlFor="emailAddress"
                className="text-[10px] font-bold uppercase tracking-widest text-slate-600"
              >
                Email address
              </label>

              <input
                id="emailAddress"
                value={cachedUser?.email || ''}
                disabled
                className="cursor-not-allowed rounded-2xl border border-slate-200 bg-slate-100 px-4 py-3 text-sm text-slate-600 outline-none"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label
                htmlFor="companyName"
                className="text-[10px] font-bold uppercase tracking-widest text-slate-600"
              >
                Company / Organization
              </label>

              <div className="relative">
                <FontAwesomeIcon
                  icon={faBuilding}
                  className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm text-slate-400"
                />

                <input
                  id="companyName"
                  value={formData.companyName}
                  onChange={e =>
                    setFormData(prev => ({
                      ...prev,
                      companyName: e.target.value
                    }))
                  }
                  placeholder="e.g. Google, Microsoft, Independent"
                  className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm text-slate-900 outline-none transition focus:border-blue-500/40 focus:ring-4 focus:ring-blue-50"
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label
                htmlFor="bio"
                className="text-[10px] font-bold uppercase tracking-widest text-slate-600"
              >
                Bio
              </label>

              <textarea
                id="bio"
                rows="4"
                maxLength="1000"
                value={formData.bio}
                onChange={e =>
                  setFormData(prev => ({ ...prev, bio: e.target.value }))
                }
                placeholder="Tell learners a little about yourself..."
                className="w-full resize-none rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500/40 focus:ring-4 focus:ring-blue-50"
              />

              <span className="text-right text-[10px] text-slate-400">
                {formData.bio.length}/1000
              </span>
            </div>

            <div className="flex flex-col gap-2">
              <label
                htmlFor="experience"
                className="text-[10px] font-bold uppercase tracking-widest text-slate-600"
              >
                Experience (years)
              </label>

              <div className="relative">
                <FontAwesomeIcon
                  icon={faBriefcase}
                  className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm text-slate-400"
                />

                <input
                  id="experience"
                  type="number"
                  min="0"
                  step="1"
                  value={formData.experience}
                  onChange={e =>
                    setFormData(prev => ({
                      ...prev,
                      experience: e.target.value
                    }))
                  }
                  onBlur={() =>
                    setFormData(prev => ({
                      ...prev,
                      experience: String(
                        Math.max(
                          0,
                          Math.floor(Number(prev.experience) || 0)
                        )
                      )
                    }))
                  }
                  className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm text-slate-900 outline-none transition focus:border-blue-500/40 focus:ring-4 focus:ring-blue-50"
                />
              </div>
            </div>

            {formData.role === 'mentor' && (
              <section className="rounded-2xl border border-blue-100 bg-blue-50/50 p-5">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
                    <FontAwesomeIcon icon={faIndianRupeeSign} />
                  </div>

                  <div>
                    <h3 className="text-sm font-black text-slate-900">
                      Mentorship pricing
                    </h3>
                    <p className="mt-1 text-xs leading-5 text-slate-500">
                      ₹0 means free mentorship.
                    </p>
                  </div>
                </div>

                <div className="mt-5">
                  <label
                    htmlFor="mentorshipPrice"
                    className="mb-2 block text-[10px] font-bold uppercase tracking-widest text-slate-600"
                  >
                    Session price
                  </label>

                  <div className="relative">
                    <FontAwesomeIcon
                      icon={faIndianRupeeSign}
                      className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-xs text-slate-400"
                    />

                    <input
                      id="mentorshipPrice"
                      type="number"
                      min="0"
                      step="1"
                      value={formData.mentorshipPrice}
                      onChange={e => handlePriceChange(e.target.value)}
                      className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm font-bold text-slate-900 outline-none transition focus:border-blue-500/40 focus:ring-4 focus:ring-blue-50"
                    />
                  </div>

                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-[10px]">
                    <span className="text-slate-500">₹0 = Free session</span>

                    <span className="font-bold text-blue-600">
                      {formData.mentorshipPrice === 0
                        ? 'FREE'
                        : `₹${formData.mentorshipPrice} / session`}
                    </span>
                  </div>

                  {formData.mentorshipPrice > 0 &&
                    verification.status !== 'verified' && (
                      <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3">
                        <p className="text-xs font-bold text-amber-800">
                          Verification required
                        </p>
                        <p className="mt-1 text-[10px] leading-5 text-amber-700">
                          Paid sessions become available after verification.
                        </p>
                      </div>
                    )}
                </div>
              </section>
            )}

            {formData.role === 'mentor' && (
              <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
                    <FontAwesomeIcon icon={faCrown} />
                  </div>

                  <div className="min-w-0">
                    <h3 className="text-sm font-black text-slate-900">
                      Premium mentor status
                    </h3>

                    <p className="mt-1 text-xs leading-5 text-slate-600">
                      Premium is approved by the Dailygram team. Strong ratings may make a mentor eligible for review, but Premium is never automatic.
                    </p>

                    <div className="mt-3 flex flex-wrap gap-2">
                      {premiumEnabled && (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1.5 text-[10px] font-bold text-emerald-700">
                          <FontAwesomeIcon icon={faCheckCircle} />
                          Premium active
                        </span>
                      )}

                      {!premiumEnabled && premiumEligible && (
                        <span className="rounded-full bg-blue-100 px-3 py-1.5 text-[10px] font-bold text-blue-700">
                          Premium review eligible
                        </span>
                      )}

                      {!premiumEnabled && !premiumEligible && (
                        <span className="rounded-full bg-slate-200 px-3 py-1.5 text-[10px] font-bold text-slate-600">
                          Standard mentor
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </section>
            )}

            <div className="flex flex-col gap-3">
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-600">
                Your skills
              </span>

              {formData.skills.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {formData.skills.map(skill => (
                    <button
                      key={skill}
                      type="button"
                      onClick={() => handleRemoveSkill(skill)}
                      className="group inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-600 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                    >
                      {skill}
                      <FontAwesomeIcon
                        icon={faXmark}
                        className="text-[9px] opacity-50 group-hover:opacity-100"
                      />
                    </button>
                  ))}
                </div>
              ) : (
                <p className="rounded-2xl border border-dashed border-slate-200 bg-white p-4 text-xs text-slate-500">
                  No skills selected yet.
                </p>
              )}
            </div>

            <div className="flex flex-col gap-3">
              <label
                htmlFor="skillSearch"
                className="text-[10px] font-bold uppercase tracking-widest text-slate-600"
              >
                Find skills
              </label>

              <div className="relative">
                <FontAwesomeIcon
                  icon={faMagnifyingGlass}
                  className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-xs text-slate-400"
                />

                <input
                  id="skillSearch"
                  value={skillSearch}
                  onChange={e => setSkillSearch(e.target.value)}
                  placeholder="Search skills..."
                  className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm text-slate-900 outline-none transition focus:border-blue-500/40 focus:ring-4 focus:ring-blue-50"
                />
              </div>

              <div className="flex max-h-52 flex-wrap gap-2 overflow-y-auto rounded-2xl border border-slate-200 bg-white p-4">
                {filteredSkills.map(skill => {
                  const isSelected = formData.skills.includes(skill)

                  return (
                    <button
                      type="button"
                      key={skill}
                      onClick={() => handleToggleSkill(skill)}
                      className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                        isSelected
                          ? 'border-blue-200 bg-blue-100 text-blue-600'
                          : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-blue-200 hover:text-blue-600'
                      }`}
                    >
                      {isSelected ? '✓ ' : '+ '}
                      {skill}
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <label
                htmlFor="customSkill"
                className="text-[10px] font-bold uppercase tracking-widest text-slate-600"
              >
                Add custom skill
              </label>

              <div className="flex gap-2">
                <input
                  id="customSkill"
                  value={customSkill}
                  onChange={e => setCustomSkill(e.target.value)}
                  placeholder="e.g. UI/UX Design"
                  className="min-w-0 flex-1 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500/40 focus:ring-4 focus:ring-blue-50"
                />

                <button
                  type="button"
                  onClick={handleAddCustomSkill}
                  className="inline-flex shrink-0 items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-xs font-bold text-slate-600 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600"
                >
                  <FontAwesomeIcon icon={faPlus} />
                  Add
                </button>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4">
              <FontAwesomeIcon
                icon={faShieldHalved}
                className="text-emerald-500"
              />
              <p className="text-[10px] leading-5 text-slate-500">
                Your email address cannot be changed from this page.
              </p>
            </div>

            <button
              type="submit"
              disabled={isSaving || isUploadingImage}
              className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 text-xs font-black text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <Spinner />
                  Saving changes...
                </>
              ) : (
                <>
                  <FontAwesomeIcon icon={faFloppyDisk} />
                  Save changes
                </>
              )}
            </button>
          </form>
        </>
      )}

      {toastEl}
    </div>
  )
}
