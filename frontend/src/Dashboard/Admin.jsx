import { useEffect, useState } from 'react'
import api, { getError } from '../lib/api'
import { Spinner, Toast } from '../components/UI'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faShieldHalved,
  faUserCheck,
  faCrown,
  faUsers,
  faCircleCheck,
  faClock,
  faBan
} from '@fortawesome/free-solid-svg-icons'

export default function Admin() {
  const [stats, setStats] = useState(null)
  const [mentors, setMentors] = useState([])
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState('')
  const [toast, setToast] = useState('')

  // ==========================================
  // LOAD ADMIN DATA
  // ==========================================
  const load = async () => {
    setLoading(true)
    setToast('')

    try {
      const [
        statsResponse,
        requestsResponse
      ] = await Promise.all([
        api.get('/admin/stats'),
        api.get('/admin/verification-requests')
      ])

      setStats(statsResponse.data)

      setMentors(
        Array.isArray(requestsResponse.data)
          ? requestsResponse.data
          : []
      )
    } catch (error) {
      setToast(getError(error))
    } finally {
      setLoading(false)
    }
  }


  useEffect(() => {
    load()
  }, [])


  // ==========================================
  // VERIFY / REJECT MENTOR
  // ==========================================
  const updateVerification = async (
    id,
    status
  ) => {
    setBusyId(id)
    setToast('')

    try {
      await api.put(
        `/admin/verification/${id}`,
        { status }
      )

      await load()

      setToast(
        status === 'verified'
          ? 'Mentor verified successfully.'
          : 'Mentor verification rejected.'
      )

    } catch (error) {
      setToast(getError(error))
    } finally {
      setBusyId('')
    }
  }


  // ==========================================
  // ENABLE / DISABLE PREMIUM
  // ==========================================
  const updatePremium = async (
    id,
    enabled
  ) => {
    setBusyId(id)
    setToast('')

    try {
      await api.put(
        `/admin/premium/${id}`,
        { enabled }
      )

      await load()

      setToast(
        enabled
          ? 'Premium enabled successfully.'
          : 'Premium disabled successfully.'
      )

    } catch (error) {
      setToast(getError(error))
    } finally {
      setBusyId('')
    }
  }


  // ==========================================
  // INITIAL LOADING
  // ==========================================
  if (loading && !stats) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center gap-3 text-sm text-slate-500">
        <Spinner />
        Loading admin workspace...
      </div>
    )
  }


  return (
    <div className="space-y-7">

      {/* ==========================================
          HEADER
      ========================================== */}
      <header>
        <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">
          Platform control
        </span>

        <h1 className="mt-1 text-3xl font-black tracking-tight text-slate-900">
          Admin dashboard
        </h1>

        <p className="mt-2 text-sm text-slate-500">
          Verify mentors and manage premium mentorship access.
        </p>
      </header>


      {/* ==========================================
          TOAST
      ========================================== */}
      {toast && (
        <Toast
          message={toast}
          type="error"
          onClose={() => setToast('')}
        />
      )}


      {/* ==========================================
          STATS
      ========================================== */}
      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">

        {/* USERS */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
            <FontAwesomeIcon icon={faUsers} />
          </div>

          <p className="mt-4 text-2xl font-black text-slate-900">
            {stats?.totalUsers || 0}
          </p>

          <p className="mt-1 text-xs font-semibold text-slate-500">
            Users
          </p>
        </div>


        {/* MENTORS */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
            <FontAwesomeIcon icon={faUserCheck} />
          </div>

          <p className="mt-4 text-2xl font-black text-slate-900">
            {stats?.totalMentors || 0}
          </p>

          <p className="mt-1 text-xs font-semibold text-slate-500">
            Mentors
          </p>
        </div>


        {/* PENDING */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
            <FontAwesomeIcon icon={faClock} />
          </div>

          <p className="mt-4 text-2xl font-black text-slate-900">
            {stats?.pendingVerifications || 0}
          </p>

          <p className="mt-1 text-xs font-semibold text-slate-500">
            Pending verification
          </p>
        </div>


        {/* VERIFIED */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
            <FontAwesomeIcon icon={faCircleCheck} />
          </div>

          <p className="mt-4 text-2xl font-black text-slate-900">
            {stats?.verifiedMentors || 0}
          </p>

          <p className="mt-1 text-xs font-semibold text-slate-500">
            Verified mentors
          </p>
        </div>

      </section>


      {/* ==========================================
          VERIFICATION QUEUE
      ========================================== */}
      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">

        {/* HEADER */}
        <div className="flex flex-col gap-3 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between">

          <div>
            <h2 className="font-black text-slate-900">
              Mentor verification queue
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              Review mentor verification before allowing paid mentorship.
            </p>
          </div>

          <button
            type="button"
            onClick={load}
            disabled={loading}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Refresh
          </button>

        </div>


        {/* MENTOR LIST */}
        <div className="divide-y divide-slate-100">

          {mentors.length ? (

            mentors.map(mentor => {

              const busy =
                busyId === mentor._id

              const verified =
                mentor.aadhaarVerificationStatus ===
                'verified'

              const rejected =
                mentor.aadhaarVerificationStatus ===
                'rejected'

              const pending =
                mentor.aadhaarVerificationStatus ===
                'pending'


              return (
                <div
                  key={mentor._id}
                  className="p-5"
                >

                  <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">

                    {/* ==========================================
                        MENTOR INFO
                    ========================================== */}
                    <div className="flex min-w-0 items-start gap-3">

                      {/* AVATAR */}
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-50 font-black text-indigo-600">

                        {mentor.name
                          ?.charAt(0)
                          ?.toUpperCase() || 'M'}

                      </div>


                      {/* DETAILS */}
                      <div className="min-w-0">

                        <h3 className="font-black text-slate-900">
                          {mentor.name}
                        </h3>

                        <p className="text-xs text-slate-500">
                          {mentor.email}
                        </p>


                        {/* COMPANY */}
                        {mentor.companyName && (
                          <p className="mt-1 text-xs font-semibold text-slate-600">
                            {mentor.companyName}
                          </p>
                        )}


                        {/* EXPERIENCE */}
                        <p className="mt-1 text-xs text-slate-500">
                          Experience:{' '}
                          {mentor.experience ?? 0} years
                        </p>


                        {/* SKILLS */}
                        <div className="mt-2 flex flex-wrap gap-2">

                          {(mentor.skills || []).map(
                            skill => (
                              <span
                                key={skill}
                                className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-semibold text-slate-600"
                              >
                                {skill}
                              </span>
                            )
                          )}

                        </div>


                        {/* STATUS */}
                        <div className="mt-3 flex flex-wrap gap-2">

                          {pending && (
                            <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-bold text-amber-700">
                              Verification pending
                            </span>
                          )}

                          {verified && (
                            <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-700">
                              ✓ Verified
                            </span>
                          )}

                          {rejected && (
                            <span className="rounded-full bg-red-50 px-2.5 py-1 text-[10px] font-bold text-red-700">
                              Rejected
                            </span>
                          )}

                          {mentor.premiumEnabled && (
                            <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-bold text-amber-700">
                              <FontAwesomeIcon
                                icon={faCrown}
                                className="mr-1"
                              />
                              Premium
                            </span>
                          )}

                        </div>

                      </div>

                    </div>


                    {/* ==========================================
                        ACTIONS
                    ========================================== */}
                    <div className="flex flex-wrap gap-2">

                      {/* VERIFY */}
                      <button
                        type="button"
                        disabled={
                          busy ||
                          verified
                        }
                        onClick={() =>
                          updateVerification(
                            mentor._id,
                            'verified'
                          )
                        }
                        className="rounded-xl bg-emerald-600 px-3 py-2 text-xs font-bold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400"
                      >
                        <FontAwesomeIcon
                          icon={faCircleCheck}
                          className="mr-1"
                        />

                        Verify
                      </button>


                      {/* REJECT */}
                      <button
                        type="button"
                        disabled={
                          busy ||
                          rejected
                        }
                        onClick={() =>
                          updateVerification(
                            mentor._id,
                            'rejected'
                          )
                        }
                        className="rounded-xl bg-red-600 px-3 py-2 text-xs font-bold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400"
                      >
                        <FontAwesomeIcon
                          icon={faBan}
                          className="mr-1"
                        />

                        Reject
                      </button>


                      {/* PREMIUM */}
                      <button
                        type="button"
                        disabled={
                          busy ||
                          !verified ||
                          !mentor.premiumEligible
                        }
                        onClick={() =>
                          updatePremium(
                            mentor._id,
                            !mentor.premiumEnabled
                          )
                        }
                        className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-bold text-amber-700 hover:bg-amber-100 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-400"
                      >
                        <FontAwesomeIcon
                          icon={faCrown}
                          className="mr-1"
                        />

                        {mentor.premiumEnabled
                          ? 'Disable premium'
                          : 'Enable premium'}
                      </button>

                    </div>

                  </div>

                </div>
              )
            })

          ) : (

            /* ==========================================
               EMPTY STATE
            ========================================== */
            <div className="p-10 text-center">

              <FontAwesomeIcon
                icon={faShieldHalved}
                className="text-2xl text-slate-300"
              />

              <p className="mt-3 font-bold text-slate-700">
                No pending verification requests
              </p>

              <p className="mt-1 text-xs text-slate-500">
                New mentor verification requests will appear here.
              </p>

            </div>

          )}

        </div>

      </section>


      {/* ==========================================
          BOTTOM STATS
      ========================================== */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">

        {/* VERIFIED */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5">

          <p className="text-xs font-bold text-slate-500">
            Verified mentors
          </p>

          <p className="mt-2 text-2xl font-black text-slate-900">
            {stats?.verifiedMentors || 0}
          </p>

        </div>


        {/* PREMIUM */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5">

          <p className="text-xs font-bold text-slate-500">
            Premium mentors
          </p>

          <p className="mt-2 text-2xl font-black text-slate-900">
            {stats?.premiumMentors || 0}
          </p>

        </div>


        {/* LEARNERS */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5">

          <p className="text-xs font-bold text-slate-500">
            Learners
          </p>

          <p className="mt-2 text-2xl font-black text-slate-900">
            {stats?.totalLearners || 0}
          </p>

        </div>

      </section>

    </div>
  )
}