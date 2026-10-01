import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api, { getError } from '../lib/api'
import { getUser } from '../lib/auth'
import { Spinner, Toast } from '../components/UI'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faMagnifyingGlass,
  faUser,
  faCalendarCheck,
  faMessage,
  faRobot,
  faArrowRight,
  faVideo,
  faClock,
  faChalkboardUser,
  faGraduationCap,
  faCheckCircle,
  faWallet
} from '@fortawesome/free-solid-svg-icons'

export default function Home() {
  const user = getUser()
  const navigate = useNavigate()

  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(true)
  const [msg, setMsg] = useState('')

  const isMentor = user?.role === 'mentor'
  const firstName =
    user?.name?.split(' ')[0] || 'there'

  const totalSkills =
    Array.isArray(user?.skills)
      ? user.skills.length
      : 0

  const profileImage =
    user?.profileImage || ''

  const userInitial =
    user?.name?.charAt(0)?.toUpperCase() || 'U'

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        setLoading(true)

        if (isMentor) {
          const [
            requestsRes,
            appointmentsRes
          ] = await Promise.all([
            api.get(
              '/appointments/my-requests'
            ),
            api.get(
              '/appointments/my-appointments'
            )
          ])

          const requests =
            Array.isArray(
              requestsRes.data
            )
              ? requestsRes.data
              : []

          const sessions =
            Array.isArray(
              appointmentsRes.data
            )
              ? appointmentsRes.data
              : []

          const map = new Map()

          ;[
            ...requests,
            ...sessions
          ].forEach(item => {
            map.set(item._id, item)
          })

          setAppointments([
            ...map.values()
          ])
        } else {
          const { data } =
            await api.get(
              '/appointments/my-appointments'
            )

          setAppointments(
            Array.isArray(data)
              ? data
              : []
          )
        }
      } catch (error) {
        setMsg(getError(error))
      } finally {
        setLoading(false)
      }
    }

    loadDashboard()
  }, [isMentor])

  const acceptedAppointments =
    useMemo(() => {
      return appointments
        .filter(
          item =>
            item.status === 'accepted'
        )
        .sort(
          (a, b) =>
            new Date(
              a.scheduledAt || 0
            ) -
            new Date(
              b.scheduledAt || 0
            )
        )
    }, [appointments])

  const pendingAppointments =
    useMemo(() => {
      return appointments.filter(
        item =>
          item.status === 'pending'
      )
    }, [appointments])

  const upcomingAppointment =
    useMemo(() => {
      const now = new Date()

      return acceptedAppointments.find(
        item => {
          if (!item.scheduledAt) {
            return true
          }

          return (
            new Date(
              item.scheduledAt
            ) >= now
          )
        }
      )
    }, [acceptedAppointments])

  const paidSessions =
    useMemo(() => {
      return appointments.filter(
        item =>
          Number(
            item.mentorshipPrice || 0
          ) > 0
      ).length
    }, [appointments])

  const formatDate = date => {
    if (!date) {
      return 'Time not scheduled'
    }

    const value = new Date(date)

    if (
      Number.isNaN(
        value.getTime()
      )
    ) {
      return 'Time not scheduled'
    }

    return value.toLocaleString(
      [],
      {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        hour: 'numeric',
        minute: '2-digit'
      }
    )
  }

  const getPerson = appointment => {
    const person = isMentor
      ? appointment?.learnerId
      : appointment?.mentorId

    return {
      name:
        person?.name ||
        (isMentor
          ? 'Learner'
          : 'Mentor'),

      email:
        person?.email || '',

      profileImage:
        person?.profileImage || ''
    }
  }

  const openChat = appointmentId => {
    navigate(
      `/dashboard/messages?appointmentId=${appointmentId}`
    )
  }

  const openVideoCall = appointment => {
    const room =
      appointment?.room ||
      `dailygram-${appointment?._id}`

    const jitsiUrl =
      `https://meet.jit.si/${encodeURIComponent(room)}`

    window.open(
      jitsiUrl,
      '_blank',
      'noopener,noreferrer'
    )
  }

  return (
    <div className="mx-auto max-w-7xl space-y-7">

      {/* HEADER */}

      <section className="rounded-3xl border border-slate-200 bg-white p-5 sm:p-7">

        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">

          <div className="flex items-center gap-4">

            <div className="h-16 w-16 shrink-0 overflow-hidden rounded-full border-2 border-white bg-violet-50 shadow-sm">

              {profileImage ? (

                <img
                  src={profileImage}
                  alt={
                    user?.name ||
                    'Profile'
                  }
                  className="h-full w-full object-cover"
                />

              ) : (

                <div className="flex h-full w-full items-center justify-center text-xl font-black text-violet-600">
                  {userInitial}
                </div>

              )}

            </div>

            <div className="min-w-0">

              <p className="text-xs font-bold uppercase tracking-wider text-violet-600">
                {isMentor
                  ? 'Mentor workspace'
                  : 'Learning workspace'}
              </p>

              <h1 className="mt-1 truncate text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
                Welcome back, {firstName}.
              </h1>

              <p className="mt-1 text-xs leading-5 text-slate-500 sm:text-sm">
                {isMentor
                  ? 'Manage your learners and sessions.'
                  : 'Find mentors and continue learning.'}
              </p>

            </div>

          </div>


          <div className="flex flex-wrap gap-2">

            {!isMentor && (
              <Link
                to="/dashboard/mentors"
                className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-violet-700"
              >
                <FontAwesomeIcon
                  icon={faMagnifyingGlass}
                />

                Find mentors
              </Link>
            )}

            <Link
              to="/dashboard/profile"
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 transition hover:bg-slate-50"
            >
              <FontAwesomeIcon
                icon={faUser}
              />

              Profile
            </Link>

          </div>

        </div>

      </section>


      {/* STATS */}

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">

        <DashboardStat
          icon={faCalendarCheck}
          label="Sessions"
          value={
            acceptedAppointments.length
          }
          description="Accepted"
          iconClass="bg-violet-50 text-violet-600"
        />

        <DashboardStat
          icon={faClock}
          label="Pending"
          value={
            pendingAppointments.length
          }
          description={
            isMentor
              ? 'Requests'
              : 'Requests sent'
          }
          iconClass="bg-amber-50 text-amber-600"
        />

        <DashboardStat
          icon={
            isMentor
              ? faChalkboardUser
              : faGraduationCap
          }
          label="Skills"
          value={totalSkills}
          description={
            isMentor
              ? 'Mentor skills'
              : 'Interests'
          }
          iconClass="bg-indigo-50 text-indigo-600"
        />

        <DashboardStat
          icon={faWallet}
          label="Paid"
          value={paidSessions}
          description="Paid sessions"
          iconClass="bg-emerald-50 text-emerald-600"
        />

      </section>


      {/* MAIN */}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">

        {/* UPCOMING */}

        <section className="lg:col-span-2">

          <div className="mb-4 flex items-center justify-between">

            <div>

              <p className="text-[10px] font-bold uppercase tracking-wider text-violet-600">
                Schedule
              </p>

              <h2 className="mt-1 text-xl font-black text-slate-950">
                Upcoming session
              </h2>

            </div>

            <Link
              to="/dashboard/appointments"
              className="text-xs font-bold text-slate-500 transition hover:text-violet-600"
            >
              View all →
            </Link>

          </div>


          {loading ? (

            <div className="flex min-h-64 items-center justify-center rounded-2xl border border-slate-200 bg-white">
              <Spinner />
            </div>

          ) : !upcomingAppointment ? (

            <EmptySession
              isMentor={isMentor}
            />

          ) : (

            <UpcomingCard
              appointment={
                upcomingAppointment
              }
              person={getPerson(
                upcomingAppointment
              )}
              formatDate={formatDate}
              onMessage={() =>
                openChat(
                  upcomingAppointment._id
                )
              }
              onVideo={() =>
                openVideoCall(
                  upcomingAppointment
                )
              }
            />

          )}

        </section>


        {/* QUICK ACTIONS */}

        <section>

          <div className="mb-4">

            <p className="text-[10px] font-bold uppercase tracking-wider text-violet-600">
              Shortcuts
            </p>

            <h2 className="mt-1 text-xl font-black text-slate-950">
              Quick actions
            </h2>

          </div>

          <div className="space-y-3">

            {!isMentor && (
              <QuickAction
                to="/dashboard/mentors"
                icon={faMagnifyingGlass}
                title="Find mentors"
                description="Explore mentors"
              />
            )}

            <QuickAction
              to="/dashboard/appointments"
              icon={faCalendarCheck}
              title="Appointments"
              description="Manage sessions"
            />

            <QuickAction
              to="/dashboard/messages"
              icon={faMessage}
              title="Messages"
              description="Continue conversations"
            />

            <QuickAction
              to="/dashboard/ai"
              icon={faRobot}
              title="Safi AI"
              description="Ask, learn and plan"
            />

          </div>

        </section>

      </div>


      {/* SKILLS */}

      <section>

        <div className="mb-4 flex items-center justify-between">

          <div>

            <p className="text-[10px] font-bold uppercase tracking-wider text-violet-600">
              Profile
            </p>

            <h2 className="mt-1 text-xl font-black text-slate-950">
              Skills & interests
            </h2>

          </div>

          <Link
            to="/dashboard/profile"
            className="text-xs font-bold text-slate-500 transition hover:text-violet-600"
          >
            Edit →
          </Link>

        </div>


        {totalSkills === 0 ? (

          <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center">

            <p className="text-sm font-bold text-slate-700">
              No skills added yet
            </p>

            <p className="mt-1 text-xs text-slate-400">
              Add skills to make your profile stronger.
            </p>

            <Link
              to="/dashboard/profile"
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-violet-700"
            >
              Complete profile

              <FontAwesomeIcon
                icon={faArrowRight}
                className="text-[9px]"
              />
            </Link>

          </div>

        ) : (

          <div className="flex flex-wrap gap-2">

            {user.skills.map(
              (skill, index) => (
                <span
                  key={`${skill}-${index}`}
                  className="rounded-lg border border-violet-100 bg-violet-50 px-3 py-2 text-xs font-bold text-violet-700"
                >
                  {skill}
                </span>
              )
            )}

          </div>

        )}

      </section>


      <Toast
        message={msg}
        type="error"
        onClose={() =>
          setMsg('')
        }
      />

    </div>
  )
}


