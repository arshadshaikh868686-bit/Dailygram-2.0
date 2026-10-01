import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api, { getError } from '../lib/api'
import { getUser } from '../lib/auth'
import { Spinner, Toast } from '../components/UI'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faMagnifyingGlass,
  faUser,
  faCalendarCheck,
  faIndianRupeeSign,
  faStar,
  faXmark,
  faChalkboardUser
} from '@fortawesome/free-solid-svg-icons'

export default function SearchMentor() {
  const user = getUser()
  const navigate = useNavigate()

  const isMentorAccount =
    user?.role === 'mentor'

  const [mentors, setMentors] = useState([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [selectedSkills, setSelectedSkills] =
    useState([])
  const [bookingId, setBookingId] =
    useState(null)
  const [msg, setMsg] = useState('')

  const loadMentors = async () => {
    try {
      setLoading(true)

      const { data } =
        await api.get('/user/mentors')

      setMentors(
        Array.isArray(data)
          ? data
          : []
      )
    } catch (error) {
      setMsg(getError(error))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadMentors()
  }, [])

  const allSkills = useMemo(() => {
    const skills = mentors.flatMap(
      mentor =>
        Array.isArray(mentor.skills)
          ? mentor.skills
          : []
    )

    return [
      ...new Set(
        skills
          .map(skill =>
            String(skill).trim()
          )
          .filter(Boolean)
      )
    ].sort((a, b) =>
      a.localeCompare(b)
    )
  }, [mentors])

  const filteredMentors = useMemo(() => {
    const search =
      query.trim().toLowerCase()

    return mentors.filter(
      mentor => {
        const name =
          mentor.name?.toLowerCase() ||
          ''

        const bio =
          mentor.bio?.toLowerCase() ||
          ''

        const skills =
          Array.isArray(mentor.skills)
            ? mentor.skills
            : []

        const matchesSearch =
          !search ||
          name.includes(search) ||
          bio.includes(search) ||
          skills.some(skill =>
            String(skill)
              .toLowerCase()
              .includes(search)
          )

        const matchesSkills =
          selectedSkills.length === 0 ||
          selectedSkills.every(
            selected =>
              skills.some(
                skill =>
                  String(skill)
                    .toLowerCase() ===
                  selected.toLowerCase()
              )
          )

        return (
          matchesSearch &&
          matchesSkills
        )
      }
    )
  }, [
    mentors,
    query,
    selectedSkills
  ])

  const toggleSkill = skill => {
    setSelectedSkills(current =>
      current.includes(skill)
        ? current.filter(
            item => item !== skill
          )
        : [...current, skill]
    )
  }

  const clearFilters = () => {
    setQuery('')
    setSelectedSkills([])
  }

  const openProfile = mentorId => {
    navigate(
      `/dashboard/profile?mentorId=${mentorId}`
    )
  }

  const bookMentor = async mentor => {
    if (isMentorAccount) {
      setMsg(
        'Mentor accounts cannot book another mentor.'
      )
      return
    }

    if (bookingId) {
      return
    }

    const price = Number(
      mentor.mentorshipPrice || 0
    )

    const confirmed =
      window.confirm(
        price > 0
          ? `Request a session with ${mentor.name} for ₹${price}?`
          : `Request a free session with ${mentor.name}?`
      )

    if (!confirmed) {
      return
    }

    try {
      setBookingId(
        mentor._id
      )

      await api.post(
  '/appointments/request',
  {
    mentorId: mentor._id,
    skill: mentor.skills?.[0],
    mentorshipPrice: price
  }
)

      setMsg(
        'Appointment request sent successfully.'
      )

    } catch (error) {
      setMsg(
        getError(error)
      )
    } finally {
      setBookingId(null)
    }
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">

      {/* HEADER */}

      <section className="rounded-3xl border border-slate-200 bg-white p-5 sm:p-7">

        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">

          <div>

            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-violet-600">
              Mentorship marketplace
            </p>

            <h1 className="mt-2 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
              Find a mentor
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              Explore mentors by skills,
              experience, and mentorship
              pricing.
            </p>

          </div>

          <div className="flex items-center gap-2 rounded-xl bg-slate-50 px-4 py-3">

            <FontAwesomeIcon
              icon={faChalkboardUser}
              className="text-violet-600"
            />

            <div>

              <p className="text-sm font-black text-slate-900">
                {mentors.length}
              </p>

              <p className="text-[10px] text-slate-400">
                mentors available
              </p>

            </div>

          </div>

        </div>

      </section>


      {/* SEARCH */}

      <section className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">

        <div className="flex flex-col gap-3 md:flex-row">

          <div className="relative flex-1">

            <FontAwesomeIcon
              icon={faMagnifyingGlass}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-slate-400"
            />

            <input
              type="text"
              value={query}
              onChange={e =>
                setQuery(e.target.value)
              }
              placeholder="Search by name, skill or bio..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-violet-400 focus:bg-white focus:ring-2 focus:ring-violet-100"
            />

          </div>

          {(query ||
            selectedSkills.length > 0) && (

            <button
              type="button"
              onClick={clearFilters}
              className="rounded-xl border border-slate-200 px-4 py-3 text-xs font-bold text-slate-600 transition hover:bg-slate-50"
            >
              Clear filters
            </button>

          )}

        </div>


        {/* SKILLS */}

        {allSkills.length > 0 && (

          <div className="mt-4">

            <p className="mb-2 text-[10px] font-black uppercase tracking-wider text-slate-400">
              Popular skills
            </p>

            <div className="flex flex-wrap gap-2">

              {allSkills.map(skill => {

                const active =
                  selectedSkills.includes(
                    skill
                  )

                return (
                  <button
                    key={skill}
                    type="button"
                    onClick={() =>
                      toggleSkill(
                        skill
                      )
                    }
                    className={`rounded-lg border px-3 py-2 text-[11px] font-bold transition ${
                      active
                        ? 'border-violet-600 bg-violet-600 text-white'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-violet-300 hover:text-violet-600'
                    }`}
                  >
                    {skill}
                  </button>
                )
              })}

            </div>

          </div>

        )}

      </section>


      {/* MENTOR LIST */}

      {loading ? (

        <div className="flex min-h-64 items-center justify-center rounded-2xl border border-slate-200 bg-white">
          <Spinner />
        </div>

      ) : filteredMentors.length === 0 ? (

        <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-14 text-center">

          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-slate-50 text-slate-400">

            <FontAwesomeIcon
              icon={faMagnifyingGlass}
            />

          </div>

          <h2 className="mt-4 text-sm font-black text-slate-800">
            No mentors found
          </h2>

          <p className="mt-1 text-xs text-slate-400">
            Try another name, skill, or
            clear your filters.
          </p>

          {(query ||
            selectedSkills.length > 0) && (

            <button
              type="button"
              onClick={clearFilters}
              className="mt-4 rounded-xl bg-violet-600 px-4 py-2.5 text-xs font-bold text-white"
            >
              Clear filters
            </button>

          )}

        </div>

      ) : (

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">

          {filteredMentors.map(
            mentor => (

              <MentorCard
                key={mentor._id}
                mentor={mentor}
                isMentorAccount={
                  isMentorAccount
                }
                isBooking={
                  bookingId ===
                  mentor._id
                }
                onProfile={() =>
                  openProfile(
                    mentor._id
                  )
                }
                onBook={() =>
                  bookMentor(
                    mentor
                  )
                }
              />

            )
          )}

        </div>

      )}


      <Toast
        message={msg}
        type={
          msg.toLowerCase().includes(
            'success'
          )
            ? 'success'
            : 'error'
        }
        onClose={() =>
          setMsg('')
        }
      />

    </div>
  )
}


/* =========================
   MENTOR CARD
========================= */

function MentorCard({
  mentor,
  isMentorAccount,
  isBooking,
  onProfile,
  onBook
}) {
  const price = Number(
    mentor.mentorshipPrice || 0
  )

  const rating =
    Number(mentor.rating || 0)

  const sessions =
    Number(
      mentor.completedSessions || 0
    )

  const skills =
    Array.isArray(mentor.skills)
      ? mentor.skills
      : []

  return (
    <article className="flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-5 transition hover:-translate-y-0.5 hover:border-violet-200 hover:shadow-lg hover:shadow-slate-200/50">

      {/* TOP */}

      <div className="flex items-start justify-between gap-3">

        <div className="flex min-w-0 items-center gap-3">

          <MentorAvatar
            mentor={mentor}
          />

          <div className="min-w-0">

            <h2 className="truncate text-sm font-black text-slate-950">
              {mentor.name ||
                'Mentor'}
            </h2>

            <p className="mt-0.5 text-[10px] text-slate-400">
              {sessions}{' '}
              completed sessions
            </p>

          </div>

        </div>


        {/* RATING */}

        <div className="flex shrink-0 items-center gap-1 rounded-lg bg-amber-50 px-2 py-1 text-[10px] font-black text-amber-700">

          <FontAwesomeIcon
            icon={faStar}
            className="text-[9px]"
          />

          {rating.toFixed(1)}

        </div>

      </div>


      {/* BIO */}

      <p className="mt-4 line-clamp-3 min-h-[60px] text-xs leading-5 text-slate-500">
        {mentor.bio ||
          'This mentor has not added a bio yet.'}
      </p>


      {/* SKILLS */}

      <div className="mt-4 flex min-h-[58px] flex-wrap content-start gap-1.5">

        {skills.length > 0 ? (

          skills
            .slice(0, 5)
            .map(
              (skill, index) => (
                <span
                  key={`${skill}-${index}`}
                  className="rounded-md bg-violet-50 px-2 py-1 text-[9px] font-bold text-violet-700"
                >
                  {skill}
                </span>
              )
            )

        ) : (

          <span className="text-[10px] text-slate-400">
            No skills listed
          </span>

        )}

        {skills.length > 5 && (

          <span className="rounded-md bg-slate-50 px-2 py-1 text-[9px] font-bold text-slate-500">
            +{skills.length - 5}
          </span>

        )}

      </div>


      {/* PRICE */}

      <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4">

        <div>

          <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
            Session price
          </p>

          <div className="mt-1 flex items-center gap-1">

            <FontAwesomeIcon
              icon={faIndianRupeeSign}
              className="text-xs text-slate-500"
            />

            <span className="text-lg font-black text-slate-950">
              {price}
            </span>

            <span className="text-[10px] text-slate-400">
              / session
            </span>

          </div>

        </div>


        {price === 0 ? (

          <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[9px] font-black uppercase text-emerald-700">
            Free
          </span>

        ) : (

          <span className="rounded-full bg-violet-50 px-2.5 py-1 text-[9px] font-black uppercase text-violet-700">
            Paid
          </span>

        )}

      </div>


      {/* ACTIONS */}

      <div className="mt-4 grid grid-cols-2 gap-2">

        <button
          type="button"
          onClick={onProfile}
          className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-bold text-slate-700 transition hover:border-violet-300 hover:text-violet-600"
        >
          <FontAwesomeIcon
            icon={faUser}
            className="mr-2"
          />

          Profile
        </button>


        <button
          type="button"
          onClick={onBook}
          disabled={
            isMentorAccount ||
            isBooking
          }
          className="rounded-xl bg-violet-600 px-3 py-2.5 text-xs font-bold text-white transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          {isBooking
            ? 'Sending...'
            : isMentorAccount
              ? 'Mentor account'
              : 'Request session'}
        </button>

      </div>

    </article>
  )
}


/* =========================
   AVATAR
========================= */

function MentorAvatar({
  mentor
}) {
  if (mentor.profileImage) {
    return (
      <div className="h-12 w-12 shrink-0 overflow-hidden rounded-full border border-slate-200 bg-slate-100">

        <img
          src={mentor.profileImage}
          alt={
            mentor.name ||
            'Mentor'
          }
          className="h-full w-full object-cover"
        />

      </div>
    )
  }

  return (
    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-violet-100 text-lg font-black text-violet-700">
      {mentor.name
        ?.charAt(0)
        ?.toUpperCase() || 'M'}
    </div>
  )
}