/* =========================
   STAT
========================= */

function DashboardStat({
  icon,
  label,
  value,
  description,
  iconClass
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">

      <div className="flex items-start justify-between gap-3">

        <div>

          <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
            {label}
          </p>

          <p className="mt-1 text-xl font-black text-slate-950 sm:text-2xl">
            {value}
          </p>

          <p className="mt-1 text-[10px] text-slate-400">
            {description}
          </p>

        </div>

        <div
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl sm:h-10 sm:w-10 ${iconClass}`}
        >
          <FontAwesomeIcon
            icon={icon}
            className="text-xs"
          />
        </div>

      </div>

    </div>
  )
}


/* =========================
   QUICK ACTION
========================= */

function QuickAction({
  to,
  icon,
  title,
  description
}) {
  return (
    <Link
      to={to}
      className="group flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 transition hover:border-violet-200 hover:bg-violet-50/30"
    >

      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-500 transition group-hover:bg-white group-hover:text-violet-600">
        <FontAwesomeIcon
          icon={icon}
          className="text-sm"
        />
      </div>

      <div className="min-w-0">

        <p className="text-xs font-bold text-slate-800">
          {title}
        </p>

        <p className="mt-0.5 text-[10px] text-slate-400">
          {description}
        </p>

      </div>

      <FontAwesomeIcon
        icon={faArrowRight}
        className="ml-auto text-[9px] text-slate-300 transition group-hover:text-violet-500"
      />

    </Link>
  )
}


/* =========================
   EMPTY SESSION
========================= */

function EmptySession({
  isMentor
}) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-14 text-center">

      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-400">
        <FontAwesomeIcon
          icon={faCalendarCheck}
        />
      </div>

      <h3 className="mt-4 text-sm font-black text-slate-800">
        No upcoming session
      </h3>

      <p className="mt-1 text-xs text-slate-400">
        {isMentor
          ? 'Accepted learner sessions will appear here.'
          : 'Find a mentor and book your first session.'}
      </p>

      <Link
        to={
          isMentor
            ? '/dashboard/appointments'
            : '/dashboard/mentors'
        }
        className="mt-4 inline-flex items-center gap-2 text-xs font-bold text-violet-600 hover:text-violet-700"
      >
        {isMentor
          ? 'Open appointments'
          : 'Find a mentor'}

        <FontAwesomeIcon
          icon={faArrowRight}
          className="text-[9px]"
        />
      </Link>

    </div>
  )
}


/* =========================
   UPCOMING CARD
========================= */

function UpcomingCard({
  appointment,
  person,
  formatDate,
  onMessage,
  onVideo
}) {
  const price = Number(
    appointment?.mentorshipPrice || 0
  )

  const paymentPaid =
    price === 0 ||
    appointment?.paymentStatus ===
      'paid'

  const paymentPending =
    price > 0 &&
    appointment?.paymentStatus ===
      'pending'

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">

      {/* PERSON */}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">

        <div className="flex items-center gap-3">

          <PersonAvatar
            person={person}
          />

          <div className="min-w-0">

            <p className="text-[9px] font-bold uppercase tracking-wider text-violet-600">
              {appointment.skill ||
                'Learning session'}
            </p>

            <h3 className="mt-1 truncate font-black text-slate-950">
              {person.name}
            </h3>

            {person.email && (
              <p className="mt-0.5 truncate text-xs text-slate-400">
                {person.email}
              </p>
            )}

          </div>

        </div>


        {/* STATUS */}

        <div className="flex flex-wrap gap-2">

          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-100 bg-emerald-50 px-2.5 py-1 text-[9px] font-black uppercase text-emerald-700">

            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />

            Accepted

          </span>

          {price === 0 ? (

            <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[9px] font-black uppercase text-slate-600">
              Free
            </span>

          ) : paymentPaid ? (

            <span className="inline-flex items-center gap-1 rounded-full border border-emerald-100 bg-emerald-50 px-2.5 py-1 text-[9px] font-black uppercase text-emerald-700">

              <FontAwesomeIcon
                icon={faCheckCircle}
              />

              Paid

            </span>

          ) : (

            <span className="rounded-full border border-amber-100 bg-amber-50 px-2.5 py-1 text-[9px] font-black uppercase text-amber-700">
              Payment required
            </span>

          )}

        </div>

      </div>


      {/* DETAILS */}

      <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">

        <SessionInfo
          icon={faClock}
          label="Scheduled"
          value={formatDate(
            appointment.scheduledAt
          )}
        />

        <SessionInfo
          icon={faCalendarCheck}
          label="Duration"
          value={`${
            appointment.duration ||
            60
          } minutes`}
        />

        <SessionInfo
          icon={faWallet}
          label="Mentorship"
          value={
            price === 0
              ? 'Free'
              : `₹${price}`
          }
        />

      </div>


      {/* PAYMENT MESSAGE */}

      {price > 0 &&
        !paymentPaid && (

          <div className="mt-4 rounded-xl border border-amber-100 bg-amber-50 px-4 py-3">

            <p className="text-xs font-bold text-amber-800">
              {paymentPending
                ? 'Payment is pending for this session.'
                : 'Payment is required before joining.'}
            </p>

            <p className="mt-1 text-[10px] text-amber-700">
              Open Appointments to manage payment.
            </p>

          </div>

        )}


      {/* ACTIONS */}

      <div className="mt-5 flex flex-col gap-2 sm:flex-row">

        <button
          type="button"
          onClick={onMessage}
          disabled={!paymentPaid}
          className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white py-2.5 text-xs font-bold text-slate-700 transition hover:border-violet-300 hover:text-violet-600 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <FontAwesomeIcon
            icon={faMessage}
          />

          Message
        </button>

        <button
          type="button"
          onClick={onVideo}
          disabled={!paymentPaid}
          className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-violet-600 py-2.5 text-xs font-bold text-white transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          <FontAwesomeIcon
            icon={faVideo}
          />

          Join video
        </button>

      </div>

    </div>
  )
}


/* =========================
   PERSON AVATAR
========================= */

function PersonAvatar({
  person
}) {
  if (person?.profileImage) {
    return (
      <div className="h-12 w-12 shrink-0 overflow-hidden rounded-full border border-slate-200 bg-slate-100">

        <img
          src={person.profileImage}
          alt={
            person.name ||
            'Profile'
          }
          className="h-full w-full object-cover"
        />

      </div>
    )
  }

  return (
    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-violet-100 font-black text-violet-700">
      {person?.name
        ?.charAt(0)
        ?.toUpperCase() || '?'}
    </div>
  )
}


/* =========================
   SESSION INFO
========================= */

function SessionInfo({
  icon,
  label,
  value
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5">

      <div className="flex items-center gap-2 text-slate-400">

        <FontAwesomeIcon
          icon={icon}
          className="text-xs"
        />

        <span className="text-[9px] font-black uppercase tracking-wide">
          {label}
        </span>

      </div>

      <p className="mt-2 truncate text-xs font-bold text-slate-800 sm:text-sm">
        {value}
      </p>

    </div>
  )
}